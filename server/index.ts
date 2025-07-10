import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./database-storage";
import path from "path";

const app = express();
app.set('trust proxy', 1); // Trust first proxy for HTTPS detection
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Force HTTPS for all requests to prevent redirect_uri_mismatch
app.use((req, res, next) => {
  // Check if request is HTTP and not from localhost
  if (req.protocol === 'http' && req.headers.host !== 'localhost:5000') {
    const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
    console.log("🔄 Forcing HTTPS redirect:", httpsUrl);
    return res.redirect(301, httpsUrl);
  }
  
  // Add headers to ensure proper routing for production domain
  console.log("🔍 PRODUCTION ROUTING DEBUG:", {
    host: req.headers.host,
    protocol: req.protocol,
    secure: req.secure,
    forwardedProto: req.headers['x-forwarded-proto'],
    userAgent: req.headers['user-agent'],
    originalUrl: req.originalUrl
  });
  
  next();
});

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

(async () => {
  // Initialize badges on startup
  try {
    await storage.initializeBadges();
  } catch (error) {
    console.error('Failed to initialize badges:', error);
  }

  // Direct download endpoint
  app.get('/kindra-screenshots.tar.gz', (req, res) => {
    const filePath = path.join(import.meta.dirname, '../kindra-screenshots.tar.gz');
    res.download(filePath, 'kindra-screenshots.tar.gz');
  });
  
  // Serve public files for downloads
  app.use('/files', express.static(path.join(import.meta.dirname, '../public')));
  
  // Register API routes first with explicit priority
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log("🔍 Environment check - NODE_ENV:", process.env.NODE_ENV);
  if (app.get("env") === "development") {
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

  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
