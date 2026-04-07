/**
 * server/routes/coordinator.js
 * Year Coordinator review panel for Question Banks AND Question Papers
 * Security: requires faculty role + DB-verified is_coordinator flag
 */
import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware, requireCoordinator } from '../middleware/auth.js';

const router = Router();

// All coordinator routes require authMiddleware + requireCoordinator
router.use(authMiddleware, requireCoordinator);

// ───────────────────────────────────────────────────────────
// Q-BANK ROUTES
// ───────────────────────────────────────────────────────────

// GET /api/coordinator/qbanks
router.get('/qbanks', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT qb.*, u.name AS faculty_name,
                    (SELECT cr.remarks FROM coordinator_reviews cr
                     WHERE cr.qbank_id = qb.id ORDER BY cr.created_at DESC LIMIT 1) AS latest_remark,
                    (SELECT cr.action FROM coordinator_reviews cr
                     WHERE cr.qbank_id = qb.id ORDER BY cr.created_at DESC LIMIT 1) AS latest_action
             FROM question_banks qb
             JOIN users u ON qb.faculty_id = u.id
             WHERE qb.status IN ('submitted_to_coordinator','coordinator_approved','coordinator_rejected')
             ORDER BY qb.created_at DESC`
        );
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/coordinator/qbanks/:id/reviews
router.get('/qbanks/:id/reviews', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT cr.*, u.name AS coordinator_name
             FROM coordinator_reviews cr
             JOIN users u ON cr.coordinator_id = u.id
             WHERE cr.qbank_id = $1 ORDER BY cr.created_at DESC`,
            [req.params.id]
        );
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/coordinator/qbanks/:id/review
// Body: { action: 'approve'|'reject'|'forward', remarks: string }
router.post('/qbanks/:id/review', async (req, res) => {
    const { action, remarks = '' } = req.body;
    if (!['approve', 'reject', 'forward'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be approve, reject, or forward.' });
    }

    try {
        const [qbRows] = await pool.query(
            `SELECT * FROM question_banks WHERE id = $1 AND status IN ('submitted_to_coordinator','coordinator_approved','coordinator_rejected')`,
            [req.params.id]
        );
        if (!qbRows.length) {
            return res.status(404).json({ error: 'Question bank not found or not in coordinator review queue' });
        }

        const statusMap = {
            approve: 'coordinator_approved',
            reject: 'coordinator_rejected',
            forward: 'forwarded_to_admin',
        };
        const newStatus = statusMap[action];

        await pool.query('UPDATE question_banks SET status = $1 WHERE id = $2', [newStatus, req.params.id]);
        await pool.query(
            'INSERT INTO coordinator_reviews (qbank_id, coordinator_id, action, remarks) VALUES ($1, $2, $3, $4)',
            [req.params.id, req.user.id, action, remarks]
        );
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, `COORDINATOR_QBANK_${action.toUpperCase()}`, JSON.stringify({ qbankId: req.params.id, remarks })]
        );

        return res.json({ success: true, status: newStatus, message: `Q-Bank ${action}d successfully.` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ───────────────────────────────────────────────────────────
// PAPER ROUTES
// ───────────────────────────────────────────────────────────

// GET /api/coordinator/papers
router.get('/papers', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT qp.*, u.name AS faculty_name
             FROM question_papers qp
             JOIN users u ON qp.faculty_id = u.id
             WHERE qp.status IN ('submitted_to_coordinator','coordinator_approved','coordinator_rejected')
             ORDER BY qp.created_at DESC`
        );
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/coordinator/papers/:id/review
// Body: { action: 'approve'|'reject'|'forward', remarks: string }
router.post('/papers/:id/review', async (req, res) => {
    const { action, remarks = '' } = req.body;
    if (!['approve', 'reject', 'forward'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action.' });
    }

    try {
        const [pRows] = await pool.query(
            `SELECT * FROM question_papers WHERE id = $1 AND status IN ('submitted_to_coordinator','coordinator_approved','coordinator_rejected')`,
            [req.params.id]
        );
        if (!pRows.length) {
            return res.status(404).json({ error: 'Paper not found or not in coordinator review queue' });
        }

        const statusMap = {
            approve: 'coordinator_approved',
            reject: 'coordinator_rejected',
            forward: 'forwarded_to_admin',
        };
        const newStatus = statusMap[action];

        await pool.query('UPDATE question_papers SET status = $1 WHERE id = $2', [newStatus, req.params.id]);
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, `COORDINATOR_PAPER_${action.toUpperCase()}`, JSON.stringify({ paperId: req.params.id, remarks })]
        );

        return res.json({ success: true, status: newStatus, message: `Paper ${action}d successfully.` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;
