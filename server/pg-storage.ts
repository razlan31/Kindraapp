import { eq, desc, and } from 'drizzle-orm';
import { db } from './db';
import {
  users, connections, moments, badges, userBadges, menstrualCycles, milestones, plans,
  type User, type Connection, type Moment, type Badge, type UserBadge, type MenstrualCycle, type Milestone, type Plan,
  type InsertUser, type InsertConnection, type InsertMoment, type InsertBadge, type InsertUserBadge, type InsertMenstrualCycle, type InsertMilestone, type InsertPlan
} from '@shared/schema';
import type { IStorage } from './storage';
import bcrypt from "bcryptjs";

export class PgStorage implements IStorage {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    console.log('🗄️ Initializing PostgreSQL storage...');
    this.initialized = true;
    console.log('✅ PostgreSQL storage initialized');
  }

  private async createTestUser() {
    console.log('👤 Creating test user...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    const testUser = await this.createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      displayName: 'Test User',
      zodiacSign: 'Gemini',
      loveLanguage: 'Quality Time'
    });

    // Create test connections
    const testConnection1 = await this.createConnection({
      userId: testUser.id,
      name: 'Alex',
      relationshipStage: 'Talking',
      startDate: new Date('2025-05-01'),
      birthday: new Date('1995-06-15'),
      zodiacSign: 'Gemini',
      loveLanguage: 'Quality Time',
      isPrivate: false
    });

    const testConnection2 = await this.createConnection({
      userId: testUser.id,
      name: 'Jordan',
      relationshipStage: 'Dating',
      startDate: new Date('2025-05-15'),
      birthday: new Date('1994-03-20'),
      zodiacSign: 'Pisces',
      loveLanguage: 'Physical Touch',
      isPrivate: false
    });

    // Create sample moments for both connections
    await this.createMoment({
      userId: testUser.id,
      connectionId: testConnection1.id,
      emoji: '😍',
      content: 'Amazing date night! We had such great chemistry.',
      tags: ['Green Flag', 'Quality Time', 'Intimacy'],
      isPrivate: false,
      isIntimate: false,
      intimacyRating: null,
      relatedToMenstrualCycle: false,
      isResolved: false,
      resolvedAt: null,
      resolutionNotes: null,
      reflection: null
    });

    await this.createMoment({
      userId: testUser.id,
      connectionId: testConnection2.id,
      emoji: '💕',
      content: 'First official date as a couple! So excited.',
      tags: ['Dating', 'Milestone', 'Green Flag'],
      isPrivate: false,
      isIntimate: false,
      intimacyRating: null,
      relatedToMenstrualCycle: false,
      isResolved: false,
      resolvedAt: null,
      resolutionNotes: null,
      reflection: null
    });

    console.log('✅ Test user and sample data created');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    await this.initialize();
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.initialize();
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.initialize();
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    await this.initialize();
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    await this.initialize();
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Connection operations
  async getConnection(id: number): Promise<Connection | undefined> {
    await this.initialize();
    const result = await db.select().from(connections).where(eq(connections.id, id)).limit(1);
    return result[0];
  }

  async getConnectionsByUserId(userId: number): Promise<Connection[]> {
    await this.initialize();
    const result = await db.select().from(connections).where(
      and(
        eq(connections.userId, userId),
        eq(connections.isArchived, false)
      )
    );
    
    // Sort to ensure user's own profile (Self) appears first
    return result.sort((a, b) => {
      if (a.relationshipStage === 'Self') return -1;
      if (b.relationshipStage === 'Self') return 1;
      return 0;
    });
  }

  async getAllConnectionsByUserId(userId: number): Promise<Connection[]> {
    await this.initialize();
    return await db.select().from(connections).where(eq(connections.userId, userId));
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    await this.initialize();
    const result = await db.insert(connections).values(connection).returning();
    return result[0];
  }

  async updateConnection(id: number, data: Partial<Connection>): Promise<Connection | undefined> {
    await this.initialize();
    const result = await db.update(connections).set(data).where(eq(connections.id, id)).returning();
    return result[0];
  }

  async deleteConnection(id: number): Promise<boolean> {
    await this.initialize();
    
    // Delete all associated data in order (foreign key constraints)
    await db.delete(moments).where(eq(moments.connectionId, id));
    await db.delete(milestones).where(eq(milestones.connectionId, id));
    await db.delete(plans).where(eq(plans.connectionId, id));
    
    // Finally delete the connection
    const result = await db.delete(connections).where(eq(connections.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Moment operations
  async getMoment(id: number): Promise<Moment | undefined> {
    await this.initialize();
    const result = await db.select().from(moments).where(eq(moments.id, id)).limit(1);
    console.log(`🔍 PG Storage - getMoment(${id}):`, result[0]);
    return result[0];
  }

  async getMomentsByUserId(userId: number, limit?: number): Promise<Moment[]> {
    await this.initialize();
    let query = db.select().from(moments).where(eq(moments.userId, userId)).orderBy(desc(moments.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    const result = await query;
    console.log(`📋 PG Storage - getMomentsByUserId(${userId}):`, result.map(m => ({ id: m.id, emoji: m.emoji, content: m.content?.substring(0, 20) })));
    return result;
  }

  async getMomentsByConnectionId(connectionId: number): Promise<Moment[]> {
    await this.initialize();
    return await db.select().from(moments).where(eq(moments.connectionId, connectionId)).orderBy(desc(moments.createdAt));
  }

  async createMoment(moment: InsertMoment): Promise<Moment> {
    await this.initialize();
    
    // Ensure dates are properly converted to Date objects
    const momentData = {
      ...moment,
      createdAt: moment.createdAt ? new Date(moment.createdAt) : new Date(),
      resolvedAt: moment.resolvedAt ? new Date(moment.resolvedAt) : null
    };
    
    console.log("🗓️ PG Storage - Creating moment with date:", momentData.createdAt);
    
    const result = await db.insert(moments).values([momentData]).returning();
    console.log(`📝 PG Storage - Created moment with date:`, result[0].createdAt);
    return result[0];
  }

  async updateMoment(id: number, data: Partial<Moment>): Promise<Moment | undefined> {
    await this.initialize();
    console.log(`🔄 PG Storage - updateMoment(${id}) with:`, data);
    const result = await db.update(moments).set(data).where(eq(moments.id, id)).returning();
    console.log(`✅ PG Storage - updateMoment result:`, result[0]);
    return result[0];
  }

  async deleteMoment(id: number): Promise<boolean> {
    await this.initialize();
    const result = await db.delete(moments).where(eq(moments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Badge operations
  async getBadge(id: number): Promise<Badge | undefined> {
    await this.initialize();
    const result = await db.select().from(badges).where(eq(badges.id, id)).limit(1);
    return result[0];
  }

  async getAllBadges(): Promise<Badge[]> {
    await this.initialize();
    return await db.select().from(badges);
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    await this.initialize();
    const result = await db.insert(badges).values(badge).returning();
    return result[0];
  }

  async getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]> {
    await this.initialize();
    const result = await db.select({
      id: userBadges.id,
      userId: userBadges.userId,
      badgeId: userBadges.badgeId,
      unlockedAt: userBadges.unlockedAt,
      badge: badges
    }).from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));
    
    return result as (UserBadge & { badge: Badge })[];
  }

  async addUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    await this.initialize();
    const result = await db.insert(userBadges).values(userBadge).returning();
    return result[0];
  }

  // Menstrual Cycle operations
  async getMenstrualCycles(userId: number): Promise<MenstrualCycle[]> {
    await this.initialize();
    console.log("PG Storage - Getting menstrual cycles for userId:", userId);
    const result = await db.select().from(menstrualCycles).where(eq(menstrualCycles.userId, userId));
    console.log("PG Storage - Query result:", result);
    return result;
  }

  async createMenstrualCycle(cycle: InsertMenstrualCycle): Promise<MenstrualCycle> {
    await this.initialize();
    console.log("PG Storage - Creating menstrual cycle with data:", cycle);
    try {
      const result = await db.insert(menstrualCycles).values(cycle).returning();
      console.log("PG Storage - Insert result:", result);
      const createdCycle = result[0];
      console.log("PG Storage - Created cycle:", createdCycle);
      return createdCycle;
    } catch (error) {
      console.error("PG Storage - Error inserting menstrual cycle:", error);
      throw error;
    }
  }

  async updateMenstrualCycle(id: number, data: Partial<MenstrualCycle>): Promise<MenstrualCycle | undefined> {
    await this.initialize();
    const result = await db.update(menstrualCycles).set(data).where(eq(menstrualCycles.id, id)).returning();
    return result[0];
  }

  async deleteMenstrualCycle(id: number): Promise<boolean> {
    await this.initialize();
    const result = await db.delete(menstrualCycles).where(eq(menstrualCycles.id, id));
    return result.rowCount > 0;
  }

  // Milestone operations
  async getMilestones(userId: number): Promise<Milestone[]> {
    await this.initialize();
    return await db.select().from(milestones).where(eq(milestones.userId, userId));
  }

  async getMilestonesByConnectionId(connectionId: number): Promise<Milestone[]> {
    await this.initialize();
    return await db.select().from(milestones).where(eq(milestones.connectionId, connectionId));
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    await this.initialize();
    const result = await db.insert(milestones).values(milestone).returning();
    return result[0];
  }

  async updateMilestone(id: number, data: Partial<Milestone>): Promise<Milestone | undefined> {
    await this.initialize();
    const result = await db.update(milestones).set(data).where(eq(milestones.id, id)).returning();
    return result[0];
  }

  async deleteMilestone(id: number): Promise<boolean> {
    await this.initialize();
    const result = await db.delete(milestones).where(eq(milestones.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Plan operations
  async getPlans(userId: number): Promise<Plan[]> {
    await this.initialize();
    return await db.select().from(plans).where(eq(plans.userId, userId));
  }

  async getPlansByConnectionId(connectionId: number): Promise<Plan[]> {
    await this.initialize();
    return await db.select().from(plans).where(eq(plans.connectionId, connectionId));
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    await this.initialize();
    const result = await db.insert(plans).values(plan).returning();
    return result[0];
  }

  async updatePlan(id: number, data: Partial<Plan>): Promise<Plan | undefined> {
    await this.initialize();
    const result = await db.update(plans).set(data).where(eq(plans.id, id)).returning();
    return result[0];
  }

  async deletePlan(id: number): Promise<boolean> {
    await this.initialize();
    const result = await db.delete(plans).where(eq(plans.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}