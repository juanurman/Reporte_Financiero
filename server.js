import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Habilitamos CORS para que nuestro frontend de Vue pueda hacer peticiones a esta API
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.options('*', cors()); // Habilita pre-flight para todas las rutas

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finanzas',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Ruta raíz para verificar que la API está viva
app.get('/', (req, res) => {
  res.json({
    estado: 'online',
    mensaje: '🚀 API de Reporte Financiero funcionando correctamente en Vercel',
    version: '1.0.0',
    endpoints: ['/api/precios', '/api/cartera', '/api/activos']
  });
});

// Endpoint para obtener todos los activos con su último precio guardado
app.get('/api/precios', async (req, res) => {
  try {
    // Obtenemos todos los activos
    const [activos] = await pool.execute('SELECT * FROM activos');
    // Obtenemos TODOS los precios ordenados por fecha (del más nuevo al más viejo)
    const [precios] = await pool.execute('SELECT activo_id, fecha, valor FROM precios_historicos ORDER BY fecha DESC');

    const resultados = activos.map(activo => {
      const historial = precios.filter(p => Number(p.activo_id) === Number(activo.id));

      // Si el activo es nuevo y no tiene precios, no lo borramos, lo mostramos en 0
      if (historial.length === 0) {
        return {
          id: activo.id, nombre: activo.nombre, simbolo: activo.simbolo, categoria: activo.categoria, emoji: activo.emoji,
          precio: 0, fecha: new Date().toISOString(),
          variaciones: { '1w': 0, '1m': 0, '3m': 0, '6m': 0, '9m': 0, '1y': 0, '3y': 0, '5y': 0 }
        };
      }

      const actual = historial[0].valor;
      const fechaActualStr = historial[0].fecha;

      // Función maestra: Busca el precio más cercano a X días en el pasado
      const getPrecioAtras = (dias) => {
        const targetDate = new Date(fechaActualStr);
        targetDate.setDate(targetDate.getDate() - dias);
        const targetTime = targetDate.getTime();

        let closest = historial[historial.length - 1]; // Toma el más viejo por defecto
        for (const registro of historial) {
          if (new Date(registro.fecha).getTime() <= targetTime) {
            closest = registro;
            break;
          }
        }
        return closest.valor;
      };

      const calcularVariacion = (dias) => {
        if (dias <= 365) {
          return Number((((actual - getPrecioAtras(dias)) / getPrecioAtras(dias)) * 100).toFixed(2));
        } else {
          // Mock histórico (3 y 5 años) para la calculadora del Delorean
          const isARS = activo.categoria === 'Moneda';
          const isM2 = activo.simbolo.startsWith('M2');
          if (isARS) {
            if (dias === 3 * 365) return 850.5;  // MEP saltó de ~150 a ~1430
            if (dias === 5 * 365) return 3100.2; // MEP saltó de ~45 a ~1430
          } else if (isM2) {
            return dias === 3 * 365 ? -15.5 : -25.2; // Caída real del M2
          } else {
            return dias === 3 * 365 ? 45.3 : 125.8;  // Renta variable en USD (SPY, Big6)
          }
          return 0;
        }
      };

      return {
        id: activo.id, nombre: activo.nombre, simbolo: activo.simbolo, categoria: activo.categoria, emoji: activo.emoji,
        precio: actual, fecha: fechaActualStr,
        variaciones: {
          '1w': calcularVariacion(7), '1m': calcularVariacion(30), 
          '3m': calcularVariacion(90), '6m': calcularVariacion(180), 
          '9m': calcularVariacion(270), '1y': calcularVariacion(365),
          '3y': calcularVariacion(3 * 365), '5y': calcularVariacion(5 * 365)
        }
      };
    }).filter(a => a !== null);

    res.json(resultados);
  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para agregar un nuevo activo (Admin)
app.post('/api/activos', async (req, res) => {
  const { simbolo, nombre, categoria, emoji, adminPassword } = req.body;
  
  // Validación básica (puedes mejorarla)
  if (adminPassword !== 'Colin') {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const query = `
      INSERT INTO activos (nombre, simbolo, categoria, emoji)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), categoria = VALUES(categoria), emoji = VALUES(emoji)
    `;
    await pool.execute(query, [nombre, simbolo.toUpperCase(), categoria, emoji]);
    res.json({ message: `Activo ${simbolo} guardado/actualizado con éxito` });
  } catch (error) {
    console.error('❌ Error al guardar activo:', error.message);
    res.status(500).json({ error: 'Error al guardar el activo' });
  }
});

// Endpoint para obtener la cartera de un usuario
app.get('/api/cartera', async (req, res) => {
  const { usuario } = req.query;
  try {
    const [filas] = await pool.execute(`
      SELECT 
        TRIM(UPPER(c.simbolo)) as simbolo, 
        MAX(COALESCE(a.nombre, UPPER(c.simbolo))) as nombre, 
        MAX(COALESCE(a.emoji, '❓')) as emoji, 
        MAX(a.categoria) as categoria,
        SUM(CASE WHEN c.tipo = 'COMPRA' THEN c.cantidad ELSE -c.cantidad END) as cantidad, 
        COALESCE(
          (SUM(CASE WHEN c.tipo = 'COMPRA' THEN c.cantidad * c.precio_compra ELSE 0 END) / NULLIF(SUM(CASE WHEN c.tipo = 'COMPRA' THEN c.cantidad ELSE 0 END), 0)) + 
          (SUM(COALESCE(c.comisiones, 0)) / NULLIF(SUM(CASE WHEN c.tipo = 'COMPRA' THEN c.cantidad ELSE -c.cantidad END), 0)), 
          0) as avgPrice, 
        MIN(c.fecha) as purchaseDate
      FROM cartera c
      LEFT JOIN activos a ON TRIM(UPPER(c.simbolo)) = a.simbolo
      WHERE c.usuario = ?
      GROUP BY TRIM(UPPER(c.simbolo))
      HAVING cantidad > 0
    `, [usuario || 'Diego']);
    res.json(filas);
  } catch (error) {
    console.error('❌ Error al obtener cartera:', error.message);
    res.status(500).json({ error: 'Error al obtener la cartera' });
  }
});

// Endpoint para agregar una transacción a la cartera
app.post('/api/cartera', async (req, res) => {
  const { usuario, simbolo, cantidad, precio_compra, fecha } = req.body;
  try {
    const query = `
      INSERT INTO cartera (usuario, simbolo, cantidad, precio_compra, fecha)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.execute(query, [
      usuario || 'Diego',
      simbolo.toUpperCase(),
      cantidad,
      precio_compra,
      fecha || new Date().toISOString().split('T')[0]
    ]);
    res.json({ message: 'Transacción guardada con éxito' });
  } catch (error) {
    console.error('❌ Error al guardar transacción:', error.message);
    res.status(500).json({ error: 'Error al guardar en la base de datos' });
  }
});

// Esto permite que Vercel maneje la app como una función serverless
export default app;

const PORT = process.env.PORT || 5000;
// Solo ejecutamos el listen si no estamos en Vercel
if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Error: El puerto ${PORT} ya está en uso. Intentá cerrar la otra terminal o cambiar el puerto en el archivo .env`);
    } else {
      console.error('❌ Error al iniciar el servidor:', err);
    }
  });
}