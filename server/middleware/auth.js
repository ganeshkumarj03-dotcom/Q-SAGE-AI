import jwt from 'jsonwebtoken';
import pool from '../db.js';

export function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'qsage_secret_key');
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
}

/**
 * requireCoordinator — must be used AFTER authMiddleware.
 * Double-checks the DB so no JWT tampering can bypass this.
 */
export function requireCoordinator(req, res, next) {
    if (req.user?.role !== 'faculty') {
        return res.status(403).json({ error: 'Access denied: faculty only' });
    }
    // DB re-verification: is this faculty actually a coordinator?
    pool.query('SELECT is_coordinator FROM users WHERE id = $1', [req.user.id])
        .then(([rows]) => {
            if (!rows.length || !rows[0].is_coordinator) {
                return res.status(403).json({ error: 'Access denied: Year Coordinator role required' });
            }
            next();
        })
        .catch(() => res.status(500).json({ error: 'Authorization check failed' }));
}
