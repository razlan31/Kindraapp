import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users with Google auth support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Changed to varchar for Google ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: text("username").unique(),
  password: text("password"), // Made optional for OAuth users
  displayName: text("display_name"),
  birthday: timestamp("birthday"),
  zodiacSign: text("zodiac_sign"),
  loveLanguage: text("love_language"),
  relationshipGoals: text("relationship_goals"),
  currentFocus: text("current_focus"),
  relationshipStyle: text("relationship_style"),
  personalNotes: text("personal_notes"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("free"), // free, active, canceled, past_due
  subscriptionPlan: text("subscription_plan"), // weekly, monthly, annual
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialEndDate: timestamp("trial_end_date"), // 5-day free trial
  points: integer("points").default(0),
  // Usage tracking for free tier limits
  monthlyAiInsights: integer("monthly_ai_insights").default(0),
  monthlyAiCoaching: integer("monthly_ai_coaching").default(0),
  lastUsageReset: timestamp("last_usage_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans configuration
export const subscriptionPlans = {
  free: {
    name: "Free",
    price: 0,
    interval: null,
    features: {
      connections: 1,
      aiInsightsPerMonth: 3,
      aiCoachingPerMonth: 3,
      advancedAnalytics: false,
      cycleTracking: "basic",
      dataExport: false,
      prioritySupport: false,
      adFree: false
    }
  },
  weekly: {
    name: "Premium Weekly",
    price: 1.99,
    interval: "week",
    features: {
      connections: "unlimited",
      aiInsightsPerMonth: "unlimited",
      aiCoachingPerMonth: "unlimited", 
      advancedAnalytics: true,
      cycleTracking: "advanced",
      dataExport: true,
      prioritySupport: true,
      adFree: true
    }
  },
  monthly: {
    name: "Premium Monthly", 
    price: 4.99,
    interval: "month",
    features: {
      connections: "unlimited",
      aiInsightsPerMonth: "unlimited",
      aiCoachingPerMonth: "unlimited",
      advancedAnalytics: true,
      cycleTracking: "advanced", 
      dataExport: true,
      prioritySupport: true,
      adFree: true
    }
  },
  annual: {
    name: "Premium Annual",
    price: 39.99,
    interval: "year", 
    features: {
      connections: "unlimited",
      aiInsightsPerMonth: "unlimited",
      aiCoachingPerMonth: "unlimited",
      advancedAnalytics: true,
      cycleTracking: "advanced",
      dataExport: true,
      prioritySupport: true,
      adFree: true
    }
  }
} as const;

export const userSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const registrationSchema = userSchema.pick({ username: true, email: true, password: true, displayName: true, zodiacSign: true, loveLanguage: true });
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Relationship stages enum
export const relationshipStages = [
  "Potential",
  "Talking", 
  "Situationship",
  "It's Complicated",
  "Dating",
  "Spouse",
  "FWB",
  "Ex",
  "Friend",
  "Best Friend",
  "Siblings"
] as const;

// Connections (relationships)
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  profileImage: text("profile_image"),
  relationshipStage: text("relationship_stage").notNull(),
  startDate: timestamp("start_date"),
  birthday: timestamp("birthday"),
  zodiacSign: text("zodiac_sign"),
  loveLanguage: text("love_language"),
  isPrivate: boolean("is_private").default(false),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const connectionSchema = createInsertSchema(connections).omit({ id: true, createdAt: true });
export type InsertConnection = z.infer<typeof connectionSchema>;
export type Connection = typeof connections.$inferSelect;

// Moment tags - refined for nuanced relationship insights
export const momentTags = [
  // Connection & Bonding
  "Quality Time",
  "Affection",
  "Support",
  "Trust Building",
  "Celebration",
  "Acts of Service",
  "Words of Affirmation",
  "Physical Touch",
  
  // Communication & Growth
  "Deep Conversation",
  "Vulnerability",
  "Conflict Resolution",
  "Boundary Setting",
  "Compromise",
  "Understanding",
  "Active Listening",
  
  // Challenges & Learning
  "Disagreement",
  "Stress",
  "External Pressure", 
  "Miscommunication",
  "Different Values",
  "Jealousy",
  "Insecurity",
  
  // Personal Development
  "Personal Growth",
  "Life Goals",
  "Career",
  "Future Planning",
  "Self-Reflection",
  
  // Intimacy Categories
  "Emotional Intimacy",
  "Physical Intimacy", 
  "Sexual Intimacy",
  "Intellectual Connection",
  
  // Life Events
  "Milestone",
  "First Time",
  "Surprise",
  "Gift",
  "Special Occasion",
  "Family/Friends",
  
  // Health & Wellness
  "Mental Health",
  "Physical Health",
  "Menstrual Cycle",
  
  // Genuine Red Flags (serious concerns)
  "Disrespect",
  "Manipulation",
  "Boundary Violation",
  "Dishonesty"
] as const;

// Moments (emotional logs)
export const moments = pgTable("moments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  connectionId: integer("connection_id").notNull(),
  title: text("title"),
  emoji: text("emoji").notNull(),
  content: text("content").notNull(),
  tags: json("tags").$type<string[]>(),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  isIntimate: boolean("is_intimate").default(false),
  intimacyRating: text("intimacy_rating"),
  relatedToMenstrualCycle: boolean("related_to_menstrual_cycle").default(false),
  // Media attachments
  mediaFiles: json("media_files").$type<{
    id: string;
    type: 'photo' | 'video';
    url: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }[]>(),
  // Conflict resolution fields
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  // Reflection field
  reflection: text("reflection"),
});

export const momentSchema = createInsertSchema(moments).omit({ id: true }).extend({
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional().default(false),
  isIntimate: z.boolean().optional().default(false),
  relatedToMenstrualCycle: z.boolean().optional().default(false),
  isResolved: z.boolean().optional().default(false),
  createdAt: z.string().optional(),
  resolvedAt: z.string().optional().nullable(),
});
export type InsertMoment = z.infer<typeof momentSchema>;
export type Moment = typeof moments.$inferSelect;

// Badges
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  unlockCriteria: json("unlock_criteria").notNull(),
  isRepeatable: boolean("is_repeatable").default(false),
  points: integer("points").default(10),
});

