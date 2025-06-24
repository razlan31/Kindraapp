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

export function getAccessibleConnections(connections: any[], user: User): any[] {
  const now = new Date();
  const isTrialActive = user.trialEndDate ? new Date(user.trialEndDate) > now : false;
  const isSubscriptionActive = user.subscriptionStatus === 'active' && 
    user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now;
  const isPremium = isTrialActive || isSubscriptionActive;
  
  // Premium users can access all connections
  if (isPremium) {
    return connections;
  }
  
  // Free users: soft-lock approach - show only the most recently created connection
  // but preserve all data for when they upgrade again
  const sortedConnections = connections
    .filter(conn => !conn.isArchived) // Don't count archived connections
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Return only the most recent connection for free users
  return sortedConnections.slice(0, 1);
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