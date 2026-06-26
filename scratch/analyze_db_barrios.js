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
    console.log('Querying database to analyze neighborhood data...\n');

    // 1. Get all assets related to Real Estate (neighborhoods)
    const [activos] = await pool.execute(`
      SELECT id, simbolo, nombre, categoria 
      FROM activos 
      WHERE (simbolo LIKE 'M2_%' OR simbolo LIKE 'ALQ_%')
      AND simbolo <> 'ALQ_YIELD'
      ORDER BY simbolo ASC
    `);

    console.log(`Total neighborhood assets found in DB: ${activos.length}`);
    
    const m2Assets = activos.filter(a => a.simbolo.startsWith('M2_'));
    const alqAssets = activos.filter(a => a.simbolo.startsWith('ALQ_'));

    console.log(`- M2 Assets (M2_...): ${m2Assets.length}`);
    console.log(`- Alquiler Assets (ALQ_...): ${alqAssets.length}`);

    // 2. Count price points per asset
    const [precios] = await pool.execute(`
      SELECT activo_id, COUNT(*) as count, MIN(fecha) as min_date, MAX(fecha) as max_date 
      FROM precios_historicos 
      GROUP BY activo_id
    `);

    const countMap = Object.fromEntries(precios.map(p => [p.activo_id, {
      count: p.count,
      min: p.min_date,
      max: p.max_date
    }]));

    console.log('\n==================================================');
    console.log('ESTADO DE LOS BARRIOS EN LA BASE DE DATOS:');
    
    // Group by neighborhood clean name (e.g. Palmero -> PALERMO)
    const barrios = {};
    for (const activo of activos) {
      const type = activo.simbolo.startsWith('M2_') ? 'M2' : 'ALQ';
      // Extract clean neighborhood name from ticker (ALQ_BEL -> BEL, M2_BEL -> BEL)
      const cleanBarrio = activo.simbolo.replace(/^(M2_|ALQ_)/, '');
      
      if (!barrios[cleanBarrio]) {
        barrios[cleanBarrio] = {
          cleanName: cleanBarrio,
          displayName: activo.nombre.replace(/^(M2 |Alquiler )/, ''),
          m2Id: null,
          m2Count: 0,
          m2Min: null,
          m2Max: null,
          alqId: null,
          alqCount: 0,
          alqMin: null,
          alqMax: null,
        };
      }

      const pData = countMap[activo.id] || { count: 0, min: null, max: null };

      if (type === 'M2') {
        barrios[cleanBarrio].m2Id = activo.id;
        barrios[cleanBarrio].m2Count = pData.count;
        barrios[cleanBarrio].m2Min = pData.min;
        barrios[cleanBarrio].m2Max = pData.max;
      } else {
        barrios[cleanBarrio].alqId = activo.id;
        barrios[cleanBarrio].alqCount = pData.count;
        barrios[cleanBarrio].alqMin = pData.min;
        barrios[cleanBarrio].alqMax = pData.max;
      }
    }

    const barriosList = Object.values(barrios);
    console.log(`Barrios únicos representados en DB: ${barriosList.length}`);

    // Print summary tables
    console.log('\nBarrios con datos completos (tanto M2 como Alquileres, con más de 40 meses de historial en ambos):');
    const completos = barriosList.filter(b => b.m2Count > 40 && b.alqCount > 40);
    console.log(`Total: ${completos.length}`);
    completos.forEach(b => {
      console.log(`- ${b.displayName} (${b.cleanName}): M2: ${b.m2Count} pts [${b.m2Min ? b.m2Min.toISOString().split('T')[0] : 'N/A'} a ${b.m2Max ? b.m2Max.toISOString().split('T')[0] : 'N/A'}] | Alquiler: ${b.alqCount} pts [${b.alqMin ? b.alqMin.toISOString().split('T')[0] : 'N/A'} a ${b.alqMax ? b.alqMax.toISOString().split('T')[0] : 'N/A'}]`);
    });

    console.log('\nBarrios incompletos (Falta una de las dos variables):');
    const incompletos = barriosList.filter(b => !b.m2Id || !b.alqId);
    console.log(`Total: ${incompletos.length}`);
    incompletos.forEach(b => {
      if (!b.m2Id) {
        console.log(`- ${b.displayName} (${b.cleanName}): FALTA M2 | Alquiler: ${b.alqCount} pts [${b.alqMin ? b.alqMin.toISOString().split('T')[0] : 'N/A'} a ${b.alqMax ? b.alqMax.toISOString().split('T')[0] : 'N/A'}]`);
      } else {
        console.log(`- ${b.displayName} (${b.cleanName}): M2: ${b.m2Count} pts [${b.m2Min ? b.m2Min.toISOString().split('T')[0] : 'N/A'} a ${b.m2Max ? b.m2Max.toISOString().split('T')[0] : 'N/A'}] | FALTA Alquiler`);
      }
    });

    console.log('\nBarrios con POCO historial (Menos de 10 meses en M2 o Alquileres):');
    const pocosPts = barriosList.filter(b => (b.m2Id && b.m2Count < 10) || (b.alqId && b.alqCount < 10));
    console.log(`Total: ${pocosPts.length}`);
    pocosPts.forEach(b => {
      console.log(`- ${b.displayName} (${b.cleanName}): M2: ${b.m2Count} pts | Alquiler: ${b.alqCount} pts`);
    });

  } catch (e) {
    console.error('Error running DB analysis:', e);
  } finally {
    await pool.end();
  }
}

run();
