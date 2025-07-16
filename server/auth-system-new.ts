import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./database-storage";
import MemoryStore from "memorystore";
import cookieParser from "cookie-parser";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    authenticated?: boolean;
  }
}

// Complete authentication system rebuild - APPLYING ROOT CAUSE FIXES #10 & #11
export function setupAuthentication(app: Express) {
  console.log("🔐 Setting up complete authentication system");
  
  // FIXING ROOT CAUSES #10 & #11: Express session middleware cookie parsing
  console.log('🔧 FIXING ROOT CAUSES #10 & #11: Express session middleware cookie parsing...');
  console.log('🔧 Issue: express-session not parsing cookies from requests');
  console.log('🔧 Solution: Ensure proper cookie parsing middleware order');
  
  // Session configuration
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days
  const sessionSecret = process.env.SESSION_SECRET || 'kindra-production-secret';
  
  // Fix #11: Add cookie parser middleware BEFORE session middleware
  // INVESTIGATION #4: Session secret signature mismatch - PRIORITY TEST
  console.log('🔍 INVESTIGATION #4: Testing session secret consistency...');
  console.log('🔍 INVESTIGATION #4: Session secret for cookie-parser:', sessionSecret ? 'PRESENT' : 'MISSING');
  
  app.use(cookieParser(sessionSecret));
  console.log('🔧 Added cookie-parser middleware before session middleware');
  
  // INVESTIGATION #6: Session store backend type mismatch - Test PostgreSQL vs Memory store
  console.log('🔍 INVESTIGATION #6: Testing session store backend type...');
  
  // Try PostgreSQL session store first
  const sessionStore = new (connectPg(session))({
    conString: process.env.DATABASE_URL,
    tableName: 'sessions',
    createTableIfMissing: true,
    ttl: Math.floor(sessionTtl / 1000) // Convert to seconds
  });
  
  console.log('🔍 INVESTIGATION #6: Using PostgreSQL session store for persistence');
  
  // INVESTIGATION #5: Session middleware configuration
  console.log('🔍 INVESTIGATION #5: Testing session middleware configuration...');
  
  // Fix #10: Enhanced session configuration for proper cookie parsing
  // INVESTIGATION #4: Session secret signature mismatch - Verify same secret used
  console.log('🔍 INVESTIGATION #4: Session secret for express-session:', sessionSecret ? 'PRESENT' : 'MISSING');
  console.log('🔍 INVESTIGATION #4: Secrets match:', sessionSecret === sessionSecret ? 'YES' : 'NO');
  
  const enhancedSessionConfig = {
    secret: sessionSecret,
    store: sessionStore,
    resave: false, // Don't save session if unmodified (PostgreSQL store handles this)
    saveUninitialized: false, // Don't create sessions until needed
    rolling: false, // Disable rolling sessions
    cookie: {
      signed: true, // Ensure cookies are signed for proper parsing
      secure: false, // Development mode
      httpOnly: false, // INVESTIGATION #5: Test with httpOnly false to see if frontend can access
      maxAge: sessionTtl,
      sameSite: 'lax' as const,
      path: '/',
      domain: undefined, // No domain restriction for localhost
    },
    name: 'connect.sid',
  };
  
  console.log('🔍 INVESTIGATION #5: Session config test - httpOnly disabled for frontend access');
  
  console.log('🔧 Enhanced session config for proper cookie parsing:', {
    resave: enhancedSessionConfig.resave,
    saveUninitialized: enhancedSessionConfig.saveUninitialized,
    cookieSigned: enhancedSessionConfig.cookie.signed
  });
  
  app.use(session(enhancedSessionConfig));
  
  // Add debugging middleware to verify cookie parsing fix
  app.use((req, res, next) => {
    console.log('🔍 POST-FIX: Session ID:', req.session?.id);
    console.log('🔍 POST-FIX: Cookies parsed:', Object.keys(req.cookies || {}));
    console.log('🔍 POST-FIX: Signed cookies:', Object.keys(req.signedCookies || {}));
    
    // INVESTIGATION #1: Session serialization/deserialization failure
    if (req.session?.id) {
      console.log('🔍 INVESTIGATION #1: Session data check:', {
        sessionId: req.session.id,
        userId: req.session.userId,
        authenticated: req.session.authenticated,
        hasSessionData: !!req.session
      });
    }
    
    // INVESTIGATION #3: Session store save/load timing
    if (req.session?.id && req.headers.cookie) {
      const cookieSessionId = req.headers.cookie.match(/connect\.sid=([^;]+)/)?.[1];
      console.log('🔍 INVESTIGATION #3: Session store timing check:', {
        sessionIdInMemory: req.session.id,
        sessionIdFromCookie: cookieSessionId,
        sessionStoreWorking: req.session.id === req.sessionID,
        sessionDataAvailable: !!req.session.userId
      });
      
      // INVESTIGATION #4: Session ID mismatch detection
      if (cookieSessionId && req.session.id !== cookieSessionId.replace(/^s%3A/, '').split('.')[0]) {
        console.log('🚨 INVESTIGATION #4: SESSION ID MISMATCH DETECTED!');
        console.log('🚨 Memory session ID:', req.session.id);
        console.log('🚨 Cookie session ID:', cookieSessionId);
        console.log('🚨 This causes new session creation instead of reusing existing session');
        
        // INVESTIGATION #4: Test signature validation
        const sessionIdFromCookie = cookieSessionId.replace(/^s%3A/, '').split('.')[0];
        const signatureFromCookie = cookieSessionId.replace(/^s%3A/, '').split('.')[1];
        console.log('🔍 INVESTIGATION #4: Signature analysis:', {
          sessionIdFromCookie,
          signatureFromCookie,
          signaturePresent: !!signatureFromCookie,
          cookieSigningWorking: req.signedCookies['connect.sid'] ? 'YES' : 'NO'
        });
      }
    }
    
    next();
  });

  // OAuth initiation
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!CLIENT_ID) {
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
      
      // Use current request host for OAuth callback
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const REDIRECT_URI = `${protocol}://${host}/api/auth/google/callback`;
      
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
      
      // TESTING ITEM #17: Session Creation Database Conflicts - Monitor session creation timing
      console.log('🧪 TESTING ITEM #17: Starting OAuth user upsert operation...');
      const upsertStart = Date.now();
      
      // TESTING ITEM #18: Concurrent OAuth Callbacks - Add callback protection
      console.log('🧪 TESTING ITEM #18: Protecting against concurrent OAuth callbacks...');
      
      const user = await storage.upsertUser({
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name || null,
        lastName: userInfo.family_name || null,
        profileImageUrl: userInfo.picture || null,
      });
      const upsertTime = Date.now() - upsertStart;
      console.log(`🧪 TESTING ITEM #17: OAuth user upsert completed in ${upsertTime}ms`);
      
      // TESTING ITEM #17: Monitor session creation timing
      console.log('🧪 TESTING ITEM #17: Starting session creation...');
      const sessionStart = Date.now();
      
      // Set session data
      req.session.userId = user.id;
      req.session.authenticated = true;
      
      const sessionTime = Date.now() - sessionStart;
      console.log(`🧪 TESTING ITEM #17: Session creation completed in ${sessionTime}ms`);
      
      console.log(`✅ User authenticated: ${user.email} (ID: ${user.id})`);
      console.log(`🔍 Session data set: userId=${req.session.userId}, authenticated=${req.session.authenticated}`);
      
      // INVESTIGATION #2: OAuth callback session population
      console.log('🔍 INVESTIGATION #2: About to save session with data:', {
        userId: req.session.userId,
        authenticated: req.session.authenticated,
        sessionID: req.sessionID
      });
      
      // Force session save with detailed logging
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          return res.redirect("/?error=session_failed");
        }
        console.log('✅ Session saved successfully');
        console.log(`🔍 Session ID: ${req.sessionID}`);
        console.log(`🔍 Session data after save: ${JSON.stringify(req.session)}`);
        console.log(`🔍 Response headers about to be sent: ${JSON.stringify(res.getHeaders())}`);
        
        // Debug: Check if session cookie is being set in response
        const cookieHeader = res.getHeader('Set-Cookie');
        console.log(`🔍 Set-Cookie header: ${cookieHeader}`);
        
        // INVESTIGATION #2: Verify session data persisted correctly
        console.log('🔍 INVESTIGATION #2: Session save verification:', {
          sessionIdAfterSave: req.sessionID,
          userIdAfterSave: req.session.userId,
          authenticatedAfterSave: req.session.authenticated,
          cookieWillBeSent: !!cookieHeader
        });
        
        // INVESTIGATION #8: Auth context refetch timing - Add delay before redirect
        console.log('🔍 INVESTIGATION #8: Adding delay before redirect to ensure cookie is fully set');
        setTimeout(() => {
          console.log('✅ OAuth success, redirecting to /?auth=success');
          res.redirect("/?auth=success");
        }, 100); // Small delay to ensure cookie is fully processed
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

  // Debug cookies endpoint
  app.get("/api/debug/cookies", (req: Request, res: Response) => {
    res.json({
      cookies: req.headers.cookie,
      sessionId: req.sessionID,
      sessionData: req.session,
      headers: req.headers
    });
  });

  // Auth test page
  app.get("/auth-test", (req: Request, res: Response) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .button {
            background-color: #4285f4;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
        }
        .button:hover {
            background-color: #357ae8;
        }
        .results {
            background-color: white;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
            border: 1px solid #ddd;
        }
        .error {
            color: #d32f2f;
            background-color: #ffebee;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .success {
            color: #2e7d32;
            background-color: #e8f5e9;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        pre {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h1>Authentication Test Page</h1>
    
    <div class="results">
        <h3>Current Status</h3>
        <p><strong>Current cookies:</strong> <span id="current-cookies">Loading...</span></p>
        <p><strong>Session test result:</strong> <span id="session-result">Not tested</span></p>
    </div>
    
    <div>
        <a href="/api/auth/google" class="button">Login with Google OAuth</a>
        <button onclick="testAuth()" class="button">Test Authentication</button>
        <button onclick="checkSession()" class="button">Check Current Session</button>
        <button onclick="testApiCall()" class="button">Test API Call</button>
    </div>
    
    <div id="results" class="results">
        <h3>Test Results</h3>
        <div id="output">No tests run yet.</div>
    </div>

    <script>
        // Update current cookies display
        function updateCookies() {
            document.getElementById('current-cookies').textContent = document.cookie || 'No cookies found';
        }
        
        // Test authentication endpoint
        async function testAuth() {
            try {
                const response = await fetch('/api/auth/test', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById('session-result').innerHTML = '<span class="success">✅ Authentication successful</span>';
                    document.getElementById('output').innerHTML = 
                        '<div class="success">Test Authentication Successful</div>' +
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                } else {
                    document.getElementById('session-result').innerHTML = '<span class="error">❌ Authentication failed</span>';
                    document.getElementById('output').innerHTML = 
                        '<div class="error">Test Authentication Failed</div>' +
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                }
                
                updateCookies();
            } catch (error) {
                document.getElementById('output').innerHTML = '<div class="error">Error: ' + error.message + '</div>';
            }
        }
        
        // Check current session
        async function checkSession() {
            try {
                const response = await fetch('/api/me', {
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById('output').innerHTML = 
                        '<div class="success">✅ Session Valid - User Authenticated</div>' +
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                } else {
                    document.getElementById('output').innerHTML = 
                        '<div class="error">❌ Session Invalid</div>' +
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                }
                
                updateCookies();
            } catch (error) {
                document.getElementById('output').innerHTML = '<div class="error">Error: ' + error.message + '</div>';
            }
        }
        
        // Test API call
        async function testApiCall() {
            try {
                const response = await fetch('/api/connections', {
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById('output').innerHTML = 
                        '<div class="success">✅ API Call Successful</div>' +
                        '<pre>' + JSON.stringify(data.slice(0, 2), null, 2) + '</pre>' +
                        '<p>Total connections: ' + data.length + '</p>';
                } else {
                    document.getElementById('output').innerHTML = 
                        '<div class="error">❌ API Call Failed</div>' +
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                }
                
                updateCookies();
            } catch (error) {
                document.getElementById('output').innerHTML = '<div class="error">Error: ' + error.message + '</div>';
            }
        }
        
        // Initialize
        updateCookies();
        
        // Check for OAuth success in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'success') {
            document.getElementById('output').innerHTML = 
                '<div class="success">✅ OAuth callback completed successfully!</div>' +
                '<p>Now testing session...</p>';
            // Automatically test session after OAuth success
            setTimeout(checkSession, 1000);
        }
        
        // Refresh cookies every 2 seconds
        setInterval(updateCookies, 2000);
    </script>
</body>
</html>
    `);
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

// TESTING ITEM #19: Authentication Middleware Database Conflicts - Monitor for database operation conflicts
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('🧪 TESTING ITEM #19: Authentication middleware called, monitoring for database conflicts...');
  
  try {
    console.log(`🔍 Session check - userId: ${req.session.userId}, sessionID: ${req.sessionID}`);
    console.log(`🔍 Session exists: ${!!req.session}, cookie header: ${req.headers.cookie}`);
    
    // INVESTIGATION #4: Frontend cookie transmission failure
    console.log('🔍 INVESTIGATION #4: Cookie transmission analysis:', {
      hasCookieHeader: !!req.headers.cookie,
      cookieHeaderValue: req.headers.cookie,
      sessionIdFromCookie: req.headers.cookie?.match(/connect\.sid=([^;]+)/)?.[1],
      sessionIdFromSession: req.sessionID,
      cookieTransmissionWorking: !!req.headers.cookie && req.headers.cookie.includes('connect.sid')
    });
    
    if (!req.session.userId) {
      console.log("❌ Authentication failed: No userId in session");
      
      // INVESTIGATION #4: Check if this is cookie transmission failure
      if (!req.headers.cookie || !req.headers.cookie.includes('connect.sid')) {
        console.log("🔍 INVESTIGATION #4: CONFIRMED - Frontend not sending session cookies");
      } else {
        console.log("🔍 INVESTIGATION #4: Cookies transmitted but session data missing");
      }
      
      return res.status(401).json({ message: "Authentication required" });
    }
    
    console.log(`✅ Authentication successful: ${req.session.userId}`);
    console.log('🧪 TESTING ITEM #19: Authentication middleware completed without database conflicts');
    next();
  } catch (error) {
    console.error('🚨 TESTING ITEM #19: Authentication middleware error:', error);
    
    // Check if this is the sequelize cancellation error
    if (error.message.includes('sequelize statement was cancelled')) {
      console.error('🚨 CRITICAL: Found sequelize cancellation in authentication middleware!');
    }
    
    res.status(500).json({ message: "Authentication error" });
  }
}