import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

// Map AI type labels → DB-safe values
function normalizeType(t) {
    if (!t) return 'Short Answer';
    if (t === 'Short Answer' || t === 'Short') return 'Short Answer';
    if (t === 'Long Answer' || t === 'Long') return 'Long Answer';
    if (t === 'MCQ') return 'MCQ';
    return t;
}

// POST /api/questions  (faculty only) — save one or many questions
router.post('/', authMiddleware, requireRole('faculty'), async (req, res) => {
    const questions = Array.isArray(req.body) ? req.body : [req.body];
    try {
        const inserted = [];
        for (const q of questions) {
            const { text, type, difficulty, module_no, marks, answer, syllabus_id, btl, co, options } = q;
            if (!text) continue;
            const normalizedType = normalizeType(type);
            const optionsJson = options && Array.isArray(options) && options.length > 0
                ? JSON.stringify(options)
                : null;
            const [rows] = await pool.query(
                'INSERT INTO questions (syllabus_id, faculty_id, text, type, difficulty, module_no, marks, answer, btl, co, options, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id',
                [
                    syllabus_id || null,
                    req.user.id,
                    text,
                    normalizedType,
                    difficulty || 'Medium',
                    module_no || 1,
                    marks || 2,
                    answer || null,
                    btl || null,
                    co || null,
                    optionsJson,
                    'pending',
                ]
            );
            inserted.push({ id: rows[0].id, text, type: normalizedType, difficulty, module_no, marks, btl, co });
        }

        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'SAVE_QUESTIONS', JSON.stringify({ count: inserted.length })]
        );

        return res.status(201).json(inserted);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/questions  (authenticated)
router.get('/', authMiddleware, async (req, res) => {
    try {
        let query = `
      SELECT q.*, u.name AS faculty_name, s.course_name
      FROM questions q
      JOIN users u ON q.faculty_id = u.id
      LEFT JOIN syllabi s ON q.syllabus_id = s.id
    `;
        const params = [];
        const conditions = [];

        if (req.query.syllabusId) {
            conditions.push(`q.syllabus_id = $${params.length + 1}`);
            params.push(req.query.syllabusId);
        }
        if (req.user.role === 'student') {
            conditions.push(`q.status = 'approved'`);
        }
        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY q.created_at DESC';

        const [rows] = await pool.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/questions/all  (admin only) — all questions from all faculty
router.get('/all', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT q.*, u.name AS faculty_name, s.course_name
            FROM questions q
            JOIN users u ON q.faculty_id = u.id
            LEFT JOIN syllabi s ON q.syllabus_id = s.id
            ORDER BY q.created_at DESC
        `);
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/questions/:id/approve  (admin only)
router.patch('/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await pool.query("UPDATE questions SET status = 'approved' WHERE id = $1", [req.params.id]);
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'APPROVE_QUESTION', JSON.stringify({ questionId: req.params.id })]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/questions/:id/reject  (admin only)
router.patch('/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await pool.query("UPDATE questions SET status = 'rejected' WHERE id = $1", [req.params.id]);
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'REJECT_QUESTION', JSON.stringify({ questionId: req.params.id })]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/questions/:id
router.delete('/:id', authMiddleware, requireRole('faculty'), async (req, res) => {
    try {
        await pool.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;
