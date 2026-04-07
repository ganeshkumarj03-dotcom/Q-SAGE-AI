import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const DATABASE_URL = 'postgresql://neondb_owner:npg_fVOgF7bh4Gvo@ep-rapid-mud-adwsk7vv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DATABASE_URL);

const existing = await sql`SELECT id FROM users WHERE email = ${'srmvec27@gmail.com'} AND role = ${'admin'}`;

if (existing.length > 0) {
    console.log('✅ Admin already exists (id:', existing[0].id + ')');
    console.log('   Email:    srmvec27@gmail.com');
    console.log('   Password: srmvec27');
} else {
    const hashed = await bcrypt.hash('srmvec27', 10);
    const result = await sql`INSERT INTO users (name, email, password, role) VALUES (${'Admin'}, ${'srmvec27@gmail.com'}, ${hashed}, ${'admin'}) RETURNING id`;
    console.log('✅ Admin account created! (id:', result[0].id + ')');
    console.log('   Email:    srmvec27@gmail.com');
    console.log('   Password: srmvec27');
}
