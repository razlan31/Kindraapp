import type { Express } from "express";
import { storage } from "./storage";

// Simple, direct Google OAuth implementation
export function setupSimpleOAuth(app: Express) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
  const REDIRECT_URI = process.env.NODE_ENV === 'production' 
    ? `https://kindra-jagohtrade.replit.app/api/auth/google/callback`
    : `https://ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev/api/auth/google/callback`;

  // Start OAuth flow
  app.get("/api/auth/google", (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=profile email&` +
      `access_type=offline`;

    console.log("🔍 OAuth URL:", googleAuthUrl);
    res.redirect(googleAuthUrl);
  });

  // Handle OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      console.error("No authorization code received");
      return res.redirect("/login?error=no_code");
    }

    try {
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
        console.error("Token exchange failed:", tokens);
        return res.redirect("/login?error=token_failed");
      }

      // Get user info
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const googleUser = await userResponse.json();
      
      if (!userResponse.ok) {
        console.error("User info failed:", googleUser);
        return res.redirect("/login?error=user_info_failed");
      }

      // Create/update user
      await storage.upsertUser({
        id: googleUser.id,
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        profileImageUrl: googleUser.picture,
      });

      // Set session
      (req.session as any).userId = googleUser.id;
      (req.session as any).authenticated = true;
      
      console.log("✅ User authenticated:", googleUser.email);
      res.redirect("/?auth=success");
      
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/login?error=callback_failed");
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Current user endpoint
  app.get("/api/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
}