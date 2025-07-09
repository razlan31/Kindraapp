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

  // Get the current domain from environment variables
  const currentDomain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev';
  const baseUrl = currentDomain.startsWith('http') ? currentDomain : `https://${currentDomain}`;
  
  console.log('OAuth Configuration:', {
    currentDomain,
    baseUrl,
    callbackURL: `${baseUrl}/api/auth/google/callback`,
    clientID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'
  });
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set in environment');
    throw new Error('Google OAuth credentials not configured');
  }
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${baseUrl}/api/auth/google/callback`
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
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    console.log("🔍 Google OAuth callback received");
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