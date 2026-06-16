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

// Diccionario para convertir "may.", "abr" a números de mes
const monthMap = {
  'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
};

// Función para generar un Ticker consistente y mantener compatibilidad con los 4 originales
const getTicker = (barrio) => {
  const fixes = { 'Nuñez': 'M2_NUN', 'Nunez': 'M2_NUN', 'Belgrano': 'M2_BEL', 'Palermo': 'M2_PAL', 'Recoleta': 'M2_REC' };
  if (fixes[barrio]) return fixes[barrio];
  
  const clean = barrio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, '');
  return `M2_${clean.substring(0, 5)}`;
};

const runImport = async () => {
  try {
    console.log('Iniciando importación masiva de TODOS los barrios...');
    const csvPath = path.join(__dirname, 'zonaprop_index_historico_total.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n');

    // 1. Extraer barrios únicos del Excel y crearlos si no existen
    const barriosUnicos = new Set(lines.slice(1).map(l => l.split(',')[2]).filter(Boolean).filter(b => b !== 'Barrio'));
    for (const barrio of barriosUnicos) {
      const ticker = getTicker(barrio);
      await pool.execute('INSERT IGNORE INTO activos (simbolo, nombre, categoria, emoji) VALUES (?, ?, "Real Estate", "🏢")', [ticker, `M2 ${barrio}`]);
    }

    const [activos] = await pool.execute('SELECT id, simbolo FROM activos WHERE simbolo LIKE "M2_%"');
    const idMap = Object.fromEntries(activos.map(a => [a.simbolo, a.id]));

    let insertados = 0;
    const valoresBulk = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      const periodo = cols[0]; // ej: "may. 26" o "abr 25"
      const barrio = cols[2];  // ej: "Nuñez"
      const indexPrecioStr = cols[5]; // ej: "3.026"

      const simbolo = getTicker(barrio);
      if (!simbolo || !idMap[simbolo] || !indexPrecioStr || indexPrecioStr === '-') continue;

      const parts = periodo.replace('.', '').split(' ').filter(Boolean);
      const mes = monthMap[parts[0].toLowerCase()];
      const fecha = `20${parts[1]}-${mes}-01`; // Usamos el día 1 de cada mes
      const precio = parseFloat(indexPrecioStr) * 1000; // "3.026" -> 3026 USD

      valoresBulk.push([idMap[simbolo], fecha, precio]);
      insertados++;
    }

    console.log(`Enviando ${insertados} precios a la nube de una sola vez (Bulk Insert)...`);
    const chunkSize = 1000;
    for (let i = 0; i < valoresBulk.length; i += chunkSize) {
      const chunk = valoresBulk.slice(i, i + chunkSize);
      await pool.query('INSERT INTO precios_historicos (activo_id, fecha, valor) VALUES ? ON DUPLICATE KEY UPDATE valor = VALUES(valor)', [chunk]);
    }

    console.log(`✅ Importación finalizada. Se insertaron ${insertados} precios históricos de M2 en TiDB.`);
  } catch (e) { console.error('❌ Error:', e); } finally { await pool.end(); }
};
runImport();