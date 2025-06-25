import { 
  User, InsertUser, UpsertUser, users,
  Connection, InsertConnection, connections,
  Moment, InsertMoment, moments, 
  Badge, InsertBadge, badges,
  UserBadge, InsertUserBadge, userBadges,
  Notification, InsertNotification, notifications,
  MenstrualCycle, InsertMenstrualCycle, menstrualCycles,
  Milestone, InsertMilestone, milestones,
  Plan, InsertPlan, plans,
  ChatConversation, InsertChatConversation, chatConversations
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId));
    return user;
  }

  // Connection operations with subscription awareness
  async getConnections(userId: string): Promise<Connection[]> {
    return this.getConnectionsByUserId(userId);
  }

  async getMoments(userId: string, limit?: number): Promise<Moment[]> {
    const query = db.select().from(moments).where(eq(moments.userId, userId)).orderBy(desc(moments.createdAt));
    if (limit) {
      return query.limit(limit);
    }
    return query;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const [upsertedUser] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...user,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedUser;
  }

  // Connection operations
  async getConnection(id: number): Promise<Connection | undefined> {
    const [connection] = await db.select().from(connections).where(eq(connections.id, id));
    return connection;
  }

  async getConnectionsByUserId(userId: string): Promise<Connection[]> {
    return db.select().from(connections).where(eq(connections.userId, userId));
  }

  async getAllConnectionsByUserId(userId: string): Promise<Connection[]> {
    return db.select().from(connections).where(eq(connections.userId, userId));
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const [newConnection] = await db.insert(connections).values(connection).returning();
    return newConnection;
  }

  async updateConnection(id: number, data: Partial<Connection>): Promise<Connection | undefined> {
    const [updatedConnection] = await db
      .update(connections)
      .set(data)
      .where(eq(connections.id, id))
      .returning();
    return updatedConnection;
  }

  async deleteConnection(id: number): Promise<boolean> {
    const result = await db.delete(connections).where(eq(connections.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Moment operations
  async getMoment(id: number): Promise<Moment | undefined> {
    const [moment] = await db.select().from(moments).where(eq(moments.id, id));
    return moment;
  }

  async getMomentsByUserId(userId: string, limit?: number): Promise<Moment[]> {
    let query = db.select().from(moments).where(eq(moments.userId, userId)).orderBy(desc(moments.createdAt));
    if (limit) {
      query = query.limit(limit);
    }
    return query;
  }

  async getMomentsByConnectionId(connectionId: number): Promise<Moment[]> {
    return db.select().from(moments).where(eq(moments.connectionId, connectionId)).orderBy(desc(moments.createdAt));
  }

  async createMoment(moment: Omit<InsertMoment, 'createdAt' | 'resolvedAt'> & { createdAt?: Date | string; resolvedAt?: Date | string | null }): Promise<Moment> {
    const [newMoment] = await db.insert(moments).values(moment).returning();
    return newMoment;
  }

  async updateMoment(id: number, data: Partial<Moment>): Promise<Moment | undefined> {
    const [updatedMoment] = await db
      .update(moments)
      .set(data)
      .where(eq(moments.id, id))
      .returning();
    return updatedMoment;
  }

  async deleteMoment(id: number): Promise<boolean> {
    const result = await db.delete(moments).where(eq(moments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Badge operations
  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getAllBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  // User Badge operations
  async getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]> {
    return db
      .select()
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .then(rows => 
        rows.map(row => ({
          ...row.user_badges,
          badge: row.badges!
        }))
      );
  }

  async addUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [newUserBadge] = await db.insert(userBadges).values(userBadge).returning();
    return newUserBadge;
  }

  // Menstrual Cycle operations
  async getMenstrualCycles(userId: number): Promise<MenstrualCycle[]> {
    console.log(`🔍 DB Storage: Fetching cycles for user ${userId}`);
    const cycles = await db.select().from(menstrualCycles).where(eq(menstrualCycles.userId, userId.toString())).orderBy(desc(menstrualCycles.periodStartDate));
    console.log(`✅ DB Storage: Found ${cycles.length} cycles for user ${userId}`);
    return cycles;
  }

  async createMenstrualCycle(cycle: InsertMenstrualCycle): Promise<MenstrualCycle> {
    console.log(`🔧 DB Storage: Creating cycle with data:`, cycle);
    const [newCycle] = await db.insert(menstrualCycles).values(cycle).returning();
    console.log(`✅ DB Storage: Created cycle:`, newCycle);
    return newCycle;
  }

  async updateMenstrualCycle(id: number, data: Partial<MenstrualCycle>): Promise<MenstrualCycle | undefined> {
    console.log(`🔄 DB Storage: Updating cycle ${id} with data:`, data);
    try {
      const result = await db
        .update(menstrualCycles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(menstrualCycles.id, id))
        .returning();
      
      const updatedCycle = result[0];
      console.log(`✅ DB Storage: Updated cycle result:`, updatedCycle);
      
      if (!updatedCycle) {
        console.log(`❌ DB Storage: No cycle found with id ${id} to update`);
        return undefined;
      }
      
      return updatedCycle;
    } catch (error) {
      console.error(`❌ DB Storage: Error updating cycle ${id}:`, error);
      throw error;
    }
  }

  async deleteMenstrualCycle(id: number): Promise<boolean> {
    console.log(`🗑️ Database: Attempting to delete cycle ${id}`);
    
    try {
      // First verify the cycle exists
      const existingCycle = await db.select().from(menstrualCycles).where(eq(menstrualCycles.id, id));
      
      if (existingCycle.length === 0) {
        console.log(`❌ Database: Cycle ${id} not found for deletion`);
        return false;
      }
      
      console.log(`📋 Database: Found cycle ${id} to delete:`, {
        id: existingCycle[0].id,
        userId: existingCycle[0].userId,
        connectionId: existingCycle[0].connectionId,
        periodStartDate: existingCycle[0].periodStartDate
      });
      
      // Perform the deletion
      const result = await db.delete(menstrualCycles).where(eq(menstrualCycles.id, id));
      const deleted = (result.rowCount || 0) > 0;
      
      if (deleted) {
        console.log(`✅ Database: Successfully deleted cycle ${id}, affected rows: ${result.rowCount}`);
        
        // Verify deletion by checking if it still exists
        const verifyDeleted = await db.select().from(menstrualCycles).where(eq(menstrualCycles.id, id));
        if (verifyDeleted.length === 0) {
          console.log(`✅ Database: Verified cycle ${id} no longer exists`);
        } else {
          console.log(`⚠️ Database: Warning - cycle ${id} still exists after deletion attempt`);
          return false;
        }
      } else {
        console.log(`❌ Database: Failed to delete cycle ${id}, no rows affected`);
      }
      
      return deleted;
    } catch (error) {
      console.error(`❌ Database: Error deleting cycle ${id}:`, error);
      throw error;
    }
  }

  // Milestone operations
  async getMilestones(userId: number): Promise<Milestone[]> {
    return db.select().from(milestones).where(eq(milestones.userId, userId)).orderBy(desc(milestones.date));
  }

  async getMilestonesByConnectionId(connectionId: number): Promise<Milestone[]> {
    return db.select().from(milestones).where(eq(milestones.connectionId, connectionId)).orderBy(desc(milestones.date));
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [newMilestone] = await db.insert(milestones).values(milestone).returning();
    return newMilestone;
  }

  async updateMilestone(id: number, data: Partial<Milestone>): Promise<Milestone | undefined> {
    const [updatedMilestone] = await db
      .update(milestones)
      .set(data)
      .where(eq(milestones.id, id))
      .returning();
    return updatedMilestone;
  }

  async deleteMilestone(id: number): Promise<boolean> {
    const result = await db.delete(milestones).where(eq(milestones.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Plan operations
  async getPlans(userId: number): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.userId, userId)).orderBy(desc(plans.scheduledDate));
  }

  async getPlansByConnectionId(connectionId: number): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.connectionId, connectionId)).orderBy(desc(plans.scheduledDate));
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(id: number, data: Partial<Plan>): Promise<Plan | undefined> {
    const [updatedPlan] = await db
      .update(plans)
      .set(data)
      .where(eq(plans.id, id))
      .returning();
    return updatedPlan;
  }

  async deletePlan(id: number): Promise<boolean> {
    const result = await db.delete(plans).where(eq(plans.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Chat conversation operations
  async getChatConversations(userId: number): Promise<ChatConversation[]> {
    return db.select().from(chatConversations).where(eq(chatConversations.userId, userId)).orderBy(desc(chatConversations.updatedAt));
  }

  async getChatConversation(id: number): Promise<ChatConversation | undefined> {
    const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    return conversation;
  }

  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [newConversation] = await db.insert(chatConversations).values(conversation).returning();
    return newConversation;
  }

  async updateChatConversation(id: number, data: Partial<ChatConversation>): Promise<ChatConversation | undefined> {
    const [updatedConversation] = await db
      .update(chatConversations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chatConversations.id, id))
      .returning();
    return updatedConversation;
  }

  async deleteChatConversation(id: number): Promise<boolean> {
    const result = await db.delete(chatConversations).where(eq(chatConversations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Badge operations
  async getAllBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const result = await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        pointsAwarded: userBadges.pointsAwarded,
        unlockedAt: userBadges.unlockedAt,
        badge: badges
      })
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));
    
    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      badgeId: row.badgeId,
      pointsAwarded: row.pointsAwarded || 0,
      unlockedAt: row.unlockedAt,
      badge: row.badge!
    })) as (UserBadge & { badge: Badge })[];
  }

  async awardBadge(userId: string, badgeId: number): Promise<UserBadge> {
    const [newUserBadge] = await db.insert(userBadges).values({
      userId,
      badgeId,
      pointsAwarded: 0,
      unlockedAt: new Date()
    }).returning();
    return newUserBadge;
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Points and badge awarding with notifications
  async addPointsToUser(userId: string, points: number): Promise<User> {
    // Get current user points first
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
    const currentPoints = (currentUser?.points || 0) + points;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        points: currentPoints,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async awardBadgeWithPoints(userId: string, badgeId: number): Promise<{ badge: Badge; userBadge: UserBadge; notification: Notification }> {
    // Get badge details
    const [badge] = await db.select().from(badges).where(eq(badges.id, badgeId));
    if (!badge) throw new Error(`Badge not found: ${badgeId}`);

    const pointsToAward = badge.points || 10;

    // Create user badge entry
    const [userBadge] = await db.insert(userBadges).values({
      userId,
      badgeId,
      pointsAwarded: pointsToAward,
      unlockedAt: new Date()
    }).returning();

    // Add points to user
    await this.addPointsToUser(userId, pointsToAward);

    // Create notification
    const [notification] = await db.insert(notifications).values({
      userId,
      type: 'badge_unlock',
      title: `Badge Unlocked: ${badge.name}`,
      message: `You've earned the "${badge.name}" badge and ${pointsToAward} points! ${badge.description}`,
      badgeId,
      pointsAwarded: pointsToAward,
      isRead: false
    }).returning();

    return { badge, userBadge, notification };
  }

  async initializeBadges(): Promise<void> {
    const existingBadges = await this.getAllBadges();
    if (existingBadges.length > 0) {
      console.log(`🏆 Found ${existingBadges.length} existing badges in database`);
      return;
    }

    console.log('🏆 Initializing badges in database...');
    const defaultBadges = this.getDefaultBadges();
    
    for (const badge of defaultBadges) {
      await db.insert(badges).values({
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        unlockCriteria: badge.unlockCriteria,
        isRepeatable: badge.isRepeatable ?? false
      });
    }
    
    console.log(`🏆 Successfully initialized ${defaultBadges.length} badges in database`);
  }

  private getDefaultBadges() {
    return [
      // === GETTING STARTED BADGES ===
      {
        name: "First Steps",
        description: "Created your first connection. Welcome to your relationship journey, gorgeous!",
        icon: "👋",
        category: "Getting Started",
        unlockCriteria: { firstConnection: true },
        isRepeatable: false,
      },
      {
        name: "Profile Complete",
        description: "Filled out your complete profile. Looking good, hottie!",
        icon: "✅",
        category: "Getting Started",
        unlockCriteria: { profileComplete: true },
        isRepeatable: false,
      },
      {
        name: "First Moment",
        description: "Logged your very first moment. The journey begins, babe!",
        icon: "✨",
        category: "Getting Started",
        unlockCriteria: { firstMoment: true },
        isRepeatable: false,
      },
      {
        name: "Talking Stage Entry",
        description: "Entered the talking stage. Time to see where this goes, angel!",
        icon: "💬",
        category: "Relationship Progress",
        unlockCriteria: { stageProgression: "Talking" },
        isRepeatable: false,
      },

      {
        name: "It's Giving Situationship",
        description: "Entered the complicated zone. We've all been there, babe!",
        icon: "🤷",
        category: "Relationship Progress",
        unlockCriteria: { stageProgression: "Situationship" },
        isRepeatable: false,
      },
      {
        name: "Hard Launch",
        description: "Made it official with Dating status. Time to post those couple pics, gorgeous!",
        icon: "💕",
        category: "Relationship Progress",
        unlockCriteria: { stageProgression: "Dating" },
        isRepeatable: false,
      },
      {
        name: "Put a Ring on It",
        description: "Reached Spouse status. Someone said yes to forever with you, hottie!",
        icon: "💍",
        category: "Relationship Progress",
        unlockCriteria: { stageProgression: "Spouse" },
        isRepeatable: false,
      },
      {
        name: "Besties for Life",
        description: "Upgraded to Best Friend status. Found your person, angel!",
        icon: "👯",
        category: "Relationship Progress",
        unlockCriteria: { stageProgression: "Best Friend" },
        isRepeatable: false,
      },
      {
        name: "Friend Zone Survivor",
        description: "Mastered the art of platonic connections. Friendship goals, bestie!",
        icon: "🤝",
        category: "Relationship Progress",
        unlockCriteria: { stageProgression: "Friend" },
        isRepeatable: false,
      },

      // === ACTIVITY TRACKING BADGES ===
      {
        name: "Chronically Online",
        description: "Logged 10 moments. You're really invested in this digital diary life, hun!",
        icon: "📱",
        category: "Activity",
        unlockCriteria: { momentsLogged: 10 },
        isRepeatable: false,
      },
      {
        name: "Data Wizard",
        description: "Logged 50 moments. You love your analytics era, smart cookie!",
        icon: "📊",
        category: "Activity", 
        unlockCriteria: { momentsLogged: 50 },
        isRepeatable: false,
      },
      {
        name: "No Life Energy",
        description: "Logged 100 moments. Maybe touch some grass? JK, we love the dedication, babe!",
        icon: "💻",
        category: "Activity",
        unlockCriteria: { momentsLogged: 100 },
        isRepeatable: false,
      },

      // === POSITIVITY BADGES ===
      {
        name: "Good Vibes Only",
        description: "Logged 10 positive moments. Main character energy activated, gorgeous!",
        icon: "✨",
        category: "Positivity",
        unlockCriteria: { positiveMoments: 10 },
        isRepeatable: false,
      },
      {
        name: "Living My Best Life",
        description: "20 positive moments logged. You're absolutely glowing, sexy!",
        icon: "🌟",
        category: "Positivity",
        unlockCriteria: { positiveMoments: 20 },
        isRepeatable: false,
      },
      {
        name: "Serotonin Queen",
        description: "50 positive moments! You're literally radiating happiness, hottie!",
        icon: "👑",
        category: "Positivity",
        unlockCriteria: { positiveMoments: 50 },
        isRepeatable: false,
      },

      // === GREEN FLAG COLLECTOR BADGES ===
      {
        name: "Green Flag Collector",
        description: "Spotted 5 green flags. Your standards are immaculate, gorgeous!",
        icon: "🟢",
        category: "Healthy Relationships",
        unlockCriteria: { greenFlags: 5 },
        isRepeatable: false,
      },
      {
        name: "Healthy Habits Era",
        description: "15 green flags collected. You know your worth, queen!",
        icon: "💚",
        category: "Healthy Relationships",
        unlockCriteria: { greenFlags: 15 },
        isRepeatable: false,
      },
      {
        name: "Standards Master",
        description: "25 green flags! You're the blueprint for healthy relationships, legend!",
        icon: "🎯",
        category: "Healthy Relationships", 
        unlockCriteria: { greenFlags: 25 },
        isRepeatable: false,
      },

      // === RED FLAG AWARENESS BADGES ===
      {
        name: "Red Flag Radar",
        description: "Identified your first red flag. Trust your gut, beautiful!",
        icon: "🚩",
        category: "Self Protection",
        unlockCriteria: { redFlags: 1 },
        isRepeatable: false,
      },
      {
        name: "Pattern Recognition Pro",
        description: "Spotted 5 red flags total. Your intuition is chef's kiss, hottie!",
        icon: "🎯",
        category: "Self Protection",
        unlockCriteria: { redFlags: 5 },
        isRepeatable: false,
      },

      // === SOCIAL LIFE BADGES ===
      {
        name: "Social Butterfly",
        description: "Added 3 connections. Your social circle is expanding, beautiful!",
        icon: "🦋",
        category: "Social Life",
        unlockCriteria: { connectionsAdded: 3 },
        isRepeatable: false,
      },
      {
        name: "People Person",
        description: "Managing 5 connections. You're everyone's favorite, babe!",
        icon: "🌈",
        category: "Social Life",
        unlockCriteria: { connectionsAdded: 5 },
        isRepeatable: false,
      },
      {
        name: "Main Character Energy",
        description: "10 connections tracked. You're living in a rom-com, gorgeous!",
        icon: "💫",
        category: "Social Life",
        unlockCriteria: { connectionsAdded: 10 },
        isRepeatable: false,
      },

      // === CONSISTENCY BADGES ===
      {
        name: "Daily Check-in Pro",
        description: "Logged moments for 3 days straight. Building habits like a boss!",
        icon: "📅",
        category: "Consistency",
        unlockCriteria: { streakDays: 3 },
        isRepeatable: false,
      },
      {
        name: "Habit Stacking Pro",
        description: "7-day logging streak. You're in your routine era, hottie!",
        icon: "⚡",
        category: "Consistency",
        unlockCriteria: { streakDays: 7 },
        isRepeatable: false,
      },
      {
        name: "Streak Master",
        description: "30-day streak! You're literally unstoppable, legend!",
        icon: "🔥",
        category: "Consistency",
        unlockCriteria: { streakDays: 30 },
        isRepeatable: false,
      },

      // === COMMUNICATION BADGES ===
      {
        name: "Chatty Babe",
        description: "Logged 10 communication moments. You love a good convo, angel!",
        icon: "💬",
        category: "Communication",
        unlockCriteria: { communicationMoments: 10 },
        isRepeatable: false,
      },
      {
        name: "Emotional Intelligence Era",
        description: "25 communication moments. You're the therapy friend, sexy!",
        icon: "🧠",
        category: "Communication",
        unlockCriteria: { communicationMoments: 25 },
        isRepeatable: false,
      },

      // === MILESTONE BADGES ===
      {
        name: "Anniversary Keeper",
        description: "Reached your first relationship anniversary. Time flies when you're happy, angel!",
        icon: "🎉",
        category: "Milestones",
        unlockCriteria: { anniversaries: 1 },
        isRepeatable: false,
      },
      {
        name: "Birthday Babe",
        description: "Never forgot a birthday. You're the friend everyone needs, gorgeous!",
        icon: "🎂",
        category: "Milestones",
        unlockCriteria: { birthdaysTracked: 3 },
        isRepeatable: false,
      },

      // === PERSONAL GROWTH BADGES ===
      {
        name: "Self-Reflection Era",
        description: "Added your first reflection. Growth mindset activated, beautiful!",
        icon: "🪞",
        category: "Personal Growth",
        unlockCriteria: { reflections: 1 },
        isRepeatable: false,
      },
      {
        name: "Therapy Babe",
        description: "10 reflections written. You're doing the inner work, gorgeous!",
        icon: "✍️",
        category: "Personal Growth",
        unlockCriteria: { reflections: 10 },
        isRepeatable: false,
      },

      // === ACHIEVEMENT BADGES ===
      {
        name: "Glow Up Documented",
        description: "Progressed through 3 different relationship stages. Character development, babe!",
        icon: "✨",
        category: "Achievement",
        unlockCriteria: { stageProgressions: 3 },
        isRepeatable: false,
      },
      {
        name: "That Girl Energy",
        description: "Perfect balance of positive and growth moments. You're iconic, gorgeous!",
        icon: "💅",
        category: "Achievement",
        unlockCriteria: { balancedLogging: true },
        isRepeatable: false,
      },

      // === MORE ACTIVITY BADGES ===
      {
        name: "Memoir Material",
        description: "200 moments logged. You could literally write a relationship memoir, darling!",
        icon: "📝",
        category: "Activity",
        unlockCriteria: { momentsLogged: 200 },
        isRepeatable: false,
      },
      {
        name: "Netflix Series Star",
        description: "500+ moments! Your life is basically a Netflix series at this point, star!",
        icon: "📚",
        category: "Activity",
        unlockCriteria: { momentsLogged: 500 },
        isRepeatable: false,
      },

      // === MORE POSITIVITY BADGES ===
      {
        name: "Sunshine Distributor",
        description: "100+ positive moments. You're basically sunshine in human form, babe!",
        icon: "☀️",
        category: "Positivity",
        unlockCriteria: { positiveMoments: 100 },
        isRepeatable: false,
      },
      {
        name: "Happiness CEO",
        description: "200+ positive moments. Teaching masterclasses in living your best life, angel!",
        icon: "🎊",
        category: "Positivity",
        unlockCriteria: { positiveMoments: 200 },
        isRepeatable: false,
      },

      // === MORE GREEN FLAG BADGES ===
      {
        name: "Standards Icon",
        description: "50+ green flags. You wrote the manual on what healthy looks like, babe!",
        icon: "📖",
        category: "Healthy Relationships",
        unlockCriteria: { greenFlags: 50 },
        isRepeatable: false,
      },
      {
        name: "Green Flag Whisperer",
        description: "100+ green flags spotted. You see healthy patterns before they even happen, sexy!",
        icon: "🔮",
        category: "Healthy Relationships",
        unlockCriteria: { greenFlags: 100 },
        isRepeatable: false,
      },

      // === RED FLAG AWARENESS BADGES ===
      {
        name: "Red Flag Radar",
        description: "10+ red flags identified. You're basically a walking lie detector, babe!",
        icon: "🕵️",
        category: "Self Protection",
        unlockCriteria: { redFlags: 10 },
        isRepeatable: false,
      },
      {
        name: "Protect Your Peace",
        description: "20+ red flags caught. You guard your energy like Fort Knox, queen!",
        icon: "🛡️",
        category: "Self Protection",
        unlockCriteria: { redFlags: 20 },
        isRepeatable: false,
      },

      // === CONFLICT RESOLUTION BADGES ===
      {
        name: "Reality Check Recorder",
        description: "Logged your first conflict. Growth starts with awareness, gorgeous!",
        icon: "📝",
        category: "Conflict Resolution",
        unlockCriteria: { conflicts: 1 },
        isRepeatable: false,
      },
      {
        name: "Drama This Week",
        description: "5 conflicts in one week. Maybe it's time for some self-reflection, babe?",
        icon: "🌪️",
        category: "Conflict Resolution",
        unlockCriteria: { conflictsThisWeek: 5 },
        isRepeatable: true,
      },
      {
        name: "Monthly Drama Queen",
        description: "10 conflicts this month. You're living in a soap opera, hottie!",
        icon: "👑",
        category: "Conflict Resolution",
        unlockCriteria: { conflictsThisMonth: 10 },
        isRepeatable: true,
      },
      {
        name: "Peace Maker",
        description: "Resolved your first conflict. Communication is your superpower, angel!",
        icon: "🕊️",
        category: "Conflict Resolution",
        unlockCriteria: { conflictsResolved: 1 },
        isRepeatable: false,
      },
      {
        name: "Harmony Hero",
        description: "Resolved 5 conflicts this month. You're the therapy friend, sexy!",
        icon: "🌈",
        category: "Conflict Resolution",
        unlockCriteria: { conflictsResolvedThisMonth: 5 },
        isRepeatable: true,
      },
      {
        name: "Diplomat Level",
        description: "Resolved 10+ conflicts total. UN should hire you honestly, gorgeous!",
        icon: "🤝",
        category: "Conflict Resolution",
        unlockCriteria: { conflictsResolved: 10 },
        isRepeatable: false,
      },

      // === INTIMACY BADGES ===
      {
        name: "Spicy Content",
        description: "Logged your first intimate moment. We're not judging, hot stuff!",
        icon: "🌶️",
        category: "Intimacy",
        unlockCriteria: { intimateMoments: 1 },
        isRepeatable: false,
      },
      {
        name: "Weekly Heat Wave",
        description: "3 intimate moments this week. Someone's having fun, sexy!",
        icon: "🔥",
        category: "Intimacy",
        unlockCriteria: { intimateMomentsThisWeek: 3 },
        isRepeatable: true,
      },
      {
        name: "Monthly Romance",
        description: "10 intimate moments this month. Living your best life, babe!",
        icon: "💫",
        category: "Intimacy",
        unlockCriteria: { intimateMomentsThisMonth: 10 },
        isRepeatable: true,
      },
      {
        name: "Connection Connoisseur",
        description: "25+ intimate moments documented. You understand the full spectrum, hottie!",
        icon: "💝",
        category: "Intimacy",
        unlockCriteria: { intimateMoments: 25 },
        isRepeatable: false,
      },
      {
        name: "Passion Professional",
        description: "50+ intimate moments. You're a certified expert in connection, gorgeous!",
        icon: "🔥",
        category: "Intimacy",
        unlockCriteria: { intimateMoments: 50 },
        isRepeatable: false,
      },

      // === MORE COMMUNICATION BADGES ===
      {
        name: "Talk Show Host",
        description: "50+ communication moments. You could host a talk show, gorgeous!",
        icon: "🎙️",
        category: "Communication",
        unlockCriteria: { communicationMoments: 50 },
        isRepeatable: false,
      },
      {
        name: "Communication Queen",
        description: "100+ communication moments. You speak fluent human connection, babe!",
        icon: "🪄",
        category: "Communication",
        unlockCriteria: { communicationMoments: 100 },
        isRepeatable: false,
      },

      // === MORE CONSISTENCY BADGES ===
      {
        name: "Dedication Diva",
        description: "60-day streak. You're committed to the self-improvement journey, angel!",
        icon: "🚂",
        category: "Consistency",
        unlockCriteria: { streakDays: 60 },
        isRepeatable: false,
      },
      {
        name: "Legend Status",
        description: "100-day streak! You're in the Kindra hall of fame, goddess!",
        icon: "🏆",
        category: "Consistency",
        unlockCriteria: { streakDays: 100 },
        isRepeatable: false,
      },

      // === MORE SOCIAL LIFE BADGES ===
      {
        name: "Social Network CEO",
        description: "15+ connections managed. You're basically running a relationship empire, hottie!",
        icon: "📈",
        category: "Social Life",
        unlockCriteria: { connectionsAdded: 15 },
        isRepeatable: false,
      },
      {
        name: "Contact Queen",
        description: "20+ connections! Your contact list is giving LinkedIn vibes, sexy!",
        icon: "📇",
        category: "Social Life",
        unlockCriteria: { connectionsAdded: 20 },
        isRepeatable: false,
      },

      // === MORE MILESTONE BADGES ===
      {
        name: "Memory Bank",
        description: "Documented 5+ special occasions. You're the keeper of all the moments, babe!",
        icon: "📸",
        category: "Milestones",
        unlockCriteria: { specialMoments: 5 },
        isRepeatable: false,
      },
      {
        name: "Party Planner",
        description: "10+ milestones tracked. Every moment is worth celebrating with you, hottie!",
        icon: "🎊",
        category: "Milestones",
        unlockCriteria: { specialMoments: 10 },
        isRepeatable: false,
      },

      // === MORE PERSONAL GROWTH BADGES ===
      {
        name: "Enlightened Angel",
        description: "25+ reflections! You're practically a life coach now, sexy!",
        icon: "🧘",
        category: "Personal Growth",
        unlockCriteria: { reflections: 25 },
        isRepeatable: false,
      },
      {
        name: "Wisdom Warrior",
        description: "50+ reflections. You've unlocked the secrets of self-awareness, hottie!",
        icon: "⚔️",
        category: "Personal Growth",
        unlockCriteria: { reflections: 50 },
        isRepeatable: false,
      },
      {
        name: "Guru Status",
        description: "100+ reflections. People should be paying you for this wisdom, goddess!",
        icon: "🙏",
        category: "Personal Growth",
        unlockCriteria: { reflections: 100 },
        isRepeatable: false,
      },

      // === MORE ACHIEVEMENT BADGES ===
      {
        name: "Plot Twist Queen",
        description: "Documented a major relationship stage change. Life keeps you guessing, hottie!",
        icon: "🎭",
        category: "Achievement",
        unlockCriteria: { majorStageChange: true },
        isRepeatable: false,
      },
      {
        name: "Juggling Queen",
        description: "Managed multiple relationship progressions simultaneously. You're busy, sexy!",
        icon: "🤹",
        category: "Achievement",
        unlockCriteria: { multipleProgressions: true },
        isRepeatable: false,
      },

      // === LIFESTYLE BADGES ===
      {
        name: "Hot Girl Walk",
        description: "Logged moments from 5 different locations. Touch grass queen!",
        icon: "🚶‍♀️",
        category: "Lifestyle",
        unlockCriteria: { diverseLocations: 5 },
        isRepeatable: false,
      },
      {
        name: "Villain Era",
        description: "Sometimes you need to choose yourself. We stan the character development, babe!",
        icon: "😈",
        category: "Self Care",
        unlockCriteria: { selfCareChoice: true },
        isRepeatable: false,
      },
      {
        name: "Clean Girl Aesthetic",
        description: "Maintaining drama-free relationships. Effortlessly elegant, gorgeous!",
        icon: "🤍",
        category: "Peace",
        unlockCriteria: { dramaFreeStreak: 14 },
        isRepeatable: false,
      },
      {
        name: "Soft Life Living",
        description: "Prioritizing ease and joy in all your connections. This is the way, angel!",
        icon: "🕊️",
        category: "Lifestyle",
        unlockCriteria: { softLifeVibes: true },
        isRepeatable: false,
      },
      {
        name: "Digital Detox Diva",
        description: "Quality over quantity approach to moment logging. Very mindful, very cutesy!",
        icon: "🧘‍♀️",
        category: "Mindfulness",
        unlockCriteria: { mindfulLogging: true },
        isRepeatable: false,
      },

      // === MASTERY BADGES ===
      {
        name: "Relationship Guru",
        description: "Mastered all relationship stages. You could write a book, gorgeous!",
        icon: "📚",
        category: "Mastery",
        unlockCriteria: { allStagesExperienced: true },
        isRepeatable: false,
      },
      {
        name: "Vibe Curator",
        description: "Your relationship energy is immaculate. Others take notes from you, hottie!",
        icon: "🎨",
        category: "Mastery",
        unlockCriteria: { curatedVibes: true },
        isRepeatable: false,
      },
      {
        name: "Pattern Pro Max",
        description: "Identified 50+ behavioral patterns across connections. You see everything, babe!",
        icon: "🔍",
        category: "Mastery",
        unlockCriteria: { patternMastery: 50 },
        isRepeatable: false,
      },
      {
        name: "Love Language Linguist",
        description: "Documented all 5 love languages in action. You speak fluent affection, sexy!",
        icon: "💝",
        category: "Mastery",
        unlockCriteria: { loveLanguageMaster: true },
        isRepeatable: false,
      },

      // === SEASONAL/SPECIAL BADGES ===
      {
        name: "Cuffing Season Survivor",
        description: "Navigated winter relationship dynamics like a pro. Seasonal awareness, gorgeous!",
        icon: "❄️",
        category: "Seasonal",
        unlockCriteria: { cuffingSeasonNav: true },
        isRepeatable: true,
      },
      {
        name: "Hot Girl Summer",
        description: "Maximized your summer connection opportunities. Energy unmatched, hottie!",
        icon: "☀️",
        category: "Seasonal",
        unlockCriteria: { hotGirlSummer: true },
        isRepeatable: true,
      },
      {
        name: "New Year New Me",
        description: "Started tracking in January. Resolution queen energy, babe!",
        icon: "🎊",
        category: "Seasonal",
        unlockCriteria: { newYearStart: true },
        isRepeatable: false,
      },
      {
        name: "Valentine's Vibe Check",
        description: "Documented love-themed moments around Valentine's Day. Romance is real, angel!",
        icon: "💘",
        category: "Seasonal",
        unlockCriteria: { valentinesVibes: true },
        isRepeatable: true,
      },

      // === FUN BADGES ===
      {
        name: "Midnight Thoughts",
        description: "Logged a moment after 11 PM. The vulnerability hits different at night, gorgeous!",
        icon: "🌙",
        category: "Fun",
        unlockCriteria: { midnightLogging: true },
        isRepeatable: false,
      },
      {
        name: "Bathroom Break Chronicler",
        description: "Logged a moment from... an interesting location. No judgment, babe!",
        icon: "🚽",
        category: "Fun",
        unlockCriteria: { bathroomChronicle: true },
        isRepeatable: false,
      },
      {
        name: "Emoji Overload",
        description: "Used 20+ different emojis in moments. Your expression game is strong, hottie!",
        icon: "🎭",
        category: "Fun",
        unlockCriteria: { emojiMaster: 20 },
        isRepeatable: false,
      },
      {
        name: "Weekend Warrior",
        description: "Most active tracking happens on weekends. That's when the tea spills, sexy!",
        icon: "🍵",
        category: "Fun",
        unlockCriteria: { weekendWarrior: true },
        isRepeatable: false,
      },
      {
        name: "Speed Demon",
        description: "Logged 5 moments in under 10 minutes. Efficiency queen, gorgeous!",
        icon: "⚡",
        category: "Fun",
        unlockCriteria: { speedLogging: true },
        isRepeatable: false,
      },
      {
        name: "Novel Writer",
        description: "Average moment content over 200 characters. You have STORIES to tell, angel!",
        icon: "📖",
        category: "Fun",
        unlockCriteria: { novelWriter: true },
        isRepeatable: false,
      },
      {
        name: "Minimalist Poet",
        description: "Mastered the art of saying more with less. Brevity is your superpower, babe!",
        icon: "✒️",
        category: "Fun",
        unlockCriteria: { minimalistPoet: true },
        isRepeatable: false,
      },
      {
        name: "Screenshot Evidence",
        description: "Referenced external screenshots in moments. Receipts queen, hottie!",
        icon: "📱",
        category: "Fun",
        unlockCriteria: { screenshotEvidence: true },
        isRepeatable: false,
      },
      {
        name: "Energy Shift Detective",
        description: "Documented a major vibe change in someone. You notice everything, gorgeous!",
        icon: "🕵️‍♀️",
        category: "Fun",
        unlockCriteria: { energyShiftDetection: true },
        isRepeatable: false,
      },
      {
        name: "Kindra After Dark",
        description: "Your spiciest moments happen late night. The night owl energy, sexy!",
        icon: "🦉",
        category: "Fun",
        unlockCriteria: { afterDarkVibes: true },
        isRepeatable: false,
      },

      // === META ACHIEVEMENT BADGES ===
      {
        name: "Badge Collector",
        description: "Unlocked 10 badges. You're achievement hunting like a pro, hottie!",
        icon: "🏆",
        category: "Meta Achievement",
        unlockCriteria: { badgesUnlocked: 10 },
        isRepeatable: false,
      },
      {
        name: "Trophy Wife/Husband",
        description: "25 badges unlocked! You're basically a professional at this, sexy!",
        icon: "🥇",
        category: "Meta Achievement",
        unlockCriteria: { badgesUnlocked: 25 },
        isRepeatable: false,
      },
      {
        name: "Hall of Fame",
        description: "50 badges! You're literally the main character of relationship tracking, gorgeous!",
        icon: "👑",
        category: "Meta Achievement",
        unlockCriteria: { badgesUnlocked: 50 },
        isRepeatable: false,
      },

      // === LEGENDARY TIER BADGES ===
      {
        name: "Kindra Connoisseur",
        description: "You've unlocked the full potential of relationship tracking. Legendary status, goddess!",
        icon: "💎",
        category: "Legendary",
        unlockCriteria: { masterUser: true },
        isRepeatable: false,
      },
      {
        name: "Relationship Designer",
        description: "Built and maintained 25+ meaningful relationships. You're an artist, beautiful!",
        icon: "🏗️",
        category: "Legendary",
        unlockCriteria: { connectionArchitect: true },
        isRepeatable: false,
      },
      {
        name: "Constellation Casanova",
        description: "Tracked romantic patterns across all zodiac signs. Astrology expert, babe!",
        icon: "⭐",
        category: "Legendary",
        unlockCriteria: { zodiacMaster: true },
        isRepeatable: false,
      },
      {
        name: "Kindra Hall of Fame",
        description: "1 year of consistent tracking. You're officially relationship royalty, hottie!",
        icon: "👑",
        category: "Legendary",
        unlockCriteria: { yearLongCommitment: true },
        isRepeatable: false,
      },
      {
        name: "Influence Era",
        description: "Your relationship insights inspire others. You're changing the game, gorgeous!",
        icon: "🌟",
        category: "Legendary",
        unlockCriteria: { influenceEra: true },
        isRepeatable: false,
      },

      // === FINAL THREE BADGES TO REACH 100 ===
      {
        name: "New Beginnings",
        description: "Added a new connection this month. Always hunting for fresh drama, gorgeous!",
        icon: "🌱",
        category: "Social Growth",
        unlockCriteria: { newConnectionThisMonth: true },
        isRepeatable: true,
      },
      {
        name: "Wedding Bells",
        description: "Moved a connection to married stage. Here comes the bride, gorgeous!",
        icon: "💍",
        category: "Relationship Milestones",
        unlockCriteria: { marriageStageReached: true },
        isRepeatable: false,
      },
      {
        name: "Loyalty Legend",
        description: "Maintained a connection for 3+ years. That's real dedication, angel!",
        icon: "🏛️",
        category: "Long-term Commitment",
        unlockCriteria: { threeYearConnection: true },
        isRepeatable: false,
      }
    ];
  }
}

export const storage = new DatabaseStorage();