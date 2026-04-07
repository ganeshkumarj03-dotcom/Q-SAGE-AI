import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'qsage_secret_key';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['admin', 'faculty', 'student'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    if (role === 'admin') {
        return res.status(403).json({ error: 'Admin accounts cannot be created via signup. Contact your system administrator.' });
    }
    if (role === 'faculty') {
        return res.status(403).json({ error: 'Faculty accounts are created by the admin only. Please contact your administrator.' });
    }
    try {
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND role = $2',
            [email, role]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'An account with this email already exists for this role.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [rows] = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, email, hashedPassword, role]
        );
        const newId = rows[0].id;

        // Log
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [newId, 'SIGNUP', JSON.stringify({ role })]
        );

        const token = jwt.sign({ id: newId, name, email, role }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ token, user: { id: newId, name, email, role } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error during signup' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND role = $2',
            [email, role]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password. Please try again or sign up first.' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password. Please try again or sign up first.' });
        }

        // Log
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [user.id, 'LOGIN', JSON.stringify({ role })]
        );

        const isCoordinator = !!user.is_coordinator;
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, is_coordinator: isCoordinator },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, is_coordinator: isCoordinator } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error during login' });
    }
});

export default router;
