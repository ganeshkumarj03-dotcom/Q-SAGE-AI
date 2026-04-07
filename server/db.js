import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

// Ensure SSL is used for Neon connections
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * pool — wrapper around 'pg' Pool to match the expected interface (mysql2-like).
 * The routes expect: const [rows] = await pool.query(sql, params)
 */
const pool = {
  // query wrapper
  query: async (queryText, params = []) => {
    // pg uses 1-based indexed parameters like $1, $2, which matches what we already converted to.
    const res = await pgPool.query(queryText, params);
    // Return array of rows inside an array to mimic [rows] destructuring of mysql2
    return [res.rows];
  },

  // connection wrapper for transactions
  getConnection: async () => {
    const client = await pgPool.connect();

    return {
      query: async (queryText, params = []) => {
        const res = await client.query(queryText, params);
        return [res.rows];
      },
      beginTransaction: async () => {
        await client.query('BEGIN');
      },
      commit: async () => {
        await client.query('COMMIT');
      },
      rollback: async () => {
        try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
      },
      release: () => {
        client.release();
      },
    };
  },
};

// ── Startup: verify connection + seed admin ───────────────────────────────────
// Schema is managed via schema.sql (already applied to Neon DB).
// No migrations needed here.
(async () => {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('✅ Neon DB connected successfully (via pg)');

    // ── Seed fixed admin account ──────────────────────────────────────────────
    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = $1 AND role = $2', ['srmvec27@gmail.com', 'admin']);
      if (existing.length === 0) {
        const hashed = await bcrypt.hash('srmvec27', 10);
        await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', ['Admin', 'srmvec27@gmail.com', hashed, 'admin']);
        console.log('✅ Admin account seeded (srmvec27@gmail.com)');
      }
    } catch (e) {
      console.error('⚠️  Admin seed error:', e.message);
    }

  } catch (err) {
    console.error('❌ Neon DB connection failed:', err.message);
    process.exit(1);
  }
})();

export default pool;
