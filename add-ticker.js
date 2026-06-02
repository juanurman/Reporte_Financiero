import readline from 'readline';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

const run = async () => {
  console.log('\n🌟 Bienvenido al Asistente para Agregar Activos 🌟\n');
  
  const simbolo = await question('1. Símbolo en Yahoo Finance (ej. BTC-USD, TSLA, MELI): ');
  const nombre = await question('2. Nombre de la empresa o activo (ej. Tesla Inc.): ');
  const categoria = await question('3. Categoría (ej. Wall Street, Cripto, Merval): ');
  const emoji = await question('4. Emoji para identificarlo (ej. 🚗, ₿): ');

  if (!simbolo || !nombre) {
    console.log('\n❌ Error: El símbolo y el nombre son obligatorios.');
    process.exit(1);
  }

  try {
    const pool = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'finanzas',
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined
    });

    await pool.execute(
      'INSERT INTO activos (nombre, simbolo, categoria, emoji) VALUES (?, ?, ?, ?)',
      [nombre, simbolo.toUpperCase(), categoria || 'Otros', emoji || '📈']
    );

    console.log(`\n✅ ¡Éxito! ${nombre} (${simbolo.toUpperCase()}) se ha agregado a la base de datos.`);
    console.log('👉 La próxima vez que se ejecute el "updater.js" o el deploy, el sistema detectará el nuevo activo y descargará automáticamente sus últimos 5 años de historial.');
    
    await pool.end();
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') console.log(`\n⚠️ El símbolo ${simbolo.toUpperCase()} ya existe en tu base de datos.`);
    else console.log('\n❌ Error al guardar en la base de datos:', err.message);
  }
  rl.close();
};

run();