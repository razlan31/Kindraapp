import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon with better error handling
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

// Add connection retry configuration
neonConfig.fetchConnectionCache = true;
neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduce connections to prevent overload
  min: 1, // Keep minimum connections
  idleTimeoutMillis: 30000, // 30 second idle timeout
  connectionTimeoutMillis: 20000, // 20 second connection timeout
  statementTimeout: 25000, // 25 second statement timeout
  queryTimeout: 25000, // 25 second query timeout
  maxUses: 1000, // Max uses per connection
  allowExitOnIdle: false, // Don't exit on idle
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

// Add connection retry logic
const createConnectionWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      return client;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

export { pool };