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

// Optimized pool configuration with proper timeouts for Neon serverless
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL + "?connect_timeout=30", // 30 second timeout for cold starts
  max: 1, // Single connection to match Neon serverless limits
  min: 0, // No minimum connections
  idleTimeoutMillis: 30000, // 30 second idle timeout
  connectionTimeoutMillis: 30000, // 30 second connection timeout
  statementTimeout: 30000, // 30 second statement timeout
  queryTimeout: 30000, // 30 second query timeout
  allowExitOnIdle: true,
});

export const db = drizzle({ client: pool, schema });

// Enhanced error handling with retry logic
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Handle specific PostgreSQL ProcessInterrupts errors
  if (err.code === '57P01') {
    console.error('PostgreSQL ProcessInterrupts detected - connection terminated by server');
  }
});

// Enhanced connection logging
pool.on('connect', (client) => {
  console.log('Database connected successfully');
  console.log(`Connection details: processID=${client.processID}, backend=${client.connectionParameters?.host}`);
});

// Add connection end logging
pool.on('remove', (client) => {
  console.log('Database connection removed from pool');
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