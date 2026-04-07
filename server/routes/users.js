import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'qsage_secret_key';

// GET /api/users?role=faculty|student  (admin only)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
    const { role } = req.query;
    try {
        if (role) {
            const [rows] = await pool.query(
                'SELECT id, name, email, role, department, status, is_coordinator, created_at FROM users WHERE role = $1 ORDER BY name',
                [role]
            );
            return res.json(rows);
        }
        // Return counts by role for dashboard stats
        const [counts] = await pool.query(
            `SELECT
        SUM(CASE WHEN role='faculty' THEN 1 ELSE 0 END) AS faculty_count,
        SUM(CASE WHEN role='student' THEN 1 ELSE 0 END) AS student_count,
        SUM(CASE WHEN role='admin'   THEN 1 ELSE 0 END) AS admin_count
       FROM users`
        );
        return res.json(counts[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/users/:id  (admin only) — update faculty details
router.patch('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
    const { name, email, department, status } = req.body;
    try {
        await pool.query(
            'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), department = COALESCE($3, department), status = COALESCE($4, status) WHERE id = $5',
            [name || null, email || null, department || null, status || null, req.params.id]
        );
        const [rows] = await pool.query('SELECT id, name, email, role, department, status, is_coordinator FROM users WHERE id = $1', [req.params.id]);
        return res.json(rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/users/faculty — Admin creates a faculty account
router.post('/faculty', authMiddleware, requireRole('admin'), async (req, res) => {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = $1 AND role = $2', [email, 'faculty']);
        if (existing.length > 0) return res.status(409).json({ error: 'Faculty with this email already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const [rows] = await pool.query(
            'INSERT INTO users (name, email, password, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, email, hashed, 'faculty', department || '']
        );
        const newId = rows[0].id;
        return res.status(201).json({ id: newId, name, email, role: 'faculty', department });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/users/:id/coordinator  (admin only) — toggle Year Coordinator flag
router.patch('/:id/coordinator', authMiddleware, requireRole('admin'), async (req, res) => {
    const { is_coordinator } = req.body;
    if (typeof is_coordinator !== 'boolean') {
        return res.status(400).json({ error: 'is_coordinator must be a boolean' });
    }
    try {
        const [checkRows] = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
        if (!checkRows.length) return res.status(404).json({ error: 'User not found' });
        if (checkRows[0].role !== 'faculty') {
            return res.status(400).json({ error: 'Only faculty accounts can be assigned as Year Coordinator' });
        }
        await pool.query('UPDATE users SET is_coordinator = $1 WHERE id = $2', [is_coordinator, req.params.id]);
        return res.json({ success: true, is_coordinator });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/users/:id  (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;
