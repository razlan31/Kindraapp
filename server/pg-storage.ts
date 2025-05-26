import { eq, desc } from 'drizzle-orm';
import { db } from './db';
import {
  users, connections, moments, badges, userBadges, menstrualCycles, milestones,
  type User, type Connection, type Moment, type Badge, type UserBadge, type MenstrualCycle, type Milestone,
  type InsertUser, type InsertConnection, type InsertMoment, type InsertBadge, type InsertUserBadge, type InsertMenstrualCycle, type InsertMilestone
} from '@shared/schema';
import type { IStorage } from './storage';
import bcrypt from "bcryptjs";

export class PgStorage implements IStorage {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    console.log('🗄️ Initializing PostgreSQL storage...');
    
    // Create test user if it doesn't exist
    const existingUser = await this.getUserByUsername('testuser');
    if (!existingUser) {
      await this.createTestUser();
    }
    
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

    // Create test connection
    const testConnection = await this.createConnection({
      userId: testUser.id,
      name: 'Alex',
      relationshipStage: 'Talking',
      startDate: new Date('2025-05-01'),
      birthday: new Date('1995-06-15'),
      zodiacSign: 'Gemini',
      loveLanguage: 'Quality Time',
      isPrivate: false
    });

    // Create sample moments
    await this.createMoment({
      userId: testUser.id,
      connectionId: testConnection.id,
      emoji: '⚡',
      content: 'Had an amazing conversation about our future goals!',
      tags: ['deep-talk', 'future-planning'],
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
    const result = await db.insert(moments).values([moment]).returning();
    console.log(`✅ PG Storage - createMoment:`, result[0]);
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
    return await db.select().from(menstrualCycles).where(eq(menstrualCycles.userId, userId));
  }

  async createMenstrualCycle(cycle: InsertMenstrualCycle): Promise<MenstrualCycle> {
    await this.initialize();
    const result = await db.insert(menstrualCycles).values(cycle).returning();
    return result[0];
  }

  async updateMenstrualCycle(id: number, data: Partial<MenstrualCycle>): Promise<MenstrualCycle | undefined> {
    await this.initialize();
    const result = await db.update(menstrualCycles).set(data).where(eq(menstrualCycles.id, id)).returning();
    return result[0];
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
}