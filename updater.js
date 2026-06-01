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
  queueLimit: 0
});

// Función para guardar precio adaptada al modelo relacional (schema.sql)
const guardarPrecio = async (simbolo, valor, fecha) => {
  // 1. Buscar el ID del activo en la BD
  const [activos] = await pool.execute('SELECT id FROM activos WHERE simbolo = ?', [simbolo]);
  
  if (activos.length === 0) {
    console.log(` ⚠️ Activo ignorado/no encontrado en DB: ${simbolo}`);
    return;
  }
  
  const activoId = activos[0].id;

  // 2. Insertar precio con su activo_id
  const query = `
    INSERT INTO precios_historicos (activo_id, fecha, valor)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE valor = VALUES(valor)
  `;
  await pool.execute(query, [activoId, fecha, valor]);
  console.log(` - Guardado exitoso: ${simbolo} -> $${valor}`);
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
    // 0. Inyectamos la base de datos histórica inmutable de Real Estate
    await inyectarHistoricoInmobiliario(pool);

    // Obtener fecha actual en formato YYYY-MM-DD respetando la zona horaria de Argentina
    const fechaActual = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    
    // 1. Obtener datos de Yahoo Finance (Wall Street, Merval, Bonos)
    console.log('Consultando Yahoo Finance (Histórico de 1 Año)...');
    const simbolosYahoo = [
      'SPY', 'AAPL', 'GOOGL', 'MSFT', 'NVDA', 'AMZN', 'META', 'MU', 'TSM', // Wall Street
      'YPF', 'GGAL', 'PAM', 'BMA', // Merval (ADRs en USD)
      'IRS', 'CRESY' // Real Estate (ADRs en USD)
    ];

    const promesasYahoo = simbolosYahoo.map(async (simbolo) => {
      try {
        // Pedimos range=1y para traer el historial completo y poder calcular las variaciones a 1 mes, 3 meses, 6 meses y 1 año.
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${simbolo}?interval=1d&range=1y`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const result = data?.chart?.result?.[0];
        
        if (result && result.timestamp && result.indicators.quote[0].close) {
          for (let i = 0; i < result.timestamp.length; i++) {
            const precioHistorico = result.indicators.quote[0].close[i];
            if (precioHistorico) {
              const fechaHistorica = new Date(result.timestamp[i] * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
              await guardarPrecio(simbolo, precioHistorico, fechaHistorica);
            }
          }
        }
      } catch (err) {
        console.log(` ⚠️ Error al obtener ${simbolo}: ${err.message}`);
      }
    });

    // Ejecutamos TODAS las peticiones a Yahoo en paralelo (ultrarrápido)
    await Promise.all(promesasYahoo);

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
      const [rows] = await pool.execute(`
        SELECT p.valor FROM precios_historicos p
        JOIN activos a ON p.activo_id = a.id
        WHERE a.simbolo = ? ORDER BY p.fecha DESC LIMIT 2
      `, [simbolo]);
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
      const [rows] = await pool.execute(`
        SELECT p.valor FROM precios_historicos p
        JOIN activos a ON p.activo_id = a.id
        WHERE a.simbolo = ? AND p.fecha < ? ORDER BY p.fecha DESC LIMIT 1
      `, [simbolo, fechaActual]);

      if (rows.length > 0) {
        const ultimoValor = rows[0].valor;
        const nuevoValor = Number((ultimoValor * (1 + ajusteDiario)).toFixed(2));
        await guardarPrecio(simbolo, nuevoValor, fechaActual);
      }
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