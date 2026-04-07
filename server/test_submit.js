import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_fVOgF7bh4Gvo@ep-rapid-mud-adwsk7vv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        // try to replicate the submit action to see the exact error
        // let's just insert to activity_logs to see if it fails
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1,$2,$3)',
            [3, 'SUBMIT_QBANK_TO_COORDINATOR', JSON.stringify({ qbId: 1 })]
        );
        console.log("Insert successful");
    } catch (e) {
        console.error("Error inserting:", e.message);
    } finally {
        await pool.end();
    }
}
run();
