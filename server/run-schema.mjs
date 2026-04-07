import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = 'postgresql://neondb_owner:npg_fVOgF7bh4Gvo@ep-rapid-mud-adwsk7vv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(DATABASE_URL);

const schemaPath = join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);

console.log(`Running ${statements.length} SQL statements...`);
for (const stmt of statements) {
    try {
        await sql(stmt + ';', []);
        console.log('✅', stmt.substring(0, 80).replace(/\n/g, ' '));
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('⚠️  Already exists (skipping)');
        } else {
            console.error('❌ Error:', e.message);
        }
    }
}
console.log('\n✅ Schema setup complete!');
