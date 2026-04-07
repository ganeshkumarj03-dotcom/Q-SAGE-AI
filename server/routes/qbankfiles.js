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

// Multer setup — save to server/uploads/qbanks/
const qbankUploadsDir = join(__dirname, '..', 'uploads', 'qbanks');
if (!fs.existsSync(qbankUploadsDir)) fs.mkdirSync(qbankUploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, qbankUploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `qbank_${Date.now()}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.docx', '.doc', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only PDF, DOCX, DOC, TXT files are allowed'));
    },
});

// POST /api/qbank-files  (faculty only)
router.post('/', authMiddleware, requireRole('faculty'), upload.single('file'), async (req, res) => {
    const { course_name, course_code } = req.body;
    if (!course_name || !course_code) {
        return res.status(400).json({ error: 'course_name and course_code are required' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'A file is required' });
    }
    try {
        const file_path = `qbanks/${req.file.filename}`;
        const original_name = req.file.originalname;
        const [inserted] = await pool.query(
            'INSERT INTO qbank_files (faculty_id, course_name, course_code, file_path, original_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [req.user.id, course_name.trim(), course_code.trim(), file_path, original_name]
        );
        const newId = inserted[0].id;
        const [rows] = await pool.query(
            'SELECT q.*, u.name AS faculty_name FROM qbank_files q JOIN users u ON q.faculty_id = u.id WHERE q.id = $1',
            [newId]
        );
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/qbank-files
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT q.*, u.name AS faculty_name FROM qbank_files q JOIN users u ON q.faculty_id = u.id ORDER BY q.created_at DESC`
        );
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/qbank-files/:id
router.delete('/:id', authMiddleware, requireRole('faculty'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM qbank_files WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'File not found' });
        const qbank = rows[0];
        if (qbank.file_path) {
            const filePath = join(__dirname, '..', 'uploads', qbank.file_path);
            fs.unlink(filePath, (err) => { if (err) console.warn('File delete warning:', err.message); });
        }
        await pool.query('DELETE FROM qbank_files WHERE id = $1', [req.params.id]);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;
