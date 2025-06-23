import { useQuery } from "@tanstack/react-query";

export interface SubscriptionStatus {
  isPremium: boolean;
  isTrialActive: boolean;
  plan: 'free' | 'weekly' | 'monthly' | 'annual';
  features: {
    connections: number | "unlimited";
    aiInsightsPerMonth: number | "unlimited";
    aiCoachingPerMonth: number | "unlimited";
    advancedAnalytics: boolean;
    cycleTracking: "basic" | "advanced";
    dataExport: boolean;
    prioritySupport: boolean;
    adFree: boolean;
  };
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

export function useSubscription() {
  const query = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...query,
    subscriptionStatus: query.data,
    isPremium: query.data?.isPremium || false,
    isTrialActive: query.data?.isTrialActive || false,
    canCreateConnection: query.data?.limits.canCreateConnection || false,
    canUseAiInsights: query.data?.limits.canUseAiInsights || false,
    canUseAiCoaching: query.data?.limits.canUseAiCoaching || false,
    usage: query.data?.usage || { connectionsUsed: 0, aiInsightsUsed: 0, aiCoachingUsed: 0 },
    features: query.data?.features || {
      connections: 1,
      aiInsightsPerMonth: 3,
      aiCoachingPerMonth: 3,
      advancedAnalytics: false,
      cycleTracking: "basic",
      dataExport: false,
      prioritySupport: false,
      adFree: false
    }
  };
}