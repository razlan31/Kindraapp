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
import { eq, desc, and, count } from "drizzle-orm";
import type { IStorage } from "./storage";

// TESTING ITEM #6: Database timeout wrapper aligned with Express server timeouts
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Database operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

// No timeout wrapper - let database handle its own timeouts
// This eliminates artificial timeout conflicts

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await withTimeout(db.select().from(users).where(eq(users.id, id)));
      return user;
    } catch (error) {
      console.error('Database error in getUser:', error);
      return undefined; // Return undefined instead of throwing
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Database error in getUserByUsername:', error);
      return undefined; // Return undefined instead of throwing
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Database error in getUserByEmail:', error);
      return undefined; // Return undefined instead of throwing
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error('Database error in createUser:', error);
      throw error; // Keep throwing for create operations
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error('Database error in updateUser:', error);
      return undefined; // Return undefined instead of throwing
    }
  }

  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId));
      return user;
    } catch (error) {
      console.error('Database error in getUserByStripeSubscriptionId:', error);
      return undefined; // Return undefined instead of throwing
    }
  }

  // Connection operations with subscription awareness
  async getConnections(userId: string): Promise<Connection[]> {
    try {
      return await this.getConnectionsByUserId(userId);
    } catch (error) {
      console.error('Database error in getConnections:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getMoments(userId: string, limit?: number): Promise<Moment[]> {
    try {
      const query = db.select().from(moments).where(eq(moments.userId, userId)).orderBy(desc(moments.createdAt));
      if (limit) {
        return await query.limit(limit);
      }
      return await query;
    } catch (error) {
      console.error('Database error in getMoments:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    try {
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
    } catch (error) {
      console.error('Database error in upsertUser:', error);
      throw error; // Keep throwing for create operations
    }
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
  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
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
  async getMenstrualCycles(userId: string): Promise<MenstrualCycle[]> {
    console.log(`🔍 DB Storage: Fetching cycles for user ${userId}`);
    const cycles = await db.select().from(menstrualCycles).where(eq(menstrualCycles.userId, userId)).orderBy(desc(menstrualCycles.periodStartDate));
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
    console.log(`🔥 DB Storage: Updating cycle ${id} with data:`, JSON.stringify(data, null, 2));
    console.log(`🔥 DB Storage: Data keys:`, Object.keys(data));
    console.log(`🔥 DB Storage: periodStartDate value:`, data.periodStartDate);
    console.log(`🔥 DB Storage: cycleEndDate value:`, data.cycleEndDate);
    
    try {
      const updateData = { ...data, updatedAt: new Date() };
      console.log(`🔥 DB Storage: Final update data being sent to DB:`, JSON.stringify(updateData, null, 2));
      
      const result = await db
        .update(menstrualCycles)
        .set(updateData)
        .where(eq(menstrualCycles.id, id))
        .returning();
      
      const updatedCycle = result[0];
      console.log(`🔥 DB Storage: Updated cycle result:`, JSON.stringify(updatedCycle, null, 2));
      
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
  async getMilestones(userId: string): Promise<Milestone[]> {
    return db.select().from(milestones).where(eq(milestones.userId, parseInt(userId))).orderBy(desc(milestones.date));
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
  async getPlans(userId: string): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.userId, parseInt(userId))).orderBy(desc(plans.scheduledDate));
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
  async getChatConversations(userId: string): Promise<ChatConversation[]> {
    return db.select().from(chatConversations).where(eq(chatConversations.userId, parseInt(userId))).orderBy(desc(chatConversations.updatedAt));
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
    try {
      return await withTimeout(db.select().from(badges), 3000);
    } catch (error) {
      console.error('🚨 getAllBadges error:', error);
      if (error.message.includes('timed out')) {
        console.error('🚨 SEQUELIZE TIMEOUT: This may trigger "sequelize statement was cancelled" error');
      }
      return [];
    }
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

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async addUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [newUserBadge] = await db.insert(userBadges).values(userBadge).returning();
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
    console.log('🏆 Starting optimized badge initialization...');
    
    // TESTING ITEM #6: Test if aligned timeouts prevent sequelize cancellation
    console.log('🧪 TESTING ITEM #6: Using aligned timeouts to prevent sequelize cancellation...');
    
    try {
      // Use aligned 3s timeout instead of 500ms to test if this prevents sequelize cancellation  
      const existingBadges = await withTimeout(
        db.select({ count: count() }).from(badges),
        3000 // Use aligned timeout matching Express server timeout
      );
      
      if (existingBadges[0].count > 0) {
        console.log(`🏆 Found ${existingBadges[0].count} existing badges in database`);
        return;
      }
      
      console.log('🏆 No badges found, deferring badge creation to avoid startup timeout...');
      
      // PERFORMANCE FIX: Defer badge creation to avoid startup timeout
      // Create badges asynchronously after server startup
      setImmediate(() => {
        this.createBadgesAsync().catch(error => {
          console.error('🚨 Deferred badge creation failed:', error);
        });
      });
      
      console.log('🏆 Badge initialization deferred to prevent startup timeout');
      
    } catch (error) {
      console.error('🚨 Badge initialization failed:', error);
      if (error.message.includes('cancelled')) {
        console.error('🎯 TESTING ITEM #6: Sequelize cancellation still occurred despite aligned timeouts!');
      }
      console.log('🔄 Deferring badge creation to prevent startup blocking...');
      
      // Always defer on error to prevent startup blocking
      setImmediate(() => {
        this.createBadgesAsync().catch(error => {
          console.error('🚨 Deferred badge creation failed:', error);
        });
      });
    }
  }

  private async createBadgesAsync(): Promise<void> {
    console.log('🏆 Starting deferred badge creation...');
    
    try {
      const defaultBadges = this.getDefaultBadges();
      
      // Create badges in optimized batches
      const batchSize = 25; // Larger batches for better performance
      for (let i = 0; i < defaultBadges.length; i += batchSize) {
        const batch = defaultBadges.slice(i, i + batchSize);
        
        const batchValues = batch.map(badge => ({
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          unlockCriteria: badge.unlockCriteria,
          isRepeatable: badge.isRepeatable ?? false
        }));
        
        await withTimeout(
          db.insert(badges).values(batchValues),
          5000 // Longer timeout for deferred operations
        );
        
        console.log(`🏆 Deferred batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(defaultBadges.length/batchSize)} completed (${batch.length} badges)`);
      }
      
      console.log(`🏆 Successfully created ${defaultBadges.length} badges asynchronously`);
    } catch (error) {
      console.error('🚨 Deferred badge creation failed:', error);
      // Don't throw - this is deferred and shouldn't block anything
    }
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
        icon: "🔥",
        category: "Activity",
        unlockCriteria: { momentsLogged: 100 },
        isRepeatable: false,
      }
    ];
  }

  // Missing methods needed for IStorage interface
  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId));
    return user;
  }

  async getConnections(userId: string): Promise<Connection[]> {
    return this.getConnectionsByUserId(userId);
  }

  async getMoments(userId: string, limit?: number): Promise<Moment[]> {
    return this.getMomentsByUserId(userId, limit);
  }

  private getDefaultBadges() {
    return [
      {
        name: "First Steps",
        description: "Welcome to Kindra! You've taken your first step towards better relationships.",
        icon: "🌟",
        category: "Getting Started",
        unlockCriteria: { signUp: true },
        isRepeatable: false,
      },
      {
        name: "Connection Made",
        description: "You've added your first connection.",
        icon: "💝",
        category: "Connection",
        unlockCriteria: { connectionsCount: 1 },
        isRepeatable: false,
      },
      {
        name: "Moment Creator",
        description: "You've logged your first moment.",
        icon: "📝",
        category: "Activity",
        unlockCriteria: { momentsLogged: 1 },
        isRepeatable: false,
      },
    ];
  }
}

export const storage = new DatabaseStorage();

// Initialize badges when the app starts
storage.initializeBadges().catch(console.error);
