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

// Lógica principal de recolección de datos
const actualizarPrecios = async () => {
  console.log(`\n[${new Date().toLocaleString('es-AR')}] Iniciando actualización de precios...`);

  try {
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

    const promesasYahoo = simbolosYahoo.map(async (simbolo) => {
      try {
        // Pedimos range=5d (en lugar de 1y) para ser eficientes pero cubrir fines de semana o feriados
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${simbolo}?interval=1d&range=5d`;
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

    // 3. Simular datos de Real Estate (M2 y Alquileres - Solo el día de hoy)
    console.log('Generando cotización del día para M2 y Alquileres...');
    const realEstateMocks = [
      { simbolo: 'M2_NUN', base: 2600, tendencia: 0.05 },  // Base USD 2600, subió 5% anual
      { simbolo: 'M2_BEL', base: 2800, tendencia: 0.04 },
      { simbolo: 'M2_PAL', base: 3100, tendencia: 0.06 },
      { simbolo: 'M2_REC', base: 2900, tendencia: 0.03 },
      { simbolo: 'ALQ_YIELD', base: 4.5, tendencia: 0.15 } // Base 4.5% anual
    ];

    const promesasRealEstate = realEstateMocks.map(async (re) => {
      const ruido = 1 + ((Math.random() - 0.5) * 0.015); // Añadimos fluctuaciones realistas de mercado (+/- 0.75%)
      const valor = Number((re.base * (1 + re.tendencia) * ruido).toFixed(2));
      await guardarPrecio(re.simbolo, valor, fechaActual);
    });
    await Promise.all(promesasRealEstate);

    // 4. Limpieza: Eliminar registros más viejos a 1 año
    console.log('🧹 Limpiando base de datos (eliminando registros anteriores a 1 año)...');
    const [cleanResult] = await pool.execute('DELETE FROM precios_historicos WHERE fecha < ?', [fechaPasada]);
    console.log(` - Se eliminaron ${cleanResult.affectedRows} registros antiguos.`);

    console.log('Actualización completada con éxito.');
  } catch (error) {
    console.error('Error durante la actualización de precios:', error.message);
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