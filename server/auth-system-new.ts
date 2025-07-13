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

// Complete authentication system rebuild
export function setupAuthentication(app: Express) {
  console.log("🔐 Setting up complete authentication system");
  
  // Session configuration
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl / 1000, // Convert to seconds
    tableName: "sessions",
  });

  // Session middleware with fixed configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'kindra-production-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false, // Only create sessions when data is stored
    rolling: true,
    cookie: {
      secure: false, // Development mode
      httpOnly: true,
      maxAge: sessionTtl,
      sameSite: 'lax' as const,
      path: '/',
    },
    name: 'connect.sid',
  }));

  // OAuth initiation
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!CLIENT_ID) {
      return res.status(500).json({ error: "OAuth not configured" });
    }
    
    // Use production domain for OAuth
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev';
    const REDIRECT_URI = `https://${domain}/api/auth/google/callback`;
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=profile email&` +
      `access_type=offline`;
    
    console.log(`🚀 OAuth redirect to: ${REDIRECT_URI}`);
    res.redirect(googleAuthUrl);
  });

  // OAuth callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect("/?error=no_code");
    }
    
    try {
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.redirect("/?error=oauth_config");
      }
      
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev';
      const REDIRECT_URI = `https://${domain}/api/auth/google/callback`;
      
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
      
      // Get user info
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      
      const userInfo = await userResponse.json();
      
      if (!userResponse.ok) {
        console.error("❌ User info failed:", userInfo);
        return res.redirect("/?error=user_info_failed");
      }
      
      // Create or update user
      const user = await storage.upsertUser({
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name || null,
        lastName: userInfo.family_name || null,
        profileImageUrl: userInfo.picture || null,
      });
      
      // Set session data
      req.session.userId = user.id;
      req.session.authenticated = true;
      
      console.log(`✅ User authenticated: ${user.email} (ID: ${user.id})`);
      console.log(`🔍 Session data set: userId=${req.session.userId}, authenticated=${req.session.authenticated}`);
      
      // Force session save with detailed logging
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          return res.redirect("/?error=session_failed");
        }
        console.log('✅ Session saved successfully');
        console.log(`🔍 Session ID: ${req.sessionID}`);
        console.log(`🔍 Session data after save: ${JSON.stringify(req.session)}`);
        
        // Set proper cookie headers
        res.cookie('connect.sid', req.sessionID, {
          secure: false,
          httpOnly: true,
          maxAge: sessionTtl,
          sameSite: 'lax',
          path: '/',
        });
        
        res.redirect("/");
      });
      
    } catch (error) {
      console.error("❌ OAuth callback error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // Test authentication endpoint (development only)
  app.post("/api/auth/test", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: "Not found" });
    }
    
    try {
      // Create test user
      const testUser = await storage.upsertUser({
        id: "test-user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        profileImageUrl: null,
      });
      
      // Set session data
      req.session.userId = testUser.id;
      req.session.authenticated = true;
      
      console.log(`✅ Test user authenticated: ${testUser.email} (ID: ${testUser.id})`);
      console.log(`🔍 Session data set: userId=${req.session.userId}, authenticated=${req.session.authenticated}`);
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          return res.status(500).json({ error: "Session save failed" });
        }
        console.log('✅ Session saved successfully');
        console.log(`🔍 Session ID: ${req.sessionID}`);
        console.log(`🔍 Session data after save: ${JSON.stringify(req.session)}`);
        res.json({ message: "Test authentication successful", user: testUser });
      });
      
    } catch (error) {
      console.error("❌ Test auth error:", error);
      res.status(500).json({ error: "Test authentication failed" });
    }
  });

  // Current user API
  app.get("/api/me", async (req: Request, res: Response) => {
    try {
      console.log(`🔍 Session check - userId: ${req.session.userId}, sessionID: ${req.sessionID}`);
      console.log(`🔍 Session exists: ${!!req.session}, cookie header: ${req.headers.cookie}`);
      
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        req.session.userId = undefined;
        req.session.authenticated = false;
        return res.status(401).json({ message: "User not found" });
      }
      
      console.log(`✅ Current user: ${user.email}`);
      res.json(user);
    } catch (error) {
      console.error("❌ /api/me error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Logout
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      res.clearCookie('connect.sid');
      console.log("✅ User logged out");
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