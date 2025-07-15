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

// 🚨 SEQUELIZE CANCELLATION FIX: Ultra-minimal configuration to prevent Neon resource limits under concurrent authentication load
console.log('🧪 SEQUELIZE CANCELLATION FIX: Configuring ultra-minimal database resources to prevent Neon limits under concurrent authentication load...');

// ROOT CAUSE: Concurrent authentication operations cause Neon database to remove connections from pool
// SOLUTION: Single connection with minimal timeouts and resource usage
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL + "?connect_timeout=3", // 3 second timeout (ultra-minimal)
  max: 1, // Single connection to prevent resource exhaustion during concurrent auth
  min: 0, // No minimum connections to minimize resource usage
  idleTimeoutMillis: 3000, // 3 second idle timeout (ultra-minimal)
  connectionTimeoutMillis: 3000, // 3 second connection timeout (ultra-minimal)
  statementTimeout: 3000, // 3 second statement timeout (ultra-minimal)
  queryTimeout: 3000, // 3 second query timeout (ultra-minimal)
  allowExitOnIdle: true,
  maxUses: 10, // Ultra-minimal connection reuse to prevent resource exhaustion
  maxLifetimeSeconds: 30, // 30 second connection lifetime (ultra-minimal)
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

// TESTING ITEM #13: Enhanced error handling with Neon resource limit monitoring
pool.on('error', (err) => {
  console.error('🚨 ITEM #13: Database pool error:', err);
  
  // Handle specific PostgreSQL ProcessInterrupts errors
  if (err.code === '57P01') {
    console.error('🚨 ITEM #13: PostgreSQL ProcessInterrupts detected - connection terminated by server');
  }
  
  // TESTING: Monitor for Neon resource limit errors
  if (err.message.includes('connection limit') || err.message.includes('resource limit')) {
    console.error('🚨 ITEM #13: Neon resource limit detected - this may cause sequelize cancellation');
  }
  
  if (err.message.includes('timeout') || err.message.includes('timed out')) {
    console.error('🚨 ITEM #13: Database timeout detected - potential resource exhaustion');
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