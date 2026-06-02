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
  connectTimeout: 20000,
  enableKeepAlive: true
});

// Función auxiliar para reintentar operaciones de red o base de datos
const executeWithRetry = async (fn, maxRetries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`   ⚠️ Intento ${attempt} fallido (${error.message}). Reintentando en ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Cache global para no hacer una consulta por cada uno de los miles de precios
const cacheActivos = {};

// Función para guardar precio adaptada al modelo relacional (schema.sql)
const guardarPrecio = async (simbolo, valor, fecha) => {
  const activoId = cacheActivos[simbolo];
  if (!activoId) return; // Si el activo no está en la BD, lo ignoramos silenciosamente

  const query = `
    INSERT INTO precios_historicos (activo_id, fecha, valor)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE valor = VALUES(valor)
  `;
  
  // Usamos executeWithRetry por si la base de datos tiene micro-cortes
  await executeWithRetry(() => pool.execute(query, [activoId, fecha, valor]));
};

// Función para guardar MUCHOS precios en bloque (Bulk Insert) para máxima velocidad en la nube
const guardarPreciosLote = async (simbolo, registros) => {
  const activoId = cacheActivos[simbolo];
  if (!activoId || registros.length === 0) return;

  const chunkSize = 250; // Insertamos de a 250 registros para no saturar la red ni la BD
  for (let i = 0; i < registros.length; i += chunkSize) {
    const chunk = registros.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '(?, ?, ?)').join(', ');
    const values = chunk.flatMap(r => [activoId, r.fecha, r.valor]);
    
    const query = `
      INSERT INTO precios_historicos (activo_id, fecha, valor)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE valor = VALUES(valor)
    `;
    await executeWithRetry(() => pool.execute(query, values));
  }
};

// Función asincrónica para inyectar la serie histórica y científica de Real Estate
const inyectarHistoricoInmobiliario = async (connection) => {
  console.log('🏗️ Inyectando dataset histórico científico de Real Estate...');
  const datosHistoricos = [
    { fecha: '2026-03-31', precios: { M2_PAL: 3302.00, M2_REC: 3003.00, M2_BEL: 2905.00, M2_NUN: 2738.00, ALQ_YIELD: 5.16 } },
    { fecha: '2025-03-31', precios: { M2_PAL: 3250.00, M2_REC: 2950.00, M2_BEL: 2850.00, M2_NUN: 2680.00, ALQ_YIELD: 5.10 } },
    { fecha: '2023-03-31', precios: { M2_PAL: 2790.00, M2_REC: 2537.00, M2_BEL: 2454.00, M2_NUN: 2313.00, ALQ_YIELD: 4.45 } },
    { fecha: '2021-03-31', precios: { M2_PAL: 2470.00, M2_REC: 2246.00, M2_BEL: 2173.00, M2_NUN: 2048.00, ALQ_YIELD: 4.12 } }
  ];

  for (const registro of datosHistoricos) {
    for (const [simbolo, valor] of Object.entries(registro.precios)) {
      // Reutilizamos guardarPrecio usando el connection del pool
      await guardarPrecio(simbolo, valor, registro.fecha);
    }
  }
};

// Lógica principal de recolección de datos
const actualizarPrecios = async () => {
  console.log(`\n[${new Date().toLocaleString('es-AR')}] Iniciando actualización de precios...`);

  try {
    // Semilla Base: Solo se usa para registrar activos iniciales si la DB está vacía
    const activosSeed = [
      { simbolo: 'SPY', nombre: 'S&P 500', categoria: 'Índice/ETF', emoji: '📈' },
      { simbolo: 'AAPL', nombre: 'Apple', categoria: 'Wall Street', emoji: '🍎' },
      { simbolo: 'GOOGL', nombre: 'Alphabet Inc.', categoria: 'Wall Street', emoji: '🔍' },
      { simbolo: 'MSFT', nombre: 'Microsoft Corp.', categoria: 'Wall Street', emoji: '💻' },
      { simbolo: 'NVDA', nombre: 'NVIDIA Corp.', categoria: 'Wall Street', emoji: '🎮' },
      { simbolo: 'AMZN', nombre: 'Amazon', categoria: 'Wall Street', emoji: '📦' },
      { simbolo: 'META', nombre: 'Meta Platforms', categoria: 'Wall Street', emoji: '🌐' },
      { simbolo: 'MU', nombre: 'Micron Technology', categoria: 'Wall Street', emoji: '💾' },
      { simbolo: 'TSM', nombre: 'Taiwan Semiconductor', categoria: 'Wall Street', emoji: '🏭' },
      { simbolo: 'YPF', nombre: 'YPF S.A.', categoria: 'Merval', emoji: '🛢️' },
      { simbolo: 'GGAL', nombre: 'Grupo Fin. Galicia', categoria: 'Merval', emoji: '🏦' },
      { simbolo: 'PAM', nombre: 'Pampa Energía', categoria: 'Merval', emoji: '⚡' },
      { simbolo: 'BMA', nombre: 'Banco Macro', categoria: 'Merval', emoji: '🏛️' },
      { simbolo: 'IRS', nombre: 'IRSA', categoria: 'Real Estate', emoji: '🏢' },
      { simbolo: 'CRESY', nombre: 'Cresud', categoria: 'Real Estate', emoji: '🌾' },
      // NUEVOS ACTIVOS: Bonos
      { simbolo: 'AL30.BA', nombre: 'Bono AL30 (AR$)', categoria: 'Bonos', emoji: '🇦🇷' },
      { simbolo: 'TLT', nombre: 'iShares 20+ Yr Treasury', categoria: 'Bonos', emoji: '🦅' }
    ];

    console.log('Verificando semilla inicial de activos...');
    await executeWithRetry(async () => {
      const [activosExistentes] = await pool.execute('SELECT simbolo FROM activos');
      const simbolosDB = activosExistentes.map(a => a.simbolo);
      
      for (const activo of activosSeed) {
        if (!simbolosDB.includes(activo.simbolo)) {
          await pool.execute(
            `INSERT INTO activos (nombre, simbolo, categoria, emoji) VALUES (?, ?, ?, ?)`,
            [activo.nombre, activo.simbolo, activo.categoria, activo.emoji]
          );
          console.log(` ➕ Nuevo activo registrado automáticamente: ${activo.simbolo}`);
        }
      }
    });

    // Precargamos TODOS los IDs de activos en memoria al iniciar para volar a máxima velocidad
    console.log('Precargando diccionario de activos para acelerar la carga...');
    const [activosDB] = await pool.execute('SELECT id, simbolo, categoria FROM activos');
    activosDB.forEach(a => { cacheActivos[a.simbolo] = a.id; });

    // 0. Inyectamos la base de datos histórica inmutable de Real Estate
    await inyectarHistoricoInmobiliario(pool);

    // Obtener fecha actual en formato YYYY-MM-DD respetando la zona horaria de Argentina
    const fechaActual = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    
    // 1. Obtener datos de Yahoo Finance (Rango dinámico INDIVIDUAL por activo)
    console.log('Analizando volumen de historial por cada activo...');
    const [conteoRows] = await pool.execute('SELECT activo_id, COUNT(*) as c FROM precios_historicos GROUP BY activo_id');
    const historialPorActivo = {};
    conteoRows.forEach(row => { historialPorActivo[row.activo_id] = row.c; });

    // Filtramos TODOS los activos de la DB que necesitan actualizarse vía Yahoo
    const activosYahoo = activosDB.filter(a => a.categoria !== 'Moneda' && a.categoria !== 'Real Estate');

    // Ejecutamos las peticiones a Yahoo de forma SECUENCIAL para evitar ETIMEDOUT o bloqueos de Rate Limiting
    for (const activo of activosYahoo) {
      const simbolo = activo.simbolo;
      const activoId = cacheActivos[simbolo];
      
      // Si el activo tiene menos de 1000 registros (aprox 4 años hábiles), bajamos 5 años. Sino, sólo 5 días.
      const registrosPrevios = historialPorActivo[activoId] || 0;
      const rangoYahoo = registrosPrevios < 1000 ? '5y' : '5d';

      try {
        console.log(`Consultando ${simbolo} (Rango: ${rangoYahoo})...`);
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${simbolo}?interval=1d&range=${rangoYahoo}`;
        
        // Envolvemos la petición HTTP en nuestro reintentador para evitar el error de TLS / Socket Drop de Yahoo
        const { data } = await executeWithRetry(() => axios.get(url, { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Connection': 'keep-alive'
          },
          timeout: 15000 // 15 segundos para dar margen al handshake TLS
        }), 3, 3000); // 3 reintentos, empezando con 3 segundos de pausa
        
        const result = data?.chart?.result?.[0];
        
        if (result && result.timestamp && result.indicators.quote[0].close) {
          const totalDias = result.timestamp.length;
          process.stdout.write(`   ⬇️ Procesando ${totalDias} días... `);
          
          const registros = [];
          for (let i = 0; i < result.timestamp.length; i++) {
            const precioHistorico = result.indicators.quote[0].close[i];
            if (precioHistorico !== null && precioHistorico !== undefined) {
              const fechaHistorica = new Date(result.timestamp[i] * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
              registros.push({ fecha: fechaHistorica, valor: precioHistorico });
            }
          }
          
          // Inserción masiva ultra-rápida
          await guardarPreciosLote(simbolo, registros);
          console.log(`✅ ¡Listo!`);
        }
        // Pausa de 500ms entre peticiones para ser "amigables" con el servidor de Yahoo
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.log(` ⚠️ Error al obtener ${simbolo}: ${err.message}`);
      }
    }

    // 2. Obtener datos de los dólares (Sólo DolarAPI actual)
    console.log('Consultando Dólares (Actual)...');
    // También envolvemos a DolarAPI por precaución
    const { data: dolares } = await executeWithRetry(() => axios.get('https://dolarapi.com/v1/dolares', { timeout: 10000 }));
    
    // Mapeo para adaptar los nombres de DolarAPI a los de nuestra base de datos
    const mapaDolares = {
      'oficial': 'DOLAR_OFICIAL',
      'blue': 'DOLAR_BLUE',
      'bolsa': 'DOLAR_MEP',
      'contadoconliqui': 'DOLAR_CCL'
    };

    const promesasDolares = dolares.map(async (dolar) => {
      const simboloDolar = mapaDolares[dolar.casa];
      if (simboloDolar && dolar.venta) {
        // Guardamos el precio de hoy
        await guardarPrecio(simboloDolar, dolar.venta, fechaActual);
      }
    });
    await Promise.all(promesasDolares);

    // 3. Algoritmo de Indexación Diaria por Correlación Financiera
    console.log('Indexando valores de Real Estate de hoy mediante correlación con ADRs Inmobiliarios...');
    
    // Función auxiliar para obtener la variación diaria de un activo bursátil
    const getVariacionDiaria = async (simbolo) => {
      const rows = await executeWithRetry(async () => {
        const [result] = await pool.execute(`
          SELECT p.valor FROM precios_historicos p
          JOIN activos a ON p.activo_id = a.id
          WHERE a.simbolo = ? ORDER BY p.fecha DESC LIMIT 2
        `, [simbolo]);
        return result;
      });
      if (rows.length < 2) return 0;
      return (rows[0].valor - rows[1].valor) / rows[1].valor;
    };

    const varPromedio = (await getVariacionDiaria('IRS') + await getVariacionDiaria('CRESY')) / 2;
    const factorSensibilidad = 0.15; // Ladrillos son menos volátiles que las acciones
    const ajusteDiario = varPromedio * factorSensibilidad;

    console.log(` - Variación promedio ADRs (IRS/CRESY): ${(varPromedio * 100).toFixed(2)}%. Ajuste M2 aplicado: ${(ajusteDiario * 100).toFixed(4)}%`);

    const realEstateAssets = ['M2_NUN', 'M2_BEL', 'M2_PAL', 'M2_REC', 'ALQ_YIELD'];
    for (const simbolo of realEstateAssets) {
      // Tomamos el último valor histórico ANTERIOR a hoy (garantiza idempotencia si se ejecuta 2 veces)
      const rows = await executeWithRetry(async () => {
        const [result] = await pool.execute(`
          SELECT p.valor FROM precios_historicos p
          JOIN activos a ON p.activo_id = a.id
          WHERE a.simbolo = ? AND p.fecha < ? ORDER BY p.fecha DESC LIMIT 1
        `, [simbolo, fechaActual]);
        return result;
      });

      if (rows.length > 0) {
        const ultimoValor = rows[0].valor;
        const nuevoValor = Number((ultimoValor * (1 + ajusteDiario)).toFixed(2));
        await guardarPrecio(simbolo, nuevoValor, fechaActual);
      }
    }

    // 4. Limpieza de base de datos (Eliminar mayor a 5 años)
    console.log('Limpiando historial antiguo (manteniendo 1826 días / 5 años)...');
    try {
      // Usamos DELETE con JOIN para preservar los datos de Real Estate (que tienen fechas estáticas de hace 5 años)
      await executeWithRetry(async () => {
        const [resultado] = await pool.execute(`
          DELETE p FROM precios_historicos p
          INNER JOIN activos a ON p.activo_id = a.id
          WHERE p.fecha < DATE_SUB(CURDATE(), INTERVAL 1826 DAY)
          AND a.categoria != 'Real Estate'
        `);
        console.log(` - Registros antiguos eliminados: ${resultado.affectedRows}`);
      });
    } catch (error) {
      console.log(` ⚠️ Error al limpiar historial: ${error.message}`);
    }

    console.log('Actualización completada con éxito.');
    
    // Cerramos el pool de conexiones para que Node.js pueda finalizar y cerrarse
    await pool.end();
    process.exit(0); // Forzamos el cierre inmediato del script (0 = Éxito)
  } catch (error) {
    console.error('Error durante la actualización de precios:', error.message);
    await pool.end();
    process.exit(1); // Forzamos la salida con error para que GitHub Actions lo marque en rojo
  }
};

// Ejecutamos la recolección de datos (GitHub Actions se encarga de llamar a este script diariamente)
actualizarPrecios();