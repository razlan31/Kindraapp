import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./database-storage";
import MemoryStore from "memorystore";
import path from "path";

const app = express();
app.set('trust proxy', 1); // Trust first proxy for HTTPS detection
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Configure sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'kindra-session-secret-' + Date.now(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Only force HTTPS for OAuth callback URLs to prevent redirect_uri_mismatch
app.use((req, res, next) => {
  // Only redirect OAuth callback URLs to HTTPS, and only if they're not already HTTPS
  if (req.path.startsWith('/api/auth/google/callback') && 
      req.protocol === 'http' && 
      req.headers.host && 
      req.headers.host.includes('replit.dev')) {
    const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
    console.log("🔄 OAuth callback HTTPS redirect:", httpsUrl);
    return res.redirect(301, httpsUrl);
  }
  
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

  // REMOVE DUPLICATE SESSION SETUP - Already configured at top of file

  // Complete OAuth system - Use production domain for proper OAuth callback
  app.get("/api/auth/google", (req, res) => {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    // Always use production domain for OAuth to prevent redirect_uri_mismatch
    const replitDomain = process.env.REPLIT_DOMAINS || 'ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev';
    const REDIRECT_URI = `https://${replitDomain}/api/auth/google/callback`;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=profile email&` +
      `access_type=offline`;

    console.log(`Starting OAuth with redirect URI: ${REDIRECT_URI}`);
    res.redirect(googleAuthUrl);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect("/?error=no_code");
    }

    try {
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
      // Always use production domain for OAuth to prevent redirect_uri_mismatch
      const replitDomain = process.env.REPLIT_DOMAINS || 'ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev';
      const REDIRECT_URI = `https://${replitDomain}/api/auth/google/callback`;

      console.log(`Processing OAuth callback with redirect URI: ${REDIRECT_URI}`);

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code as string,
          grant_type: "authorization_code",
          redirect_uri: REDIRECT_URI,
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        return res.redirect("/?error=token_failed");
      }

      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const userInfo = await userResponse.json();
      
      if (!userResponse.ok) {
        return res.redirect("/?error=user_info_failed");
      }

      const user = await storage.upsertUser({
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name || null,
        lastName: userInfo.family_name || null,
        profileImageUrl: userInfo.picture || null,
      });

      (req.session as any).userId = user.id;
      (req.session as any).authenticated = true;

      console.log(`User authenticated: ${user.email} (ID: ${user.id})`);

      req.session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect("/?error=session_failed");
        }
        console.log('Session saved successfully, redirecting to home');
        res.redirect("/");
      });

    } catch (error) {
      console.error("OAuth error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // Register all other routes

  // Keep essential file serving
  app.get('/kindra-screenshots.tar.gz', (req, res) => {
    const filePath = path.join(import.meta.dirname, '../kindra-screenshots.tar.gz');
    res.download(filePath, 'kindra-screenshots.tar.gz');
  });
  
  app.use('/files', express.static(path.join(import.meta.dirname, '../public')));
  
  // Register API routes
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
