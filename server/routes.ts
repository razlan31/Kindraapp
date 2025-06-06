import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  userSchema, connectionSchema, momentSchema,
  userBadgeSchema, menstrualCycleSchema, milestoneSchema, planSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import Stripe from "stripe";
import { aiCoach, type RelationshipContext } from "./ai-relationship-coach";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Helper functions for relationship stage milestones
function getMilestoneTitle(oldStage: string, newStage: string): string {
  const milestones: Record<string, string> = {
    'Potential': 'New Connection',
    'Talking': 'Started Talking',
    'Situationship': 'Became Situationship',
    'It\'s Complicated': 'Relationship Complicated',
    'Dating': 'Started Dating',
    'Spouse': 'Got Married',
    'FWB': 'Friends with Benefits',
    'Ex': 'Relationship Ended',
    'Friend': 'Became Friends',
    'Best Friend': 'Became Best Friends',
    'Siblings': 'Sibling Bond'
  };
  
  return milestones[newStage] || `Changed to ${newStage}`;
}

function getMilestoneEmoji(stage: string): string {
  const emojis: Record<string, string> = {
    'Potential': '👀',
    'Talking': '💬',
    'Situationship': '🤷',
    'It\'s Complicated': '😵‍💫',
    'Dating': '💕',
    'Spouse': '💍',
    'FWB': '🤝',
    'Ex': '💔',
    'Friend': '👫',
    'Best Friend': '💖',
    'Siblings': '👨‍👩‍👧‍👦'
  };
  
  return emojis[stage] || '✨';
}

