import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon with better error handling
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

// Disable connection caching to prevent stale connections
neonConfig.fetchConnectionCache = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Single connection to prevent pool issues
  min: 0, // No minimum connections
  idleTimeoutMillis: 0, // No idle timeout
  connectionTimeoutMillis: 10000, // 10 second connection timeout
  statementTimeout: 15000, // 15 second statement timeout
  queryTimeout: 15000, // 15 second query timeout
  maxUses: Infinity, // No connection reuse limit
  allowExitOnIdle: true, // Allow exit on idle
});

export const db = drizzle({ client: pool, schema });

// Handle pool errors gracefully with automatic retry
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Don't exit process on database errors
});

// Add connection health check
pool.on('connect', () => {
  console.log('Database connected successfully');
});

// Handle connection removal
pool.on('remove', () => {
  console.log('Database connection removed from pool');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  try {
    await pool.end();
  } catch (error) {
    console.error('Error closing pool:', error);
  }
  process.exit(0);
});

// Health check function
const healthCheck = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Export health check for monitoring
export { healthCheck };

export { pool };