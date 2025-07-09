import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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

// Configure Google OAuth strategy
export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set in environment');
    throw new Error('Google OAuth credentials not configured');
  }
  
  // Fixed callback URL based on domain detection - always use HTTPS
  const getCallbackURL = () => {
    // Always use the production domain for OAuth callbacks
    // This ensures consistent callback URL regardless of how the app is accessed
    return 'https://kindra-jagohtrade.replit.app/api/auth/google/callback';
  };

  const callbackURL = getCallbackURL();
  
  console.log('🔍 OAuth Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
    callbackURL,
    clientID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'
  });

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName;
      const lastName = profile.name?.familyName;
      const profileImageUrl = profile.photos?.[0]?.value;

      // Upsert user in database
      await storage.upsertUser({
        id: googleId,
        email,
        firstName,
        lastName,
        profileImageUrl,
      });

      const user = await storage.getUser(googleId);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log("Deserializing user ID:", id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log("User not found during deserialization:", id);
        return done(null, false);
      }
      console.log("User deserialized successfully:", user.id);
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, false); // Don't fail, just return false for unauthenticated
    }
  });

  // Auth routes
  app.get("/api/auth/google", (req, res, next) => {
    console.log("🔍 Initiating Google OAuth flow");
    console.log("🔍 Request hostname:", req.hostname);
    console.log("🔍 Request headers host:", req.headers.host);
    console.log("🔍 Request protocol:", req.protocol);
    console.log("🔍 Request original URL:", req.originalUrl);
    console.log("🔍 Full request URL:", `${req.protocol}://${req.headers.host}${req.originalUrl}`);
    console.log("🔍 All request headers:", JSON.stringify(req.headers, null, 2));
    
    // Force HTTPS redirect if the request is HTTP
    if (req.protocol === 'http') {
      const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
      console.log("🔄 Redirecting HTTP to HTTPS:", httpsUrl);
      return res.redirect(httpsUrl);
    }
    
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    console.log("🔍 Google OAuth callback received");
    console.log("🔍 Query params:", req.query);
    console.log("🔍 Full URL:", req.url);
    console.log("🔍 Callback request headers:", JSON.stringify(req.headers, null, 2));
    
    // Force HTTPS redirect if the request is HTTP
    if (req.protocol === 'http') {
      const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
      console.log("🔄 Redirecting HTTP callback to HTTPS:", httpsUrl);
      return res.redirect(httpsUrl);
    }
    
    // Check if there's an error in the callback
    if (req.query.error) {
      console.error("❌ OAuth error from Google:", req.query.error);
      console.error("❌ OAuth error description:", req.query.error_description);
      return res.redirect("/login?error=oauth_error");
    }
    
    passport.authenticate("google", { 
      failureRedirect: "/login",
      failureMessage: true 
    }, (err, user, info) => {
      if (err) {
        console.error("❌ OAuth authentication error:", err);
        return res.redirect("/login?error=oauth_error");
      }
      if (!user) {
        console.error("❌ OAuth authentication failed:", info);
        return res.redirect("/login?error=oauth_failed");
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error("❌ Login session error:", err);
          return res.redirect("/login?error=session_error");
        }
        
        // Store user ID in session for custom auth middleware compatibility
        (req.session as any).userId = user.id;
        console.log("✅ User logged in successfully, session userId set:", user.id);
        res.redirect("/"); // Redirect to main app after successful login
      });
    })(req, res, next);
  });

  app.get("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });

  // POST logout endpoint for frontend
  app.post("/api/logout", (req, res) => {
    console.log("🔍 TRACKING: SERVER logout starting");
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ success: false, message: "Logout failed" });
      }
      
      // Clear session
      req.session.destroy((err) => {
        if (err) {
          console.error("🔴 SERVER: Session destruction failed:", err);
        } else {
          console.log("🔴 SERVER: Session destroyed successfully");
        }
      });
      
      console.log("🔍 TRACKING: SERVER logout returning success response");
      res.json({ success: true, message: "Logout successful" });
      console.log("🔍 TRACKING: SERVER logout response sent successfully");
    });
  });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};