import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_fVOgF7bh4Gvo@ep-rapid-mud-adwsk7vv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const sql = fs.readFileSync('schema_coordinator.sql', 'utf8');
        console.log("Applying schema...");
        await pool.query(sql);
        console.log("Schema applied.");

        const res = await pool.query("SELECT id, name, email, role, is_coordinator FROM users WHERE name ILIKE '%DAVID SANCHEZ%'");
        console.log("Users:", res.rows);
        if (res.rows.length > 0) {
            await pool.query("UPDATE users SET is_coordinator = true WHERE id = $1", [res.rows[0].id]);
            console.log("Updated user to be coordinator.");
        } else {
            const all = await pool.query("SELECT id, name, email, role, is_coordinator FROM users");
            console.log("All users:", all.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
