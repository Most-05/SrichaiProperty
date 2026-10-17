import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// โหลดตัวแปร DATABASE_URL จาก .env.local หรือ .env
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length > 0) {
          let v = val.join('=').trim();
          if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = v;
          }
        }
      });
    }
  }
}

async function run() {
  loadEnv();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ ไม่พบ DATABASE_URL ใน .env.local หรือ .env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });

  try {
    console.log('🔄 กำลังอัปเดต Check Constraints ในฐานข้อมูล...');

    await pool.query(`
      ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
      ALTER TABLE properties ADD CONSTRAINT properties_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected', 'closed', 'sold', 'active', 'inactive'));
    `);
    console.log('✅ 1. อัปเดต properties_status_check สำเร็จ (รองรับ closed/sold)');

    await pool.query(`
      ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
      ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled', 'no_show', 'no-show', 'awaiting_customer'));
    `);
    console.log('✅ 2. อัปเดต appointments_status_check สำเร็จ (รองรับ no_show/awaiting_customer)');

    console.log('🎉 อัปเดตฐานข้อมูลเสร็จสมบูรณ์เรียบร้อยแล้ว!');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการอัปเดตฐานข้อมูล:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
