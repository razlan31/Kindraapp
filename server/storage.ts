import {
  users,
  connections,
  moments,
  badges,
  userBadges,
  menstrualCycles,
  milestones,
  plans,
  notifications,
  chatConversations,
  type User,
  type Connection,
  type Moment,
  type Badge,
  type UserBadge,
  type MenstrualCycle,
  type Milestone,
  type Plan,
  type Notification,
  type ChatConversation,
  type UpsertUser,
  type InsertConnection,
  type InsertMoment,
  type InsertBadge,
  type InsertUserBadge,
  type InsertMenstrualCycle,
  type InsertMilestone,
  type InsertPlan,
  type InsertNotification,
  type InsertChatConversation,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined>;
  addPointsToUser(userId: string, points: number): Promise<User>;

  // Connection operations
  getConnection(id: number): Promise<Connection | undefined>;
  getConnectionsByUserId(userId: string): Promise<Connection[]>;
  getAllConnectionsByUserId(userId: string): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnection(id: number, data: Partial<Connection>): Promise<Connection | undefined>;
  deleteConnection(id: number): Promise<boolean>;
  getConnections(userId: string): Promise<Connection[]>;

  // Moment operations
  getMoment(id: number): Promise<Moment | undefined>;
  getMomentsByUserId(userId: string, limit?: number): Promise<Moment[]>;
  getMomentsByConnectionId(connectionId: number): Promise<Moment[]>;
  createMoment(moment: any): Promise<Moment>;
  updateMoment(id: number, data: Partial<Moment>): Promise<Moment | undefined>;
  deleteMoment(id: number): Promise<boolean>;
  getMoments(userId: string, limit?: number): Promise<Moment[]>;

  // Badge operations
  getBadge(id: number): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  addUserBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  awardBadge(userId: string, badgeId: number): Promise<UserBadge>;
  awardBadgeWithPoints(userId: string, badgeId: number): Promise<{ badge: Badge; userBadge: UserBadge; notification: Notification }>;
  initializeBadges(): Promise<void>;

  // Menstrual cycle operations
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
  getPlans(userId: string): Promise<Plan[]>;
  getPlansByConnectionId(connectionId: number): Promise<Plan[]>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, data: Partial<Plan>): Promise<Plan | undefined>;
  deletePlan(id: number): Promise<boolean>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;

  // Chat conversation operations
  getChatConversations(userId: string): Promise<ChatConversation[]>;
  getChatConversation(id: number): Promise<ChatConversation | undefined>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: number, data: Partial<ChatConversation>): Promise<ChatConversation | undefined>;
  deleteChatConversation(id: number): Promise<boolean>;
}

// Import and export the DatabaseStorage implementation
import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();

// Initialize badges when the storage is created
storage.initializeBadges().catch(console.error);