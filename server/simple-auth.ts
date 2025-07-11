import type { Express } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";

export function setupSimpleAuth(app: Express) {
  // Session configuration
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'kindra-dev-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));

  console.log("✅ Simple session-based authentication configured");

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // OAuth endpoints
  app.get("/api/auth/google", (req, res) => {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
    const REDIRECT_URI = process.env.NODE_ENV === 'production' 
      ? `https://kindra-jagohtrade.replit.app/api/auth/google/callback`
      : `https://ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev/api/auth/google/callback`;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=profile email&` +
      `access_type=offline`;

    console.log("🔗 Starting OAuth flow with redirect:", REDIRECT_URI);
    res.redirect(googleAuthUrl);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      console.error("❌ No authorization code received");
      return res.redirect("/?error=no_code");
    }

    try {
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
      const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
      const REDIRECT_URI = process.env.NODE_ENV === 'production' 
        ? `https://kindra-jagohtrade.replit.app/api/auth/google/callback`
        : `https://ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev/api/auth/google/callback`;

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
        console.error("❌ User info fetch failed:", userInfo);
        return res.redirect("/?error=user_info_failed");
      }

      // Store user in database
      const user = await storage.upsertUser({
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name || null,
        lastName: userInfo.family_name || null,
        profileImageUrl: userInfo.picture || null,
      });

      console.log("✅ User authenticated:", user.email);

      // Set session
      req.session.userId = user.id;
      req.session.authenticated = true;

      // Save session and redirect
      req.session.save((err: any) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res.redirect("/?error=session_failed");
        }
        console.log("✅ Session saved - redirecting to home");
        res.redirect("/");
      });

    } catch (error) {
      console.error("❌ OAuth callback error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // Essential API endpoints
  app.get("/api/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("❌ Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("❌ Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      console.log("✅ Logout successful");
      res.json({ message: "Logged out successfully" });
    });
  });

  return requireAuth;
}