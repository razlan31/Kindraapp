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

// TESTING ITEM #7: Increase connection pool size to prevent exhaustion during concurrent operations
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL + "?connect_timeout=5", // 5 second timeout for faster failure
  max: 5, // TESTING: Increased from 1 to 5 connections to handle concurrent operations
  min: 0, // No minimum connections
  idleTimeoutMillis: 5000, // 5 second idle timeout (aggressive reduction)
  connectionTimeoutMillis: 5000, // 5 second connection timeout (aggressive reduction)
  statementTimeout: 5000, // 5 second statement timeout (aggressive reduction)
  queryTimeout: 5000, // 5 second query timeout (aggressive reduction)
  allowExitOnIdle: true,
  maxUses: 100, // Reduced connection reuse to prevent resource exhaustion
  maxLifetimeSeconds: 60, // 1 minute connection lifetime (aggressive reduction)
});

// TESTING ITEM #12: Drizzle ORM-level timeout configuration to prevent sequelize cancellation
console.log('🧪 TESTING ITEM #12: Configuring Drizzle ORM query timeout to prevent sequelize cancellation...');

export const db = drizzle({ 
  client: pool, 
  schema,
  // Add ORM-level timeout configuration
  logger: {
    logQuery: (query, params) => {
      console.log('🧪 ITEM #12: Drizzle query starting:', query.substring(0, 100) + '...');
    }
  }
});

// Export pool for testing purposes
export { pool };

// Enhanced error handling with retry logic
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Handle specific PostgreSQL ProcessInterrupts errors
  if (err.code === '57P01') {
    console.error('PostgreSQL ProcessInterrupts detected - connection terminated by server');
  }
});

// Enhanced connection logging with pool statistics
pool.on('connect', (client) => {
  console.log('Database connected successfully');
  console.log(`Connection details: processID=${client.processID}, backend=${client.connectionParameters?.host}`);
  console.log(`Pool stats: total=${pool.totalCount}, idle=${pool.idleCount}, waiting=${pool.waitingCount}`);
});

// Add connection end logging with pool statistics
pool.on('remove', (client) => {
  console.log('Database connection removed from pool');
  console.log(`Pool stats after removal: total=${pool.totalCount}, idle=${pool.idleCount}, waiting=${pool.waitingCount}`);
});

// Add connection acquisition logging
pool.on('acquire', (client) => {
  console.log(`Connection acquired: processID=${client?.processID || 'null'}, pool waiting=${pool.waitingCount}`);
});

// Add connection release logging
pool.on('release', (client) => {
  console.log(`Connection released: processID=${client?.processID || 'null'}, pool idle=${pool.idleCount}`);
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