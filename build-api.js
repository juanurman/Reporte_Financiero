import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const buildApi = async () => {
  try {
    console.log('⏳ Conectando a la base de datos para generar JSON estático...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'finanzas',
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined
    });

    // 1. Extraemos los datos idéntico a como lo hace tu server.js local
    const [activos] = await connection.execute('SELECT * FROM activos');
    const [precios] = await connection.execute('SELECT activo_id, fecha, valor FROM precios_historicos ORDER BY fecha DESC');

    const resultados = activos.map(activo => {
      const historial = precios.filter(p => p.activo_id === activo.id);
      if (historial.length === 0) return null;

      const actual = historial[0].valor;
      const fechaActualStr = historial[0].fecha;

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
        if (dias <= 365) return Number((((actual - getPrecioAtras(dias)) / getPrecioAtras(dias)) * 100).toFixed(2));
        // Mocks para años pasados (calculadora Delorean)
        const isARS = activo.categoria === 'Moneda';
        const isM2 = activo.simbolo.startsWith('M2');
        if (isARS) return dias === 3 * 365 ? 850.5 : 3100.2;
        if (isM2) return dias === 3 * 365 ? -15.5 : -25.2;
        return dias === 3 * 365 ? 45.3 : 125.8;
      };

      return {
        id: activo.id, nombre: activo.nombre, simbolo: activo.simbolo, categoria: activo.categoria, emoji: activo.emoji,
        precio: actual, fecha: fechaActualStr,
        variaciones: {
          '1w': calcularVariacion(7), '1m': calcularVariacion(30), '3m': calcularVariacion(90), '6m': calcularVariacion(180),
          '9m': calcularVariacion(270), '1y': calcularVariacion(365), '3y': calcularVariacion(3 * 365), '5y': calcularVariacion(5 * 365)
        }
      };
    }).filter(a => a !== null);

    // 2. Extraemos la Cartera (Portfolio) para el despliegue estático
    console.log('⏳ Generando snapshot de la cartera...');
    let carteraData = [];
    try {
      const [carteraFilas] = await connection.execute(`
        SELECT c.simbolo, a.nombre, a.emoji, c.cantidad, c.precio_compra as avgPrice, c.fecha as purchaseDate
        FROM cartera c
        JOIN activos a ON c.simbolo = a.simbolo
        WHERE c.usuario = 'Diego'
      `);
      carteraData = carteraFilas;
    } catch (err) {
      console.warn('⚠️ No se pudo obtener la cartera (la tabla puede no existir aún).');
    }

    // 3. Guardamos los resultados en la carpeta /public (Vite luego lo moverá a /dist)
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    
    fs.writeFileSync(path.join(publicDir, 'precios.json'), JSON.stringify(resultados, null, 2));
    
    if (carteraData.length > 0) {
      fs.writeFileSync(path.join(publicDir, 'cartera.json'), JSON.stringify(carteraData, null, 2));
      console.log('✅ Archivo public/cartera.json generado con éxito.');
    }

    console.log('✅ Archivo public/precios.json generado con éxito para ser servido estáticamente.');

    await connection.end();
  } catch (error) {
    console.error('❌ Error generando precios.json:', error.message);
    process.exit(1); // Importante salir con error para que el GitHub Action falle si no se puede conectar a TiDB
  }
};

buildApi();