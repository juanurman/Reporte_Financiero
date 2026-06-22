import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finanzas',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined,
});

const monthMap = {
  'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
};

// Generador de Tickers para Alquileres (ALQ_...) compatible con fixes
const getTicker = (barrio) => {
  const fixes = { 'Nuñez': 'ALQ_NUN', 'Nunez': 'ALQ_NUN', 'Belgrano': 'ALQ_BEL', 'Palermo': 'ALQ_PAL', 'Recoleta': 'ALQ_REC' };
  if (fixes[barrio]) return fixes[barrio];
  
  const clean = barrio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, '');
  return `ALQ_${clean.substring(0, 20)}`;
};

const runImport = async () => {
  try {
    console.log('Iniciando importación masiva de alquileres por barrio...');

    // 0. Limpiar antiguos registros de alquileres por barrio (excepto el mock general ALQ_YIELD)
    console.log('Limpiando registros antiguos de alquileres por barrio...');
    await pool.execute(`
      DELETE FROM activos 
      WHERE simbolo LIKE "ALQ_%" 
      AND simbolo <> "ALQ_YIELD"
    `);

    const csvPath = path.join(__dirname, 'zonaprop_alquileres_historico_total.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ El archivo ${csvPath} no existe. Por favor ejecuta primero 'py scrape_alquileres.py'`);
      return;
    }

    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n');

    // 1. Identificar barrios con datos válidos
    const barriosConDatos = new Set();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      const barrio = cols[2];
      const indexPrecioStr = cols[4]; // Columna Index en Alquileres
      if (barrio && indexPrecioStr && indexPrecioStr !== '-' && indexPrecioStr.trim() !== '') {
        barriosConDatos.add(barrio);
      }
    }

    // 2. Insertar los activos de alquiler
    for (const barrio of barriosConDatos) {
      const ticker = getTicker(barrio);
      await pool.execute('INSERT IGNORE INTO activos (simbolo, nombre, categoria, emoji) VALUES (?, ?, "Real Estate", "🔑")', [ticker, `Alquiler ${barrio}`]);
    }

    const [activos] = await pool.execute('SELECT id, simbolo FROM activos WHERE simbolo LIKE "ALQ_%" AND simbolo <> "ALQ_YIELD"');
    const idMap = Object.fromEntries(activos.map(a => [a.simbolo, a.id]));

    let insertados = 0;
    const valoresBulk = [];
    const seen = new Set();

    // 3. Procesar filas de precios
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      const periodo = cols[0];
      const barrio = cols[2];
      const indexPrecioStr = cols[4]; // En alquileres, Index es celdas[3]/cols[4]

      const simbolo = getTicker(barrio);
      if (!simbolo || !idMap[simbolo] || !indexPrecioStr || indexPrecioStr === '-') continue;

      const parts = periodo.replace('.', '').split(' ').filter(Boolean);
      const mes = monthMap[parts[0].toLowerCase()];
      if (!mes) continue;
      const fecha = `20${parts[1]}-${mes}-01`;

      // Los precios en pesos están en formato "1.381.761". Removemos los puntos para parsearlo a número entero.
      const precio = parseInt(indexPrecioStr.replace(/\./g, ''), 10);
      if (isNaN(precio)) continue;

      const key = `${simbolo}_${fecha}`;
      if (seen.has(key)) continue;
      seen.add(key);

      valoresBulk.push([idMap[simbolo], fecha, precio]);
      insertados++;
    }

    console.log(`Enviando ${insertados} precios de alquileres a la base de datos (Bulk Insert)...`);
    const chunkSize = 1000;
    for (let i = 0; i < valoresBulk.length; i += chunkSize) {
      const chunk = valoresBulk.slice(i, i + chunkSize);
      await pool.query('INSERT INTO precios_historicos (activo_id, fecha, valor) VALUES ? ON DUPLICATE KEY UPDATE valor = VALUES(valor)', [chunk]);
    }

    console.log(`✅ Importación de alquileres finalizada. Se insertaron ${insertados} registros.`);
  } catch (e) {
    console.error('❌ Error al importar alquileres:', e);
  } finally {
    await pool.end();
  }
};

runImport();
