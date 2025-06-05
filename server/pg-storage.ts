import { eq, desc } from 'drizzle-orm';
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

    // Create comprehensive test connection 1: Alex (Early Relationship)
    const testConnection1 = await this.createConnection({
      userId: testUser.id,
      name: 'Alex',
      relationshipStage: 'Talking',
      startDate: new Date('2025-05-01'),
      birthday: new Date('1995-06-15'),
      zodiacSign: 'Gemini',
      loveLanguage: 'Quality Time',
      isPrivate: false,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    });

    // Create comprehensive test connection 2: Jordan (Established Relationship)
    const testConnection2 = await this.createConnection({
      userId: testUser.id,
      name: 'Jordan',
      relationshipStage: 'Dating',
      startDate: new Date('2025-03-15'),
      birthday: new Date('1994-03-20'),
      zodiacSign: 'Pisces',
      loveLanguage: 'Physical Touch',
      isPrivate: false,
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b630?w=400&h=400&fit=crop&crop=face'
    });

    // Create comprehensive moments for Alex (Early Relationship - Talking Stage)
    const alexMoments = [
      {
        emoji: '💫', content: 'First time we matched on the app! Excited to get to know them.',
        tags: ['First Contact', 'Green Flag'], createdAt: new Date('2025-05-01')
      },
      {
        emoji: '😊', content: 'Had our first video call - such great conversation flow!',
        tags: ['Quality Time', 'Green Flag', 'Communication'], createdAt: new Date('2025-05-03')
      },
      {
        emoji: '🎭', content: 'They suggested a really creative first date idea - mini golf and ice cream.',
        tags: ['Planning', 'Creativity', 'Green Flag'], createdAt: new Date('2025-05-05')
      },
      {
        emoji: '✨', content: 'First in-person date! Chemistry was even better than expected.',
        tags: ['First Date', 'Chemistry', 'Green Flag'], createdAt: new Date('2025-05-07')
      },
      {
        emoji: '📱', content: 'They texted to make sure I got home safely. Such thoughtfulness!',
        tags: ['Thoughtful', 'Safety', 'Green Flag'], createdAt: new Date('2025-05-07')
      },
      {
        emoji: '🤔', content: 'Still figuring out where this is going, but I really enjoy their company.',
        tags: ['Uncertainty', 'Reflection'], createdAt: new Date('2025-05-12')
      }
    ];

    // Create comprehensive moments for Jordan (Established Relationship - Dating)
    const jordanMoments = [
      {
        emoji: '💕', content: 'Made it official! We\'re now exclusively dating.',
        tags: ['Milestone', 'Commitment', 'Green Flag'], createdAt: new Date('2025-03-15')
      },
      {
        emoji: '🏠', content: 'First time staying over at their place. Felt so natural and comfortable.',
        tags: ['Intimacy', 'Comfort', 'Physical Touch'], createdAt: new Date('2025-03-20')
      },
      {
        emoji: '👨‍👩‍👧‍👦', content: 'Met their family today! They were so welcoming and kind.',
        tags: ['Family', 'Milestone', 'Green Flag'], createdAt: new Date('2025-03-28')
      },
      {
        emoji: '💔', content: 'Had our first real argument about future plans. Felt tense.',
        tags: ['Conflict', 'Communication', 'Red Flag'], createdAt: new Date('2025-04-05')
      },
      {
        emoji: '🤝', content: 'We talked through our disagreement and found compromise. Growth moment!',
        tags: ['Resolution', 'Growth', 'Communication'], createdAt: new Date('2025-04-06')
      },
      {
        emoji: '🎂', content: 'They planned such a thoughtful surprise for my birthday.',
        tags: ['Thoughtful', 'Birthday', 'Love Language'], createdAt: new Date('2025-04-15')
      },
      {
        emoji: '🌅', content: 'Weekend getaway together. Deepened our connection so much.',
        tags: ['Travel', 'Quality Time', 'Intimacy'], createdAt: new Date('2025-04-22')
      },
      {
        emoji: '💍', content: 'Casually talked about the future - we both want similar things!',
        tags: ['Future Planning', 'Alignment', 'Green Flag'], createdAt: new Date('2025-05-10')
      },
      {
        emoji: '😰', content: 'Feeling a bit overwhelmed by how fast things are moving.',
        tags: ['Anxiety', 'Pace', 'Reflection'], createdAt: new Date('2025-05-18')
      },
      {
        emoji: '🤗', content: 'They noticed I was stressed and gave me space without me asking.',
        tags: ['Understanding', 'Emotional Intelligence', 'Green Flag'], createdAt: new Date('2025-05-20')
      }
    ];

    // Create all Alex moments
    for (const moment of alexMoments) {
      await this.createMoment({
        userId: testUser.id,
        connectionId: testConnection1.id,
        emoji: moment.emoji,
        content: moment.content,
        tags: moment.tags,
        isPrivate: false,
        isIntimate: moment.tags.includes('Intimacy'),
        intimacyRating: moment.tags.includes('Intimacy') ? "3" : null,
        relatedToMenstrualCycle: false,
        isResolved: moment.tags.includes('Resolution'),
        resolvedAt: moment.tags.includes('Resolution') ? moment.createdAt : null,
        resolutionNotes: moment.tags.includes('Resolution') ? 'Worked through together' : null,
        reflection: null,
        createdAt: moment.createdAt
      });
    }

    // Create all Jordan moments
    for (const moment of jordanMoments) {
      await this.createMoment({
        userId: testUser.id,
        connectionId: testConnection2.id,
        emoji: moment.emoji,
        content: moment.content,
        tags: moment.tags,
        isPrivate: false,
        isIntimate: moment.tags.includes('Intimacy'),
        intimacyRating: moment.tags.includes('Intimacy') ? "4" : null,
        relatedToMenstrualCycle: false,
        isResolved: moment.tags.includes('Resolution'),
        resolvedAt: moment.tags.includes('Resolution') ? moment.createdAt : null,
        resolutionNotes: moment.tags.includes('Resolution') ? 'Communicated effectively' : null,
        reflection: null,
        createdAt: moment.createdAt
      });
    }

    // Create milestones for both relationships
    await this.createMilestone({
      userId: testUser.id,
      connectionId: testConnection1.id,
      title: 'First Match',
      description: 'Connected on dating app',
      date: new Date('2025-05-01')
    });

    await this.createMilestone({
      userId: testUser.id,
      connectionId: testConnection1.id,
      title: 'First Date',
      description: 'Mini golf and ice cream',
      date: new Date('2025-05-07')
    });

    await this.createMilestone({
      userId: testUser.id,
      connectionId: testConnection2.id,
      title: 'Made It Official',
      description: 'Became exclusive',
      date: new Date('2025-03-15')
    });

    await this.createMilestone({
      userId: testUser.id,
      connectionId: testConnection2.id,
      title: 'Met the Family',
      description: 'First time meeting their parents',
      date: new Date('2025-03-28')
    });

    console.log('✅ Test user with comprehensive relationship data created');
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
    
    console.log("🗓️ PG Storage - Creating moment with date:", (moment as any).createdAt);
    
    const result = await db.insert(moments).values([moment]).returning();
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