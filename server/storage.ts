import { 
  User, InsertUser, users,
  Connection, InsertConnection, connections,
  Moment, InsertMoment, moments, 
  Badge, InsertBadge, badges,
  UserBadge, InsertUserBadge, userBadges,
  MenstrualCycle, InsertMenstrualCycle, menstrualCycles,
  Milestone, InsertMilestone, milestones
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  // Connection operations
  getConnection(id: number): Promise<Connection | undefined>;
  getConnectionsByUserId(userId: number): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnection(id: number, data: Partial<Connection>): Promise<Connection | undefined>;
  deleteConnection(id: number): Promise<boolean>;

  // Moment operations
  getMoment(id: number): Promise<Moment | undefined>;
  getMomentsByUserId(userId: number, limit?: number): Promise<Moment[]>;
  getMomentsByConnectionId(connectionId: number): Promise<Moment[]>;
  createMoment(moment: InsertMoment): Promise<Moment>;
  updateMoment(id: number, data: Partial<Moment>): Promise<Moment | undefined>;
  deleteMoment(id: number): Promise<boolean>;

  // Badge operations
  getBadge(id: number): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // User Badge operations
  getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]>;
  addUserBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  
  // Menstrual Cycle operations
  getMenstrualCycles(userId: number): Promise<MenstrualCycle[]>;
  createMenstrualCycle(cycle: InsertMenstrualCycle): Promise<MenstrualCycle>;
  updateMenstrualCycle(id: number, data: Partial<MenstrualCycle>): Promise<MenstrualCycle | undefined>;
  
  // Milestone operations
  getMilestones(userId: number): Promise<Milestone[]>;
  getMilestonesByConnectionId(connectionId: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, data: Partial<Milestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private connections: Map<number, Connection>;
  private moments: Map<number, Moment>;
  private badges: Map<number, Badge>;
  private userBadges: Map<number, UserBadge>;
  private menstrualCycles: Map<number, MenstrualCycle>;
  private milestones: Map<number, Milestone>;
  
  private userId: number;
  private connectionId: number;
  private momentId: number;
  private badgeId: number;
  private userBadgeId: number;
  private menstrualCycleId: number;
  private milestoneId: number;

  constructor() {
    // Initialize maps for storage
    this.users = new Map();
    this.connections = new Map();
    this.moments = new Map();
    this.badges = new Map();
    this.userBadges = new Map();
    this.menstrualCycles = new Map();
    this.milestones = new Map();
    
    // Initialize auto-incrementing IDs
    this.userId = 1;
    this.connectionId = 1;
    this.momentId = 1;
    this.badgeId = 1;
    this.userBadgeId = 1;
    this.menstrualCycleId = 1;
    this.milestoneId = 1;
    
    // Initialize default badges
    this.initializeDefaultBadges();
    
    // Create test user synchronously to ensure it exists
    this.createTestUserSync();
  }

  private createTestUserSync() {
    // Create test user synchronously without bcrypt for simplicity
    const testUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123', // In production this would be hashed
      displayName: 'Test User',
      zodiacSign: 'Gemini',
      loveLanguage: 'Quality Time',
      profileImage: null,
      createdAt: new Date()
    };
    
    this.users.set(1, testUser);
    console.log("Created test user synchronously:", testUser.username);
    
    // Add a hidden system connection so database is never empty
    // This connection uses userId 0 (system) so it won't appear in user's list
    const systemConnection: Connection = {
      id: 1,
      userId: 0, // System user ID - won't appear in user queries
      name: "System Connection",
      relationshipStage: "Best Friend",
      startDate: new Date('2024-01-15'),
      birthday: null,
      zodiacSign: "Leo",
      loveLanguage: "Quality Time",
      profileImage: null,
      isPrivate: true,
      createdAt: new Date()
    };
    
    this.connections.set(1, systemConnection);
    
    // Create a test connection for the actual user to test with
    const testConnection: Connection = {
      id: 2,
      userId: 1, // Actual test user ID
      name: "Alex",
      relationshipStage: "Talking",
      startDate: new Date('2025-05-01'),
      birthday: new Date('1995-06-15'),
      zodiacSign: "Gemini",
      loveLanguage: "Quality Time",
      profileImage: null,
      isPrivate: false,
      createdAt: new Date()
    };
    
    this.connections.set(2, testConnection);
    this.connectionId = 3; // Next connection will start from ID 3
    console.log("Created hidden system connection to prevent empty database");
    console.log("Created test connection for user testing");
  }

  private async initializeTestUser() {
    // This method is kept for reference but not used
    const hashedPassword = await import('bcryptjs').then(bcrypt => 
      bcrypt.hash('password123', 10)
    );
    
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      displayName: 'Test User',
      zodiacSign: 'Gemini',
      loveLanguage: 'Quality Time'
    };
    
    const user = await this.createUser(testUser);
    
    // Add test connections so the app is usable
    await this.createConnection({
      userId: user.id,
      name: "Alex",
      relationshipStage: "Exclusive",
      startDate: new Date("2023-11-23"),
      zodiacSign: "Sagittarius",
      loveLanguage: "Words of Affirmation, Quality Time",
      profileImage: "https://randomuser.me/api/portraits/women/32.jpg"
    });
    
    await this.createConnection({
      userId: user.id,
      name: "Jordan",
      relationshipStage: "Talking",
      startDate: new Date("2024-01-15"),
      zodiacSign: "Leo",
      loveLanguage: "Physical Touch",
      profileImage: "https://randomuser.me/api/portraits/men/22.jpg"
    });
  }

  private initializeDefaultBadges() {
    const defaultBadges: InsertBadge[] = [
      {
        name: "Emotion Master",
        description: "Log emotions in 10 different moments",
        icon: "fa-heart",
        category: "Emotional Growth",
        unlockCriteria: { momentsLogged: 10 },
      },
      {
        name: "Communication Pro",
        description: "Have at least 5 positive communication moments",
        icon: "fa-comments",
        category: "Communication",
        unlockCriteria: { positiveCommunication: 5 },
      },
      {
        name: "Green Flag Queen",
        description: "Collect 10 green flags across all relationships",
        icon: "fa-flag",
        category: "Relationship Health",
        unlockCriteria: { greenFlags: 10 },
      },
      {
        name: "Reflection Ritualist",
        description: "Log moments consistently for 7 days",
        icon: "fa-calendar-check",
        category: "Consistency",
        unlockCriteria: { streakDays: 7 },
      },
      {
        name: "Boundary Babe",
        description: "Set and maintain healthy boundaries",
        icon: "fa-shield",
        category: "Self-care",
        unlockCriteria: { boundariesSet: 3 },
      },
      {
        name: "Connection Champion",
        description: "Track 3 different relationship types",
        icon: "fa-people-group",
        category: "Diversity",
        unlockCriteria: { relationshipTypes: 3 },
      }
    ];

    defaultBadges.forEach(badge => this.createBadge(badge));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      displayName: insertUser.displayName || null,
      profileImage: insertUser.profileImage || null,
      zodiacSign: insertUser.zodiacSign || null,
      loveLanguage: insertUser.loveLanguage || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Connection operations
  async getConnection(id: number): Promise<Connection | undefined> {
    return this.connections.get(id);
  }

  async getConnectionsByUserId(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.userId === userId
    );
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    console.log("STORAGE: createConnection called with data:", insertConnection);
    const id = this.connectionId++;
    const connection: Connection = { 
      ...insertConnection, 
      id, 
      createdAt: new Date(),
      // Ensure null values for optional fields that aren't provided
      profileImage: insertConnection.profileImage || null,
      startDate: insertConnection.startDate || null,
      birthday: insertConnection.birthday || null,
      zodiacSign: insertConnection.zodiacSign || null,
      loveLanguage: insertConnection.loveLanguage || null,
      isPrivate: insertConnection.isPrivate || false
    };
    console.log("STORAGE: Created connection object:", connection);
    this.connections.set(id, connection);
    console.log("STORAGE: Saved to map. Verifying:", this.connections.get(id));
    return connection;
  }

  async updateConnection(id: number, data: Partial<Connection>): Promise<Connection | undefined> {
    console.log("STORAGE: updateConnection called with id:", id, "data:", data);
    const connection = this.connections.get(id);
    console.log("STORAGE: Found existing connection:", connection);
    
    if (!connection) {
      console.log("STORAGE: Connection not found");
      return undefined;
    }
    
    const updatedConnection = { ...connection, ...data };
    console.log("STORAGE: Created updated connection:", updatedConnection);
    
    this.connections.set(id, updatedConnection);
    console.log("STORAGE: Saved to map. Verifying:", this.connections.get(id));
    
    return updatedConnection;
  }

  async deleteConnection(id: number): Promise<boolean> {
    return this.connections.delete(id);
  }

  // Moment operations
  async getMoment(id: number): Promise<Moment | undefined> {
    return this.moments.get(id);
  }

  async getMomentsByUserId(userId: number, limit?: number): Promise<Moment[]> {
    const userMoments = Array.from(this.moments.values())
      .filter((moment) => moment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? userMoments.slice(0, limit) : userMoments;
  }

  async getMomentsByConnectionId(connectionId: number): Promise<Moment[]> {
    return Array.from(this.moments.values())
      .filter((moment) => moment.connectionId === connectionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createMoment(insertMoment: InsertMoment): Promise<Moment> {
    const id = this.momentId++;
    const moment: Moment = { 
      ...insertMoment, 
      id, 
      createdAt: new Date(),
      tags: insertMoment.tags || null,
      isPrivate: insertMoment.isPrivate || null,
      isIntimate: insertMoment.isIntimate || null,
      intimacyRating: insertMoment.intimacyRating || null,
      relatedToMenstrualCycle: insertMoment.relatedToMenstrualCycle || null
    };
    this.moments.set(id, moment);
    return moment;
  }

  async updateMoment(id: number, data: Partial<Moment>): Promise<Moment | undefined> {
    const moment = this.moments.get(id);
    if (!moment) return undefined;
    
    const updatedMoment = { ...moment, ...data };
    this.moments.set(id, updatedMoment);
    return updatedMoment;
  }

  async deleteMoment(id: number): Promise<boolean> {
    return this.moments.delete(id);
  }

  // Badge operations
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }

  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const id = this.badgeId++;
    const badge: Badge = { ...insertBadge, id };
    this.badges.set(id, badge);
    return badge;
  }

  // User Badge operations
  async getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]> {
    const userBadgeEntries = Array.from(this.userBadges.values())
      .filter((userBadge) => userBadge.userId === userId);
    
    return userBadgeEntries.map(userBadge => {
      const badge = this.badges.get(userBadge.badgeId);
      if (!badge) throw new Error(`Badge not found: ${userBadge.badgeId}`);
      return { ...userBadge, badge };
    });
  }

  async addUserBadge(insertUserBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.userBadgeId++;
    const userBadge: UserBadge = { ...insertUserBadge, id, unlockedAt: new Date() };
    this.userBadges.set(id, userBadge);
    return userBadge;
  }

  // Menstrual Cycle operations
  async getMenstrualCycles(userId: number): Promise<MenstrualCycle[]> {
    return Array.from(this.menstrualCycles.values())
      .filter((cycle) => cycle.userId === userId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }
  
  async getMenstrualCycle(id: number): Promise<MenstrualCycle | undefined> {
    return this.menstrualCycles.get(id);
  }

  async createMenstrualCycle(insertCycle: InsertMenstrualCycle): Promise<MenstrualCycle> {
    const id = this.menstrualCycleId++;
    const cycle: MenstrualCycle = { ...insertCycle, id };
    this.menstrualCycles.set(id, cycle);
    return cycle;
  }

  async updateMenstrualCycle(id: number, data: Partial<MenstrualCycle>): Promise<MenstrualCycle | undefined> {
    const cycle = this.menstrualCycles.get(id);
    if (!cycle) return undefined;
    
    const updatedCycle = { ...cycle, ...data };
    this.menstrualCycles.set(id, updatedCycle);
    return updatedCycle;
  }
  
  // Milestone operations
  async getMilestones(userId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values())
      .filter(milestone => milestone.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getMilestonesByConnectionId(connectionId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values())
      .filter(milestone => milestone.connectionId === connectionId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const id = this.milestoneId++;
    const newMilestone: Milestone = { ...milestone, id };
    this.milestones.set(id, newMilestone);
    return newMilestone;
  }
  
  async updateMilestone(id: number, data: Partial<Milestone>): Promise<Milestone | undefined> {
    const milestone = this.milestones.get(id);
    if (!milestone) return undefined;
    
    const updatedMilestone = { ...milestone, ...data };
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }
  
  async deleteMilestone(id: number): Promise<boolean> {
    return this.milestones.delete(id);
  }
}

export const storage = new MemStorage();
