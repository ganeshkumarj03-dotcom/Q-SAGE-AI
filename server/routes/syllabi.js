import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();

// Multer setup — save to server/uploads/
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'server/uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `syllabus_${Date.now()}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100 MB

// POST /api/syllabi  (faculty only)
router.post('/', authMiddleware, requireRole('faculty'), upload.single('file'), async (req, res) => {
    const { course_name, course_code, semester } = req.body;
    if (!course_name || !course_code) {
        return res.status(400).json({ error: 'course_name and course_code are required' });
    }
    try {
        const file_path = req.file ? req.file.filename : null;
        const [rows] = await pool.query(
            "INSERT INTO syllabi (faculty_id, course_name, course_code, semester, file_path, status) VALUES ($1, $2, $3, $4, $5, 'approved') RETURNING id",
            [req.user.id, course_name, course_code, semester || '', file_path]
        );
        const syllabusId = rows[0].id;

        // Insert modules if provided
        const modules = req.body.modules ? JSON.parse(req.body.modules) : [];
        for (const mod of modules) {
            await pool.query(
                'INSERT INTO syllabus_modules (syllabus_id, module_no, title, topics) VALUES ($1, $2, $3, $4)',
                [syllabusId, mod.id, mod.title, JSON.stringify(mod.topics || [])]
            );
        }

        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'UPLOAD_SYLLABUS', JSON.stringify({ syllabusId, course_name })]
        );

        const [sylRows] = await pool.query('SELECT * FROM syllabi WHERE id = $1', [syllabusId]);
        return res.status(201).json(sylRows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/syllabi  (all authenticated users)
router.get('/', authMiddleware, async (req, res) => {
    try {
        let query = `
      SELECT s.*, u.name AS faculty_name
      FROM syllabi s
      JOIN users u ON s.faculty_id = u.id
    `;
        const params = [];

        if (req.user.role === 'student') {
            query += ` WHERE s.status = 'approved'`;
        }
        query += ' ORDER BY s.created_at DESC';

        const [rows] = await pool.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/syllabi/:id  - get syllabus with modules
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM syllabi WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });

        const [modules] = await pool.query(
            'SELECT * FROM syllabus_modules WHERE syllabus_id = $1 ORDER BY module_no',
            [req.params.id]
        );
        return res.json({ ...rows[0], modules });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/syllabi/:id/approve  (admin only)
router.patch('/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await pool.query("UPDATE syllabi SET status = 'approved' WHERE id = $1", [req.params.id]);
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'APPROVE_SYLLABUS', JSON.stringify({ syllabusId: req.params.id })]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/syllabi/:id/reject  (admin only)
router.patch('/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await pool.query("UPDATE syllabi SET status = 'rejected' WHERE id = $1", [req.params.id]);
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'REJECT_SYLLABUS', JSON.stringify({ syllabusId: req.params.id })]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/syllabi/:id
router.delete('/:id', authMiddleware, requireRole('faculty'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM syllabi WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Syllabus not found' });

        const syllabus = rows[0];
        if (syllabus.file_path) {
            const filePath = join(__dirname, '..', 'uploads', syllabus.file_path);
            fs.unlink(filePath, (err) => { if (err) console.warn('File delete warning:', err.message); });
        }
        await pool.query('DELETE FROM syllabi WHERE id = $1', [req.params.id]);
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'DELETE_SYLLABUS', JSON.stringify({ syllabusId: req.params.id })]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;
