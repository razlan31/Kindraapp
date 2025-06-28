import { User } from "../shared/schema";
import { subscriptionPlans } from "../shared/schema";

export interface SubscriptionStatus {
  isPremium: boolean;
  isTrialActive: boolean;
  plan: keyof typeof subscriptionPlans;
  features: typeof subscriptionPlans[keyof typeof subscriptionPlans]['features'];
  usage: {
    connectionsUsed: number;
    aiInsightsUsed: number;
    aiCoachingUsed: number;
  };
  limits: {
    canCreateConnection: boolean;
    canUseAiInsights: boolean;
    canUseAiCoaching: boolean;
    canUseAdvancedAnalytics: boolean;
  };
}

export function getUserSubscriptionStatus(user: User, connectionsCount: number): SubscriptionStatus {
  const now = new Date();
  const plan = (user.subscriptionPlan as keyof typeof subscriptionPlans) || 'free';
  const planFeatures = subscriptionPlans[plan].features;
  
  // Check if user is in trial period
  const isTrialActive = user.trialEndDate ? new Date(user.trialEndDate) > now : false;
  
  // Check if subscription is active
  const isSubscriptionActive = user.subscriptionStatus === 'active' && 
    user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now;
  
  const isPremium = isTrialActive || isSubscriptionActive;
  
  // Reset monthly usage if needed
  const shouldResetUsage = user.lastUsageReset && 
    (now.getTime() - new Date(user.lastUsageReset).getTime()) > (30 * 24 * 60 * 60 * 1000);
  
  const currentUsage = {
    connectionsUsed: connectionsCount,
    aiInsightsUsed: shouldResetUsage ? 0 : (user.monthlyAiInsights || 0),
    aiCoachingUsed: shouldResetUsage ? 0 : (user.monthlyAiCoaching || 0)
  };
  
  // Determine limits based on plan and usage with soft-lock approach
  // Free users can view all their data but are restricted on creation/usage
  const limits = {
    canCreateConnection: isPremium || 
      (planFeatures.connections === "unlimited" || currentUsage.connectionsUsed < planFeatures.connections),
    canUseAiInsights: isPremium || 
      (planFeatures.aiInsightsPerMonth === "unlimited" || currentUsage.aiInsightsUsed < planFeatures.aiInsightsPerMonth),
    canUseAiCoaching: isPremium || 
      (planFeatures.aiCoachingPerMonth === "unlimited" || currentUsage.aiCoachingUsed < planFeatures.aiCoachingPerMonth),
    canUseAdvancedAnalytics: isPremium || planFeatures.advancedAnalytics
  };
  
  return {
    isPremium,
    isTrialActive,
    plan,
    features: planFeatures,
    usage: currentUsage,
    limits
  };
}

export function getConnectionsWithLockStatus(connections: any[], user: User, focusConnectionId?: number): any[] {
  const now = new Date();
  const isTrialActive = user.trialEndDate ? new Date(user.trialEndDate) > now : false;
  const isSubscriptionActive = user.subscriptionStatus === 'active' && 
    user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now;
  const isPremium = isTrialActive || isSubscriptionActive;
  
  // Premium users can access all connections without locks
  if (isPremium) {
    return connections.map(conn => ({ ...conn, isLocked: false }));
  }
  
  // Free users: Show all connections but mark locked status
  // Priority: 1. Focus connection (always unlocked), 2. Most recent connection if no focus
  const activeConnections = connections.filter(conn => !conn.isArchived);
  
  let primaryConnection = null;
  if (focusConnectionId) {
    primaryConnection = activeConnections.find(conn => conn.id === focusConnectionId);
  }
  
  // If no focus connection or focus not found, use most recent
  if (!primaryConnection) {
    const sortedConnections = activeConnections
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    primaryConnection = sortedConnections[0];
  }
  
  // Mark lock status: primary connection + self connections are unlocked for free users
  return connections.map(conn => ({
    ...conn,
    isLocked: !isPremium && conn.id !== primaryConnection?.id && conn.relationshipStage !== 'Self'
  }));
}

export function getAccessibleConnections(connections: any[], user: User, focusConnectionId?: number): any[] {
  const connectionsWithStatus = getConnectionsWithLockStatus(connections, user, focusConnectionId);
  // Return only unlocked connections for API filtering
  return connectionsWithStatus.filter(conn => !conn.isLocked);
}

export function incrementUsage(user: User, type: 'insights' | 'coaching'): Partial<User> {
  const now = new Date();
  const shouldReset = user.lastUsageReset && 
    (now.getTime() - new Date(user.lastUsageReset).getTime()) > (30 * 24 * 60 * 60 * 1000);
  
  if (shouldReset) {
    return {
      monthlyAiInsights: type === 'insights' ? 1 : 0,
      monthlyAiCoaching: type === 'coaching' ? 1 : 0,
      lastUsageReset: now
    };
  }
  
  return {
    monthlyAiInsights: type === 'insights' ? (user.monthlyAiInsights || 0) + 1 : user.monthlyAiInsights,
    monthlyAiCoaching: type === 'coaching' ? (user.monthlyAiCoaching || 0) + 1 : user.monthlyAiCoaching
  };
}

export function startFreeTrial(user: User): Partial<User> {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 5); // 5-day trial
  
  return {
    trialEndDate,
    subscriptionStatus: 'active',
    subscriptionPlan: 'monthly', // Default trial plan
    subscriptionStartDate: new Date()
  };
}