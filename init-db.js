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
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('⏳ Ejecutando schema.sql...');
    await connection.query(schema);
    
    console.log('✅ Base de datos inicializada correctamente.');
    await connection.end();
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error.message);
  }
};

initDB();