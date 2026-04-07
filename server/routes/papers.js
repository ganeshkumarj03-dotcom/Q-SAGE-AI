/**
 * server/routes/papers.js  (PostgreSQL / Neon version) — PDF version
 *
 * Status lifecycle:
 *   draft → submitted_to_coordinator → coordinator_approved | coordinator_rejected
 *        → forwarded_to_admin → admin_approved | admin_rejected
 */
import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

const QP_DIR = join(__dirname, '..', 'uploads', 'question-papers');
if (!fs.existsSync(QP_DIR)) fs.mkdirSync(QP_DIR, { recursive: true });

async function generateQPaperPDF({
    qpId, institution, department, examType, totalMarks, duration,
    courseName, courseCode, examDate, regulations, branch, year,
    semester, qpCode, sections = [],
}) {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `QP_${qpId}_${Date.now()}.pdf`;
            const filePath = join(QP_DIR, fileName);
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            const stripM = (t) => (t || '').replace(/\(?\s*\d+\s*marks?\s*\)?/gi, '').replace(/\s+/g, ' ').trim();

            // ── Cover ─────────────────────────────────────────────
            doc.fontSize(16).font('Helvetica-Bold').text(institution || 'Institution Name', { align: 'center' });
            if (department) {
                doc.fontSize(13).font('Helvetica-Bold').text(`DEPARTMENT OF ${department.toUpperCase()}`, { align: 'center' });
            }
            doc.moveDown(0.5);
            doc.fontSize(13).font('Helvetica-Bold').text(examType || 'EXAMINATION', { align: 'center' });
            if (regulations) {
                doc.fontSize(10).font('Helvetica-Oblique').text(`(Regulations ${regulations})`, { align: 'center' });
            }
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica-Bold').text(`${courseCode || ''} – ${courseName || ''}`, { align: 'center' });
            doc.moveDown(0.5);

            // Info row
            doc.fontSize(10).font('Helvetica');
            const parts = [];
            if (branch) parts.push(`Branch: ${branch}`);
            if (examDate) parts.push(`Date: ${examDate}`);
            parts.push(`Max. Marks: ${totalMarks || 100}`);
            parts.push(`Duration: ${duration || '3 Hrs'}`);
            doc.text(parts.join('   |   '), { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(11).font('Helvetica-Bold').text('Answer ALL Questions', { align: 'center' });
            doc.fontSize(10).font('Helvetica-Oblique').text(`(${totalMarks || 100} Marks)`, { align: 'center' });
            doc.moveDown(1);

            // ── Sections ──────────────────────────────────────────
            let qNo = 1;
            for (const section of sections) {
                doc.fontSize(12).font('Helvetica-Bold').text(section.title || '', { align: 'center' });
                if (section.instructions) {
                    doc.fontSize(10).font('Helvetica-Oblique').text(section.instructions, { align: 'center' });
                }
                doc.moveDown(0.5);

                for (const q of (section.questions || [])) {
                    const qtxt = stripM(q.text || q.question || '');
                    const marks = q.marks ? ` (${q.marks})` : '';
                    const btl = q.btl ? ` [${q.btl}]` : '';
                    const co = q.co ? ` [${q.co}]` : '';

                    doc.fontSize(10).font('Helvetica-Bold').text(`${qNo++}. `, { continued: true })
                        .font('Helvetica').text(qtxt + co + btl + marks, { lineGap: 2 });

                    // Sub-parts handling
                    if (q.partA) {
                        doc.fontSize(10).font('Helvetica').text(`    (a) ${stripM(q.partA.text || '')}`, { lineGap: 2 });
                        doc.font('Helvetica-BoldOblique').text('    OR', { lineGap: 2 });
                        doc.font('Helvetica').text(`    (b) ${stripM(q.partB?.text || '')}`, { lineGap: 2 });
                    }
                    doc.moveDown(0.4);

                    if (doc.y > doc.page.height - 80) doc.addPage();
                }
                doc.moveDown(0.5);
            }


            doc.end();
            stream.on('finish', () => resolve(`question-papers/${fileName}`));
            stream.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
}

// ─────────────────────────────────────────────
// POST /api/papers  (faculty) — Save as draft + generate PDF
// ─────────────────────────────────────────────
router.post('/', authMiddleware, requireRole('faculty'), async (req, res) => {
    const {
        course_name, course_code, institution, department, exam_type,
        total_marks, exam_date, duration, regulations, branch, year,
        semester, qp_code, sections = [],
    } = req.body;

    if (!course_name) return res.status(400).json({ error: 'course_name is required' });

    try {
        let questionCount = 0;
        sections.forEach(s => { questionCount += (s.questions || []).length; });

        const [facultyRows] = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const facultyName = facultyRows[0]?.name || '';

        const [paperRows] = await pool.query(
            `INSERT INTO question_papers
       (faculty_id, institution, course_name, course_code, department, exam_type, total_marks, duration, exam_date, regulations, branch, year, semester, qp_code, faculty_name, status, question_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'draft', $16) RETURNING id`,
            [req.user.id, institution || '', course_name, course_code || '', department || '', exam_type || '', total_marks || 100, duration || '3 Hrs', exam_date || null, regulations || '', branch || '', year || '', semester || '', qp_code || '', facultyName, questionCount]
        );
        const paperId = paperRows[0].id;

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const [sRows] = await pool.query(
                'INSERT INTO paper_sections (paper_id, title, section_order) VALUES ($1, $2, $3) RETURNING id',
                [paperId, section.title, i + 1]
            );
            const sectionId = sRows[0].id;
            for (const q of (section.questions || [])) {
                if (q.id) {
                    await pool.query('INSERT INTO paper_questions (section_id, question_id) VALUES ($1, $2)', [sectionId, q.id]);
                }
            }
        }

        const fileRelPath = await generateQPaperPDF({
            qpId: paperId, institution, department, examType: exam_type,
            totalMarks: total_marks, duration, courseName: course_name,
            courseCode: course_code, examDate: exam_date, regulations,
            branch, year, semester, qpCode: qp_code, sections,
        });

        await pool.query('UPDATE question_papers SET file_url = $1 WHERE id = $2', [fileRelPath, paperId]);

        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'SAVE_PAPER_DRAFT', JSON.stringify({ paperId, course_name, questionCount })]
        );

        return res.status(201).json({ id: paperId, course_name, exam_type, total_marks, status: 'draft', file_url: fileRelPath, question_count: questionCount });
    } catch (err) {
        console.error('POST /api/papers error:', err);
        return res.status(500).json({ error: 'Failed to save question paper: ' + err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/papers/:id/submit  — Faculty submits to coordinator
// ─────────────────────────────────────────────
router.post('/:id/submit', authMiddleware, requireRole('faculty'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM question_papers WHERE id = $1 AND faculty_id = $2',
            [req.params.id, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Paper not found or access denied' });
        if (!['draft', 'coordinator_rejected'].includes(rows[0].status)) {
            return res.status(400).json({ error: 'Paper is not in a submittable state' });
        }

        await pool.query(
            "UPDATE question_papers SET status = 'submitted_to_coordinator' WHERE id = $1",
            [req.params.id]
        );
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1,$2,$3)',
            [req.user.id, 'SUBMIT_PAPER_TO_COORDINATOR', JSON.stringify({ paperId: req.params.id })]
        );
        return res.json({ success: true, status: 'submitted_to_coordinator' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// GET /api/papers/all  (admin) — see forwarded papers
// ─────────────────────────────────────────────
router.get('/all', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT qp.*, u.name AS faculty_name
      FROM question_papers qp JOIN users u ON qp.faculty_id = u.id
      WHERE qp.status IN ('forwarded_to_admin', 'admin_approved', 'admin_rejected')
      ORDER BY qp.created_at DESC
    `);
        return res.json(rows);
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// GET /api/papers  (faculty=own drafts+all, student=none)
router.get('/', authMiddleware, async (req, res) => {
    try {
        let query = `SELECT qp.*, u.name AS faculty_name FROM question_papers qp JOIN users u ON qp.faculty_id = u.id`;
        const params = [];
        if (req.user.role === 'faculty') {
            query += ' WHERE qp.faculty_id = $1';
            params.push(req.user.id);
        } else if (req.user.role === 'admin') {
            // admin sees all
        } else {
            // students don't see papers
            return res.json([]);
        }
        query += ' ORDER BY qp.created_at DESC';
        const [rows] = await pool.query(query, params);
        return res.json(rows);
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// GET /api/papers/:id/file  — stream PDF
router.get('/:id/file', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT file_url FROM question_papers WHERE id = $1', [req.params.id]);
        if (!rows.length || !rows[0].file_url) return res.status(404).json({ error: 'File not found' });
        const filePath = join(__dirname, '..', 'uploads', rows[0].file_url);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="QuestionPaper_${req.params.id}.pdf"`);
        fs.createReadStream(filePath).pipe(res);
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/papers/:id/approve  (admin)
router.patch('/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await pool.query("UPDATE question_papers SET status = 'admin_approved' WHERE id = $1", [req.params.id]);
        await pool.query('INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'ADMIN_APPROVE_PAPER', JSON.stringify({ paperId: req.params.id })]);
        return res.json({ success: true });
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/papers/:id/reject  (admin)
router.patch('/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await pool.query("UPDATE question_papers SET status = 'admin_rejected' WHERE id = $1", [req.params.id]);
        await pool.query('INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'ADMIN_REJECT_PAPER', JSON.stringify({ paperId: req.params.id })]);
        return res.json({ success: true });
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// GET /api/papers/:id  — detail view
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [papers] = await pool.query('SELECT * FROM question_papers WHERE id = $1', [req.params.id]);
        if (!papers.length) return res.status(404).json({ error: 'Not found' });
        const [sections] = await pool.query(
            'SELECT * FROM paper_sections WHERE paper_id = $1 ORDER BY section_order', [req.params.id]
        );
        for (const section of sections) {
            const [questions] = await pool.query(
                `SELECT q.* FROM questions q JOIN paper_questions pq ON pq.question_id = q.id WHERE pq.section_id = $1`,
                [section.id]
            );
            section.questions = questions;
        }
        return res.json({ ...papers[0], sections });
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

export default router;
