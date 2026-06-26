import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finanzas',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined,
});

async function run() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, simbolo, nombre FROM activos 
      WHERE simbolo LIKE 'M2_%' OR simbolo LIKE 'ALQ_%'
      ORDER BY simbolo ASC
    `);
    console.log('ALL DB Neighborhoods (simbolo, nombre):');
    rows.forEach(r => {
      console.log(`- ${r.simbolo} | ${r.nombre} (ID: ${r.id})`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
