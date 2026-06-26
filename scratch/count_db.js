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
    const [[{count: totalPrecios}]] = await pool.execute('SELECT COUNT(*) as count FROM precios_historicos');
    const [[{count: totalActivos}]] = await pool.execute('SELECT COUNT(*) as count FROM activos');
    console.log(`Total precios_historicos in DB: ${totalPrecios}`);
    console.log(`Total activos in DB: ${totalActivos}`);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
