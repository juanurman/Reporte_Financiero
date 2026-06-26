import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargamos las variables de entorno
dotenv.config();

// Configuramos el pool de conexiones (recomendado para scripts de larga duración)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finanzas',
  // SSL Seguro habilitado automáticamente si la base de datos está en la nube (TiDB)
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  connectTimeout: 10000
});

// Función para guardar precio optimizada (ya recibe el activoId)
const guardarPrecio = async (activoId, simbolo, valor, fecha) => {
  try {
    // 2. Insertar precio con su activo_id
    const query = `
      INSERT INTO precios_historicos (activo_id, fecha, valor)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE valor = VALUES(valor)
    `;
    await pool.execute(query, [activoId, fecha, valor]);
    console.log(` - Guardado exitoso: ${simbolo} -> $${valor}`);
  } catch (err) {
    console.error(` ❌ Error SQL al guardar ${simbolo}: ${err.message}`);
  }
};

// Lógica principal de recolección de datos
const actualizarPrecios = async (shouldExit = true) => {
  console.log(`\n[${new Date().toLocaleString('es-AR')}] Iniciando actualización de precios...`);

  try {
    // Obtener fecha actual en formato YYYY-MM-DD respetando la zona horaria de Argentina
    const fechaActual = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    
    // Fecha de hace 5.5 años exactos (YYYY-MM-DD) para usar en históricos y simulaciones
    const fechaHaceCincoAniosYMedio = new Date();
    fechaHaceCincoAniosYMedio.setFullYear(fechaHaceCincoAniosYMedio.getFullYear() - 5);
    fechaHaceCincoAniosYMedio.setMonth(fechaHaceCincoAniosYMedio.getMonth() - 6);
    const fechaPasada = fechaHaceCincoAniosYMedio.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

    // 1. Obtener mapeo de símbolos e IDs para evitar consultas redundantes
    const [activosDB] = await pool.execute(
      `SELECT id, simbolo FROM activos
       WHERE simbolo NOT LIKE "M2_%"
       AND simbolo NOT LIKE "ALQ_%"
       AND simbolo NOT IN ("DOLAR_OFICIAL", "DOLAR_BLUE", "DOLAR_MEP", "DOLAR_CCL")`
    );

    console.log(`Procesando ${activosDB.length} activos desde Yahoo Finance...`);

    // Procesamos en lotes paralelos para mejorar la velocidad
    const BATCH_SIZE = 10; // Procesar de a 10 activos a la vez
    for (let i = 0; i < activosDB.length; i += BATCH_SIZE) {
      const batch = activosDB.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (activo) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${activo.simbolo}?interval=1d&range=7d`;
          const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
          const result = data?.chart?.result?.[0];
          
          if (result && result.timestamp && result.indicators.quote[0].close) {
            for (let j = 0; j < result.timestamp.length; j++) {
              const precioHistorico = result.indicators.quote[0].close[j];
              if (precioHistorico) {
                const fechaHistorica = new Date(result.timestamp[j] * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
                await guardarPrecio(activo.id, activo.simbolo, precioHistorico, fechaHistorica);
              }
            }
          }
        } catch (err) {
          console.log(` ⚠️ Error al obtener ${activo.simbolo}: ${err.message}`);
        }
      }));
      console.log(` - Lote ${i / BATCH_SIZE + 1} procesado.`);
    }

    // 2. Obtener datos de los dólares (Sólo DolarAPI actual)
    console.log('Consultando Dólares (Actual)...');
    const { data: dolares } = await axios.get('https://dolarapi.com/v1/dolares');
    
    // Mapeo para adaptar los nombres de DolarAPI a los de nuestra base de datos
    const mapaDolares = {
      'oficial': 'DOLAR_OFICIAL',
      'blue': 'DOLAR_BLUE',
      'bolsa': 'DOLAR_MEP',
      'contadoconliqui': 'DOLAR_CCL'
    };

    // Mapeo de IDs para dólares
    const [activosDolares] = await pool.execute('SELECT id, simbolo FROM activos WHERE simbolo IN ("DOLAR_OFICIAL", "DOLAR_BLUE", "DOLAR_MEP", "DOLAR_CCL")');
    const idMap = Object.fromEntries(activosDolares.map(a => [a.simbolo, a.id]));

    for (const dolar of dolares) {
      const simboloDolar = mapaDolares[dolar.casa];
      if (simboloDolar && dolar.venta && idMap[simboloDolar]) {
        await guardarPrecio(idMap[simboloDolar], simboloDolar, dolar.venta, fechaActual);
      }
    }

    // 3. Simular datos de Real Estate (Solo Alquileres - Solo el día de hoy)
    console.log('Generando cotización del día para Alquileres...');
    const [activosRE] = await pool.execute('SELECT id, simbolo FROM activos WHERE simbolo = "ALQ_YIELD"');
    const idMapRE = Object.fromEntries(activosRE.map(a => [a.simbolo, a.id]));

    const realEstateMocks = [
      { simbolo: 'ALQ_YIELD', base: 4.5, tendencia: 0.15 } // Base 4.5% anual
    ];

    for (const re of realEstateMocks) {
      if (!idMapRE[re.simbolo]) continue;
      const ruido = 1 + ((Math.random() - 0.5) * 0.015); // Añadimos fluctuaciones realistas de mercado (+/- 0.75%)
      const valor = Number((re.base * (1 + re.tendencia) * ruido).toFixed(2));
      await guardarPrecio(idMapRE[re.simbolo], re.simbolo, valor, fechaActual);
    }

    // 4. Limpieza: Eliminar registros más viejos a 5.5 años (Omitiendo M2_ para no borrar su historial)
    console.log('🧹 Limpiando base de datos (eliminando registros anteriores a 5.5 años)...');
    const [cleanResult] = await pool.execute(`
      DELETE ph FROM precios_historicos ph
      JOIN activos a ON ph.activo_id = a.id
      WHERE ph.fecha < ? AND a.simbolo NOT LIKE "M2_%"
    `, [fechaPasada]).catch(() => [{affectedRows: 0}]);
    console.log(` - Se eliminaron ${cleanResult.affectedRows || 0} registros antiguos.`);

    console.log('Actualización completada con éxito.');
    
    // Cerramos el pool de conexiones si se requiere finalizar el proceso
    if (shouldExit) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña espera para flush de logs
      await pool.end();
      process.exit(0); // Forzamos el cierre inmediato del script (0 = Éxito)
    }
  } catch (error) {
    console.error('Error durante la actualización de precios:', error.message);
    if (shouldExit) {
      await pool.end();
      process.exit(1); // Forzamos la salida con error para que GitHub Actions lo marque en rojo
    } else {
      throw error;
    }
  }
};

// Ejecutamos la recolección de datos si el archivo se ejecuta directamente
import { fileURLToPath } from 'url';
import path from 'path';

const nodePath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const currentPath = fileURLToPath(import.meta.url);

if (nodePath === currentPath || nodePath.endsWith('updater.js')) {
  actualizarPrecios(true);
}

export { actualizarPrecios };