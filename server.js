// server.js
import Fastify from 'fastify';
import pg from 'pg';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';

// Setup ES modules paths configurations for locating public folder assets
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Register the static file server plugin BEFORE your custom API routes
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/', // Serves index.html directly from the root URL (http://localhost:3000/)
});

// Setup PostgreSQL connection manager with pooling enabled
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Utility to securely decode Base64 cursor tokens back to search checkpoints
const decodeCursor = (cursorStr) => {
  if (!cursorStr) return null;
  try {
    const decoded = Buffer.from(cursorStr, 'base64').toString('utf-8');
    const [createdAt, id] = decoded.split('_');
    if (!createdAt || !id) return null;
    return { createdAt, id: parseInt(id, 10) };
  } catch (err) {
    return null; // Gracefully handles malformed or tampered cursors
  }
};

// Utility to encode internal sorting states into safe opaque tokens
const encodeCursor = (createdAt, id) => {
  return Buffer.from(`${new Date(createdAt).toISOString()}_${id}`).toString('base64');
};

// Main fast-paginated product inventory endpoint
fastify.get('/api/products', async (request, reply) => {
  const { category, cursor, limit = 20 } = request.query;
  const limitNum = Math.min(parseInt(limit, 10), 100); // Production guardrail: Max response sizing

  let queryText = `SELECT id, name, category, price, created_at FROM products`;
  const queryParams = [];
  const whereClauses = [];

  // Conditional Logic 1: Filter by category if explicitly supplied
  if (category) {
    queryParams.push(category);
    whereClauses.push(`category = $${queryParams.length}`);
  }

  // Conditional Logic 2: Apply precise cursor positioning for strict historical ordering
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      queryParams.push(decoded.createdAt, decoded.id);
      whereClauses.push(
        `(created_at < $${queryParams.length - 1} OR (created_at = $${queryParams.length - 1} AND id < $${queryParams.length}))`
      );
    }
  }

  // Merge runtime criteria statements dynamically
  if (whereClauses.length > 0) {
    queryText += ` WHERE ` + whereClauses.join(' AND ');
  }

  // Sorting matches the optimized index precisely to force index scans: (category, created_at DESC, id DESC)
  queryText += ` ORDER BY created_at DESC, id DESC LIMIT $${queryParams.length + 1}`;
  
  // Proactively select limitNum + 1 rows to establish look-ahead paging boundaries without running a COUNT(*)
  queryParams.push(limitNum + 1);

  const { rows } = await pool.query(queryText, queryParams);

  // Evaluate if additional entities reside further back in history records
  const hasNextPage = rows.length > limitNum;
  
  // Crop payload records matching consumer's targeted restriction limits
  const data = hasNextPage ? rows.slice(0, limitNum) : rows;
  
  // Extract positioning elements from the boundary item to formulate the next page's cursor tracking token
  const nextCursor = hasNextPage 
    ? encodeCursor(data[data.length - 1].created_at, data[data.length - 1].id) 
    : null;

  return {
    products: data,
    nextCursor,
    hasNextPage,
  };
});

// Start application runtime loop
const startServer = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Sanchvex core listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startServer();