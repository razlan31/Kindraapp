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

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Connection operations
  getConnection(id: number): Promise<Connection | undefined>;
  getConnectionsByUserId(userId: string): Promise<Connection[]>;
  getAllConnectionsByUserId(userId: string): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnection(id: number, data: Partial<Connection>): Promise<Connection | undefined>;
  deleteConnection(id: number): Promise<boolean>;

  // Moment operations
  getMoment(id: number): Promise<Moment | undefined>;
  getMomentsByUserId(userId: string, limit?: number): Promise<Moment[]>;
  getMomentsByConnectionId(connectionId: number): Promise<Moment[]>;
  createMoment(moment: Omit<InsertMoment, 'createdAt' | 'resolvedAt'> & { createdAt?: Date | string; resolvedAt?: Date | string | null }): Promise<Moment>;
  updateMoment(id: number, data: Partial<Moment>): Promise<Moment | undefined>;
  deleteMoment(id: number): Promise<boolean>;

  // Badge operations
  getBadge(id: number): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // User Badge operations
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  addUserBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  awardBadgeWithPoints(userId: string, badgeId: number): Promise<{ badge: Badge; userBadge: UserBadge; notification: Notification }>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: any): Promise<any>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // Points operations
  addPointsToUser(userId: string, points: number): Promise<User>;
  
  // Menstrual Cycle operations
  getMenstrualCycles(userId: string): Promise<MenstrualCycle[]>;
  createMenstrualCycle(cycle: InsertMenstrualCycle): Promise<MenstrualCycle>;
  updateMenstrualCycle(id: number, data: Partial<MenstrualCycle>): Promise<MenstrualCycle | undefined>;
  deleteMenstrualCycle(id: number): Promise<boolean>;
  
  // Milestone operations
  getMilestones(userId: string): Promise<Milestone[]>;
  getMilestonesByConnectionId(connectionId: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, data: Partial<Milestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;
  
  // Plan operations
  getPlans(userId: number): Promise<Plan[]>;
  getPlansByConnectionId(connectionId: number): Promise<Plan[]>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, data: Partial<Plan>): Promise<Plan | undefined>;
  deletePlan(id: number): Promise<boolean>;
  
  // Chat conversation operations
  getChatConversations(userId: number): Promise<ChatConversation[]>;
  getChatConversation(id: number): Promise<ChatConversation | undefined>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: number, data: Partial<ChatConversation>): Promise<ChatConversation | undefined>;
  deleteChatConversation(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private connections: Map<number, Connection>;
  private moments: Map<number, Moment>;
  private badges: Map<number, Badge>;
  private userBadges: Map<number, UserBadge>;
  private menstrualCycles: Map<number, MenstrualCycle>;
  private milestones: Map<number, Milestone>;
  private plans: Map<number, Plan>;
  
  private userId: number;
  private connectionId: number;
  private momentId: number;
  private badgeId: number;
  private userBadgeId: number;
  private menstrualCycleId: number;
  private milestoneId: number;
  private planId: number;

  constructor() {
    // Initialize maps for storage
    this.users = new Map();
    this.connections = new Map();
    this.moments = new Map();
    this.badges = new Map();
    this.userBadges = new Map();
    this.menstrualCycles = new Map();
    this.milestones = new Map();
    this.plans = new Map();
    
    // Initialize auto-incrementing IDs
    this.userId = 1;
    this.connectionId = 1;
    this.momentId = 1;
    this.badgeId = 1;
    this.userBadgeId = 1;
    this.menstrualCycleId = 1;
    this.milestoneId = 1;
    this.planId = 1;
    
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
    
    // Create test connections for the actual user to test with
    const testConnection1: Connection = {
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

    const testConnection2: Connection = {
      id: 3,
      userId: 1, // Actual test user ID
      name: "Jordan",
      relationshipStage: "Dating",
      startDate: new Date('2025-05-15'),
      birthday: new Date('1994-03-20'),
      zodiacSign: "Pisces",
      loveLanguage: "Physical Touch",
      profileImage: null,
      isPrivate: false,
      createdAt: new Date()
    };
    
    this.connections.set(2, testConnection1);
    this.connections.set(3, testConnection2);
    this.connectionId = 4; // Next connection will start from ID 4
    console.log("Created hidden system connection to prevent empty database");
    console.log("Created test connection for user testing");
    
    // Add sample moments with proper tags for calendar visualization
    this.createSampleMoments();
    
    // Add sample plans for testing
    // Sample plans will be created as moments with 'Plan' tags
  }

  private createSampleMoments() {
    // Create moments with different tags for calendar visualization
    const sampleMoments: Moment[] = [
      {
        id: this.momentId++,
        userId: 1,
        connectionId: 2, // Alex
        emoji: "😍",
        content: "Amazing date night! We had such great chemistry.",
        tags: ["Green Flag", "Quality Time", "Intimacy"],
        isPrivate: false,
        isIntimate: false,
        intimacyRating: null,
        relatedToMenstrualCycle: false,
        isResolved: false,
        resolvedAt: null,
        resolutionNotes: null,
        reflection: null,
        createdAt: new Date('2025-05-24T19:30:00')
      },
      {
        id: this.momentId++,
        userId: 1,
        connectionId: 3, // Jordan
        emoji: "💕",
        content: "First official date as a couple! So excited.",
        tags: ["Dating", "Milestone", "Green Flag"],
        isPrivate: false,
        isIntimate: false,
        intimacyRating: null,
        relatedToMenstrualCycle: false,
        isResolved: false,
        resolvedAt: null,
        resolutionNotes: null,
        reflection: null,
        createdAt: new Date('2025-05-25T18:00:00')
      },
      {
        id: this.momentId++,
        userId: 1,
        connectionId: 2,
        emoji: "😔",
        content: "Had a disagreement about future plans. Felt dismissed.",
        tags: ["Red Flag", "Conflict", "Communication"],
        isPrivate: false,
        isIntimate: false,
        intimacyRating: null,
        relatedToMenstrualCycle: false,
        isResolved: false,
        resolvedAt: null,
        resolutionNotes: null,
        reflection: null,
        createdAt: new Date('2025-05-23T14:20:00')
      },
      {
        id: this.momentId++,
        userId: 1,
        connectionId: 2,
        emoji: "💕",
        content: "First time being intimate together. Beautiful connection.",
        tags: ["Intimacy", "Physical Touch", "Green Flag"],
        isPrivate: true,
        isIntimate: true,
        relatedToMenstrualCycle: false,
        isMilestone: true,
        milestoneTitle: "First Intimacy",
        createdAt: new Date('2025-05-22T22:15:00')
      },
      {
        id: this.momentId++,
        userId: 1,
        connectionId: 2,
        emoji: "🗣️",
        content: "Great conversation about our goals and dreams.",
        tags: ["Communication", "Blue Flag", "Growth"],
        isPrivate: false,
        isIntimate: false,
        relatedToMenstrualCycle: false,
        isMilestone: false,
        milestoneTitle: null,
        createdAt: new Date('2025-05-21T16:45:00')
      },
      {
        id: this.momentId++,
        userId: 1,
        connectionId: 2,
        emoji: "❤️",
        content: "Surprise flowers at work! So thoughtful.",
        tags: ["Green Flag", "Acts of Service", "Support"],
        isPrivate: false,
        isIntimate: false,
        relatedToMenstrualCycle: false,
        isMilestone: false,
        milestoneTitle: null,
        createdAt: new Date('2025-05-20T12:30:00')
      }
    ];

    // Add the sample moments to storage
    sampleMoments.forEach(moment => {
      this.moments.set(moment.id, moment);
    });

    // Note: Milestone entries are now created dynamically when connections are created or stages change
    // This prevents duplicate milestone entries in the timeline

    console.log(`Created ${sampleMoments.length} sample moments with proper tags for calendar visualization`);
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
      // === GETTING STARTED BADGES ===
      {
        name: "First Contact",
        description: "Added your very first connection. This is your main character moment!",
        icon: "✨",
        category: "Getting Started",
        unlockCriteria: { connectionsAdded: 1 },
        isRepeatable: false,
      },
      {
        name: "Touch Grass Goddess",
        description: "Made your first real-world connection. No more chronically online behavior, bestie!",
        icon: "🌱",
        category: "Getting Started", 
        unlockCriteria: { firstConnection: true },
        isRepeatable: false,
      },
      {
        name: "Diary Queen",
        description: "Logged your first moment. Welcome to the digital diary life, gorgeous!",
        icon: "📔",
        category: "Getting Started",
        unlockCriteria: { momentsLogged: 1 },
        isRepeatable: false,
      },
      {
        name: "Baby Steps Babe",
        description: "Three days on Kindra. You're getting the hang of this tracking thing!",
        icon: "👶",
        category: "Getting Started",
        unlockCriteria: { streakDays: 3 },
        isRepeatable: false,
      },
      {
        name: "Kindra Newbie",
        description: "First week complete! You're officially part of the family now.",
        icon: "🎓",
        category: "Getting Started",
        unlockCriteria: { streakDays: 7 },
        isRepeatable: false,
      },

      // === RELATIONSHIP STAGE BADGES ===
      {
        name: "Rizz Master",
        description: "Successfully moved from Potential to Talking stage. Your game is strong, honey!",
        icon: "🔥",
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
      {
        name: "Professional Documenter",
        description: "200 moments logged. You could literally write a relationship memoir, darling!",
        icon: "📝",
        category: "Activity",
        unlockCriteria: { momentsLogged: 200 },
        isRepeatable: false,
      },
      {
        name: "Archive Overlord",
        description: "500+ moments! Your life is basically a Netflix series at this point, star!",
        icon: "📚",
        category: "Activity",
        unlockCriteria: { momentsLogged: 500 },
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
      {
        name: "Joy Distributor",
        description: "100+ positive moments. You're basically sunshine in human form, babe!",
        icon: "☀️",
        category: "Positivity",
        unlockCriteria: { positiveMoments: 100 },
        isRepeatable: false,
      },
      {
        name: "Happiness Mogul",
        description: "200+ positive moments. Teaching masterclasses in living your best life, angel!",
        icon: "🎊",
        category: "Positivity",
        unlockCriteria: { positiveMoments: 200 },
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
      {
        name: "Toxicity Detector",
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
        name: "First Conflict Chronicler",
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
        name: "First Peace Maker",
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
      {
        name: "Conversation Curator",
        description: "50+ communication moments. You could host a talk show, gorgeous!",
        icon: "🎙️",
        category: "Communication",
        unlockCriteria: { communicationMoments: 50 },
        isRepeatable: false,
      },
      {
        name: "Word Wizard",
        description: "100+ communication moments. You speak fluent human connection, babe!",
        icon: "🪄",
        category: "Communication",
        unlockCriteria: { communicationMoments: 100 },
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
      {
        name: "Social Network CEO",
        description: "15+ connections managed. You're basically running a relationship empire, hottie!",
        icon: "📈",
        category: "Social Life",
        unlockCriteria: { connectionsAdded: 15 },
        isRepeatable: false,
      },
      {
        name: "Connection Collector",
        description: "20+ connections! Your contact list is giving LinkedIn vibes, sexy!",
        icon: "📇",
        category: "Social Life",
        unlockCriteria: { connectionsAdded: 20 },
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
      {
        name: "Memory Bank",
        description: "Documented 5+ special occasions. You're the keeper of all the moments, babe!",
        icon: "📸",
        category: "Milestones",
        unlockCriteria: { specialMoments: 5 },
        isRepeatable: false,
      },
      {
        name: "Celebration Station",
        description: "10+ milestones tracked. Every moment is worth celebrating with you, hottie!",
        icon: "🎊",
        category: "Milestones",
        unlockCriteria: { specialMoments: 10 },
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
      {
        name: "Plot Twist Queen",
        description: "Documented a major relationship stage change. Life keeps you guessing, hottie!",
        icon: "🎭",
        category: "Achievement",
        unlockCriteria: { majorStageChange: true },
        isRepeatable: false,
      },
      {
        name: "Multi-tasking Maven",
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
        name: "Connection Architect",
        description: "Built and maintained 25+ meaningful relationships. You're an artist, beautiful!",
        icon: "🏗️",
        category: "Legendary",
        unlockCriteria: { connectionArchitect: true },
        isRepeatable: false,
      },
      {
        name: "Zodiac Compatibility Scholar",
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
      (connection) => connection.userId === userId && !connection.isArchived
    );
  }

  async getAllConnectionsByUserId(userId: number): Promise<Connection[]> {
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
    try {
      console.log(`📋 getMomentsByUserId - Starting fetch for user ${userId}`);
      const allMoments = Array.from(this.moments.values());
      console.log(`📋 Total moments in storage: ${allMoments.length}`);
      
      const userMoments = allMoments.filter((moment) => moment.userId === userId);
      console.log(`📋 User ${userId} moments found: ${userMoments.length}`);
      
      const sortedMoments = userMoments.sort((a, b) => {
        try {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        } catch (sortError) {
          console.error(`❌ Error sorting moments:`, sortError);
          return 0;
        }
      });
      
      console.log(`📋 Getting moments for user ${userId}:`, sortedMoments.map(m => ({ id: m.id, emoji: m.emoji, content: m.content?.substring(0, 20) })));
      
      return limit ? sortedMoments.slice(0, limit) : sortedMoments;
    } catch (error) {
      console.error(`❌ Error in getMomentsByUserId:`, error);
      throw error;
    }
  }

  async getMomentsByConnectionId(connectionId: number): Promise<Moment[]> {
    return Array.from(this.moments.values())
      .filter((moment) => moment.connectionId === connectionId)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async createMoment(insertMoment: InsertMoment): Promise<Moment> {
    const id = this.momentId++;
    
    console.log("🗓️ Storage - Creating moment with date:", (insertMoment as any).createdAt);
    
    const moment: Moment = { 
      ...insertMoment, 
      id, 
      createdAt: (insertMoment as any).createdAt ? new Date((insertMoment as any).createdAt) : new Date(),
      tags: insertMoment.tags || null,
      isPrivate: insertMoment.isPrivate || null,
      isIntimate: insertMoment.isIntimate || null,
      intimacyRating: insertMoment.intimacyRating || null,
      relatedToMenstrualCycle: insertMoment.relatedToMenstrualCycle || null
    };
    this.moments.set(id, moment);
    console.log("📝 Storage - Created moment with date:", moment.createdAt.toISOString());
    return moment;
  }

  async updateMoment(id: number, data: Partial<Moment>): Promise<Moment | undefined> {
    const moment = this.moments.get(id);
    if (!moment) {
      console.log(`❌ Moment ${id} not found for update`);
      return undefined;
    }
    
    console.log(`🔄 Updating moment ${id}:`, { before: moment, updateData: data });
    const updatedMoment = { ...moment, ...data };
    this.moments.set(id, updatedMoment);
    console.log(`✅ Moment ${id} updated:`, updatedMoment);
    
    // Verify the update was saved
    const savedMoment = this.moments.get(id);
    console.log(`🔍 Verification - moment ${id} in storage:`, savedMoment);
    
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

  async deleteMenstrualCycle(id: number): Promise<boolean> {
    return this.menstrualCycles.delete(id);
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

  async getPlans(userId: number): Promise<Plan[]> {
    return Array.from(this.plans.values()).filter(plan => plan.userId === userId);
  }

  async getPlansByConnectionId(connectionId: number): Promise<Plan[]> {
    return Array.from(this.plans.values()).filter(plan => plan.connectionId === connectionId);
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const id = this.planId++;
    const newPlan: Plan = { ...plan, id };
    this.plans.set(id, newPlan);
    return newPlan;
  }

  async updatePlan(id: number, data: Partial<Plan>): Promise<Plan | undefined> {
    const plan = this.plans.get(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...data };
    this.plans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deletePlan(id: number): Promise<boolean> {
    return this.plans.delete(id);
  }
}

import { PgStorage } from "./pg-storage";

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();
