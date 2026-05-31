import axios from 'axios';
import mysql from 'mysql2/promise';
import cron from 'node-cron';
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
const guardarPrecio = async (connection, simbolo, valor, fecha) => {
  // 1. Buscar el ID del activo en la BD
  const [activos] = await connection.execute('SELECT id FROM activos WHERE simbolo = ?', [simbolo]);
  
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
  await connection.execute(query, [activoId, fecha, valor]);
  console.log(` - Guardado exitoso: ${simbolo} -> $${valor}`);
};

// Lógica principal de recolección de datos
const actualizarPrecios = async () => {
  console.log(`\n[${new Date().toLocaleString('es-AR')}] Iniciando actualización de precios...`);
  let connection;

  try {
    connection = await pool.getConnection();
    
    // Obtener fecha actual en formato YYYY-MM-DD respetando la zona horaria de Argentina
    const fechaActual = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    
    // Fecha de hace 1 año exacto (YYYY-MM-DD) para usar en históricos y simulaciones
    const fechaHaceUnAnio = new Date();
    fechaHaceUnAnio.setFullYear(fechaHaceUnAnio.getFullYear() - 1);
    const fechaPasada = fechaHaceUnAnio.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

    // 1. Obtener datos de Yahoo Finance (Wall Street, Merval, Bonos)
    console.log('Consultando Yahoo Finance (Histórico de 1 Año)...');
    const simbolosYahoo = [
      'SPY', 'AAPL', 'GOOGL', 'MSFT', 'NVDA', 'AMZN', 'META', // Wall Street
      'YPF', 'GGAL', 'PAM', 'BMA', // Merval (ADRs en USD)
      'IRS', 'CRESY' // Real Estate (ADRs en USD)
    ];
    for (const simbolo of simbolosYahoo) {
      try {
        // Pedimos range=1y e interval=1d para tener la evolución DIARIA
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${simbolo}?interval=1d&range=1y`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const result = data?.chart?.result?.[0];
        
        if (result && result.timestamp && result.indicators.quote[0].close) {
          for (let i = 0; i < result.timestamp.length; i++) {
            const precioHistorico = result.indicators.quote[0].close[i];
            if (precioHistorico) {
              const fechaHistorica = new Date(result.timestamp[i] * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
              await guardarPrecio(connection, simbolo, precioHistorico, fechaHistorica);
            }
          }
        }
      } catch (err) {
        console.log(` ⚠️ Error al obtener ${simbolo}: ${err.message}`);
      }
    }

    // 2. Obtener datos de los dólares (DolarAPI + ArgentinaDatos histórico)
    console.log('Consultando Dólares (Actual + Histórico de 1 Año)...');
    const { data: dolares } = await axios.get('https://dolarapi.com/v1/dolares');
    
    let dolaresHistorico = [];
    try {
      // Utilizamos ArgentinaDatos para obtener el histórico del dólar
      const { data } = await axios.get('https://api.argentinadatos.com/v1/cotizaciones/dolares');
      dolaresHistorico = data;
    } catch (error) {
      console.log(' ⚠️ Error al obtener histórico de dólares:', error.message);
    }

    // Mapeo para adaptar los nombres de DolarAPI a los de nuestra base de datos
    const mapaDolares = {
      'oficial': 'DOLAR_OFICIAL',
      'blue': 'DOLAR_BLUE',
      'bolsa': 'DOLAR_MEP',
      'contadoconliqui': 'DOLAR_CCL'
    };

    for (const dolar of dolares) {
      const simboloDolar = mapaDolares[dolar.casa];
      if (simboloDolar && dolar.venta) {
        // Guardamos el precio de hoy
        await guardarPrecio(connection, simboloDolar, dolar.venta, fechaActual);
        
        // Guardamos todo el historial DIARIO del último año
        const pasados = dolaresHistorico
          .filter(d => d.casa === dolar.casa && d.fecha >= fechaPasada);
          
        for (const pasado of pasados) {
          await guardarPrecio(connection, simboloDolar, pasado.venta, pasado.fecha);
        }
      }
    }

    // 3. Simular datos de Real Estate (M2 y Alquileres)
    console.log('Generando histórico de M2 y Alquileres...');
    const realEstateMocks = [
      { simbolo: 'M2_NUN', base: 2600, tendencia: 0.05 },  // Base USD 2600, subió 5% anual
      { simbolo: 'M2_BEL', base: 2800, tendencia: 0.04 },
      { simbolo: 'M2_PAL', base: 3100, tendencia: 0.06 },
      { simbolo: 'M2_REC', base: 2900, tendencia: 0.03 },
      { simbolo: 'ALQ_YIELD', base: 4.5, tendencia: 0.15 } // Base 4.5% anual
    ];

    const unDia = 24 * 60 * 60 * 1000;
    for (const re of realEstateMocks) {
      for (let i = 0; i <= 365; i++) {
        const fechaObj = new Date(fechaHaceUnAnio.getTime() + (i * unDia));
        const fechaStr = fechaObj.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
        const progreso = i / 365;
        const ruido = 1 + ((Math.random() - 0.5) * 0.015); // Añadimos fluctuaciones realistas de mercado (+/- 0.75%)
        const valor = Number((re.base * (1 + (re.tendencia * progreso)) * ruido).toFixed(2));
        await guardarPrecio(connection, re.simbolo, valor, fechaStr);
      }
    }

    console.log('Actualización completada con éxito.');
  } catch (error) {
    console.error('Error durante la actualización de precios:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

// Programar el Cron Job (Lunes a Viernes a las 17:30 - Hora Argentina)
cron.schedule('30 17 * * 1-5', actualizarPrecios, {
  scheduled: true,
  timezone: "America/Argentina/Buenos_Aires"
});

console.log('🚀 Cron job configurado. El script se ejecutará de Lunes a Viernes a las 17:30 hs (ART).');

// Ejecutamos la recolección de datos inmediatamente al iniciar el script por primera vez
actualizarPrecios();