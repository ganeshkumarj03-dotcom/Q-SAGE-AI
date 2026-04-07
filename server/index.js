import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

// Ensure uploads directory exists
const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import syllabusRoutes from './routes/syllabi.js';
import questionRoutes from './routes/questions.js';
import paperRoutes from './routes/papers.js';
import logRoutes from './routes/logs.js';
import aiRoutes from './routes/ai.js';
import qbankFilesRoutes from './routes/qbankfiles.js';
import qbanksRoutes from './routes/qbanks.js';
import coordinatorRoutes from './routes/coordinator.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directories exist
const qbDir = join(__dirname, 'uploads', 'question-banks');
if (!fs.existsSync(qbDir)) fs.mkdirSync(qbDir, { recursive: true });
const qpDir = join(__dirname, 'uploads', 'question-papers');
if (!fs.existsSync(qpDir)) fs.mkdirSync(qpDir, { recursive: true });

// Advanced CORS — allow localhost, 127.0.0.1, and all private LAN IP ranges
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow server-to-server / curl
        const allowedPatterns = [
            /^https?:\/\/localhost(:\d+)?$/,
            /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
            /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,   // 192.168.x.x
            /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,    // 10.x.x.x
            /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/, // 172.16-31.x.x
        ];
        const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
        if (isAllowed) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/syllabi', syllabusRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/qbank-files', qbankFilesRoutes);
app.use('/api/qbanks', qbanksRoutes);
app.use('/api/coordinator', coordinatorRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Global error handler — prevents server crashes from unexpected route errors
app.use((err, req, res, next) => {
    if (err instanceof Error && err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS policy blocked this request.' });
    }
    console.error(`❌ Global Error [${req.method} ${req.path}]:`, err.stack || err.message);
    res.status(500).json({ error: 'Something went wrong on the server' });
});

// Catch unhandled promise rejections & exceptions so the process stays alive
process.on('unhandledRejection', (reason) => {
    console.error('⚠️  Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('⚠️  Uncaught Exception:', err.message);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Q-Sage Backend running on http://localhost:${PORT}`);
});
