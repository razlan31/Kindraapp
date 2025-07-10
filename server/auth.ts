// Removed Passport.js imports - using manual OAuth only
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Configure session store
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week default
  
  // Use PostgreSQL store for persistent sessions
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl / 1000, // Convert to seconds
    tableName: "session",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: false, // Disable rolling to prevent session timing conflicts
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
    // Immediate session destruction settings
    unset: 'destroy',
  });
}

// Configure manual OAuth setup
export async function setupAuth(app: Express) {
  app.use(getSession());
  // Removed Passport.js initialization - using manual OAuth only
  
  console.log("🔥 FORCING MANUAL OAUTH ONLY - NO PASSPORT.JS");
  
  // Clear any existing routes that might conflict
  app._router.stack = app._router.stack.filter((layer: any) => {
    const routePath = layer.route?.path;
    return routePath !== '/api/auth/google' && routePath !== '/api/auth/google/callback';
  });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set in environment');
    throw new Error('Google OAuth credentials not configured');
  }
  
  // Fixed callback URL based on domain detection - always use HTTPS
  const getCallbackURL = () => {
    // Use the actual Replit domain from environment variable
    const replitDomain = process.env.REPLIT_DOMAINS || 'kindra-jagohtrade.replit.app';
    return `https://${replitDomain}/api/auth/google/callback`;
  };

  const callbackURL = getCallbackURL();
  
  console.log('🔍 OAuth Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
    callbackURL,
    clientID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    proxyEnabled: true
  });

  // Removed Passport.js implementation - using manual OAuth only

  // Test endpoint to verify domain routing
  app.get("/api/test", (req, res) => {
    const timestamp = new Date().toISOString();
    const response = {
      timestamp,
      domain: req.headers.host,
      protocol: req.protocol,
      secure: req.secure,
      forwardedProto: req.headers['x-forwarded-proto'],
      serverInstance: "MANUAL_OAUTH_ONLY",
      message: "Server instance confirmed"
    };
    console.log("🔍 TEST ENDPOINT HIT:", JSON.stringify(response, null, 2));
    res.json(response);
  });

  // Auth routes
  app.get("/api/auth/google", (req, res, next) => {
    console.log("🔍 ===== GOOGLE OAUTH FLOW INITIATED =====");
    console.log("🔍 Request hostname:", req.hostname);
    console.log("🔍 Request headers host:", req.headers.host);
    console.log("🔍 Request protocol:", req.protocol);
    console.log("🔍 Request secure:", req.secure);
    console.log("🔍 Request original URL:", req.originalUrl);
    console.log("🔍 Full request URL:", `${req.protocol}://${req.headers.host}${req.originalUrl}`);
    console.log("🔍 X-Forwarded-Proto:", req.headers['x-forwarded-proto']);
    console.log("🔍 X-Forwarded-Host:", req.headers['x-forwarded-host']);
    console.log("🔍 User-Agent:", req.headers['user-agent']);
    console.log("🔍 All request headers:", JSON.stringify(req.headers, null, 2));
    
    // Force HTTPS redirect if the request is HTTP
    if (req.protocol === 'http' && req.headers.host !== 'localhost:5000') {
      const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
      console.log("🔄 Redirecting HTTP to HTTPS:", httpsUrl);
      return res.redirect(301, httpsUrl);
    }
    
    // Manual OAuth URL construction to bypass Passport's protocol detection
    // Always use the production domain from environment - never localhost
    const productionDomain = process.env.REPLIT_DOMAINS || 'kindra-jagohtrade.replit.app';
    const redirectUri = `https://${productionDomain}/api/auth/google/callback`;
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const scope = 'profile email';
    const responseType = 'code';
    const state = 'random_state_' + Math.random();
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${encodeURIComponent(responseType)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${encodeURIComponent(state)}`;
    
    console.log("🔍 Manual OAuth URL:", googleAuthUrl);
    console.log("🔍 Redirect URI being sent:", redirectUri);
    
    // Store state in session for verification
    (req.session as any).oauthState = state;
    
    res.redirect(googleAuthUrl);
  });

  app.get("/api/auth/google/callback", async (req, res, next) => {
    console.log("🔍 ===== GOOGLE OAUTH CALLBACK RECEIVED =====");
    console.log("🔍 Query params:", req.query);
    console.log("🔍 Full URL:", req.url);
    console.log("🔍 Request protocol:", req.protocol);
    console.log("🔍 Request host:", req.headers.host);
    console.log("🔍 Request hostname:", req.hostname);
    console.log("🔍 Full request URL:", `${req.protocol}://${req.headers.host}${req.originalUrl}`);
    console.log("🔍 Callback request headers:", JSON.stringify(req.headers, null, 2));
    
    // Force HTTPS redirect if the request is HTTP
    if (req.protocol === 'http' && req.headers.host !== 'localhost:5000') {
      const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
      console.log("🔄 Redirecting HTTP callback to HTTPS:", httpsUrl);
      return res.redirect(301, httpsUrl);
    }
    
    // Check if there's an error in the callback
    if (req.query.error) {
      console.error("❌ ===== GOOGLE OAUTH ERROR =====");
      console.error("❌ Error code:", req.query.error);
      console.error("❌ Error description:", req.query.error_description);
      console.error("❌ Error URI:", req.query.error_uri);
      console.error("❌ Full error query:", req.query);
      console.error("❌ The redirect URI Google received was likely:", `${req.protocol}://${req.headers.host}/api/auth/google/callback`);
      return res.redirect("/login?error=oauth_error");
    }
    
    const { code, state } = req.query;
    
    // Verify state to prevent CSRF
    if (state !== (req.session as any).oauthState) {
      console.error("❌ Invalid OAuth state");
      return res.redirect("/login?error=invalid_state");
    }
    
    if (!code) {
      console.error("❌ No authorization code received");
      return res.redirect("/login?error=no_code");
    }
    
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `https://${process.env.REPLIT_DOMAINS || 'kindra-jagohtrade.replit.app'}/api/auth/google/callback`,
        }),
      });
      
      const tokens = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error("❌ Token exchange failed:", tokens);
        return res.redirect("/login?error=token_exchange_failed");
      }
      
      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });
      
      const googleUser = await userResponse.json();
      
      if (!userResponse.ok) {
        console.error("❌ User info fetch failed:", googleUser);
        return res.redirect("/login?error=user_info_failed");
      }
      
      // Upsert user in database
      await storage.upsertUser({
        id: googleUser.id,
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        profileImageUrl: googleUser.picture,
      });
      
      const user = await storage.getUser(googleUser.id);
      
      if (!user) {
        console.error("❌ User not found after creation");
        return res.redirect("/login?error=user_creation_failed");
      }
      
      // Set up session
      (req.session as any).userId = user.id;
      console.log("✅ User logged in successfully, session userId set:", user.id);
      
      res.redirect("/"); // Redirect to main app after successful login
      
    } catch (error) {
      console.error("❌ OAuth callback error:", error);
      return res.redirect("/login?error=callback_error");
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    // Clear session data
    delete (req.session as any).userId;
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });

  // POST logout endpoint for frontend
  app.post("/api/logout", (req, res) => {
    console.log("🔍 TRACKING: SERVER logout starting");
    
    // Clear session data
    delete (req.session as any).userId;
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error("🔴 SERVER: Session destruction failed:", err);
        return res.status(500).json({ success: false, message: "Logout failed" });
      } else {
        console.log("🔴 SERVER: Session destroyed successfully");
      }
      
      console.log("🔍 TRACKING: SERVER logout returning success response");
      res.json({ success: true, message: "Logout successful" });
      console.log("🔍 TRACKING: SERVER logout response sent successfully");
    });
  });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  // Check session-based authentication
  if ((req.session as any)?.userId) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};