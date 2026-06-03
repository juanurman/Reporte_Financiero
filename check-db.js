const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  try {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: true }
    });
    
    const [rows] = await c.query('SHOW COLUMNS FROM cartera');
    console.log(rows);
    
    const hasTipo = rows.find(r => r.Field === 'tipo');
    if (!hasTipo) {
      await c.query('ALTER TABLE cartera ADD COLUMN tipo ENUM("COMPRA", "VENTA") DEFAULT "COMPRA"');
      console.log('Added tipo column.');
    } else {
      console.log('tipo column exists.');
    }
    c.end();
  } catch (e) {
    console.error(e);
  }
}
check();
