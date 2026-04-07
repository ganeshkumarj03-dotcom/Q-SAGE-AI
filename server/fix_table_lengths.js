import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_fVOgF7bh4Gvo@ep-rapid-mud-adwsk7vv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Altering question_banks status column...");
        await pool.query('ALTER TABLE question_banks ALTER COLUMN status TYPE VARCHAR(50)');
        console.log("Altered question_banks");

        // just in case questions has the same issue
        await pool.query('ALTER TABLE questions ALTER COLUMN status TYPE VARCHAR(50)');
        console.log("Altered questions");

        // also question_papers
        await pool.query('ALTER TABLE question_papers ALTER COLUMN status TYPE VARCHAR(50)');
        console.log("Altered question_papers");

        // also qbank_files
        await pool.query('ALTER TABLE qbank_files ALTER COLUMN status TYPE VARCHAR(50)');
        console.log("Altered qbank_files");
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await pool.end();
    }
}
run();
