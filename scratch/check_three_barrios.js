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
    const [activos] = await pool.execute(`
      SELECT id, simbolo, nombre FROM activos 
      WHERE simbolo IN ('ALQ_ALMAGRO', 'M2_ALMAGRO', 'ALQ_PARQUECHACABUCO', 'M2_PARQUECHACABUCO', 'ALQ_SANTELMO', 'M2_SANTELMO')
    `);
    
    for (const a of activos) {
      const [[{count}]] = await pool.execute('SELECT COUNT(*) as count FROM precios_historicos WHERE activo_id = ?', [a.id]);
      console.log(`- ${a.simbolo} | ${a.nombre} (ID: ${a.id}): ${count} prices`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
