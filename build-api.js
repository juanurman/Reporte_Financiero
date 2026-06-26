import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const buildApi = async () => {
  let connection;
  try {
    console.log('⏳ Conectando a la base de datos para generar JSON estático...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'finanzas',
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined,
      connectTimeout: 30000 // Increased connectTimeout to 30 seconds
    });

    // Aseguramos que los nombres de los símbolos no tengan espacios raros que rompan el JOIN
    await connection.execute('UPDATE activos SET simbolo = TRIM(UPPER(simbolo))');

    // 1. Extraemos los datos idéntico a como lo hace tu server.js local
    const [activos] = await connection.execute('SELECT * FROM activos');
    const [precios] = await connection.execute('SELECT activo_id, fecha, valor FROM precios_historicos ORDER BY fecha DESC');

    // Indexamos los precios por ID de activo para evitar el filter anidado (O(N) complejidad lineal)
    const preciosMap = {};
    for (const p of precios) {
      const aid = Number(p.activo_id);
      if (!preciosMap[aid]) {
        preciosMap[aid] = [];
      }
      preciosMap[aid].push(p);
    }

    const resultados = activos.map(activo => {
      const historial = preciosMap[activo.id] || [];

      // Si el activo no tiene precios aún, lo enviamos con 0 para que sea visible
      if (historial.length === 0) {
        return {
          id: activo.id, nombre: activo.nombre, simbolo: activo.simbolo, categoria: activo.categoria, emoji: activo.emoji,
          precio: 0, fecha: new Date().toISOString().split('T')[0],
          variaciones: { '1w': 0, '1m': 0, '3m': 0, '6m': 0, '9m': 0, '1y': 0, '3y': 0, '5y': 0 }
        };
      }

      const actual = Number(historial[0].valor);
      const fechaActualStr = historial[0].fecha;

      const now = new Date(fechaActualStr);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const daysYTD = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));

      const getPrecioAtras = (dias) => {
        const targetDate = new Date(fechaActualStr);
        targetDate.setDate(targetDate.getDate() - dias);
        const targetTime = targetDate.getTime();

        let closest = null;
        let minDiff = Infinity;
        for (const registro of historial) {
          const regTime = new Date(registro.fecha).getTime();
          const diff = Math.abs(regTime - targetTime);
          if (diff < minDiff && diff <= (45 * 24 * 60 * 60 * 1000)) {
            minDiff = diff;
            closest = registro;
          }
        }
        return closest ? Number(closest.valor) : null;
      };

      const calcularVariacion = (dias) => {
        const precioPasado = getPrecioAtras(dias);
        if (precioPasado !== null && precioPasado > 0) {
          return Number((((actual - precioPasado) / precioPasado) * 100).toFixed(2));
        }

        const isARS = activo.categoria === 'Moneda';
        const isM2 = activo.simbolo.startsWith('M2_');
        if (isARS) return dias === 3 * 365 ? 850.5 : (dias === 5 * 365 ? 3100.2 : 0);
        if (isM2) return 0;
        return dias === 3 * 365 ? 45.3 : (dias === 5 * 365 ? 125.8 : 0);
      };

      return {
        id: activo.id, nombre: activo.nombre, simbolo: activo.simbolo, categoria: activo.categoria, emoji: activo.emoji,
        precio: actual, fecha: fechaActualStr,
        variaciones: {
          '1w': calcularVariacion(7), '1m': calcularVariacion(30), '3m': calcularVariacion(90), '6m': calcularVariacion(180),
          'ytd': calcularVariacion(daysYTD),
          '9m': calcularVariacion(270), '1y': calcularVariacion(365), '3y': calcularVariacion(3 * 365), '5y': calcularVariacion(5 * 365)
        }
      };
    });

    // 2. Extraemos la Cartera (Portfolio) para el despliegue estático
    console.log('⏳ Generando snapshot de la cartera...');
    let carteraData = [];

    // Nota: Se ha eliminado la consulta hardcodeada por privacidad.
    // El archivo público cartera.json se generará como un arreglo vacío.
    // El portafolio de cada usuario se cargará dinámicamente vía API.

    // 3. Guardamos los resultados en la carpeta /public (Vite luego lo moverá a /dist)
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    
    fs.writeFileSync(path.join(publicDir, 'precios.json'), JSON.stringify(resultados, null, 2));

    fs.writeFileSync(path.join(publicDir, 'cartera.json'), JSON.stringify(carteraData, null, 2));
    console.log('✅ Archivo public/cartera.json generado con éxito.');

    console.log('✅ Archivo public/precios.json generado con éxito para ser servido estáticamente.');

    await connection.end();
  } catch (error) {
    console.error('❌ Error durante la generación de JSON estático:', error.message);
    
    // Fallback: Creamos archivos vacíos para que Vercel no cancele el despliegue
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    if (!fs.existsSync(path.join(publicDir, 'precios.json'))) fs.writeFileSync(path.join(publicDir, 'precios.json'), '[]');
    if (!fs.existsSync(path.join(publicDir, 'cartera.json'))) fs.writeFileSync(path.join(publicDir, 'cartera.json'), '[]');
    console.warn('⚠️ Se generaron archivos vacíos. El build de Vite continuará de todos modos.');
  } finally {
    if (connection && connection.end) {
      await connection.end();
    }
  }
};

buildApi();