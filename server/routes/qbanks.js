/**
 * server/routes/qbanks.js  (PostgreSQL/Neon) — Full Year Coordinator Workflow
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
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const QB_DIR = join(__dirname, '..', 'uploads', 'question-banks');

if (!fs.existsSync(QB_DIR)) {
    fs.mkdirSync(QB_DIR, { recursive: true });
}

const router = Router();

// ─────────────────────────────────────────────────────────────
// PDF Generator (server-side, pdfkit)
// ─────────────────────────────────────────────────────────────
function generateQBankPDF({ qbId, courseName, courseCode, facultyName, college, department, units }) {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `QB_${qbId}_${Date.now()}.pdf`;
            const filePath = join(QB_DIR, fileName);
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            const stripM = (t) => (t || '').replace(/\(?\s*\d+\s*marks?\s*\)?/gi, '').replace(/\s+/g, ' ').trim();
            const pageW = doc.page.width - 100;

            // Cover
            doc.fontSize(16).font('Helvetica-Bold').text(college || 'Institution Name', { align: 'center' });
            doc.fontSize(11).font('Helvetica').text('SRM Nagar, Kattankulathur – 603 203', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(13).font('Helvetica-Bold').text(`DEPARTMENT OF ${(department || 'Department').toUpperCase()}`, { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(15).font('Helvetica-Bold').text('QUESTION BANK', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica-Bold').text(`SUBJECT: ${courseCode || ''} – ${courseName || 'Subject'}`, { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica-Oblique').text(`Prepared by: ${facultyName}`, { align: 'center' });
            doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });

            // Units
            (units || []).forEach((unit) => {
                doc.addPage();
                doc.fontSize(13).font('Helvetica-Bold')
                    .text(`UNIT ${unit.unitLabel} – ${(unit.unitName || '').toUpperCase()}`, { align: 'center' });
                if (unit.syllabus) {
                    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#555555')
                        .text(unit.syllabus, { align: 'center' });
                    doc.fillColor('#000000');
                }
                doc.moveDown(0.5);

                // PART-A
                doc.fontSize(11).font('Helvetica-Bold').text('PART-A (2 Marks)');
                doc.moveDown(0.3);
                const colWidths = [35, pageW - 140, 60, 75];
                const tableX = 50;
                let y = doc.y;

                const drawHdr = (cols, widths) => {
                    let x = tableX;
                    const rh = 20;
                    cols.forEach((c, ci) => {
                        doc.rect(x, y, widths[ci], rh).stroke();
                        doc.font('Helvetica-Bold').fontSize(8).text(c, x + 3, y + 6, { width: widths[ci] - 6, align: 'center', lineBreak: false });
                        x += widths[ci];
                    });
                    y += rh; doc.y = y;
                };

                const drawDataRow = (cells, widths) => {
                    const maxH = Math.max(20, ...cells.map((c, ci) =>
                        doc.heightOfString(c, { width: widths[ci] - 6, fontSize: 8 }) + 8
                    ));
                    let x = tableX;
                    cells.forEach((cell, ci) => {
                        doc.rect(x, y, widths[ci], maxH).stroke();
                        doc.font('Helvetica').fontSize(8).text(cell, x + 3, y + 4, { width: widths[ci] - 6, align: ci === 1 ? 'left' : 'center', lineBreak: ci === 1 });
                        x += widths[ci];
                    });
                    y += maxH; doc.y = y;
                    if (doc.y > doc.page.height - 80) { doc.addPage(); y = doc.y = 50; }
                };

                drawHdr(['Q.No.', 'Questions', 'BT Level', 'Competence'], colWidths);
                (unit.partA || []).forEach((q, qi) => {
                    drawDataRow([`${qi + 1}`, stripM(q.text), q.btl || '', q.competence || `CO${unit.unitNo || 1}`], colWidths);
                });

                doc.moveDown(1); y = doc.y;

                // PART-B
                doc.fontSize(11).font('Helvetica-Bold').text('PART-B (16 Marks)');
                doc.moveDown(0.3);
                const colWB = [35, pageW - 165, 45, 60, 75];
                y = doc.y;

                drawHdr(['Q.No.', 'Questions', 'Marks', 'BT Level', 'Competence'], colWB);
                (unit.partB || []).forEach((q, qi) => {
                    drawDataRow([`${qi + 1}`, stripM(q.text), `(${q.marks || 16})`, q.btl || '', q.competence || `CO${unit.unitNo || 1}`], colWB);
                });
            });

            // Signature
            doc.addPage();
            doc.moveDown(2);
            const sigY = doc.y;
            const pw = doc.page.width - 100;
            doc.fontSize(10).font('Helvetica')
                .text('Faculty In-Charge', 50, sigY, { width: pw / 3, align: 'center' })
                .text('Verified by', 50 + pw / 3, sigY, { width: pw / 3, align: 'center' })
                .text('HOD', 50 + (pw / 3) * 2, sigY, { width: pw / 3, align: 'center' });

            doc.end();
            stream.on('finish', () => resolve(`question-banks/${fileName}`));
            stream.on('error', reject);
        } catch (err) { reject(err); }
    });
}

// ─────────────────────────────────────────────────────────────
// POST /api/qbanks  — Save Q-Bank as draft + generate PDF
// ─────────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireRole('faculty'), async (req, res) => {
    const { syllabusId, courseName, courseCode, college, department, units = [] } = req.body;
    if (!courseName || !units.length) {
        return res.status(400).json({ error: 'courseName and units are required' });
    }

    try {
        let questionCount = 0;
        units.forEach(u => { questionCount += (u.partA || []).length + (u.partB || []).length; });

        const [facultyRows] = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const facultyName = facultyRows[0]?.name || '';

        // Insert QB row with status 'draft'
        const [qbRows] = await pool.query(
            `INSERT INTO question_banks (faculty_id, syllabus_id, course_name, course_code, faculty_name, college, department, status, question_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8) RETURNING id`,
            [req.user.id, syllabusId || null, courseName, courseCode || '', facultyName, college || '', department || '', questionCount]
        );
        const qbId = qbRows[0].id;

        // Insert individual questions
        for (const unit of units) {
            for (const q of (unit.partA || [])) {
                await pool.query(
                    `INSERT INTO questions (syllabus_id, faculty_id, question_bank_id, text, type, difficulty, module_no, marks, btl, co, status)
                     VALUES ($1,$2,$3,$4,'Short Answer','Medium',$5,2,$6,$7,'draft')`,
                    [syllabusId || null, req.user.id, qbId, q.text || '', unit.unitNo || 1, q.btl || null, `CO${unit.unitNo || 1}`]
                );
            }
            for (const q of (unit.partB || [])) {
                await pool.query(
                    `INSERT INTO questions (syllabus_id, faculty_id, question_bank_id, text, type, difficulty, module_no, marks, btl, co, status)
                     VALUES ($1,$2,$3,$4,'Long Answer','Hard',$5,16,$6,$7,'draft')`,
                    [syllabusId || null, req.user.id, qbId, q.text || '', unit.unitNo || 1, q.btl || null, `CO${unit.unitNo || 1}`]
                );
            }
        }

        // Generate PDF
        const fileRelPath = await generateQBankPDF({ qbId, courseName, courseCode, facultyName, college, department, units });

        await pool.query('UPDATE question_banks SET file_url = $1 WHERE id = $2', [fileRelPath, qbId]);

        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1,$2,$3)',
            [req.user.id, 'SAVE_QBANK_DRAFT', JSON.stringify({ qbId, courseName, questionCount })]
        );

        return res.status(201).json({ id: qbId, courseName, questionCount, fileUrl: fileRelPath, status: 'draft' });
    } catch (err) {
        console.error('POST /api/qbanks error:', err);
        return res.status(500).json({ error: 'Failed to save question bank: ' + err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/qbanks/:id/submit  — Faculty submits QB to coordinator
// ─────────────────────────────────────────────────────────────
router.post('/:id/submit', authMiddleware, requireRole('faculty'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM question_banks WHERE id = $1 AND faculty_id = $2`,
            [req.params.id, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Question bank not found or access denied' });
        if (!['draft', 'coordinator_rejected'].includes(rows[0].status)) {
            return res.status(400).json({ error: 'Question bank is not in a submittable state' });
        }

        await pool.query(
            `UPDATE question_banks SET status = 'submitted_to_coordinator' WHERE id = $1`,
            [req.params.id]
        );
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1,$2,$3)',
            [req.user.id, 'SUBMIT_QBANK_TO_COORDINATOR', JSON.stringify({ qbId: req.params.id })]
        );
        return res.json({ success: true, status: 'submitted_to_coordinator' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/qbanks/all  — Admin sees forwarded + approved + rejected
// ─────────────────────────────────────────────────────────────
router.get('/all', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT qb.*, u.name AS faculty_name_display,
                   (SELECT cr.remarks FROM coordinator_reviews cr WHERE cr.qbank_id = qb.id ORDER BY cr.created_at DESC LIMIT 1) AS coordinator_remarks
            FROM question_banks qb
            JOIN users u ON qb.faculty_id = u.id
            WHERE qb.status IN ('forwarded_to_admin', 'admin_approved', 'admin_rejected')
            ORDER BY qb.created_at DESC
        `);
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/qbanks  — Faculty sees own, student sees admin_approved
// ─────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        let query = `SELECT qb.*, u.name AS faculty_name_display FROM question_banks qb JOIN users u ON qb.faculty_id = u.id`;
        const params = [];
        if (req.user.role === 'student') {
            query += ` WHERE qb.status = 'admin_approved'`;
        } else if (req.user.role === 'faculty') {
            query += ` WHERE qb.faculty_id = $1`;
            params.push(req.user.id);
        }
        query += ' ORDER BY qb.created_at DESC';
        const [rows] = await pool.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/qbanks/:id/approve  (admin)
// ─────────────────────────────────────────────────────────────
router.patch('/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await pool.query(`UPDATE question_banks SET status = 'admin_approved' WHERE id = $1`, [req.params.id]);
        await pool.query(`UPDATE questions SET status = 'approved' WHERE question_bank_id = $1`, [req.params.id]);
        await pool.query('INSERT INTO activity_logs (user_id, action, details) VALUES ($1,$2,$3)',
            [req.user.id, 'ADMIN_APPROVE_QBANK', JSON.stringify({ qbId: req.params.id })]);
        return res.json({ success: true });
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/qbanks/:id/reject  (admin)
// ─────────────────────────────────────────────────────────────
router.patch('/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await pool.query(`UPDATE question_banks SET status = 'admin_rejected' WHERE id = $1`, [req.params.id]);
        await pool.query(`UPDATE questions SET status = 'rejected' WHERE question_bank_id = $1`, [req.params.id]);
        await pool.query('INSERT INTO activity_logs (user_id, action, details) VALUES ($1,$2,$3)',
            [req.user.id, 'ADMIN_REJECT_QBANK', JSON.stringify({ qbId: req.params.id })]);
        return res.json({ success: true });
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/qbanks/:id/file  — Serve PDF
// ─────────────────────────────────────────────────────────────
router.get('/:id/file', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT file_url FROM question_banks WHERE id = $1', [req.params.id]);
        if (!rows.length || !rows[0].file_url) return res.status(404).json({ error: 'File not found' });
        const filePath = join(__dirname, '..', 'uploads', rows[0].file_url);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="QuestionBank_${req.params.id}.pdf"`);
        fs.createReadStream(filePath).pipe(res);
    } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

export default router;
