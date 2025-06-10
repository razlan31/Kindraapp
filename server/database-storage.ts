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

  async getConnectionsByUserId(userId: number): Promise<Connection[]> {
    return db.select().from(connections).where(eq(connections.userId, userId));
  }

  async getAllConnectionsByUserId(userId: number): Promise<Connection[]> {
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
}