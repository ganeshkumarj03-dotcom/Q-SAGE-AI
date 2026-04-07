import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/logs  (admin only)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT l.*, u.name AS user_name, u.role AS user_role
       FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC
       LIMIT 100`
        );
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;
