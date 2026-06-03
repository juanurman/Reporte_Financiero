import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

dotenv.config();

const app = express();

// Habilitamos CORS para que nuestro frontend de Vue pueda hacer peticiones a esta API
app.use(cors());
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

// Autoconfiguración de la base de datos (Migración automática)
try {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS transacciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario VARCHAR(50) NOT NULL DEFAULT 'Diego',
      activo_id INT NOT NULL,
      cantidad DECIMAL(10,4) NOT NULL,
      precio_compra DECIMAL(10,4) NOT NULL,
      fecha DATE NOT NULL,
      FOREIGN KEY (activo_id) REFERENCES activos(id)
    )
  `);
  
  // Intentamos agregar la columna si la tabla ya existía de antes (Migración segura)
  try {
    await pool.execute('ALTER TABLE transacciones ADD COLUMN usuario VARCHAR(50) NOT NULL DEFAULT "Diego" AFTER id');
  } catch (e) { /* La columna ya existe, continuamos silenciosamente */ }

  // Forzamos el renombramiento del usuario por si ya había cargado algo como 'default'
  await pool.execute(`UPDATE transacciones SET usuario = 'Diego' WHERE usuario = 'default'`);

  const [txRows] = await pool.execute('SELECT COUNT(*) as c FROM transacciones');
  if (txRows[0].c === 0) {
    console.log('🌱 Sembrando transacciones iniciales en el portafolio dinámico...');
    const seedQueries = [
      `INSERT INTO transacciones (usuario, activo_id, cantidad, precio_compra, fecha) SELECT 'Diego', id, 3.2, 394.69, '2026-02-06' FROM activos WHERE simbolo = 'MU'`,
      `INSERT INTO transacciones (usuario, activo_id, cantidad, precio_compra, fecha) SELECT 'Diego', id, 13.67, 147.08, '2025-04-04' FROM activos WHERE simbolo = 'TSM'`,
      `INSERT INTO transacciones (usuario, activo_id, cantidad, precio_compra, fecha) SELECT 'Diego', id, 5.88, 167.15, '2025-03-05' FROM activos WHERE simbolo = 'GOOGL'`,
      `INSERT INTO transacciones (usuario, activo_id, cantidad, precio_compra, fecha) SELECT 'Diego', id, 2.53, 388.64, '2025-03-05' FROM activos WHERE simbolo = 'MSFT'`
    ];
    for (const q of seedQueries) await pool.execute(q);
  }
} catch (dbError) { console.error('⚠️ Error autoconfigurando la tabla de transacciones:', dbError.message); }

// Endpoint para obtener todos los activos con su último precio guardado
app.get('/api/precios', async (req, res) => {
  try {
    // Obtenemos todos los activos
    const [activos] = await pool.execute('SELECT * FROM activos');
    // Obtenemos TODOS los precios ordenados por fecha (del más nuevo al más viejo)
    const [precios] = await pool.execute('SELECT activo_id, fecha, valor FROM precios_historicos ORDER BY fecha DESC');

    const resultados = activos.map(activo => {
      const historial = precios.filter(p => p.activo_id === activo.id);
      if (historial.length === 0) return null;

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
        const precioAtras = getPrecioAtras(dias);
        if (!precioAtras) return 0;
        return Number((((actual - precioAtras) / precioAtras) * 100).toFixed(2));
      };

      // Calculamos YTD (Year-to-Date) buscando el primer registro hábil del año actual
      const currentYear = new Date(fechaActualStr).getFullYear();
      let firstOfYear = historial[0];
      for (let i = 0; i < historial.length; i++) {
        if (new Date(historial[i].fecha).getFullYear() === currentYear) {
          firstOfYear = historial[i];
        } else if (new Date(historial[i].fecha).getFullYear() < currentYear) {
          break;
        }
      }
      const ytdVariation = firstOfYear ? Number((((actual - firstOfYear.valor) / firstOfYear.valor) * 100).toFixed(2)) : 0;

      return {
        id: activo.id, nombre: activo.nombre, simbolo: activo.simbolo, categoria: activo.categoria, emoji: activo.emoji,
        precio: actual, fecha: fechaActualStr,
        variaciones: {
          '1w': calcularVariacion(7), '1m': calcularVariacion(30), 
          '3m': calcularVariacion(90), '6m': calcularVariacion(180), 
          '9m': calcularVariacion(270), 'ytd': ytdVariation, '1y': calcularVariacion(365),
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

// Endpoint para agregar un nuevo activo desde el panel de Administración
app.post('/api/activos', async (req, res) => {
  const { simbolo, nombre, categoria, emoji, adminPassword } = req.body;

  // SEGURIDAD REAL DE BACKEND: Rechazamos la petición si la contraseña no coincide con la del servidor
  const serverPassword = process.env.ADMIN_PASSWORD || 'argento123'; // Clave por defecto si te olvidas el .env
  if (!adminPassword || adminPassword.trim() !== serverPassword.trim()) {
    return res.status(401).json({ error: 'Acceso Denegado: Contraseña de administrador incorrecta.' });
  }

  if (!simbolo || !nombre) {
    return res.status(400).json({ error: 'El símbolo y el nombre son obligatorios.' });
  }

  try {
    await pool.execute(
      'INSERT INTO activos (nombre, simbolo, categoria, emoji) VALUES (?, ?, ?, ?)',
      [nombre, simbolo.toUpperCase(), categoria || 'Otros', emoji || '📈']
    );

    // ESPERAMOS a que el actualizador termine de descargar la info de Yahoo para ESTE símbolo específico
    console.log(`⏳ Descargando historial de ${simbolo.toUpperCase()}...`);
    await execAsync(`node updater.js "${simbolo.toUpperCase()}"`);
    console.log(`✅ Historial de ${simbolo.toUpperCase()} descargado con éxito.`);

    // Disparamos un push a GitHub automáticamente para que la web pública de todos se actualice
    exec('git commit --allow-empty -m "🤖 Auto-Deploy: Nuevo activo agregado" && git push', (error) => {
      if (error) console.error('⚠️ No se pudo disparar auto-deploy en GitHub. Hacé un push manual luego.');
      else console.log('🚀 Auto-Deploy disparado en GitHub Actions.');
    });

    res.status(201).json({ message: `¡Éxito! ${nombre} agregado. Visible localmente al instante. En 1 min estará público para todos.` });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: `El símbolo ${simbolo.toUpperCase()} ya existe.` });
    console.error('❌ Error al agregar activo:', error.message);
    res.status(500).json({ error: 'Error interno del servidor al guardar en TiDB.' });
  }
});

// Endpoint para obtener la Cartera consolidada
app.get('/api/cartera', async (req, res) => {
  const usuario = req.query.usuario || 'Diego';
  try {
    const [rows] = await pool.execute(`
      SELECT a.simbolo, a.nombre, a.emoji, 
             SUM(t.cantidad) as cantidad, 
             SUM(t.cantidad * t.precio_compra) / SUM(t.cantidad) as avgPrice, 
             MIN(t.fecha) as purchaseDate
      FROM transacciones t
      JOIN activos a ON t.activo_id = a.id
      WHERE t.usuario = ?
      GROUP BY a.simbolo, a.nombre, a.emoji
      HAVING cantidad > 0
    `, [usuario]);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: 'Error al obtener la cartera' }); }
});

// Endpoint para registrar una nueva Compra
app.post('/api/cartera', async (req, res) => {
  const { usuario, simbolo, cantidad, precio_compra, fecha, adminPassword } = req.body;
  const serverPassword = process.env.ADMIN_PASSWORD || 'argento123';
  if (!adminPassword || adminPassword.trim() !== serverPassword.trim()) {
    return res.status(401).json({ error: 'Acceso Denegado: Contraseña incorrecta.' });
  }
  
  const user = usuario || 'Diego';
  try {
    const [activos] = await pool.execute('SELECT id FROM activos WHERE simbolo = ?', [simbolo]);
    if (activos.length === 0) return res.status(404).json({ error: `El Ticker ${simbolo} no existe. Agregalo primero desde 'Agregar Activo'.` });
    
    await pool.execute('INSERT INTO transacciones (usuario, activo_id, cantidad, precio_compra, fecha) VALUES (?, ?, ?, ?, ?)', [user, activos[0].id, cantidad, precio_compra, fecha]);

    exec('git commit --allow-empty -m "🤖 Auto-Deploy: Nueva transacción" && git push', () => {});
    res.status(201).json({ message: `¡Éxito! Compra de ${simbolo} registrada en la base de datos.` });
  } catch (error) { res.status(500).json({ error: 'Error al guardar la transacción en TiDB.' }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
});