import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./database-storage";
import { setupAuthentication } from "./auth-system-new";
import path from "path";

const app = express();

// Trust proxy for proper cookie handling in production
app.set('trust proxy', 1);

// Remove artificial timeouts - let operations complete naturally

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// TESTING ITEM #10: Express request handler timeout middleware
console.log('🧪 TESTING ITEM #10: Adding request handler timeout middleware to prevent sequelize cancellation...');

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // TESTING ITEM #10: Set specific timeout for each request to prevent sequelize cancellation
  if (path.startsWith("/api")) {
    const requestTimeout = setTimeout(() => {
      console.error(`🚨 ITEM #10: Request timeout detected for ${req.method} ${path} after 2.5 seconds`);
      if (!res.headersSent) {
        res.status(408).json({ error: "Request timeout" });
      }
    }, 2500); // 2.5 second timeout per request (shorter than database timeout)
    
    // Clear timeout when request completes
    res.on("finish", () => {
      clearTimeout(requestTimeout);
    });
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// TESTING ITEM #9: Serialize database operations to prevent concurrent conflicts
console.log('🧪 TESTING ITEM #9: Serializing database operations to prevent concurrent conflicts...');

// Database operation queue to prevent concurrency issues
let databaseOperationQueue: Promise<any> = Promise.resolve();

// Serialize all database operations
const serializeDatabaseOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
  databaseOperationQueue = databaseOperationQueue.then(async () => {
    console.log('🔄 SERIALIZED: Starting database operation...');
    const result = await operation();
    console.log('✅ SERIALIZED: Database operation completed');
    return result;
  }).catch(error => {
    console.error('🚨 SERIALIZED: Database operation failed:', error);
    throw error;
  });
  
  return databaseOperationQueue;
};

// Create a startup lock to prevent race conditions
let startupInProgress = false;

(async () => {
  // Check for startup race conditions
  if (startupInProgress) {
    console.log('🚨 STARTUP: Race condition detected - another initialization is in progress!');
    return;
  }
  startupInProgress = true;
  
  // TESTING ITEM #9: Serialize badge initialization to prevent concurrent conflicts
  try {
    console.log('🔍 STARTUP: Beginning serialized badge initialization...');
    
    // Use serialized badge initialization to prevent concurrent database operations
    await serializeDatabaseOperation(async () => {
      return await storage.initializeBadges();
    });
    console.log('✅ STARTUP: Serialized badge initialization completed successfully');
  } catch (error) {
    console.error('🚨 STARTUP: Serialized badge initialization failed:', error);
    // Continue startup even if badge initialization fails
    console.log('🔄 STARTUP: Continuing startup despite badge initialization failure');
  } finally {
    startupInProgress = false;
  }

  // Setup JSON parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // TESTING ITEM #9: Serialize authentication setup to prevent concurrent database operations
  await serializeDatabaseOperation(async () => {
    setupAuthentication(app);
    return Promise.resolve();
  });

  // TESTING ITEM #9: Serialize route registration to prevent concurrent database operations
  const server = await serializeDatabaseOperation(async () => {
    return await registerRoutes(app);
  });

  // TESTING ITEM #6: Align Express timeouts with database timeouts to prevent mismatch
  server.keepAliveTimeout = 2000; // 2 second keep-alive (shorter than DB timeout)
  server.headersTimeout = 3000; // 3 second headers timeout (must be > keepAliveTimeout)
  server.requestTimeout = 4000; // 4 second request timeout (shorter than DB timeout)
  server.timeout = 4000; // 4 second socket timeout

  console.log('🧪 TESTING ITEM #6: Express timeouts aligned with database timeouts: keepAlive=2s, headers=3s, request=4s, socket=4s');

  // Keep essential file serving
  app.get('/kindra-screenshots.tar.gz', (req, res) => {
    const filePath = path.join(import.meta.dirname, '../kindra-screenshots.tar.gz');
    res.download(filePath, 'kindra-screenshots.tar.gz');
  });
  
  app.use('/files', express.static(path.join(import.meta.dirname, '../public')));

  // Vite development server setup
  console.log("🔍 Environment check - NODE_ENV:", process.env.NODE_ENV);
  if (app.get("env") === "development") { // Re-enabled to test
    console.log("🚀 Setting up Vite for development...");
    await setupVite(app, server);
    console.log("✅ Vite setup completed");
  } else {
    console.log("🏗️ Setting up static serving for production...");
    serveStatic(app);
    
    // Add React Router fallback for production only
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      // Serve index.html for all other routes (React Router handling)
      res.sendFile(path.resolve(import.meta.dirname, '../dist/public/index.html'));
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('API Error:', {
      status,
      message,
      stack: err.stack,
      url: _req.url,
      method: _req.method
    });

    // Ensure response is properly formatted JSON
    if (!res.headersSent) {
      res.status(status).json({ error: true, message });
    }
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Attempting to kill existing processes...`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  // Serve test page in development
  if (process.env.NODE_ENV === 'development') {
    app.get('/test-auth', (req, res) => {
      res.sendFile('test-auth.html', { root: process.cwd() });
    });
  }

  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
