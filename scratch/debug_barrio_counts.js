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
      WHERE simbolo IN ('M2_PAL', 'ALQ_PALERMO', 'ALQ_PAL', 'M2_PALERMO')
    `);
    console.log('Activos found for Palermo:', activos);

    for (const activo of activos) {
      const [[{count}]] = await pool.execute(
        'SELECT COUNT(*) as count FROM precios_historicos WHERE activo_id = ?',
        [activo.id]
      );
      const [dates] = await pool.execute(
        'SELECT MIN(fecha) as min, MAX(fecha) as max FROM precios_historicos WHERE activo_id = ?',
        [activo.id]
      );
      console.log(`Activo ${activo.simbolo} (ID: ${activo.id}) has ${count} prices:`, dates[0]);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
