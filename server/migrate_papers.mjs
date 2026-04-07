/**
 * server/migrate_papers.mjs
 * Run once: node server/migrate_papers.mjs
 * Adds missing columns to question_papers for the new status-based workflow.
 */
import pool from './db.js';

async function migrate() {
    const alterStatements = [
        `ALTER TABLE question_papers ADD COLUMN IF NOT EXISTS course_code   VARCHAR(100) DEFAULT ''`,
        `ALTER TABLE question_papers ADD COLUMN IF NOT EXISTS department     VARCHAR(255) DEFAULT ''`,
        `ALTER TABLE question_papers ADD COLUMN IF NOT EXISTS duration       VARCHAR(50)  DEFAULT '3 Hrs'`,
        `ALTER TABLE question_papers ADD COLUMN IF NOT EXISTS regulations    VARCHAR(100) DEFAULT ''`,
        `ALTER TABLE question_papers ADD COLUMN IF NOT EXISTS branch         VARCHAR(100) DEFAULT ''`,
        `ALTER TABLE question_papers ADD COLUMN IF NOT EXISTS year           VARCHAR(50)  DEFAULT ''`,
        `ALTER TABLE question_papers ADD COLUMN IF NOT EXISTS semester       VARCHAR(50)  DEFAULT ''`,
        `ALTER TABLE question_papers ADD COLUMN IF NOT EXISTS qp_code        VARCHAR(100) DEFAULT ''`,
        `ALTER TABLE question_papers ADD COLUMN IF NOT EXISTS faculty_name   VARCHAR(255) DEFAULT ''`,
        // Update status check to allow new workflow values
        `ALTER TABLE question_papers DROP CONSTRAINT IF EXISTS question_papers_status_check`,
        `ALTER TABLE question_papers ADD CONSTRAINT question_papers_status_check
            CHECK (status IN ('draft','pending','submitted_to_coordinator','coordinator_approved','coordinator_rejected','forwarded_to_admin','admin_approved','admin_rejected','approved','rejected'))`,
    ];

    for (const sql of alterStatements) {
        try {
            await pool.query(sql);
            console.log('✓', sql.slice(0, 60));
        } catch (err) {
            console.error('✗', sql.slice(0, 60), '\n  ', err.message);
        }
    }
    console.log('\nMigration complete.');
    process.exit(0);
}

migrate();
