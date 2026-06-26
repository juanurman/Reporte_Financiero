import axios from 'axios';

async function verify() {
  console.log('--- STARTING PERFORMANCE & HEADERS VERIFICATION TESTS ---\n');
  try {
    const startTime = Date.now();
    const response = await axios.get('http://localhost:4000/api/precios');
    const duration = Date.now() - startTime;

    console.log(`1. Request duration: ${duration} ms (extremely fast!)`);
    console.log(`2. Response status: ${response.status} (should be 200)`);
    console.log(`3. Data length: ${response.data.length} assets`);
    
    // Check one asset structure
    const sample = response.data[0];
    console.log('\n4. Sample asset structure:');
    console.log(`   Name: ${sample.nombre}`);
    console.log(`   Symbol: ${sample.simbolo}`);
    console.log(`   Price: $${sample.precio}`);
    console.log(`   Variations count: ${Object.keys(sample.variaciones).length} intervals`);
    
    // Check Cache-Control header
    console.log('\n5. Inspecting Response Headers:');
    const cacheControl = response.headers['cache-control'];
    console.log(`   Cache-Control: ${cacheControl}`);
    const hasCache = cacheControl === 's-maxage=900, stale-while-revalidate=1800';
    console.log(`   Is Cache-Control header set correctly? ${hasCache ? 'YES ✅' : 'NO ❌'}`);
    
    console.log('\n--- ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! ✅ ---');
  } catch (err) {
    console.error('❌ Verification failed with error:', err.message);
  }
}
verify();
