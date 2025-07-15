import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Minimal WebSocket configuration to reduce connection issues
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
neonConfig.fetchConnectionCache = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use minimal pool configuration to reduce connection issues
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Single connection
  min: 0, // No minimum
  idleTimeoutMillis: 30000, // 30 second idle timeout
  connectionTimeoutMillis: 5000, // 5 second connection timeout
  statementTimeout: 5000, // 5 second statement timeout
  queryTimeout: 5000, // 5 second query timeout
  allowExitOnIdle: true,
});

export const db = drizzle({ client: pool, schema });

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Add connection logging
pool.on('connect', () => {
  console.log('Database connected successfully');
});

// Health check function using pool
const healthCheck = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database health check passed');
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Export health check for monitoring
export { healthCheck };

// Test database connection on startup
healthCheck();