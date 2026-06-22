// test-drift.js
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function validateDrift() {
  console.log('--- Starting Sanchvex Data Drift Verification ---');

  // 1. Fetch Page 1 (Simulating the user pulling the first 5 records)
  console.log('\n[User Action] Fetching Page 1 (Limit: 5)...');
  const page1Res = await fetch('http://localhost:3000/api/products?limit=5');
  const page1 = await page1Res.json();
  
  console.log('Page 1 Items Recieved:');
  page1.products.forEach(p => console.log(` -> ID: ${p.id} | Name: ${p.name} | Created At: ${p.created_at}`));
  
  const cursorToken = page1.nextCursor;
  console.log(`🔑 Generated Next Page Cursor Token: ${cursorToken}`);

  // 2. Simulate Data Drift (A background process injects 3 new items right now)
  console.log('\n[System Event] Drift alert! Injecting 3 brand new items into the database...');
  const now = new Date().toISOString();
  
  // We use IDs or highly future timestamps to place them right at the top of "Newest First"
  await pool.query(`
    INSERT INTO products (name, category, price, created_at, updated_at) VALUES 
    ('Drift Product Alpha', 'Electronics', 99.99, NOW() + INTERVAL '10 minutes', NOW() + INTERVAL '10 minutes'),
    ('Drift Product Beta', 'Electronics', 89.99, NOW() + INTERVAL '11 minutes', NOW() + INTERVAL '11 minutes'),
    ('Drift Product Gamma', 'Electronics', 79.99, NOW() + INTERVAL '12 minutes', NOW() + INTERVAL '12 minutes');
  `);
  console.log('✅ 3 new records successfully committed to Neon.');

  // 3. Fetch Page 2 using the original pointer from Page 1
  console.log('\n[User Action] Fetching Page 2 using the cursor token...');
  const page2Res = await fetch(`http://localhost:3000/api/products?limit=5&cursor=${cursorToken}`);
  const page2 = await page2Res.json();

  console.log('Page 2 Items Recieved:');
  page2.products.forEach(p => console.log(` -> ID: ${p.id} | Name: ${p.name} | Created At: ${p.created_at}`));

  // 4. Verify Integrity Constraints
  const page1Ids = new Set(page1.products.map(p => p.id));
  let hasDuplicates = false;

  page2.products.forEach(p => {
    if (page1Ids.has(p.id)) {
      hasDuplicates = true;
      console.error(`❌ CRITICAL FAILURE: Duplicate detected! Product ID ${p.id} appeared on both Page 1 and Page 2.`);
    }
  });

  if (!hasDuplicates && page2.products.length > 0) {
    console.log('\n🎉 VALIDATION SUCCESS: Zero duplicate items encountered!');
    console.log('The cursor system anchored seamlessly. Data drift handled perfectly.');
  }

  await pool.end();
}

validateDrift().catch(console.error);