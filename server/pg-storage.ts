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

    // Create 3 additional test connections with rich activity data
    const testConnection3 = await this.createConnection({
      userId: testUser.id,
      name: 'Maya',
      relationshipStage: 'Best Friend',
      startDate: new Date('2024-08-10'),
      birthday: new Date('1996-11-08'),
      zodiacSign: 'Scorpio',
      loveLanguage: 'Acts of Service',
      isPrivate: false
    });

    const testConnection4 = await this.createConnection({
      userId: testUser.id,
      name: 'Sam',
      relationshipStage: 'Situationship',
      startDate: new Date('2025-04-20'),
      birthday: new Date('1993-01-25'),
      zodiacSign: 'Aquarius',
      loveLanguage: 'Words of Affirmation',
      isPrivate: false
    });

    const testConnection5 = await this.createConnection({
      userId: testUser.id,
      name: 'Riley',
      relationshipStage: 'It\'s Complicated',
      startDate: new Date('2025-03-05'),
      birthday: new Date('1997-07-12'),
      zodiacSign: 'Cancer',
      loveLanguage: 'Physical Touch',
      isPrivate: false
    });

    // Create comprehensive moments for Maya (Best Friend)
    const mayaMoments = [
      {
        emoji: '🎉',
        content: 'Maya surprised me with tickets to my favorite band! She remembered I mentioned them months ago.',
        tags: ['Green Flag', 'Acts of Service', 'Thoughtful'],
        createdAt: new Date('2025-06-01T14:30:00Z')
      },
      {
        emoji: '🍕',
        content: 'Late night pizza and deep conversation about life goals. Maya always knows what to say.',
        tags: ['Quality Time', 'Deep Connection', 'Support'],
        createdAt: new Date('2025-05-28T22:15:00Z')
      },
      {
        emoji: '💪',
        content: 'Maya helped me move apartments all day without complaining. True friendship.',
        tags: ['Acts of Service', 'Green Flag', 'Reliable'],
        createdAt: new Date('2025-05-15T16:00:00Z')
      },
      {
        emoji: '😢',
        content: 'Had a breakdown about work stress. Maya listened for hours and brought me comfort food.',
        tags: ['Emotional Support', 'Green Flag', 'Caring'],
        createdAt: new Date('2025-05-10T19:45:00Z')
      },
      {
        emoji: '🎬',
        content: 'Movie marathon weekend! We watched 6 films and laughed until our stomachs hurt.',
        tags: ['Quality Time', 'Fun', 'Bonding'],
        createdAt: new Date('2025-04-30T20:30:00Z')
      }
    ];

    for (const moment of mayaMoments) {
      await this.createMoment({
        userId: testUser.id,
        connectionId: testConnection3.id,
        emoji: moment.emoji,
        content: moment.content,
        tags: moment.tags,
        isPrivate: false,
        isIntimate: false,
        intimacyRating: null,
        relatedToMenstrualCycle: false,
        createdAt: moment.createdAt,
        isResolved: false,
        resolvedAt: null,
        resolutionNotes: null,
        reflection: null
      });
    }

    // Create moments for Sam (Situationship with mixed signals)
    const samMoments = [
      {
        emoji: '🤔',
        content: 'Sam left me on read again after making plans. Starting to feel like I\'m not a priority.',
        tags: ['Red Flag', 'Communication Issues', 'Confusion'],
        createdAt: new Date('2025-06-03T11:20:00Z')
      },
      {
        emoji: '🔥',
        content: 'Amazing chemistry when we\'re together, but then radio silence for days.',
        tags: ['Physical Connection', 'Mixed Signals', 'Inconsistent'],
        createdAt: new Date('2025-05-25T23:45:00Z')
      },
      {
        emoji: '📱',
        content: 'Sam only texts me late at night. Makes me feel like a backup option.',
        tags: ['Red Flag', 'Booty Call', 'Disrespect'],
        createdAt: new Date('2025-05-20T02:30:00Z')
      },
      {
        emoji: '😕',
        content: 'Saw Sam on a dating app. We never talked about exclusivity but it still stings.',
        tags: ['Jealousy', 'Unclear Boundaries', 'Hurt'],
        createdAt: new Date('2025-05-18T16:10:00Z')
      },
      {
        emoji: '💬',
        content: 'Great conversation about our dreams and ambitions. Sam can be really thoughtful.',
        tags: ['Intellectual Connection', 'Green Flag', 'Deep Talk'],
        createdAt: new Date('2025-05-12T14:20:00Z')
      },
      {
        emoji: '🍷',
        content: 'Wine night turned into an intense makeout session. The attraction is undeniable.',
        tags: ['Physical Intimacy', 'Chemistry', 'Passion'],
        isIntimate: true,
        intimacyRating: 7,
        createdAt: new Date('2025-05-08T21:15:00Z')
      }
    ];

    for (const moment of samMoments) {
      await this.createMoment({
        userId: testUser.id,
        connectionId: testConnection4.id,
        emoji: moment.emoji,
        content: moment.content,
        tags: moment.tags,
        isPrivate: false,
        isIntimate: moment.isIntimate || false,
        intimacyRating: moment.intimacyRating || null,
        relatedToMenstrualCycle: false,
        createdAt: moment.createdAt,
        isResolved: false,
        resolvedAt: null,
        resolutionNotes: null,
        reflection: null
      });
    }

    // Create moments for Riley (It's Complicated - on/off relationship)
    const rileyMoments = [
      {
        emoji: '💔',
        content: 'Another fight about commitment. Riley wants all the benefits but none of the responsibility.',
        tags: ['Red Flag', 'Commitment Issues', 'Frustration'],
        createdAt: new Date('2025-06-02T18:30:00Z')
      },
      {
        emoji: '🌹',
        content: 'Riley showed up with flowers after our fight. The gesture was sweet but actions matter more.',
        tags: ['Apology', 'Romantic Gesture', 'Pattern'],
        createdAt: new Date('2025-05-30T12:45:00Z')
      },
      {
        emoji: '😍',
        content: 'Perfect weekend getaway. When it\'s good with Riley, it\'s incredible.',
        tags: ['Quality Time', 'Romance', 'Connection'],
        createdAt: new Date('2025-05-22T19:20:00Z')
      },
      {
        emoji: '🤷',
        content: 'Riley cancelled our plans last minute again. Third time this month.',
        tags: ['Red Flag', 'Unreliable', 'Disrespect'],
        createdAt: new Date('2025-05-19T15:00:00Z')
      },
      {
        emoji: '🔒',
        content: 'Caught Riley being secretive with their phone. Trust issues are growing.',
        tags: ['Red Flag', 'Trust Issues', 'Suspicious'],
        createdAt: new Date('2025-05-14T20:10:00Z')
      },
      {
        emoji: '💋',
        content: 'Passionate night together. The physical connection is still strong.',
        tags: ['Physical Intimacy', 'Passion', 'Chemistry'],
        isIntimate: true,
        intimacyRating: 8,
        relatedToMenstrualCycle: true,
        createdAt: new Date('2025-05-11T23:30:00Z')
      },
      {
        emoji: '🎭',
        content: 'Riley was charming at the party but flirted with others in front of me.',
        tags: ['Red Flag', 'Disrespect', 'Jealousy'],
        createdAt: new Date('2025-05-05T22:15:00Z')
      }
    ];

    for (const moment of rileyMoments) {
      await this.createMoment({
        userId: testUser.id,
        connectionId: testConnection5.id,
        emoji: moment.emoji,
        content: moment.content,
        tags: moment.tags,
        isPrivate: false,
        isIntimate: moment.isIntimate || false,
        intimacyRating: moment.intimacyRating || null,
        relatedToMenstrualCycle: moment.relatedToMenstrualCycle || false,
        createdAt: moment.createdAt,
        isResolved: false,
        resolvedAt: null,
        resolutionNotes: null,
        reflection: null
      });
    }

    // Create menstrual cycles with varied data
    const cycles = [
      {
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-06'),
        cycleLength: 28,
        flow: 'Medium' as const,
        symptoms: ['Cramps', 'Mood Swings'],
        notes: 'Normal cycle, felt emotional around Riley situation'
      },
      {
        startDate: new Date('2025-04-03'),
        endDate: new Date('2025-04-08'),
        cycleLength: 28,
        flow: 'Heavy' as const,
        symptoms: ['Severe Cramps', 'Fatigue', 'Headache'],
        notes: 'Stressful period, work deadline coincided'
      },
      {
        startDate: new Date('2025-03-06'),
        endDate: new Date('2025-03-10'),
        cycleLength: 27,
        flow: 'Light' as const,
        symptoms: ['Mild Cramps'],
        notes: 'Light cycle, felt great overall'
      }
    ];

    for (const cycle of cycles) {
      await this.createMenstrualCycle({
        userId: testUser.id,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        cycleLength: cycle.cycleLength,
        flow: cycle.flow,
        symptoms: cycle.symptoms,
        notes: cycle.notes
      });
    }

    // Create milestones for relationship progress
    await this.createMilestone({
      userId: testUser.id,
      connectionId: testConnection3.id,
      title: 'Became Best Friends',
      description: 'Maya and I officially became best friends after years of close friendship',
      emoji: '💖',
      date: new Date('2024-12-25'),
      category: 'Relationship'
    });

    await this.createMilestone({
      userId: testUser.id,
      connectionId: testConnection4.id,
      title: 'Started Situationship',
      description: 'Things with Sam became physical but undefined',
      emoji: '🤷',
      date: new Date('2025-04-20'),
      category: 'Relationship'
    });

    await this.createMilestone({
      userId: testUser.id,
      connectionId: testConnection5.id,
      title: 'First Breakup',
      description: 'Riley and I broke up after commitment issues',
      emoji: '💔',
      date: new Date('2025-04-15'),
      category: 'Relationship'
    });

    await this.createMilestone({
      userId: testUser.id,
      connectionId: testConnection5.id,
      title: 'Got Back Together',
      description: 'Riley and I decided to try again',
      emoji: '💕',
      date: new Date('2025-05-01'),
      category: 'Relationship'
    });

    // Create future plans
    await this.createPlan({
      userId: testUser.id,
      connectionId: testConnection3.id,
      title: 'Weekend Hiking Trip',
      description: 'Planning a hiking trip with Maya to the mountains',
      date: new Date('2025-06-15'),
      category: 'Adventure',
      status: 'Planned'
    });

    await this.createPlan({
      userId: testUser.id,
      connectionId: testConnection4.id,
      title: 'Define The Relationship Talk',
      description: 'Need to have a serious conversation with Sam about what we are',
      date: new Date('2025-06-10'),
      category: 'Communication',
      status: 'Planned'
    });

    console.log('✅ Test user and comprehensive sample data created with 3 additional connections');
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