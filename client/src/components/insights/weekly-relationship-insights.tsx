import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Connection, Moment } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Calendar, TrendingUp, Heart, Users, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeeklyInsightsProps {
  connections: Connection[];
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

interface WeeklyInsight {
  title: string;
  insight: string;
  dataSource: string;
  actionableAdvice: string;
  confidence: number;
  type: 'positive' | 'neutral' | 'growth';
  weekOf: string;
}

export function WeeklyRelationshipInsights({ connections, moments, userData }: WeeklyInsightsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();

  // Get current week identifier for caching
  const getCurrentWeek = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber}`;
  };

  const currentWeek = getCurrentWeek();

  // Fetch weekly insights
  const { data: weeklyInsight, isLoading, refetch } = useQuery<WeeklyInsight>({
    queryKey: ['/api/weekly-insights', currentWeek],
    enabled: isAuthenticated && moments.length >= 5, // Only fetch if authenticated and sufficient data
    staleTime: 1000 * 60 * 60 * 24 * 7, // Cache for 1 week
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate fallback insight based on actual data
  const generateFallbackInsight = (): WeeklyInsight => {
    if (moments.length < 5) {
      return {
        title: "Building Your Relationship Data",
        insight: "You're just getting started with tracking relationship moments. As you add more entries, you'll unlock deeper weekly insights about your relationship patterns and growth opportunities.",
        dataSource: `Based on ${moments.length} tracked moments`,
        actionableAdvice: "Continue tracking daily moments to reveal meaningful patterns in your relationships.",
        confidence: 50,
        type: 'neutral',
        weekOf: currentWeek
      };
    }

    // Analyze recent week's data
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentMoments = moments.filter(m => 
      new Date(m.createdAt || '') >= oneWeekAgo
    );

    const positiveEmojis = ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖', '🌟', '✨', '💫', '🔥', '😘'];
    const recentPositive = recentMoments.filter(m => positiveEmojis.includes(m.emoji)).length;
    const positiveRatio = recentMoments.length > 0 ? recentPositive / recentMoments.length : 0;

    if (positiveRatio >= 0.7) {
      return {
        title: "Thriving Connection Patterns",
        insight: `Your relationships are showing strong positive momentum with ${Math.round(positiveRatio * 100)}% of your recent moments being positive. This indicates healthy communication and emotional connection across your relationships.`,
        dataSource: `Based on ${recentMoments.length} moments from the past week`,
        actionableAdvice: "Maintain this positive trajectory by continuing the behaviors that are working well and being mindful of what contributes to these good moments.",
        confidence: 85,
        type: 'positive',
        weekOf: currentWeek
      };
    } else if (positiveRatio < 0.4) {
      return {
        title: "Relationship Reflection Opportunity",
        insight: `Your recent relationship data shows ${Math.round(positiveRatio * 100)}% positive moments, suggesting some challenges. This is normal and provides valuable insight into areas that need attention.`,
        dataSource: `Based on ${recentMoments.length} moments from the past week`,
        actionableAdvice: "Focus on open communication with your connections and consider what specific situations or patterns might benefit from a different approach.",
        confidence: 80,
        type: 'growth',
        weekOf: currentWeek
      };
    } else {
      // Analyze communication patterns
      const communicationMoments = recentMoments.filter(m => 
        m.content && (
          m.content.toLowerCase().includes('text') ||
          m.content.toLowerCase().includes('call') ||
          m.content.toLowerCase().includes('talk') ||
          m.content.toLowerCase().includes('conversation')
        )
      );

      return {
        title: "Communication Pattern Analysis",
        insight: `Your relationship data shows ${communicationMoments.length} communication-focused moments out of ${recentMoments.length} total interactions this week. This reveals your current communication frequency and style preferences.`,
        dataSource: `Based on ${recentMoments.length} moments from the past week`,
        actionableAdvice: communicationMoments.length > recentMoments.length * 0.6 
          ? "Balance your strong communication habits with more in-person activities and shared experiences."
          : "Consider increasing intentional communication moments to deepen your connections.",
        confidence: 75,
        type: 'neutral',
        weekOf: currentWeek
      };
    }
  };

  const displayInsight = weeklyInsight || generateFallbackInsight();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800';
      case 'growth':
        return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <Heart className="h-5 w-5 text-green-600" />;
      case 'growth':
        return <TrendingUp className="h-5 w-5 text-amber-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
              <Calendar className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <CardTitle className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Loading Weekly Insights
              </CardTitle>
              <CardDescription>
                Analyzing your relationship patterns...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`${getTypeStyles(displayInsight.type)} border transition-all duration-300 hover:shadow-lg`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
              {getTypeIcon(displayInsight.type)}
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {displayInsight.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3" />
                Week of {displayInsight.weekOf} • Updates every Monday
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
            This Week's Insight
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {displayInsight.insight}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
            Actionable Next Steps
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {displayInsight.actionableAdvice}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            {displayInsight.dataSource}
          </div>
          <Badge variant="secondary" className="text-xs">
            {displayInsight.confidence}% confidence
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 rounded-md px-3 py-2 mt-4">
          <strong>Weekly Insights</strong> refresh every Monday and are based on your relationship data patterns. 
          The more moments you track, the more personalized and accurate your insights become.
        </div>
      </CardContent>
    </Card>
  );
}