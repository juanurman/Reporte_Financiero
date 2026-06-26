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

// Normalizar nombres de barrios inconsistentes
const normalizeBarrioName = (barrio) => {
  if (!barrio) return '';
  const unified = {
    'Paternal': 'La Paternal',
    'La Paternal': 'La Paternal',
    'Santa Rita': 'Villa Santa Rita',
    'Villa Santa Rita': 'Villa Santa Rita',
    'Agronomia': 'Agronomía',
    'Agronomía': 'Agronomía',
    'Nunez': 'Nuñez',
    'Nuñez': 'Nuñez',
    'San Nicolás': 'San Nicolás',
    'San Nicolas': 'San Nicolás',
  };
  return unified[barrio.trim()] || barrio.trim();
};

// Función para generar un Ticker consistente y mantener compatibilidad con los 4 originales
const getTicker = (barrio) => {
  const normalized = normalizeBarrioName(barrio);
  const fixes = { 'Nuñez': 'M2_NUN', 'Belgrano': 'M2_BEL', 'Palermo': 'M2_PAL', 'Recoleta': 'M2_REC' };
  if (fixes[normalized]) return fixes[normalized];
  
  const clean = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, '');
  // Aumentamos a 20 caracteres para evitar colisiones entre "Villas" y "Parques"
  return `M2_${clean.substring(0, 20)}`;
};

const runImport = async () => {
  try {
    console.log('Iniciando importación masiva de TODOS los barrios...');

    // 0. Limpieza de activos M2 antiguos colisionados (excepto los 4 originales)
    console.log('Limpiando activos M2 antiguos y colisionados de la base de datos...');
    await pool.execute(`
      DELETE FROM activos 
      WHERE simbolo LIKE "M2_%" 
      AND simbolo NOT IN ("M2_NUN", "M2_BEL", "M2_PAL", "M2_REC")
    `);

    const csvPath = path.join(__dirname, 'zonaprop_index_historico_total.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n');

    // 1. Analizar el CSV para encontrar barrios que tengan al menos un precio de Index válido
    const barriosConDatos = new Set();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      const barrio = cols[2];
      const indexPrecioStr = cols[5];
      if (barrio && indexPrecioStr && indexPrecioStr !== '-' && indexPrecioStr.trim() !== '') {
        barriosConDatos.add(barrio);
      }
    }

    // Insertar sólo los barrios que tienen datos reales
    for (const barrio of barriosConDatos) {
      const normalized = normalizeBarrioName(barrio);
      const ticker = getTicker(normalized);
      await pool.execute('INSERT IGNORE INTO activos (simbolo, nombre, categoria, emoji) VALUES (?, ?, "Real Estate", "🏢")', [ticker, `M2 ${normalized}`]);
    }

    const [activos] = await pool.execute('SELECT id, simbolo FROM activos WHERE simbolo LIKE "M2_%"');
    const idMap = Object.fromEntries(activos.map(a => [a.simbolo, a.id]));

    let insertados = 0;
    const valoresBulk = [];
    const seen = new Set(); // Para prevenir colisiones/duplicados en el mismo mes

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      const periodo = cols[0]; // ej: "may. 26" o "abr 25"
      const barrio = cols[2];  // ej: "Nuñez"
      const indexPrecioStr = cols[5]; // ej: "3.026"

      const normalized = normalizeBarrioName(barrio);
      const simbolo = getTicker(normalized);
      if (!simbolo || !idMap[simbolo] || !indexPrecioStr || indexPrecioStr === '-') continue;

      const parts = periodo.replace('.', '').split(' ').filter(Boolean);
      const mes = monthMap[parts[0].toLowerCase()];
      const fecha = `20${parts[1]}-${mes}-01`; // Usamos el día 1 de cada mes
      const precio = parseFloat(indexPrecioStr) * 1000; // "3.026" -> 3026 USD

      const key = `${simbolo}_${fecha}`;
      if (seen.has(key)) {
        // Ignoramos duplicados (las filas al inicio de cada mes en el CSV tienen prioridad por su ranking)
        continue;
      }
      seen.add(key);

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
    
    // Limpieza automática post-importación de barrios incompletos
    await limpiarBarriosIncompletos(pool);
  } catch (e) { console.error('❌ Error:', e); } finally { await pool.end(); }
};

const limpiarBarriosIncompletos = async (pool) => {
  console.log('🧹 Iniciando limpieza de barrios con datos incompletos o insuficientes (< 24 meses)...');
  try {
    const [activos] = await pool.execute(`
      SELECT id, simbolo, nombre 
      FROM activos 
      WHERE (simbolo LIKE 'M2_%' OR simbolo LIKE 'ALQ_%')
      AND simbolo <> 'ALQ_YIELD'
    `);

    const [precios] = await pool.execute(`
      SELECT activo_id, COUNT(*) as count 
      FROM precios_historicos 
      GROUP BY activo_id
    `);

    const countMap = Object.fromEntries(precios.map(p => [p.activo_id, p.count]));

    const barrios = {};
    for (const activo of activos) {
      const cleanBarrio = activo.simbolo.replace(/^(M2_|ALQ_)/, '');
      if (!barrios[cleanBarrio]) {
        barrios[cleanBarrio] = {
          cleanName: cleanBarrio,
          displayName: activo.nombre.replace(/^(M2 |Alquiler )/, ''),
          m2Id: null,
          m2Count: 0,
          alqId: null,
          alqCount: 0
        };
      }
      const count = countMap[activo.id] || 0;
      if (activo.simbolo.startsWith('M2_')) {
        barrios[cleanBarrio].m2Id = activo.id;
        barrios[cleanBarrio].m2Count = count;
      } else {
        barrios[cleanBarrio].alqId = activo.id;
        barrios[cleanBarrio].alqCount = count;
      }
    }

    const idsABorrar = [];
    const barriosBorrados = [];

    for (const b of Object.values(barrios)) {
      if (b.m2Count < 24 || b.alqCount < 24) {
        if (b.m2Id) idsABorrar.push(b.m2Id);
        if (b.alqId) idsABorrar.push(b.alqId);
        barriosBorrados.push(`${b.displayName} (M2: ${b.m2Count} pts, Alq: ${b.alqCount} pts)`);
      }
    }

    if (idsABorrar.length > 0) {
      console.log(` - Eliminando ${idsABorrar.length} activos correspondientes a ${barriosBorrados.length} barrios...`);
      const placeholder = idsABorrar.map(() => '?').join(',');
      await pool.execute(`DELETE FROM activos WHERE id IN (${placeholder})`, idsABorrar);
      console.log(' ✅ Barrios eliminados de la base de datos:', barriosBorrados.join(', '));
    } else {
      console.log(' ✅ No se encontraron barrios con datos insuficientes para eliminar.');
    }
  } catch (err) {
    console.error(' ❌ Error durante la limpieza de barrios:', err.message);
  }
};

runImport();