export const badgeSchema = createInsertSchema(badges).omit({ id: true });
export type InsertBadge = z.infer<typeof badgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User Badges (junction table) - supports multiple unlocks of same badge
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  pointsAwarded: integer("points_awarded").default(0),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const userBadgeSchema = createInsertSchema(userBadges).omit({ id: true, unlockedAt: true });
export type InsertUserBadge = z.infer<typeof userBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// Notifications table for badge unlocks and other alerts
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // "badge_unlock", "milestone", "reminder", etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  badgeId: integer("badge_id"), // For badge unlock notifications
  pointsAwarded: integer("points_awarded").default(0),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof notificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Menstrual cycles with pattern learning
export const menstrualCycles = pgTable("menstrual_cycles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  connectionId: integer("connection_id"), // null means tracking for user themselves
  
  // Core cycle dates
  periodStartDate: timestamp("period_start_date").notNull(), // When period begins
  periodEndDate: timestamp("period_end_date"), // When period ends
  cycleEndDate: timestamp("cycle_end_date"), // When full cycle ends (before next period)
  
  // Cycle metadata
  cycleLength: integer("cycle_length"), // Total days in cycle (calculated)
  periodLength: integer("period_length"), // Days of menstruation (calculated)
  
  // Cycle status and prediction
  isActive: boolean("is_active").default(false), // Currently ongoing cycle
  isPredicted: boolean("is_predicted").default(false), // Auto-generated prediction
  isCompleted: boolean("is_completed").default(false), // Manually completed by user
  
  // Pattern data for learning
  patternVersion: integer("pattern_version").default(1), // Tracks pattern changes
  
  // User data
  notes: text("notes"),
  mood: text("mood"),
  symptoms: json("symptoms").$type<string[]>(),
  flowIntensity: text("flow_intensity"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cycle patterns for learning and prediction
export const cyclePatterns = pgTable("cycle_patterns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  connectionId: integer("connection_id"), // null means user's own pattern
  
  // Pattern statistics
  averageCycleLength: integer("average_cycle_length").notNull(),
  averagePeriodLength: integer("average_period_length").notNull(),
  
  // Pattern confidence (based on number of cycles used to calculate)
  sampleSize: integer("sample_size").notNull(),
  confidenceScore: integer("confidence_score").notNull(), // 1-100
  
  // Pattern validity
  isActive: boolean("is_active").default(true), // Current active pattern
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const menstrualCycleSchema = createInsertSchema(menstrualCycles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  cycleLength: true,
  periodLength: true
}).extend({
  periodStartDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  periodEndDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  cycleEndDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const cyclePatternSchema = createInsertSchema(cyclePatterns).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type InsertMenstrualCycle = z.infer<typeof menstrualCycleSchema>;
export type MenstrualCycle = typeof menstrualCycles.$inferSelect;
export type InsertCyclePattern = z.infer<typeof cyclePatternSchema>;
export type CyclePattern = typeof cyclePatterns.$inferSelect;

// Relationship Milestones
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  connectionId: integer("connection_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  isAnniversary: boolean("is_anniversary").default(false),
  isRecurring: boolean("is_recurring").default(false),
  color: text("color").default("#C084FC"), // Default milestone color
  icon: text("icon").default("cake"),
});

export const milestoneSchema = createInsertSchema(milestones).omit({ id: true }).extend({
  date: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});
export type InsertMilestone = z.infer<typeof milestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

// Plans table for future activities with connections
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  connectionId: integer("connection_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "date", "call", "movie", "hiking", "dinner", "other"
  scheduledDate: timestamp("scheduled_date").notNull(),
  location: text("location"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const planSchema = createInsertSchema(plans).omit({ id: true }).extend({
  scheduledDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});
export type InsertPlan = z.infer<typeof planSchema>;
export type Plan = typeof plans.$inferSelect;

// Chat conversations table for AI coach history
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  messages: json("messages").notNull(), // Array of ChatMessage objects
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatConversationSchema = createInsertSchema(chatConversations).omit({ id: true });
export type InsertChatConversation = z.infer<typeof chatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
