import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const initDB = async () => {
  try {
    // CLAVE 1: No especificamos 'database' aquí para evitar errores si no existe.
    // CLAVE 2: multipleStatements: true es OBLIGATORIO para ejecutar un archivo .sql completo.
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined
    });

    const schemaPath = path.join(__dirname, 'schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Reemplazamos "finanzas" por la base de datos que tengas en tu .env o Github Secrets
    const dbName = process.env.DB_NAME || 'finanzas';
    schema = schema.replace(/CREATE DATABASE IF NOT EXISTS finanzas;/gi, `CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    schema = schema.replace(/USE finanzas;/gi, `USE \`${dbName}\`;`);
    
    console.log(`⏳ Ejecutando schema.sql en la base de datos: ${dbName}...`);
    await connection.query(schema);
    console.log('✅ Estructura de base de datos inicializada (schema.sql).');

    // Aseguramos que la conexión esté usando la base de datos recién creada/verificada
    await connection.query(`USE \`${dbName}\``);

    // Consultamos la cantidad de activos actuales para decidir si sembramos
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM activos');
    const count = rows[0]?.count || 0;

    if (count === 0) {
      console.log('⏳ La tabla "activos" está vacía. Cargando datos iniciales de seed.sql...');
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await connection.query(seedSql);
        console.log('✅ Datos iniciales (seed.sql) cargados con éxito.');
      } else {
        console.warn('⚠️ No se encontró el archivo seed.sql, omitiendo siembra.');
      }
    } else {
      console.log(`ℹ️ La tabla "activos" ya contiene ${count} registros. Omitiendo seed.sql para preservar tus cambios y borrados.`);
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error.message);
  }
};

initDB();