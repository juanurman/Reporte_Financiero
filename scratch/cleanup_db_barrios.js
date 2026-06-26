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

const limpiarBarriosIncompletos = async (pool) => {
  console.log('🧹 Iniciando limpieza de barrios con datos incompletos o insuficientes (< 24 meses)...');
  try {
    // 1. Obtener todos los activos de tipo barrio
    const [activos] = await pool.execute(`
      SELECT id, simbolo, nombre 
      FROM activos 
      WHERE (simbolo LIKE 'M2_%' OR simbolo LIKE 'ALQ_%')
      AND simbolo <> 'ALQ_YIELD'
    `);

    // 2. Obtener cantidad de precios por activo
    const [precios] = await pool.execute(`
      SELECT activo_id, COUNT(*) as count 
      FROM precios_historicos 
      GROUP BY activo_id
    `);

    const countMap = Object.fromEntries(precios.map(p => [p.activo_id, p.count]));

    // 3. Agrupar por barrio limpio
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

    // 4. Identificar cuáles borrar (menos de 24 meses en M2 o en Alquiler)
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

async function run() {
  await limpiarBarriosIncompletos(pool);
  await pool.end();
}

run();
