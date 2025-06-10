import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  profileImage: text("profile_image"),
  birthday: timestamp("birthday"),
  zodiacSign: text("zodiac_sign"),
  loveLanguage: text("love_language"),
  relationshipGoals: text("relationship_goals"),
  currentFocus: text("current_focus"),
  relationshipStyle: text("relationship_style"),
  personalNotes: text("personal_notes"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof userSchema>;
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
  userId: integer("user_id").notNull(),
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
  userId: integer("user_id").notNull(),
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
});

export const badgeSchema = createInsertSchema(badges).omit({ id: true });
export type InsertBadge = z.infer<typeof badgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User Badges (junction table)
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const userBadgeSchema = createInsertSchema(userBadges).omit({ id: true, unlockedAt: true });
export type InsertUserBadge = z.infer<typeof userBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// Menstrual cycles
export const menstrualCycles = pgTable("menstrual_cycles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  connectionId: integer("connection_id"), // null means tracking for user themselves
  startDate: timestamp("start_date").notNull(), // Period start date
  periodEndDate: timestamp("period_end_date"), // Period end date (menstruation ends)
  endDate: timestamp("end_date"), // Full cycle end date (optional, for completed cycles)
  notes: text("notes"),
  mood: text("mood"),
  symptoms: json("symptoms").$type<string[]>(),
  flowIntensity: text("flow_intensity"),
});

export const menstrualCycleSchema = createInsertSchema(menstrualCycles).omit({ id: true }).extend({
  startDate: z.string().or(z.date()).transform((val) => {
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
  endDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});
export type InsertMenstrualCycle = z.infer<typeof menstrualCycleSchema>;
export type MenstrualCycle = typeof menstrualCycles.$inferSelect;

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
