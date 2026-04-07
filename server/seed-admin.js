/**
 * seed-admin.js
 * Run once: node server/seed-admin.js
 * Inserts the fixed admin account if it does not already exist.
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ADMIN_EMAIL = 'srmvec27@gmail.com';
const ADMIN_PASSWORD = 'srmvec27';
const ADMIN_NAME = 'Admin';

(async () => {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'qsage_db',
        });

        const [rows] = await conn.query(
            'SELECT id FROM users WHERE email = ? AND role = ?',
            [ADMIN_EMAIL, 'admin']
        );

        if (rows.length > 0) {
            console.log('ℹ️  Admin account already exists — no changes made.');
        } else {
            const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await conn.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [ADMIN_NAME, ADMIN_EMAIL, hashed, 'admin']
            );
            console.log('✅ Admin account seeded successfully.');
            console.log(`   Email   : ${ADMIN_EMAIL}`);
            console.log(`   Role    : admin`);
        }
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
})();
