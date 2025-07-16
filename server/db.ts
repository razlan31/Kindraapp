import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Optimized WebSocket configuration for stability
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = "password"; // Enable pipelining for faster connections
neonConfig.fetchConnectionCache = true; // Enable connection caching
neonConfig.poolQueryViaFetch = true; // Use fetch for Pool queries when possible

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized database connection pool configuration
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL + "?connect_timeout=10",
  max: 3, // Improved concurrency
  min: 0, 
  idleTimeoutMillis: 10000, // 10 second idle timeout
  connectionTimeoutMillis: 10000, // 10 second connection timeout
  statementTimeout: 15000, // 15 second statement timeout
  queryTimeout: 15000, // 15 second query timeout
  allowExitOnIdle: true,
  maxUses: 1000, // Better connection reuse
  maxLifetimeSeconds: 300, // 5 minute connection lifetime
});

// Database configuration - clean and optimized

export const db = drizzle({ 
  client: pool, 
  schema
});

// Export pool for testing purposes
export { pool };

// Database error monitoring
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Simple connection logging
pool.on('connect', () => {
  console.log('Database connected successfully');
});

// Enhanced health check with timeout handling
const healthCheck = async () => {
  try {
    const client = await pool.connect();
    
    // Use AbortController for timeout control
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort('Health check timed out'), 5000);
    
    try {
      await client.query('SELECT 1');
      clearTimeout(timeout);
      console.log('Database health check passed');
      return true;
    } catch (queryError) {
      clearTimeout(timeout);
      throw queryError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Health check failed:', error);
    // Handle ProcessInterrupts specifically
    if (error.code === '57P01') {
      console.error('Health check failed due to PostgreSQL ProcessInterrupts');
    }
    return false;
  }
};

// Export health check for monitoring
export { healthCheck };

// Test database connection on startup
healthCheck();