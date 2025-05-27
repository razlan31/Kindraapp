import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  userSchema, connectionSchema, momentSchema,
  userBadgeSchema, menstrualCycleSchema, milestoneSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";

// Extend session types
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  // For development purposes, we'll automatically log in with user ID 1
  // But first check if the user actually exists
  storage.getUser(1).then(user => {
    if (user) {
      req.session.userId = 1;
      console.log("Auth middleware: Setting userId to 1 - user exists");
      next();
    } else {
      console.error("Auth middleware: User ID 1 does not exist!");
      res.status(401).json({ message: "User not found" });
    }
  }).catch(error => {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "kindra-app-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new SessionStore({ checkPeriod: 86400000 }),
    })
  );

  // Auth Routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = userSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      // Set session
      req.session.userId = newUser.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Server error during registration" });
      }
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Get user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Connections Routes
  app.get("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const connections = await storage.getConnectionsByUserId(userId);
      res.status(200).json(connections);
    } catch (error) {
      console.error("Error in get connections:", error);
      res.status(500).json({ message: "Server error fetching connections" });
    }
  });

  app.post("/api/connections", isAuthenticated, async (req, res) => {
    try {
      console.log("Received connection creation request:", req.body);
      const userId = req.session.userId as number;
      console.log("User ID from session:", userId);
      
      // Create connection object with all form data
      const connectionData: any = {
        userId: userId,
        name: req.body.name,
        relationshipStage: req.body.relationshipStage || "Talking",
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        birthday: req.body.birthday ? new Date(req.body.birthday) : null,
        zodiacSign: req.body.zodiacSign || null,
        loveLanguage: req.body.loveLanguage || null,
        profileImage: req.body.profileImage || null,
        isPrivate: req.body.isPrivate || false
      };
      
      console.log("Creating connection with data:", connectionData);
      const newConnection = await storage.createConnection(connectionData);
      console.log("Connection created successfully:", newConnection);
      
      // Log the saved connection to verify all fields are preserved
      const savedConnection = await storage.getConnection(newConnection.id);
      console.log("Verification - saved connection:", savedConnection);
      res.status(201).json(newConnection);
    } catch (error) {
      console.error("Connection creation error:", error);
      res.status(500).json({ message: "Server error creating connection", details: error.message });
    }
  });

  app.get("/api/connections/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const connectionId = parseInt(req.params.id);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to view this connection" });
      }
      
      res.status(200).json(connection);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching connection" });
    }
  });

  // Handle both PUT and PATCH for connection updates
  const updateConnectionHandler = async (req: Request, res: Response) => {
    console.log("=== CONNECTION UPDATE HANDLER CALLED ===");
    console.log("Request body:", req.body);
    console.log("Request params:", req.params);
    console.log("Session data:", req.session);
    
    try {
      const userId = (req.session as any).userId as number;
      const connectionId = parseInt(req.params.id);
      
      console.log("User ID:", userId);
      console.log("Connection ID:", connectionId);
      
      if (!userId) {
        console.log("No user ID in session");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (isNaN(connectionId)) {
        console.log("Invalid connection ID");
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      console.log("Found connection:", connection);
      
      if (!connection) {
        console.log("Connection not found");
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== userId) {
        console.log("Unauthorized access attempt");
        return res.status(403).json({ message: "Unauthorized to update this connection" });
      }
      
      console.log("Updating connection with data:", req.body);
      const updatedConnection = await storage.updateConnection(connectionId, req.body);
      console.log("Updated connection result:", updatedConnection);
      
      if (!updatedConnection) {
        console.log("Update failed");
        return res.status(404).json({ message: "Failed to update connection" });
      }
      
      console.log("=== UPDATE SUCCESSFUL ===");
      res.status(200).json(updatedConnection);
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ message: "Server error updating connection" });
    }
  };

  // Test route to verify API is working
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  // Simple direct update route that bypasses any conflicts
  app.post("/api/connections/:id/update", async (req, res) => {
    try {
      console.log("=== DIRECT UPDATE ROUTE CALLED ===");
      console.log("Connection ID:", req.params.id);
      console.log("Request body:", req.body);
      
      const connectionId = parseInt(req.params.id);
      
      // Get current connection first
      const currentConnection = await storage.getConnection(connectionId);
      console.log("Current connection:", currentConnection);
      
      if (!currentConnection) {
        console.log("Connection not found!");
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Update the connection
      const updatedConnection = await storage.updateConnection(connectionId, req.body);
      console.log("Updated connection:", updatedConnection);
      
      // Verify the update worked
      const verifyConnection = await storage.getConnection(connectionId);
      console.log("Verification - connection after update:", verifyConnection);
      
      res.status(200).json(updatedConnection);
    } catch (error) {
      console.error("Direct update error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Original routes
  app.put("/api/connections/:id", isAuthenticated, updateConnectionHandler);
  app.patch("/api/connections/:id", isAuthenticated, updateConnectionHandler);

  app.delete("/api/connections/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const connectionId = parseInt(req.params.id);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this connection" });
      }
      
      await storage.deleteConnection(connectionId);
      res.status(200).json({ message: "Connection deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error deleting connection" });
    }
  });

  // Moments Routes
  app.get("/api/moments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      console.log(`📋 GET /api/moments - Fetching for user ${userId}`);
      const moments = await storage.getMomentsByUserId(userId, limit);
      console.log(`✅ GET /api/moments - Found ${moments.length} moments`);
      res.status(200).json(moments);
    } catch (error) {
      console.error("❌ GET /api/moments error:", error);
      res.status(500).json({ message: "Server error fetching moments" });
    }
  });

  app.post("/api/moments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const momentData = momentSchema.parse({ ...req.body, userId });
      
      // Check if connection exists and belongs to user
      const connection = await storage.getConnection(momentData.connectionId);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to add moments to this connection" });
      }
      
      const newMoment = await storage.createMoment(momentData);
      
      // Check if any badges should be unlocked
      await checkAndAwardBadges(userId);
      
      res.status(201).json(newMoment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Server error creating moment" });
      }
    }
  });

  // Add reflection to a moment
  app.post("/api/moments/:id/reflection", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const momentId = parseInt(req.params.id);
      const { reflection } = req.body;
      
      if (isNaN(momentId)) {
        return res.status(400).json({ message: "Invalid moment ID" });
      }
      
      if (!reflection || typeof reflection !== 'string') {
        return res.status(400).json({ message: "Reflection text is required" });
      }
      
      const moment = await storage.getMoment(momentId);
      
      if (!moment) {
        return res.status(404).json({ message: "Moment not found" });
      }
      
      if (moment.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this moment" });
      }
      
      const updatedMoment = await storage.updateMoment(momentId, { reflection });
      
      if (!updatedMoment) {
        return res.status(500).json({ message: "Failed to update moment" });
      }
      
      res.json(updatedMoment);
    } catch (error) {
      res.status(500).json({ message: "Server error adding reflection" });
    }
  });

  // Update a moment
  app.patch("/api/moments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const momentId = parseInt(req.params.id);
      
      console.log(`🚀 PATCH START - Moment ${momentId}, Request body:`, req.body);
      
      if (isNaN(momentId)) {
        return res.status(400).json({ message: "Invalid moment ID" });
      }
      
      const moment = await storage.getMoment(momentId);
      console.log(`📖 PATCH - Found moment:`, moment);
      
      if (!moment) {
        return res.status(404).json({ message: "Moment not found" });
      }
      
      if (moment.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this moment" });
      }
      
      // SIMPLIFIED: Just update the fields we care about most
      const updateData: any = {
        ...req.body // Use all fields from request body
      };
      
      console.log(`🎯 PATCH Route - About to call storage.updateMoment(${momentId}) with:`, updateData);
      
      const updatedMoment = await storage.updateMoment(momentId, updateData);
      
      if (!updatedMoment) {
        console.log(`❌ PATCH Route - Failed to update moment ${momentId}`);
        return res.status(500).json({ message: "Failed to update moment" });
      }
      
      console.log(`✅ PATCH Route - Successfully updated moment ${momentId}:`, updatedMoment);
      
      // FORCE IMMEDIATE VERIFICATION - check if the update actually stuck
      const verifyMoment = await storage.getMoment(momentId);
      console.log(`🔍 VERIFICATION - Moment ${momentId} after update:`, verifyMoment);
      
      res.json(updatedMoment);
    } catch (error) {
      console.error("❌ PATCH Route error:", error);
      res.status(500).json({ message: "Server error updating moment" });
    }
  });

  app.get("/api/connections/:id/moments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const connectionId = parseInt(req.params.id);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to view moments for this connection" });
      }
      
      const moments = await storage.getMomentsByConnectionId(connectionId);
      res.status(200).json(moments);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching moments" });
    }
  });

  app.get("/api/moments/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const momentId = parseInt(req.params.id);
      
      if (isNaN(momentId)) {
        return res.status(400).json({ message: "Invalid moment ID" });
      }
      
      const moment = await storage.getMoment(momentId);
      
      if (!moment) {
        return res.status(404).json({ message: "Moment not found" });
      }
      
      if (moment.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to view this moment" });
      }
      
      res.status(200).json(moment);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching moment" });
    }
  });

  app.put("/api/moments/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const momentId = parseInt(req.params.id);
      
      if (isNaN(momentId)) {
        return res.status(400).json({ message: "Invalid moment ID" });
      }
      
      const moment = await storage.getMoment(momentId);
      
      if (!moment) {
        return res.status(404).json({ message: "Moment not found" });
      }
      
      if (moment.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this moment" });
      }
      
      const updatedMoment = await storage.updateMoment(momentId, req.body);
      res.status(200).json(updatedMoment);
    } catch (error) {
      res.status(500).json({ message: "Server error updating moment" });
    }
  });

  app.delete("/api/moments/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const momentId = parseInt(req.params.id);
      
      if (isNaN(momentId)) {
        return res.status(400).json({ message: "Invalid moment ID" });
      }
      
      const moment = await storage.getMoment(momentId);
      
      if (!moment) {
        return res.status(404).json({ message: "Moment not found" });
      }
      
      if (moment.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this moment" });
      }
      
      await storage.deleteMoment(momentId);
      res.status(200).json({ message: "Moment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error deleting moment" });
    }
  });

  // Badges Routes
  app.get("/api/badges", isAuthenticated, async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.status(200).json(badges);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching badges" });
    }
  });

  app.get("/api/user-badges", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const userBadges = await storage.getUserBadges(userId);
      res.status(200).json(userBadges);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching user badges" });
    }
  });

  // Menstrual Cycle Routes
  app.get("/api/menstrual-cycles", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const cycles = await storage.getMenstrualCycles(userId);
      res.status(200).json(cycles);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching menstrual cycles" });
    }
  });

  app.post("/api/menstrual-cycles", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const cycleData = menstrualCycleSchema.parse({ ...req.body, userId });
      
      const newCycle = await storage.createMenstrualCycle(cycleData);
      res.status(201).json(newCycle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Server error creating menstrual cycle" });
      }
    }
  });

  app.put("/api/menstrual-cycles/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const cycleId = parseInt(req.params.id);
      
      if (isNaN(cycleId)) {
        return res.status(400).json({ message: "Invalid cycle ID" });
      }
      
      const cycle = await storage.getMenstrualCycle(cycleId);
      
      if (!cycle) {
        return res.status(404).json({ message: "Menstrual cycle not found" });
      }
      
      if (cycle.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this cycle" });
      }
      
      const updatedCycle = await storage.updateMenstrualCycle(cycleId, req.body);
      res.status(200).json(updatedCycle);
    } catch (error) {
      res.status(500).json({ message: "Server error updating menstrual cycle" });
    }
  });
  
  // Milestone routes
  app.get("/api/milestones", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const connectionId = req.query.connectionId ? parseInt(req.query.connectionId as string) : null;
      
      let milestones;
      if (connectionId) {
        milestones = await storage.getMilestonesByConnectionId(connectionId);
      } else {
        milestones = await storage.getMilestones(userId);
      }
      
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });
  
  app.post("/api/milestones", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const milestoneData = req.body;
      
      const result = milestoneSchema.safeParse({ ...milestoneData, userId });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid milestone data", errors: result.error.format() });
      }
      
      const milestone = await storage.createMilestone(result.data);
      res.status(201).json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });
  
  app.put("/api/milestones/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const milestoneId = parseInt(req.params.id);
      
      if (isNaN(milestoneId)) {
        return res.status(400).json({ message: "Invalid milestone ID" });
      }
      
      // Verify the milestone belongs to this user
      const userMilestones = await storage.getMilestones(userId);
      const targetMilestone = userMilestones.find(m => m.id === milestoneId);
      
      if (!targetMilestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      const updatedMilestone = await storage.updateMilestone(milestoneId, req.body);
      res.json(updatedMilestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });
  
  app.delete("/api/milestones/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const milestoneId = parseInt(req.params.id);
      
      if (isNaN(milestoneId)) {
        return res.status(400).json({ message: "Invalid milestone ID" });
      }
      
      // Verify the milestone belongs to this user
      const userMilestones = await storage.getMilestones(userId);
      const targetMilestone = userMilestones.find(m => m.id === milestoneId);
      
      if (!targetMilestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      await storage.deleteMilestone(milestoneId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete milestone" });
    }
  });

  // Helper function to check and award badges
  async function checkAndAwardBadges(userId: number) {
    try {
      // Get all user moments
      const moments = await storage.getMomentsByUserId(userId);
      
      // Get all user connections
      const connections = await storage.getConnectionsByUserId(userId);
      
      // Get all user badges
      const userBadges = await storage.getUserBadges(userId);
      const earnedBadgeIds = userBadges.map(ub => ub.badgeId);
      
      // Get all available badges
      const allBadges = await storage.getAllBadges();
      
      // Check each badge criteria
      for (const badge of allBadges) {
        // Skip if already earned
        if (earnedBadgeIds.includes(badge.id)) continue;

        const criteria = badge.unlockCriteria as Record<string, any>;
        let isEarned = false;

        // Check different criteria types
        if (criteria.momentsLogged && moments.length >= criteria.momentsLogged) {
          isEarned = true;
        }
        
        if (criteria.positiveCommunication) {
          const positiveCommunicationCount = moments.filter(m => 
            (m.tags?.includes('Positive') || m.tags?.includes('Communication')) &&
            !m.tags?.includes('Conflict')
          ).length;
          
          if (positiveCommunicationCount >= criteria.positiveCommunication) {
            isEarned = true;
          }
        }
        
        if (criteria.greenFlags) {
          const greenFlagCount = moments.filter(m => 
            m.tags?.includes('Green Flag')
          ).length;
          
          if (greenFlagCount >= criteria.greenFlags) {
            isEarned = true;
          }
        }
        
        if (criteria.relationshipTypes) {
          const uniqueRelationshipTypes = new Set(
            connections.map(c => c.relationshipStage)
          );
          
          if (uniqueRelationshipTypes.size >= criteria.relationshipTypes) {
            isEarned = true;
          }
        }
        
        // Award badge if earned
        if (isEarned) {
          await storage.addUserBadge({
            userId,
            badgeId: badge.id
          });
        }
      }
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
