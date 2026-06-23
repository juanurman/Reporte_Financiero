import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finanzas',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 30000
});

// Hitos históricos del dólar para interpolación lineal
const hitosDolar = [
  { fecha: '2020-01-01', OFICIAL: 60.0, BLUE: 75.0, MEP: 73.0, CCL: 74.0 },
  { fecha: '2021-01-01', OFICIAL: 84.0, BLUE: 165.0, MEP: 140.0, CCL: 145.0 },
  { fecha: '2022-01-01', OFICIAL: 103.0, BLUE: 208.0, MEP: 198.0, CCL: 202.0 },
  { fecha: '2023-01-01', OFICIAL: 177.0, BLUE: 346.0, MEP: 328.0, CCL: 340.0 },
  { fecha: '2024-01-01', OFICIAL: 808.0, BLUE: 1025.0, MEP: 995.0, CCL: 975.0 },
  { fecha: '2025-01-01', OFICIAL: 1030.0, BLUE: 1440.0, MEP: 1400.0, CCL: 1420.0 },
  { fecha: '2026-06-22', OFICIAL: 1481.79, BLUE: 1495.0, MEP: 1485.8, CCL: 1527.0 }
];

// Obtener valor del dólar interpolado
const getDolarInterpolado = (simbolo, fechaStr) => {
  const targetTime = new Date(fechaStr).getTime();
  
  // Buscar el intervalo
  let i = 0;
  for (; i < hitosDolar.length - 1; i++) {
    const tStart = new Date(hitosDolar[i].fecha).getTime();
    const tEnd = new Date(hitosDolar[i+1].fecha).getTime();
    if (targetTime >= tStart && targetTime <= tEnd) {
      const valStart = hitosDolar[i][simbolo.replace('DOLAR_', '')];
      const valEnd = hitosDolar[i+1][simbolo.replace('DOLAR_', '')];
      const pct = (targetTime - tStart) / (tEnd - tStart);
      return Number((valStart + pct * (valEnd - valStart)).toFixed(2));
    }
  }
  // Fallback si la fecha es posterior al último hito
  return hitosDolar[hitosDolar.length - 1][simbolo.replace('DOLAR_', '')];
};

const runSeeder = async () => {
  console.log('🚀 Iniciando script de sembrado histórico...');
  try {
    // 1. Obtener todos los activos excepto M2_ y ALQ_
    const [activos] = await pool.execute('SELECT id, simbolo, categoria FROM activos');
    console.log(`Leídos ${activos.length} activos de la base de datos.`);

    const yahooAssets = activos.filter(a => 
      !a.simbolo.startsWith('M2_') && 
      !a.simbolo.startsWith('ALQ_') &&
      !['DOLAR_OFICIAL', 'DOLAR_BLUE', 'DOLAR_MEP', 'DOLAR_CCL'].includes(a.simbolo)
    );

    const dolarAssets = activos.filter(a => 
      ['DOLAR_OFICIAL', 'DOLAR_BLUE', 'DOLAR_MEP', 'DOLAR_CCL'].includes(a.simbolo)
    );

    console.log(`- Activos Yahoo Finance a procesar: ${yahooAssets.length}`);
    console.log(`- Activos Dólar a procesar: ${dolarAssets.length}`);

    // 2. Sembrar Yahoo Finance (6 años de histórico diario)
    for (const activo of yahooAssets) {
      console.log(`⏳ Descargando histórico de Yahoo Finance para: ${activo.simbolo}...`);
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${activo.simbolo}?interval=1d&range=6y`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        const result = data?.chart?.result?.[0];
        
        if (result && result.timestamp && result.indicators.quote[0].close) {
          const timestamps = result.timestamp;
          const closes = result.indicators.quote[0].close;
          
          const records = [];
          for (let j = 0; j < timestamps.length; j++) {
            const precio = closes[j];
            if (precio !== null && precio !== undefined && !isNaN(precio)) {
              const fecha = new Date(timestamps[j] * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
              records.push([activo.id, fecha, Number(precio.toFixed(4))]);
            }
          }
          
          if (records.length > 0) {
            console.log(` - Insertando ${records.length} registros para ${activo.simbolo}...`);
            const chunkSize = 1000;
            for (let k = 0; k < records.length; k += chunkSize) {
              const chunk = records.slice(k, k + chunkSize);
              await pool.query(
                'INSERT INTO precios_historicos (activo_id, fecha, valor) VALUES ? ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
                [chunk]
              );
            }
            console.log(` ✅ Guardados ${records.length} registros para ${activo.simbolo}.`);
          } else {
            console.log(` ⚠️ No se encontraron precios históricos válidos para ${activo.simbolo}`);
          }
        }
      } catch (err) {
        console.error(` ❌ Error al obtener histórico de ${activo.simbolo}: ${err.message}`);
      }
    }

    // 3. Sembrar Dólares (6 años con interpolación lineal diaria)
    console.log('⏳ Generando e insertando cotizaciones de Dólares interpoladas...');
    const startDate = new Date('2020-01-01');
    const endDate = new Date();
    
    const dates = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      dates.push(curr.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }));
      curr.setDate(curr.getDate() + 1);
    }
    
    for (const activo of dolarAssets) {
      console.log(` - Procesando dólar: ${activo.simbolo}...`);
      const records = [];
      for (const fecha of dates) {
        const valor = getDolarInterpolado(activo.simbolo, fecha);
        records.push([activo.id, fecha, valor]);
      }
      
      if (records.length > 0) {
        console.log(`   * Insertando ${records.length} cotizaciones diarias para ${activo.simbolo}...`);
        const chunkSize = 1000;
        for (let k = 0; k < records.length; k += chunkSize) {
          const chunk = records.slice(k, k + chunkSize);
          await pool.query(
            'INSERT INTO precios_historicos (activo_id, fecha, valor) VALUES ? ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
            [chunk]
          );
        }
        console.log(`   ✅ Guardados ${records.length} registros para ${activo.simbolo}.`);
      }
    }

    console.log('🎉 Sembrado histórico completado con éxito.');
  } catch (error) {
    console.error('❌ Error general durante el sembrado histórico:', error);
  } finally {
    await pool.end();
  }
};

runSeeder();