// Extend session types
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.session.userId) {
    console.log("Auth middleware: User authenticated with ID", req.session.userId);
    next();
  } else {
    console.log("Auth middleware: No user session found");
    res.status(401).json({ message: "Authentication required" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "kindra-app-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production", 
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true
      },
      store: new SessionStore({ checkPeriod: 86400000 }),
    })
  );

  // Plan routes - use non-api route to bypass ALL Vite middleware conflicts  
  // Stats endpoint
  app.get("/api/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionData;
      const userId = session.userId!;

      const connections = await storage.getConnectionsByUserId(userId);
      const moments = await storage.getMomentsByUserId(userId);
      const badges = await storage.getUserBadges(userId);

      res.json({
        totalConnections: connections.length,
        totalMoments: moments.length,
        totalBadges: badges.length
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/plans-data", isAuthenticated, async (req: Request, res: Response) => {
    console.log('🚀 PLANS DATA ROUTE HIT - This should show if route is working');
    try {
      const userId = req.session.userId as number;
      console.log('📋 GET /plans-data - Fetching for user', userId);
      const plans = await storage.getPlans(userId);
      console.log('📋 Plans found:', plans.length);
      console.log('📋 Plans data:', JSON.stringify(plans, null, 2));
      
      // Force JSON response with explicit headers
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      res.status(200).json(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.post("/plans-data", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const planData = { ...req.body, userId };
      console.log('📋 Creating plan for user', userId, 'data:', planData);
      
      const plan = await storage.createPlan(planData);
      console.log('📋 Plan created successfully:', plan);
      res.status(201).json(plan);
    } catch (error) {
      console.error('Error creating plan:', error);
      res.status(500).json({ message: "Failed to create plan" });
    }
  });

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

  app.put("/api/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const updateData = req.body;
      
      // Validate the update data
      const allowedFields = [
        'displayName', 'email', 'zodiacSign', 'loveLanguage', 'profileImage',
        'relationshipGoals', 'currentFocus', 'relationshipStyle', 'personalNotes'
      ];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {} as any);
      
      const updatedUser = await storage.updateUser(userId, filteredData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // PATCH endpoint for profile updates (used by onboarding)
  app.patch("/api/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const updateData = req.body;
      
      console.log("Backend /api/me PATCH - received data:", updateData);
      
      // Validate the update data - includes onboarding fields AND email
      const allowedFields = [
        'displayName', 'email', 'zodiacSign', 'loveLanguage', 'profileImage',
        'relationshipGoals', 'currentFocus', 'relationshipStyle', 'personalNotes'
      ];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {} as any);
      
      console.log("Backend /api/me PATCH - filtered data being saved:", filteredData);
      
      const updatedUser = await storage.updateUser(userId, filteredData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update profile endpoint
  app.patch("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const updateData = req.body;
      
      // Validate the update data - now includes relationship-focused fields
      const allowedFields = [
        'displayName', 'email', 'zodiacSign', 'loveLanguage', 'profileImage',
        'relationshipGoals', 'currentFocus', 'relationshipStyle', 'personalNotes'
      ];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {} as any);
      
      const updatedUser = await storage.updateUser(userId, filteredData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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

  // Get individual connection
  app.get("/api/connections/:id", isAuthenticated, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Verify ownership
      if (connection.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.status(200).json(connection);
    } catch (error) {
      console.error("Error fetching connection:", error);
      res.status(500).json({ message: "Server error" });
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
      
      console.log("Profile image received:", req.body.profileImage ? `${req.body.profileImage.substring(0, 50)}...` : "null");
      
      console.log("Creating connection with data:", connectionData);
      const newConnection = await storage.createConnection(connectionData);
      console.log("Connection created successfully:", newConnection);
      
      // Create initial connection milestone for new connection
      try {
        // First, create the connection start milestone
        const connectionStartData = {
          userId: userId,
          connectionId: newConnection.id,
          emoji: "💫",
          content: `Connected with ${connectionData.name}`,
          title: "Connection Started",
          tags: ['Milestone', 'Connection Start'],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: null,
          isMilestone: true,
          milestoneTitle: "Connection Started",
          createdAt: connectionData.startDate || new Date()
        };
        
        const connectionMilestone = await storage.createMoment(connectionStartData);
        console.log("Created connection start milestone:", connectionMilestone);

        // Then, create the initial relationship stage milestone for any stage (1 second later for proper ordering)
        if (connectionData.relationshipStage) {
          const stageTitle = getMilestoneTitle('', connectionData.relationshipStage);
          const stageEmoji = getMilestoneEmoji(connectionData.relationshipStage);
          const baseTime = connectionData.startDate || new Date();
          
          const stageMilestoneData = {
            userId: userId,
            connectionId: newConnection.id,
            emoji: stageEmoji,
            content: `Relationship started as ${connectionData.relationshipStage}`,
            title: stageTitle,
            tags: ['Milestone', 'Relationship Stage', connectionData.relationshipStage],
            isPrivate: false,
            isIntimate: false,
            intimacyRating: null,
            relatedToMenstrualCycle: false,
            isResolved: false,
            resolvedAt: null,
            resolutionNotes: null,
            reflection: null,
            isMilestone: true,
            milestoneTitle: stageTitle,
            createdAt: new Date(baseTime.getTime() + 1000)
          };
          
          const stageMilestone = await storage.createMoment(stageMilestoneData);
          console.log("Created initial stage milestone:", stageMilestone);
        }

        // Create birthday milestone for current year if birthday exists
        if (connectionData.birthday) {
          const birthdayDate = new Date(connectionData.birthday);
          const currentYear = new Date().getFullYear();
          birthdayDate.setFullYear(currentYear);
          
          const birthdayMilestoneData = {
            userId,
            connectionId: newConnection.id,
            emoji: '🎂',
            content: `${newConnection.name}'s Birthday`,
            title: 'Birthday',
            tags: ['Milestone', 'Birthday'],
            isPrivate: false,
            isIntimate: false,
            intimacyRating: null,
            relatedToMenstrualCycle: false,
            isResolved: false,
            resolvedAt: null,
            resolutionNotes: null,
            reflection: null,
            isMilestone: true,
            milestoneTitle: 'Birthday',
            createdAt: birthdayDate
          };
          
          const birthdayMilestone = await storage.createMoment(birthdayMilestoneData);
          console.log("Created birthday milestone:", birthdayMilestone);
        }
      } catch (milestoneError) {
        console.error("Error creating initial milestones:", milestoneError);
        // Don't fail the connection creation if milestone creation fails
      }
      
      // Check if any badges should be unlocked
      const awardedBadges = await checkAndAwardBadges(userId);
      
      // Log the saved connection to verify all fields are preserved
      const savedConnection = await storage.getConnection(newConnection.id);
      console.log("Verification - saved connection:", savedConnection);
      
      // Return connection with any newly awarded badges
      res.status(201).json({
        ...newConnection,
        badges: awardedBadges
      });
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
      
      // Check if relationship stage has changed to create milestone
      const oldStage = connection.relationshipStage;
      const newStage = req.body.relationshipStage;
      
      console.log("Updating connection with data:", req.body);
      const updatedConnection = await storage.updateConnection(connectionId, req.body);
      console.log("Updated connection result:", updatedConnection);
      
      // Create milestone entry if relationship stage changed
      if (updatedConnection && newStage && oldStage !== newStage) {
        console.log(`Relationship stage changed from ${oldStage} to ${newStage}, creating milestone`);
        
        // Check if this is the first time we're setting up milestones for this connection
        const existingMoments = await storage.getMomentsByConnectionId(connectionId);
        console.log("Existing moments for connection:", existingMoments.map(m => ({ id: m.id, tags: m.tags, content: m.content })));
        
        const hasInitialMilestone = existingMoments.some(moment => 
          moment.tags?.includes('Connection Start')
        );
        console.log("Has initial milestone:", hasInitialMilestone);
        console.log("Connection start date:", updatedConnection.startDate);
        
        // If no initial milestone exists, create missing milestones for this connection
        if (!hasInitialMilestone && updatedConnection.startDate) {
          console.log("Creating missing initial milestones for existing connection");
          try {
            // First, create the connection start milestone
            const connectionStartData = {
              userId: userId,
              connectionId: connectionId,
              emoji: "💫",
              content: `Connected with ${updatedConnection.name}`,
              title: "Connection Started",
              tags: ['Milestone', 'Connection Start'],
              isPrivate: false,
              isIntimate: false,
              intimacyRating: null,
              relatedToMenstrualCycle: false,
              isResolved: false,
              resolvedAt: null,
              resolutionNotes: null,
              reflection: null,
              isMilestone: true,
              milestoneTitle: "Connection Started",
              createdAt: updatedConnection.startDate
            };
            
            const connectionMilestone = await storage.createMoment(connectionStartData);
            console.log("Created missing connection start milestone:", connectionMilestone);

            // Then, create the initial relationship stage milestone for any stage
            if (oldStage) {
              const initialStageTitle = getMilestoneTitle('', oldStage);
              const initialStageEmoji = getMilestoneEmoji(oldStage);
              
              const baseTime = updatedConnection.startDate ? new Date(updatedConnection.startDate) : new Date();
              
              const initialStageMilestoneData = {
                userId: userId,
                connectionId: connectionId,
                emoji: initialStageEmoji,
                content: `Relationship started as ${oldStage}`,
                title: initialStageTitle,
                tags: ['Milestone', 'Relationship Stage', oldStage],
                isPrivate: false,
                isIntimate: false,
                intimacyRating: null,
                relatedToMenstrualCycle: false,
                isResolved: false,
                resolvedAt: null,
                resolutionNotes: null,
                reflection: null,
                isMilestone: true,
                milestoneTitle: initialStageTitle,
                createdAt: new Date(baseTime.getTime() + 1000)
              };
              
              const initialStageMilestone = await storage.createMoment(initialStageMilestoneData);
              console.log("Created missing initial stage milestone:", initialStageMilestone);
            }
          } catch (initialMilestoneError) {
            console.error("Error creating initial milestones:", initialMilestoneError);
          }
        }
        
        // Now create the stage progression milestone with current date
        const milestoneTitle = getMilestoneTitle(oldStage, newStage);
        const milestoneEmoji = getMilestoneEmoji(newStage);
        
        try {
          const milestoneData = {
            userId: userId,
            connectionId: connectionId,
            emoji: milestoneEmoji,
            content: `Relationship stage changed from ${oldStage} to ${newStage}`,
            title: milestoneTitle,
            tags: ['Milestone', 'Relationship Stage', newStage],
            isPrivate: false,
            isIntimate: false,
            intimacyRating: null,
            relatedToMenstrualCycle: false,
            isResolved: false,
            resolvedAt: null,
            resolutionNotes: null,
            reflection: null,
            isMilestone: true,
            milestoneTitle: milestoneTitle,
            createdAt: new Date() // Explicitly set current date for progression milestone
          };
          
          const milestone = await storage.createMoment(milestoneData);
          console.log("Created relationship stage milestone:", milestone);

          // Create anniversary milestone for significant relationship stages
          const anniversaryStages = ['Dating', 'Spouse', 'Friend', 'Best Friend'];
          if (anniversaryStages.includes(newStage)) {
            try {
              const currentDate = new Date();
              const nextYear = new Date(currentDate);
              nextYear.setFullYear(currentDate.getFullYear() + 1);
              
              // Get appropriate emoji and title for each stage
              let emoji, anniversaryType;
              switch (newStage) {
                case 'Spouse':
                  emoji = '💍';
                  anniversaryType = 'Wedding';
                  break;
                case 'Dating':
                  emoji = '💕';
                  anniversaryType = 'Dating';
                  break;
                case 'Best Friend':
                  emoji = '👯';
                  anniversaryType = 'Best Friendship';
                  break;
                case 'Friend':
                  emoji = '🤝';
                  anniversaryType = 'Friendship';
                  break;
                default:
                  emoji = '🎉';
                  anniversaryType = 'Relationship';
              }
              
              const anniversaryData = {
                userId: userId,
                connectionId: connectionId,
                emoji: emoji,
                content: `${anniversaryType} Anniversary with ${updatedConnection.name}`,
                title: `${anniversaryType} Anniversary`,
                tags: ['Milestone', 'Anniversary', newStage],
                isPrivate: false,
                isIntimate: false,
                intimacyRating: null,
                relatedToMenstrualCycle: false,
                isResolved: false,
                resolvedAt: null,
                resolutionNotes: null,
                reflection: null,
                isMilestone: true,
                milestoneTitle: `${anniversaryType} Anniversary`,
                createdAt: nextYear
              };
              
              const anniversaryMilestone = await storage.createMoment(anniversaryData);
              console.log("Created anniversary milestone:", anniversaryMilestone);
            } catch (anniversaryError) {
              console.error("Error creating anniversary milestone:", anniversaryError);
              // Don't fail the update if anniversary creation fails
            }
          }
        } catch (milestoneError) {
          console.error("Error creating relationship stage milestone:", milestoneError);
          // Don't fail the connection update if milestone creation fails
        }
      }
      
      if (!updatedConnection) {
        console.log("Update failed");
        return res.status(404).json({ message: "Failed to update connection" });
      }
      
      // Check if any badges should be unlocked
      const newBadges = await checkAndAwardBadges(userId);
      
      console.log("=== UPDATE SUCCESSFUL ===");
      res.status(200).json({
        ...updatedConnection,
        badges: newBadges
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ message: "Server error updating connection" });
    }
  };

  // Get user badges
  app.get("/api/badges", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      
      // Check for any new badges before returning the list
      await checkAndAwardBadges(userId);
      
      const userBadges = await storage.getUserBadges(userId);
      
      console.log(`🏆 Fetched ${userBadges.length} badges for user ${userId}`);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Server error fetching badges" });
    }
  });

  // Get all available badges
  app.get("/api/badges/all", isAuthenticated, async (req, res) => {
    try {
      const allBadges = await storage.getAllBadges();
      res.json(allBadges);
    } catch (error) {
      console.error("Error fetching all badges:", error);
      res.status(500).json({ message: "Server error fetching all badges" });
    }
  });

  // Manual badge check route for debugging
  app.post("/api/badges/check", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      console.log(`🔍 Manual badge check triggered for user ${userId}`);
      
      const newBadges = await checkAndAwardBadges(userId);
      
      res.json({
        message: `Badge check completed for user ${userId}`,
        newBadges,
        count: newBadges.length
      });
    } catch (error) {
      console.error("Error in manual badge check:", error);
      res.status(500).json({ message: "Error checking badges" });
    }
  });

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
      
      console.log("🚀 ROUTES - POST /api/moments called");
      console.log("🚀 ROUTES - Raw request body:", req.body);
      console.log("🚀 ROUTES - User ID:", userId);
      
      const momentData = momentSchema.parse({ ...req.body, userId });
      console.log("🚀 ROUTES - Parsed moment data:", momentData);
      console.log("🚀 ROUTES - momentData.createdAt:", momentData.createdAt);
      console.log("🚀 ROUTES - Using selected date:", momentData.createdAt);
      
      // Convert createdAt string to Date object for database
      const momentDataWithDate = {
        ...momentData,
        createdAt: momentData.createdAt ? new Date(momentData.createdAt) : new Date(),
        resolvedAt: momentData.resolvedAt ? new Date(momentData.resolvedAt) : null
      };
      
      // Check if connection exists and belongs to user
      const connection = await storage.getConnection(momentData.connectionId);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to add moments to this connection" });
      }
      
      const newMoment = await storage.createMoment(momentDataWithDate);
      console.log("🚀 ROUTES - Created moment result:", newMoment);
      console.log("🚀 ROUTES - Final createdAt:", newMoment.createdAt);
      
      // Check if any badges should be unlocked
      const newBadges = await checkAndAwardBadges(userId);
      
      res.status(201).json({ 
        ...newMoment, 
        newBadges 
      });
    } catch (error) {
      console.error("🚀 ROUTES - Error creating moment:", error);
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
      
      // Check if any badges should be unlocked
      await checkAndAwardBadges(userId);
      
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

  // Settings Routes
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return default settings structure (can be expanded to store in database)
      const defaultSettings = {
        notifications: {
          pushEnabled: true,
          momentReminders: true,
          cycleReminders: true,
          insightAlerts: true,
        },
        privacy: {
          shareAnalytics: true,
        },
        preferences: {
          theme: "system",
          defaultTab: "dashboard",
          autoSave: true,
        }
      };

      res.status(200).json(defaultSettings);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const settingsData = req.body;
      
      // For now, we'll just return success. In a real app, you'd store these in the database
      // You could extend the user table or create a separate settings table
      
      res.status(200).json({ 
        message: "Settings saved successfully",
        settings: settingsData 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error saving settings" });
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
    console.log("🚨 MILESTONE ROUTE HIT - Starting request");
    try {
      const userId = req.session.userId as number;
      const milestoneData = req.body;
      
      console.log("🚨 MILESTONE ROUTE - Original data:", JSON.stringify(milestoneData, null, 2));
      
      // Convert date string to Date object before validation
      if (milestoneData.date && typeof milestoneData.date === 'string') {
        console.log("🚨 MILESTONE ROUTE - Converting date from string to Date object");
        milestoneData.date = new Date(milestoneData.date);
        console.log("🚨 MILESTONE ROUTE - Date after conversion:", milestoneData.date);
      }
      
      console.log("🚨 MILESTONE ROUTE - Data with userId:", JSON.stringify({ ...milestoneData, userId }, null, 2));
      
      const result = milestoneSchema.safeParse({ ...milestoneData, userId });
      
      if (!result.success) {
        console.log("🚨 MILESTONE ROUTE - Validation failed:", JSON.stringify(result.error.format(), null, 2));
        return res.status(400).json({ message: "Invalid milestone data", errors: result.error.format() });
      }
      
      console.log("🚨 MILESTONE ROUTE - Validation successful, creating milestone");
      const milestone = await storage.createMilestone(result.data);
      console.log("🚨 MILESTONE ROUTE - Milestone created:", milestone);
      res.status(201).json(milestone);
    } catch (error) {
      console.log("🚨 MILESTONE ROUTE - Server error:", error);
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
  async function checkAndAwardBadges(userId: number): Promise<Array<{badgeId: number, name: string, icon: string, description: string, category: string}>> {
    try {
      // Get all user data
      const moments = await storage.getMomentsByUserId(userId);
      const connections = await storage.getConnectionsByUserId(userId);
      const userBadges = await storage.getUserBadges(userId);
      const earnedBadgeIds = userBadges.map(ub => ub.badgeId);
      const allBadges = await storage.getAllBadges();
      const newBadges: Array<{badgeId: number, name: string, icon: string, description: string, category: string}> = [];
      
      console.log(`🏆 Badge Check - User ${userId}: ${moments.length} moments, ${connections.length} connections, ${userBadges.length} badges earned`);
      console.log("Available badges:", allBadges.length);
      console.log("First few badges:", allBadges.slice(0, 3).map(b => ({ name: b.name, criteria: b.unlockCriteria })));

      // Process each badge
      for (const badge of allBadges) {
        // For non-repeatable badges, skip if user already has it
        if (!badge.isRepeatable && earnedBadgeIds.includes(badge.id)) continue;
        
        // For repeatable badges, check if they've earned it recently to prevent spam
        // Skip cooldown for connection-based badges (First Contact should be immediate)
        if (badge.isRepeatable && earnedBadgeIds.includes(badge.id)) {
          // No cooldown for connection-based badges
          if (criteria.connectionsAdded || criteria.firstConnection) {
            // Allow immediate re-award for connection badges
          } else {
            const lastEarned = userBadges
              .filter(ub => ub.badgeId === badge.id)
              .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())[0];
            
            if (lastEarned) {
              const cooldownPeriod = badge.name.includes('Weekly') ? 6 * 24 * 60 * 60 * 1000 : // 6 days for weekly badges
                                     badge.name.includes('Monthly') ? 25 * 24 * 60 * 60 * 1000 : // 25 days for monthly badges
                                     24 * 60 * 60 * 1000; // 1 day default
              
              if (new Date(lastEarned.unlockedAt).getTime() > Date.now() - cooldownPeriod) {
                continue; // Still in cooldown period
              }
            }
          }
        }

        const criteria = badge.unlockCriteria as Record<string, any>;
        let isEarned = false;

        // Connection-based badges
        if (criteria.connectionsAdded && connections.length >= criteria.connectionsAdded) {
          // For repeatable connection badges, award each time the criteria is met
          // For non-repeatable ones, only award if user doesn't have it yet
          if (badge.isRepeatable || !earnedBadgeIds.includes(badge.id)) {
            isEarned = true;
          }
        }

        if (criteria.firstConnection && connections.length >= 1) {
          // Only award if it's repeatable or user doesn't have this badge yet
          if (badge.isRepeatable || !earnedBadgeIds.includes(badge.id)) {
            isEarned = true;
          }
        }

        // Stage progression badges
        if (criteria.stageProgression) {
          const hasStage = connections.some(c => c.relationshipStage === criteria.stageProgression);
          if (hasStage) isEarned = true;
        }

        // Moment counting badges
        if (criteria.momentsLogged && moments.length >= criteria.momentsLogged) {
          isEarned = true;
        }

        // Positive moments
        if (criteria.positiveMoments) {
          const positiveCount = moments.filter(m => 
            ['😍', '❤️', '😊', '🥰', '💖', '✨', '🔥', '💕'].includes(m.emoji) ||
            m.tags?.includes('Green Flag')
          ).length;
          if (positiveCount >= criteria.positiveMoments) isEarned = true;
        }

        // Green flags
        if (criteria.greenFlags) {
          const greenFlagCount = moments.filter(m => m.tags?.includes('Green Flag')).length;
          if (greenFlagCount >= criteria.greenFlags) isEarned = true;
        }

        // Red flags - only count if this is a repeatable badge or user doesn't have it yet
        if (criteria.redFlags) {
          const redFlagCount = moments.filter(m => m.tags?.includes('Red Flag')).length;
          if (redFlagCount >= criteria.redFlags) {
            // Only award if it's repeatable or user doesn't have this badge yet
            if (badge.isRepeatable || !earnedBadgeIds.includes(badge.id)) {
              isEarned = true;
            }
          }
        }

        // Conflicts - check for different time periods
        if (criteria.conflicts) {
          const conflictCount = moments.filter(m => m.tags?.includes('Conflict')).length;
          if (conflictCount >= criteria.conflicts) {
            // Only award if it's repeatable or user doesn't have this badge yet
            if (badge.isRepeatable || !earnedBadgeIds.includes(badge.id)) {
              isEarned = true;
            }
          }
        }

        // Conflicts in specific time periods
        if (criteria.conflictsThisMonth) {
          const thisMonth = new Date();
          thisMonth.setDate(1);
          thisMonth.setHours(0, 0, 0, 0);
          
          const conflictsThisMonth = moments.filter(m => 
            m.tags?.includes('Conflict') && 
            m.createdAt && new Date(m.createdAt) >= thisMonth
          ).length;
          if (conflictsThisMonth >= criteria.conflictsThisMonth) isEarned = true;
        }

        if (criteria.conflictsThisWeek) {
          const thisWeek = new Date();
          thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
          thisWeek.setHours(0, 0, 0, 0);
          
          const conflictsThisWeek = moments.filter(m => 
            m.tags?.includes('Conflict') && 
            m.createdAt && new Date(m.createdAt) >= thisWeek
          ).length;
          if (conflictsThisWeek >= criteria.conflictsThisWeek) isEarned = true;
        }

        // Conflicts resolved - check for different criteria
        if (criteria.conflictsResolved) {
          const resolvedCount = moments.filter(m => 
            m.tags?.includes('Conflict') && m.isResolved
          ).length;
          if (resolvedCount >= criteria.conflictsResolved) isEarned = true;
        }

        if (criteria.conflictsResolvedThisMonth) {
          const thisMonth = new Date();
          thisMonth.setDate(1);
          thisMonth.setHours(0, 0, 0, 0);
          
          const resolvedThisMonth = moments.filter(m => 
            m.tags?.includes('Conflict') && 
            m.isResolved && 
            m.resolvedAt && new Date(m.resolvedAt) >= thisMonth
          ).length;
          if (resolvedThisMonth >= criteria.conflictsResolvedThisMonth) isEarned = true;
        }

        // Intimate moments - with time-based criteria
        if (criteria.intimateMoments) {
          const intimateCount = moments.filter(m => 
            m.isIntimate || m.tags?.includes('Intimacy')
          ).length;
          if (intimateCount >= criteria.intimateMoments) {
            // Only award if it's repeatable or user doesn't have this badge yet
            if (badge.isRepeatable || !earnedBadgeIds.includes(badge.id)) {
              isEarned = true;
            }
          }
        }

        if (criteria.intimateMomentsThisWeek) {
          const thisWeek = new Date();
          thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
          thisWeek.setHours(0, 0, 0, 0);
          
          const intimateThisWeek = moments.filter(m => 
            (m.isIntimate || m.tags?.includes('Sex')) &&
            m.createdAt && new Date(m.createdAt) >= thisWeek
          ).length;
          if (intimateThisWeek >= criteria.intimateMomentsThisWeek) isEarned = true;
        }

        if (criteria.intimateMomentsThisMonth) {
          const thisMonth = new Date();
          thisMonth.setDate(1);
          thisMonth.setHours(0, 0, 0, 0);
          
          const intimateThisMonth = moments.filter(m => 
            (m.isIntimate || m.tags?.includes('Sex')) &&
            m.createdAt && new Date(m.createdAt) >= thisMonth
          ).length;
          if (intimateThisMonth >= criteria.intimateMomentsThisMonth) isEarned = true;
        }

        // Communication moments
        if (criteria.communicationMoments) {
          const commCount = moments.filter(m => 
            m.tags?.includes('Communication')
          ).length;
          if (commCount >= criteria.communicationMoments) isEarned = true;
        }

        // Streak days (improved check - exclude milestone moments)
        if (criteria.streakDays) {
          // Only count user-created moments, not system-generated milestones
          const userMoments = moments.filter(m => 
            !m.tags?.includes('Milestone') && 
            !m.tags?.includes('Connection Start') &&
            !m.tags?.includes('Anniversary')
          );
          
          const uniqueDays = new Set(
            userMoments.map(m => m.createdAt ? new Date(m.createdAt).toDateString() : '')
          );
          
          // Only award if they have genuine user activity across multiple days
          if (uniqueDays.size >= criteria.streakDays && userMoments.length >= criteria.streakDays) {
            isEarned = true;
          }
        }

        // Anniversaries
        if (criteria.anniversaries) {
          const anniversaryCount = moments.filter(m => 
            m.tags?.includes('Anniversary')
          ).length;
          if (anniversaryCount >= criteria.anniversaries) isEarned = true;
        }

        // Birthdays tracked
        if (criteria.birthdaysTracked) {
          const birthdayCount = moments.filter(m => 
            m.tags?.includes('Birthday')
          ).length;
          if (birthdayCount >= criteria.birthdaysTracked) isEarned = true;
        }

        // Reflections
        if (criteria.reflections) {
          const reflectionCount = moments.filter(m => 
            m.reflection && m.reflection.trim().length > 0
          ).length;
          if (reflectionCount >= criteria.reflections) isEarned = true;
        }

        // Stage progressions count
        if (criteria.stageProgressions) {
          const progressionCount = moments.filter(m => 
            m.tags?.includes('Relationship Stage')
          ).length;
          if (progressionCount >= criteria.stageProgressions) isEarned = true;
        }

        // Special achievement badges
        if (criteria.balancedLogging) {
          const positiveCount = moments.filter(m => 
            ['😍', '❤️', '😊', '🥰', '💖', '✨', '🔥'].includes(m.emoji)
          ).length;
          const reflectionCount = moments.filter(m => 
            m.reflection && m.reflection.trim().length > 0
          ).length;
          if (positiveCount >= 10 && reflectionCount >= 5) isEarned = true;
        }

        if (criteria.majorStageChange) {
          const hasProgression = moments.some(m => 
            m.tags?.includes('Relationship Stage') && 
            (m.content?.includes('Dating') || m.content?.includes('Spouse'))
          );
          if (hasProgression) isEarned = true;
        }

        if (criteria.dramaFreeStreak) {
          const recentConflicts = moments.filter(m => 
            m.tags?.includes('Conflict') && 
            m.createdAt && new Date(m.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          ).length;
          if (recentConflicts === 0 && moments.length >= 10) isEarned = true;
        }

        // Meta achievement badges
        if (criteria.badgesUnlocked && userBadges.length >= criteria.badgesUnlocked) {
          isEarned = true;
        }

        // Legendary badges
        if (criteria.allStagesExperienced) {
          const uniqueStages = new Set(connections.map(c => c.relationshipStage));
          if (uniqueStages.size >= 5) isEarned = true;
        }

        if (criteria.masterUser) {
          if (moments.length >= 100 && connections.length >= 5 && userBadges.length >= 20) {
            isEarned = true;
          }
        }

        if (criteria.loveLanguageMaster) {
          const uniqueLoveLanguages = new Set(
            connections.filter(c => c.loveLanguage).map(c => c.loveLanguage)
          );
          if (uniqueLoveLanguages.size >= 3) isEarned = true;
        }

        if (criteria.zodiacExpert) {
          const uniqueZodiacSigns = new Set(
            connections.filter(c => c.zodiacSign).map(c => c.zodiacSign)
          );
          if (uniqueZodiacSigns.size >= 6) isEarned = true;
        }

        // Award badge if earned
        if (isEarned) {
          await storage.addUserBadge({
            userId,
            badgeId: badge.id
          });
          console.log(`🎉 NEW BADGE UNLOCKED: ${badge.name} for user ${userId}!`);
          
          // Add to newly earned badges array
          newBadges.push({
            badgeId: badge.id,
            name: badge.name,
            icon: badge.icon,
            description: badge.description,
            category: badge.category
          });
        }
      }
      
      return newBadges;
    } catch (error) {
      console.error("Error checking badges:", error);
      return [];
    }
  }

  // Stripe billing endpoints
  app.get("/api/billing/subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['default_payment_method', 'latest_invoice']
      });

      res.json({ subscription });
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/billing/customer", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.json({ customer: null });
      }

      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      res.json({ customer });
    } catch (error: any) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/billing/create-customer-portal", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/settings`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating customer portal:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/billing/cancel-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ error: "No subscription found" });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({ subscription });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/billing/invoices", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.json({ invoices: [] });
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 10,
      });

      res.json({ invoices: invoices.data });
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Automatic cycle progression function
  async function checkAndCreateAutomaticCycles(userId: number, existingCycles: any[]): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group cycles by connection
    const cyclesByConnection = existingCycles.reduce((acc, cycle) => {
      if (!cycle.connectionId) return acc;
      if (!acc[cycle.connectionId]) acc[cycle.connectionId] = [];
      acc[cycle.connectionId].push(cycle);
      return acc;
    }, {} as Record<number, any[]>);

    let allCycles = [...existingCycles];

    // Process each connection separately
    for (const [connectionId, cycles] of Object.entries(cyclesByConnection)) {
      const connectionIdNum = parseInt(connectionId);
      const sortedCycles = cycles.sort((a: any, b: any) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      // Check if there's an active cycle for this connection
      const activeCycle = sortedCycles.find((cycle: any) => !cycle.endDate);

      if (activeCycle) {
        continue; // Skip to next connection - already has active cycle
      }

      // Check for cycles that ended and need automatic progression for this connection
      const completedCycles = sortedCycles.filter((cycle: any) => cycle.endDate);
      
      if (completedCycles.length === 0) {
        continue; // No completed cycles to base pattern on for this connection
      }

      // Find the most recently ended cycle (sort by end date, not start date)
      const lastCompletedCycle = completedCycles.sort((a: any, b: any) => 
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      )[0];
      const lastEndDate = new Date(lastCompletedCycle.endDate);
      const nextCycleStartDate = new Date(lastEndDate);
      nextCycleStartDate.setDate(nextCycleStartDate.getDate() + 1); // Next day after cycle ends

      // Only create new cycle if the next cycle start date is today or in the past
      if (nextCycleStartDate > today) {
        continue;
      }

      // Calculate cycle patterns from the last cycle
      const lastStartDate = new Date(lastCompletedCycle.startDate);
      const lastPeriodEndDate = lastCompletedCycle.periodEndDate ? 
        new Date(lastCompletedCycle.periodEndDate) : null;
      
      // Calculate cycle length and period length
      const cycleLength = Math.ceil((lastEndDate.getTime() - lastStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const periodLength = lastPeriodEndDate ? 
        Math.ceil((lastPeriodEndDate.getTime() - lastStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 5; // Default to 5 days

      // Calculate new cycle dates
      const newCycleStartDate = new Date(nextCycleStartDate);
      const newPeriodEndDate = new Date(newCycleStartDate);
      newPeriodEndDate.setDate(newPeriodEndDate.getDate() + periodLength - 1);
      
      // Create the new automatic cycle for this connection
      const newCycleData = {
        userId,
        connectionId: connectionIdNum,
        startDate: newCycleStartDate,
        periodEndDate: newPeriodEndDate,
        endDate: undefined,
        notes: `Auto-generated cycle following ${cycleLength}-day pattern`,
        mood: null,
        symptoms: null,
        flowIntensity: null
      };

      console.log(`Creating automatic cycle progression for connection ${connectionIdNum}:`, newCycleData);

      try {
        const newCycle = await storage.createMenstrualCycle(newCycleData);
        console.log("Created automatic cycle:", newCycle);
        allCycles.push(newCycle);
      } catch (error) {
        console.error("Error creating automatic cycle:", error);
      }
    }

    return allCycles;
  }

  // Menstrual cycle endpoints
  app.get("/api/menstrual-cycles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      console.log("Fetching menstrual cycles for userId:", userId);
      let cycles = await storage.getMenstrualCycles(userId);
      console.log("Retrieved cycles:", cycles);
      
      // Check for automatic cycle progression
      cycles = await checkAndCreateAutomaticCycles(userId, cycles);
      
      res.json(cycles);
    } catch (error: any) {
      console.error("Error fetching menstrual cycles:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/menstrual-cycles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { startDate, periodEndDate, endDate, flowIntensity, symptoms, connectionId, mood, notes } = req.body;
      
      console.log("Creating menstrual cycle with data:", {
        userId,
        connectionId: connectionId || null,
        startDate,
        periodEndDate,
        endDate,
        flowIntensity,
        mood,
        symptoms,
        notes
      });
      
      const cycleData = {
        userId,
        connectionId: connectionId || null,
        startDate: new Date(startDate),
        periodEndDate: periodEndDate ? new Date(periodEndDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        flowIntensity: flowIntensity || null,
        mood: mood || null,
        symptoms: symptoms || null,
        notes: notes || null,
      };
      
      console.log("Processed cycle data:", cycleData);
      
      const cycle = await storage.createMenstrualCycle(cycleData);
      
      console.log("Created cycle result:", cycle);
      
      // If the created cycle has an end date, check if we need to create the next active cycle
      if (cycle.endDate) {
        try {
          const allCycles = await storage.getMenstrualCycles(userId);
          const updatedCycles = await checkAndCreateAutomaticCycles(userId, allCycles);
          console.log("Checked for automatic cycle progression after cycle creation");
        } catch (error) {
          console.error("Error checking for automatic cycle progression:", error);
          // Don't fail the request if automatic progression fails
        }
      }
      
      res.json(cycle);
    } catch (error: any) {
      console.error("Error creating menstrual cycle:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/menstrual-cycles/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const cycleId = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.startDate) updates.startDate = new Date(updates.startDate);
      if (updates.periodEndDate) updates.periodEndDate = new Date(updates.periodEndDate);
      if (updates.endDate) updates.endDate = new Date(updates.endDate);
      
      const cycle = await storage.updateMenstrualCycle(cycleId, updates);
      
      if (!cycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      
      // If the updated cycle now has an end date, handle automatic progression
      if (cycle.endDate && updates.endDate) {
        try {
          console.log("Cycle updated with end date, handling automatic progression");
          
          // Get all cycles for this user
          const allCycles = await storage.getMenstrualCycles(userId);
          
          // Find any existing active cycles for this connection that need to be removed
          const connectionId = cycle.connectionId;
          const existingActiveCycles = allCycles.filter((c: any) => 
            c.connectionId === connectionId && 
            !c.endDate && 
            c.id !== cycle.id
          );
          
          // Remove existing active cycles for this connection
          for (const activeCycle of existingActiveCycles) {
            console.log(`Removing existing active cycle ${activeCycle.id} for connection ${connectionId}`);
            // Delete the cycle
            const cycleIndex = allCycles.findIndex((c: any) => c.id === activeCycle.id);
            if (cycleIndex !== -1) {
              allCycles.splice(cycleIndex, 1);
            }
            // Remove from storage
            await storage.deleteMenstrualCycle(activeCycle.id);
          }
          
          // Now trigger automatic progression
          const updatedCycles = await checkAndCreateAutomaticCycles(userId, allCycles);
          console.log("Completed automatic cycle progression after cycle update");
        } catch (error) {
          console.error("Error handling automatic cycle progression:", error);
          // Don't fail the request if automatic progression fails
        }
      }
      
      res.json(cycle);
    } catch (error: any) {
      console.error("Error updating menstrual cycle:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Chat endpoints
  app.post("/api/ai/chat", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Gather user context for AI
      const user = await storage.getUser(userId);
      const connections = await storage.getConnectionsByUserId(userId);
      const recentMoments = await storage.getMomentsByUserId(userId, 30);

      // Calculate connection health scores
      const connectionHealthScores = connections.map(connection => {
        const connectionMoments = recentMoments.filter(m => m.connectionId === connection.id);
        const positiveEmojis = ['😍', '❤️', '😊', '🥰', '💖', '✨', '🔥', '💕'];
        const positiveMoments = connectionMoments.filter(m => 
          positiveEmojis.includes(m.emoji) || m.tags?.includes('Green Flag')
        );
        
        const healthScore = connectionMoments.length > 0 
          ? Math.round((positiveMoments.length / connectionMoments.length) * 100)
          : 50;

        return {
          name: connection.name,
          healthScore,
          totalMoments: connectionMoments.length,
          positivePatterns: positiveMoments.length
        };
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const context: RelationshipContext = {
        user,
        connections,
        recentMoments,
        connectionHealthScores
      };

      // Generate AI response
      const aiResponse = await aiCoach.generateResponse(userId, message, context);

      res.json({ 
        message: aiResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  app.get("/api/ai/conversation", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const conversation = aiCoach.getConversationHistory(userId);
      
      res.json({ conversation });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.delete("/api/ai/conversation", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      aiCoach.clearConversation(userId);
      
      res.json({ message: "Conversation cleared" });
    } catch (error) {
      console.error("Error clearing conversation:", error);
      res.status(500).json({ message: "Failed to clear conversation" });
    }
  });

  // Create a comprehensive connection template with all types of entries
  app.post("/api/create-template-connection", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Create the template connection
      const templateConnection = await storage.createConnection({
        userId,
        name: "Taylor",
        profileImage: null,
        relationshipStage: "Dating",
        startDate: "2024-12-01T00:00:00.000Z",
        birthday: "1996-08-22T00:00:00.000Z",
        zodiacSign: "Virgo",
        loveLanguage: "Acts of Service",
        isPrivate: false
      });

      console.log("Created template connection:", templateConnection);

      // Create comprehensive moments covering all entry types
      const templateMoments = [
        // 1. Connection Start Milestone
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "💫",
          content: "Met at the coffee shop downtown - instant connection!",
          title: "First Meeting",
          tags: ["Milestone", "First Meeting"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "There was something special about the way we talked for hours without noticing time pass.",
          isMilestone: true,
          milestoneTitle: "First Meeting",
          createdAt: "2024-12-01T14:30:00.000Z"
        },

        // 2. Positive Dating Moment
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "😍",
          content: "Amazing first official date at the art museum - we both love contemporary art!",
          title: "First Date Success",
          tags: ["Date", "Art", "Green Flag"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "I love how we can discuss art for hours. Taylor has such insightful perspectives.",
          createdAt: "2024-12-05T19:45:00.000Z"
        },

        // 3. Communication Moment
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "🗣️",
          content: "Had a deep conversation about our future goals and values - we're very aligned!",
          title: "Values Alignment Talk",
          tags: ["Communication", "Deep Talk", "Green Flag"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "It's rare to find someone who shares similar life goals and values. This felt really meaningful.",
          createdAt: "2024-12-10T20:15:00.000Z"
        },

        // 4. Conflict Resolution
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "😔",
          content: "Had our first disagreement about planning styles - I'm spontaneous, Taylor likes structure",
          title: "Planning Style Conflict",
          tags: ["Conflict", "Communication"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: true,
          isResolved: true,
          resolvedAt: "2024-12-12T16:30:00.000Z",
          resolutionNotes: "We talked it through and found a compromise - we'll alternate between planned and spontaneous activities",
          reflection: "Actually handled this really well. Taylor was patient and we found a solution together.",
          createdAt: "2024-12-12T14:20:00.000Z"
        },

        // 5. Intimacy Moment (Emotional)
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "💕",
          content: "Shared vulnerable stories about our families - felt so emotionally connected",
          title: "Emotional Intimacy",
          tags: ["Sex", "Vulnerability", "Connection"],
          isPrivate: true,
          isIntimate: true,
          intimacyRating: "medium",
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "Opening up about family stuff was scary but Taylor was so understanding and supportive.",
          createdAt: "2024-12-15T21:30:00.000Z"
        },

        // 6. Physical Intimacy
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "🔥",
          content: "First time being physically intimate - beautiful and meaningful",
          title: "Physical Intimacy Milestone",
          tags: ["Sex", "Physical", "Milestone"],
          isPrivate: true,
          isIntimate: true,
          intimacyRating: "high",
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "Felt natural and right. Taylor was gentle and considerate. This brought us closer.",
          createdAt: "2024-12-18T23:45:00.000Z"
        },

        // 7. Cycle-Related Moment
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "🤗",
          content: "Taylor brought me comfort food and gave me space when I was feeling emotional during my cycle",
          title: "Cycle Support",
          tags: ["Support", "Cycle", "Green Flag", "Acts of Service"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: true,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "Taylor is so thoughtful about understanding my cycle. Acts of service love language showing through.",
          createdAt: "2024-12-22T16:00:00.000Z"
        },

        // 8. Love Language Moment
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "🏠",
          content: "Taylor surprised me by organizing my cluttered workspace while I was at work",
          title: "Acts of Service Love",
          tags: ["Acts of Service", "Love Language", "Surprise", "Green Flag"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "This is exactly how Taylor shows love - through helpful actions. Feels so seen and cared for.",
          createdAt: "2024-12-25T18:30:00.000Z"
        },

        // 9. Quality Time Moment
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "🌅",
          content: "Watched the sunrise together after staying up all night talking about everything",
          title: "Quality Time Magic",
          tags: ["Quality Time", "Deep Talk", "Connection", "Special Moment"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "These unplanned moments of just being together are my favorite. Time stops when we're talking.",
          createdAt: "2024-12-28T06:15:00.000Z"
        },

        // 10. Growth Moment
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "🌱",
          content: "Taylor encouraged me to apply for that promotion I was nervous about",
          title: "Personal Growth Support",
          tags: ["Growth", "Support", "Encouragement", "Green Flag"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "Taylor believes in me even when I don't believe in myself. This kind of support means everything.",
          createdAt: "2025-01-02T12:00:00.000Z"
        },

        // 11. Special Occasion
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "🎉",
          content: "Celebrated New Year together - perfect kiss at midnight!",
          title: "New Year Together",
          tags: ["Celebration", "Holiday", "Milestone", "Romance"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "Starting the new year with Taylor feels like a good omen. Excited for what's ahead.",
          createdAt: "2025-01-01T00:00:00.000Z"
        },

        // 12. Friendship Integration
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "👥",
          content: "Introduced Taylor to my closest friends - everyone loved them!",
          title: "Friend Group Integration",
          tags: ["Friends", "Social", "Integration", "Milestone"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "My friends' approval means a lot to me. Taylor fit right in and everyone had such a good time.",
          createdAt: "2025-01-05T19:00:00.000Z"
        },

        // 13. Future Planning
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "✈️",
          content: "Planned our first weekend trip together for Valentine's Day",
          title: "Future Plans Together",
          tags: ["Planning", "Travel", "Future", "Romance"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "Making future plans together feels natural and exciting. We both want to explore new places.",
          createdAt: "2025-01-08T14:45:00.000Z"
        },

        // 14. Thoughtful Gesture
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "📚",
          content: "Taylor remembered I mentioned wanting to read more poetry and gifted me a beautiful collection",
          title: "Thoughtful Gift",
          tags: ["Gift", "Thoughtful", "Memory", "Literature", "Green Flag"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "The fact that Taylor remembered this small detail from weeks ago shows how much they listen and care.",
          createdAt: "2025-01-12T17:20:00.000Z"
        },

        // 15. Relationship Milestone
        {
          userId,
          connectionId: templateConnection.id,
          emoji: "💝",
          content: "Officially decided to be exclusive - we're a couple!",
          title: "Becoming Official",
          tags: ["Milestone", "Exclusive", "Commitment", "Relationship Stage"],
          isPrivate: false,
          isIntimate: false,
          intimacyRating: null,
          relatedToMenstrualCycle: false,
          isResolved: false,
          resolvedAt: null,
          resolutionNotes: null,
          reflection: "This feels right and natural. We both want to focus on building something special together.",
          isMilestone: true,
          milestoneTitle: "Becoming Official",
          createdAt: "2025-01-15T20:30:00.000Z"
        }
      ];

      // Create all moments
      const createdMoments = [];
      for (const momentData of templateMoments) {
        try {
          const moment = await storage.createMoment(momentData);
          createdMoments.push(moment);
          console.log(`Created moment: ${moment.title}`);
        } catch (error) {
          console.error(`Error creating moment ${momentData.title}:`, error);
        }
      }

      // Create menstrual cycle data for this connection
      try {
        const cycleData = {
          userId,
          connectionId: templateConnection.id,
          startDate: "2024-12-20T00:00:00.000Z",
          periodEndDate: "2024-12-25T00:00:00.000Z",
          endDate: "2025-01-18T00:00:00.000Z",
          notes: "Regular 29-day cycle - Taylor has been very supportive",
          mood: "positive",
          symptoms: "mild cramping, supported well",
          flowIntensity: "medium"
        };
        
        const cycle = await storage.createMenstrualCycle(cycleData);
        console.log("Created menstrual cycle:", cycle);
      } catch (error) {
        console.error("Error creating cycle:", error);
      }

      res.json({
        connection: templateConnection,
        moments: createdMoments,
        message: "Comprehensive connection template created successfully!"
      });

    } catch (error) {
      console.error("Error creating template connection:", error);
      res.status(500).json({ error: "Failed to create template connection" });
    }
  });

  // Mini insights API endpoint
  app.post("/api/ai/mini-insight", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { context, data } = req.body;

      if (!context || !data) {
        return res.status(400).json({ error: "Context and data are required" });
      }

      const { generateMiniInsight } = await import('./mini-insights');
      const insight = await generateMiniInsight({ context, data });

      res.json({ insight });
    } catch (error: any) {
      console.error("Error generating mini insight:", error);
      res.status(500).json({ error: error.message || "Failed to generate insight" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
