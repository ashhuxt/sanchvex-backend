// seed.js
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Initialize connection pool using your secret environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'];
const BATCH_SIZE = 10000;
const TOTAL_RECORDS = 200000;

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('--- Sanchvex Seeding Engine Started ---');
    console.log('Clearing any existing data from products table...');
    await client.query('TRUNCATE TABLE products RESTART IDENTITY;');

    console.log(`Generating and inserting ${TOTAL_RECORDS} records in chunks of ${BATCH_SIZE}...`);
    
    // Loop through 20 batches instead of 200,000 individual items
    for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
      const values = [];
      const valueStrings = [];
      
      for (let j = 0; j < BATCH_SIZE; j++) {
        const currentId = i + j;
        const name = `Product Item ${currentId}`;
        const category = CATEGORIES[currentId % CATEGORIES.length];
        const price = parseFloat((Math.random() * 800 + 10).toFixed(2)); // Random price between 10 and 810
        
        // Stagger dates backwards by 1 minute per item to simulate a real history timeline
        const simulatedTime = new Date(Date.now() - currentId * 60000).toISOString();

        // Each row takes 5 parameters: name, category, price, created_at, updated_at
        const paramOffset = j * 5;
        values.push(name, category, price, simulatedTime, simulatedTime);
        valueStrings.push(`($${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, $${paramOffset + 4}, $${paramOffset + 5})`);
      }

      // Build a single massive query for the batch: INSERT INTO products (...) VALUES (...), (...), ...
      const queryText = `INSERT INTO products (name, category, price, created_at, updated_at) VALUES ${valueStrings.join(',')}`;
      await client.query(queryText, values);
      
      console.log(`Successfully batch-inserted records: ${i + BATCH_SIZE} / ${TOTAL_RECORDS}`);
    }

    console.log('🎉 Seeding completed successfully on Sanchvex!');
  } catch (error) {
    console.error('❌ Critical Error during seeding operation:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();