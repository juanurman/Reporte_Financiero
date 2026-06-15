import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Habilitamos CORS para que nuestro frontend de Vue pueda hacer peticiones a esta API
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors()); // Habilita pre-flight para todas las rutas

app.use(express.json());

// Ignoramos peticiones al favicon para evitar errores 404 en los logs
app.get('/favicon.ico', (req, res) => res.status(204).end());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finanzas',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000
});

// Ruta raíz para verificar que la API está viva
app.get('/', (req, res) => {
  res.json({
    estado: 'online',
    mensaje: '🚀 API de Reporte Financiero funcionando correctamente en Vercel',
    version: '1.0.0',
    endpoints: ['/api/precios', '/api/cartera', '/api/activos', '/api/historical-price']
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
  if (adminPassword !== 'admin') {
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

// Endpoint para eliminar un activo (Admin)
app.delete('/api/activos/:simbolo', async (req, res) => {
  const { adminPassword } = req.body;
  
  if (adminPassword !== 'admin') {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const { simbolo } = req.params;
    await pool.execute('DELETE FROM activos WHERE simbolo = ?', [simbolo]);
    res.json({ message: `Activo ${simbolo} eliminado con éxito` });
  } catch (error) {
    console.error('❌ Error al eliminar activo:', error.message);
    res.status(500).json({ error: 'Error al eliminar el activo' });
  }
});

// Endpoint para obtener el precio histórico de un activo en una fecha
app.get('/api/historical-price', async (req, res) => {
  const { simbolo, fecha } = req.query;

  if (!simbolo || !fecha) {
    return res.status(400).json({ error: 'Símbolo y fecha son requeridos.' });
  }

  try {
    // Buscamos el precio en la fecha exacta o el último anterior disponible (para fines de semana/feriados)
    const query = `
      SELECT p.valor
      FROM precios_historicos p
      JOIN activos a ON p.activo_id = a.id
      WHERE a.simbolo = ? AND p.fecha <= ?
      ORDER BY p.fecha DESC
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [simbolo.toUpperCase(), fecha]);

    if (rows.length > 0) {
      res.json({ precio: rows[0].valor });
    } else {
      res.status(404).json({ error: 'No se encontró precio para la fecha especificada o anterior.' });
    }
  } catch (error) {
    console.error('❌ Error al obtener precio histórico:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener la cartera de un usuario
app.get('/api/cartera', async (req, res) => {
  const { usuario } = req.query;
  
  const querySQL = `
    SELECT 
      TRIM(UPPER(c.simbolo)) as simbolo, 
      MAX(COALESCE(a.nombre, UPPER(c.simbolo))) as nombre, 
      MAX(COALESCE(a.emoji, '💰')) as emoji, 
      MAX(COALESCE(a.categoria, 'Otros')) as categoria,
      SUM(CASE WHEN c.tipo = 'COMPRA' THEN c.cantidad ELSE -c.cantidad END) as cantidad, 
      COALESCE(
        SUM(CASE WHEN c.tipo = 'COMPRA' THEN c.cantidad * c.precio_compra ELSE 0 END) / 
        NULLIF(SUM(CASE WHEN c.tipo = 'COMPRA' THEN c.cantidad ELSE 0 END), 0), 
        0) as avgPrice, 
      SUM(COALESCE(c.comisiones, 0)) as totalComisiones,
      MIN(c.fecha) as purchaseDate
    FROM cartera c
    LEFT JOIN activos a ON TRIM(UPPER(c.simbolo)) = a.simbolo
    WHERE UPPER(c.usuario) = UPPER(?)
    GROUP BY simbolo
    HAVING SUM(CASE WHEN c.tipo = 'COMPRA' THEN c.cantidad ELSE -c.cantidad END) > 0
  `;

  try {
    const [filas] = await pool.execute(querySQL, [usuario || '']);
    res.json(filas);
  } catch (error) {
    console.error('❌ Error SQL al obtener cartera:', error.message);

    // 🔧 Auto-reparación silenciosa si las columnas 'tipo' o 'comisiones' no existen en la BD de Vercel
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      try {
        console.log('🔧 Auto-reparando tabla cartera en producción...');
        await pool.execute('ALTER TABLE cartera ADD COLUMN tipo VARCHAR(10) NOT NULL DEFAULT "COMPRA"').catch(()=>{});
        await pool.execute('ALTER TABLE cartera ADD COLUMN comisiones DECIMAL(15,4) DEFAULT 0').catch(()=>{});
        
        const [filasRetry] = await pool.execute(querySQL, [usuario || '']);
        return res.json(filasRetry);
      } catch (retryError) {
        return res.status(500).json({ error: 'Error reparando la tabla cartera', details: retryError.message });
      }
    }

    // Si la tabla no existe en esta base de datos, devolvemos un array vacío pacíficamente
    if (error.code === 'ER_NO_SUCH_TABLE') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Error SQL al obtener la cartera', details: error.sqlMessage || error.message });
    }
  }
});

// Endpoint para agregar una transacción a la cartera
app.post('/api/cartera', async (req, res) => {
  const { usuario, simbolo, tipo, cantidad, precio_compra, comisiones, fecha } = req.body;
  try {
    // 🛡️ Autocreación de la tabla en localhost si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cartera (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(50) NOT NULL,
        simbolo VARCHAR(20) NOT NULL,
        tipo VARCHAR(10) NOT NULL,
        cantidad DECIMAL(15,4) NOT NULL,
        precio_compra DECIMAL(15,4) NOT NULL,
        comisiones DECIMAL(15,4) DEFAULT 0,
        fecha DATE NOT NULL
      )
    `);

    // Parche por si la tabla ya existía en producción pero era la versión vieja sin estas columnas
    await pool.execute('ALTER TABLE cartera ADD COLUMN tipo VARCHAR(10) NOT NULL DEFAULT "COMPRA"').catch(()=>{});
    await pool.execute('ALTER TABLE cartera ADD COLUMN comisiones DECIMAL(15,4) DEFAULT 0').catch(()=>{});
    
    // Parche para remover una restricción única que impide cargar varias transacciones el mismo día
    await pool.execute('ALTER TABLE cartera DROP INDEX uk_usuario_simbolo_fecha').catch(()=>{});

    const query = `
      INSERT INTO cartera (usuario, simbolo, tipo, cantidad, precio_compra, comisiones, fecha)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(query, [
      usuario,
      simbolo.toUpperCase(),
      tipo || 'COMPRA',
      cantidad,
      precio_compra,
      comisiones || 0,
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