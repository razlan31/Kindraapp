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

// Request logging middleware

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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

// Create a startup lock to prevent race conditions
let startupInProgress = false;

(async () => {
  // Check for startup race conditions
  if (startupInProgress) {
    console.log('🚨 STARTUP: Race condition detected - another initialization is in progress!');
    return;
  }
  startupInProgress = true;
  
  // Initialize badges on startup with deferred processing to prevent timeout
  try {
    console.log('🔍 STARTUP: Beginning optimized badge initialization...');
    
    // Use deferred badge initialization to prevent startup blocking
    await storage.initializeBadges();
    console.log('✅ STARTUP: Badge initialization completed successfully');
  } catch (error) {
    console.error('🚨 STARTUP: Badge initialization failed:', error);
    // Continue startup even if badge initialization fails
    console.log('🔄 STARTUP: Continuing startup despite badge initialization failure');
  } finally {
    startupInProgress = false;
  }

  // Setup JSON parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Setup authentication system BEFORE registering routes
  setupAuthentication(app);

  // Register API routes BEFORE Vite middleware
  const server = await registerRoutes(app);

  // Configure Express server timeouts to prevent request cancellation
  server.keepAliveTimeout = 5000; // 5 second keep-alive
  server.headersTimeout = 6000; // 6 second headers timeout (must be > keepAliveTimeout)
  server.requestTimeout = 10000; // 10 second request timeout
  server.timeout = 10000; // 10 second socket timeout

  console.log('🕐 Express server timeouts configured: keepAlive=5s, headers=6s, request=10s, socket=10s');

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
