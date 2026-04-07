import mysql from 'mysql2/promise';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read schema — strip USE qsage_db; so we can run without DB selected first
const schema = fs.readFileSync(join(__dirname, 'schema.sql'), 'utf8');

(async () => {
    let conn;
    try {
        // Connect without DB first to create it
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            multipleStatements: true,
        });

        console.log('✅ Connected to MySQL');

        // Run the entire schema
        await conn.query(schema);
        console.log('✅ Database and all tables created successfully in qsage_db');

    } catch (err) {
        console.error('❌ Schema setup failed:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
})();
