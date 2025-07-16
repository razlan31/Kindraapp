import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./database-storage";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    authenticated?: boolean;
  }
}

// Session configuration
export function setupSession(app: Express) {
  console.log("🔐 Setting up session middleware");
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  // Use PostgreSQL for session storage
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl / 1000, // Convert to seconds
    tableName: "sessions", // Use existing sessions table
    schemaName: "public", // Explicit schema
    errorLog: console.error.bind(console), // Enable error logging
  });
  
  // Test session store connection
  sessionStore.on('connect', () => {
    console.log('🔐 Session store connected to PostgreSQL');
  });
  
  sessionStore.on('error', (err) => {
    console.error('❌ Session store error:', err);
  });
  
  // Test session store manually
  sessionStore.get('test-session-id', (err, session) => {
    if (err) {
      console.error('❌ Session store test failed:', err);
    } else {
      console.log('✅ Session store test passed');
    }
  });
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'kindra-development-secret-fixed',
    store: sessionStore,
    resave: false, // Don't resave unchanged sessions
    saveUninitialized: false, // Don't create sessions until needed
    rolling: false, // Don't extend session on activity to prevent session ID changes
    cookie: {
      secure: false, // Always false for development - HTTPS handled by proxy
      httpOnly: true, // Secure cookies
      maxAge: sessionTtl,
      sameSite: 'lax',
      path: '/',
      domain: undefined, // Let browser set domain automatically
    },
    name: 'connect.sid', // Explicit session name
  }));
}

// OAuth routes
export function setupOAuthRoutes(app: Express) {
  console.log("🔐 Setting up OAuth routes");
  
  // Google OAuth initiation
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    
    if (!CLIENT_ID) {
      console.error("❌ GOOGLE_CLIENT_ID not configured");
      return res.status(500).json({ error: "OAuth not configured" });
    }
    
    // Use current request host for OAuth callback
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const REDIRECT_URI = `${protocol}://${host}/api/auth/google/callback`;
    
    console.log(`🔍 OAuth using current request host: ${host}`);
    console.log(`🔍 OAuth redirect URI: ${REDIRECT_URI}`);
    console.log(`🔍 This ensures cookie domain matches request domain`);
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=profile email&` +
      `access_type=offline`;
    
    console.log(`🚀 OAuth redirect to: ${REDIRECT_URI}`);
    res.redirect(googleAuthUrl);
  });
  
  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code } = req.query;
    
    if (!code) {
      console.error("❌ No authorization code received");
      return res.redirect("/?error=no_code");
    }
    
    try {
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error("❌ Google OAuth credentials not configured");
        return res.redirect("/?error=oauth_config");
      }
      
      // Use current request host for OAuth callback
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const REDIRECT_URI = `${protocol}://${host}/api/auth/google/callback`;
      
      console.log(`🔄 Processing OAuth callback with redirect URI: ${REDIRECT_URI}`);
      
      // Exchange code for tokens
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
        console.error("❌ Token exchange failed:", tokens);
        return res.redirect("/?error=token_failed");
      }
      
      // Get user info from Google
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      
      const userInfo = await userResponse.json();
      
      if (!userResponse.ok) {
        console.error("❌ User info request failed:", userInfo);
        return res.redirect("/?error=user_info_failed");
      }
      
      // Upsert user in database
      const user = await storage.upsertUser({
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name || null,
        lastName: userInfo.family_name || null,
        profileImageUrl: userInfo.picture || null,
      });
      
      // Set session
      req.session.userId = user.id;
      req.session.authenticated = true;
      
      console.log(`✅ User authenticated: ${user.email} (ID: ${user.id})`);
      console.log(`✅ Session before save:`, { userId: req.session.userId, sessionId: req.session.id, authenticated: req.session.authenticated });
      
      // Save session and redirect
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          return res.redirect("/?error=session_failed");
        }
        console.log('✅ Session saved successfully, redirecting to home');
        console.log('✅ Session after save:', { userId: req.session.userId, sessionId: req.session.id });
        console.log('✅ Session cookie will be sent with name:', 'connect.sid');
        
        // Don't manually set cookie - let express-session handle it
        
        res.redirect("/?auth=success");
      });
      
    } catch (error) {
      console.error("❌ OAuth error:", error);
      res.redirect("/?error=auth_failed");
    }
  });
}

// API routes
export function setupApiRoutes(app: Express) {
  console.log("🔐 Setting up API routes");
  


  // Current user endpoint
  app.get("/api/me", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      console.log(`🔍 Session check - userId: ${userId}, sessionID: ${req.session.id}`);
      console.log(`🔍 Session exists: ${!!req.session}, cookie header: ${req.headers.cookie}`);
      console.log(`🔍 Full session data:`, req.session);
      console.log(`🔍 Session authenticated: ${req.session.authenticated}`);
      
      // Check if session exists in database
      if (req.session.id) {
        console.log(`🔍 Checking session ${req.session.id} in database...`);
      }
      
      // Regenerate session if it's new and empty
      if (!req.session.userId && !req.session.authenticated) {
        console.log('🔍 Session has no user data, checking for authentication...');
      }
      
      // Force session to be saved if it doesn't exist
      if (!req.session.id) {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
          } else {
            console.log('Session saved, new ID:', req.session.id);
          }
        });
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        // Clear invalid session
        req.session.userId = undefined;
        req.session.authenticated = false;
        return res.status(401).json({ message: "User not found" });
      }
      
      console.log(`✅ Current user found: ${user.email}`);
      res.json(user);
    } catch (error) {
      console.error("❌ Error fetching current user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    console.log("🚪 Logout request received");
    
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Session destroy error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      res.clearCookie('connect.sid');
      console.log("✅ User logged out successfully");
      res.json({ message: "Logged out successfully" });
    });
  });
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Complete authentication setup
export function setupAuthentication(app: Express) {
  console.log("🔐 Setting up complete authentication system");
  
  setupSession(app);
  setupOAuthRoutes(app);
  setupApiRoutes(app);
  
  console.log("✅ Authentication system setup complete");
}