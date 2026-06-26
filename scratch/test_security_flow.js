import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finanzas',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined,
});

async function runTests() {
  console.log('--- STARTING SECURITY FLOW VERIFICATION TESTS ---\n');
  try {
    // 1. Delete TEST_SEC and TEST_LEGACY if they already exist
    await pool.execute("DELETE FROM usuarios WHERE username IN ('TEST_SEC', 'TEST_LEGACY')");

    // 2. Create TEST_SEC user via API (POST /api/usuarios)
    console.log('1. Creating TEST_SEC user via admin API...');
    const createUserRes = await axios.post('http://localhost:4000/api/usuarios', {
      username: 'TEST_SEC',
      password: 'my_secure_password_123',
      adminPassword: 'admin' // default local admin password
    });
    console.log('   Response:', createUserRes.data);

    // 3. Inspect TEST_SEC in the database
    const [secUserRows] = await pool.execute("SELECT * FROM usuarios WHERE username = 'TEST_SEC'");
    const secUser = secUserRows[0];
    console.log('\n2. Inspecting TEST_SEC in DB:');
    console.log(`   Username: ${secUser.username}`);
    console.log(`   Stored Password: ${secUser.password}`);
    const isHashed = secUser.password.includes(':') && secUser.password.length > 50;
    console.log(`   Is correctly hashed (contains ":" and is long)? ${isHashed ? 'YES ✅' : 'NO ❌'}`);

    // 4. Test login with correct password
    console.log('\n3. Testing login for TEST_SEC with correct password...');
    const loginSuccessRes = await axios.post('http://localhost:4000/api/login', {
      username: 'TEST_SEC',
      password: 'my_secure_password_123'
    });
    console.log('   Response:', loginSuccessRes.data);

    // 5. Test login with wrong password
    console.log('\n4. Testing login for TEST_SEC with wrong password...');
    try {
      await axios.post('http://localhost:4000/api/login', {
        username: 'TEST_SEC',
        password: 'wrong_password'
      });
      console.log('   Response: Success (ERROR - should have failed!) ❌');
    } catch (err) {
      console.log(`   Response: Failed with status ${err.response.status} (${err.response.data.error}) ✅`);
    }

    // 6. Create legacy plain-text user directly in the DB
    console.log('\n5. Creating legacy plain-text user TEST_LEGACY in DB...');
    await pool.execute(
      "INSERT INTO usuarios (username, password) VALUES ('TEST_LEGACY', 'legacy_password_plain')"
    );
    const [legacyUserBefore] = await pool.execute("SELECT * FROM usuarios WHERE username = 'TEST_LEGACY'");
    console.log(`   Stored Password in DB before login: ${legacyUserBefore[0].password}`);

    // 7. Login with TEST_LEGACY (should trigger transparent migration)
    console.log('\n6. Logging in with TEST_LEGACY to trigger transparent migration...');
    const legacyLoginRes = await axios.post('http://localhost:4000/api/login', {
      username: 'TEST_LEGACY',
      password: 'legacy_password_plain'
    });
    console.log('   Login response:', legacyLoginRes.data);

    // Wait a brief moment for asynchronous migration write to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // 8. Inspect TEST_LEGACY in the database after login
    const [legacyUserAfter] = await pool.execute("SELECT * FROM usuarios WHERE username = 'TEST_LEGACY'");
    const storedAfter = legacyUserAfter[0].password;
    console.log('\n7. Inspecting TEST_LEGACY in DB after login:');
    console.log(`   Stored Password in DB: ${storedAfter}`);
    const isMigrated = storedAfter.includes(':') && storedAfter.length > 50;
    console.log(`   Is successfully migrated to hash? ${isMigrated ? 'YES ✅' : 'NO ❌'}`);

    // 9. Verify logging in again with migrated password works
    console.log('\n8. Logging in again with TEST_LEGACY...');
    const legacyLoginAgainRes = await axios.post('http://localhost:4000/api/login', {
      username: 'TEST_LEGACY',
      password: 'legacy_password_plain'
    });
    console.log('   Login response:', legacyLoginAgainRes.data);

    // 10. Clean up test users
    await pool.execute("DELETE FROM usuarios WHERE username IN ('TEST_SEC', 'TEST_LEGACY')");
    console.log('\n--- ALL TESTS COMPLETED SUCCESSFULLY! ✅ ---');

  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await pool.end();
  }
}

runTests();
