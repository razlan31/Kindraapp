import { 
  User, InsertUser, UpsertUser, users,
  Connection, InsertConnection, connections,
  Moment, InsertMoment, moments, 
  Badge, InsertBadge, badges,
  UserBadge, InsertUserBadge, userBadges,
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

  async getMomentsByUserId(userId: number, limit?: number): Promise<Moment[]> {
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
    return db.select().from(menstrualCycles).where(eq(menstrualCycles.userId, userId)).orderBy(desc(menstrualCycles.startDate));
  }

  async createMenstrualCycle(cycle: InsertMenstrualCycle): Promise<MenstrualCycle> {
    const [newCycle] = await db.insert(menstrualCycles).values(cycle).returning();
    return newCycle;
  }

  async updateMenstrualCycle(id: number, data: Partial<MenstrualCycle>): Promise<MenstrualCycle | undefined> {
    const [updatedCycle] = await db
      .update(menstrualCycles)
      .set(data)
      .where(eq(menstrualCycles.id, id))
      .returning();
    return updatedCycle;
  }

  async deleteMenstrualCycle(id: number): Promise<boolean> {
    const result = await db.delete(menstrualCycles).where(eq(menstrualCycles.id, id));
    return (result.rowCount || 0) > 0;
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

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async awardBadge(userId: string, badgeId: number): Promise<UserBadge> {
    const [newUserBadge] = await db.insert(userBadges).values({
      userId,
      badgeId,
      earnedAt: new Date()
    }).returning();
    return newUserBadge;
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
        name: "Data Goddess",
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
        name: "Boundary Goddess",
        description: "25 green flags! You're the blueprint for healthy relationships, hot stuff!",
        icon: "👸",
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
        name: "Daily Check-in Babe",
        description: "Logged moments for 3 days straight. Building habits like a boss, gorgeous!",
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
        name: "Consistency Queen",
        description: "30-day streak! You're literally unstoppable, sexy!",
        icon: "👑",
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
        name: "Weekend Warrior",
        description: "Most active tracking happens on weekends. That's when the tea spills, sexy!",
        icon: "🍵",
        category: "Fun",
        unlockCriteria: { weekendWarrior: true },
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
      }
    ];
  }
}

export const storage = new DatabaseStorage();