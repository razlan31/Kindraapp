import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Connection, Moment } from "@shared/schema";
import { TrendingUp, Calendar, Heart, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";

export function AIInsights() {
  const { user } = useAuth();
  
  const { data: connections = [], isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    enabled: !!user
  });

  const { data: moments = [], isLoading: momentsLoading } = useQuery<Moment[]>({
    queryKey: ['/api/moments'],
    enabled: !!user
  });

  // Show loading state while data is being fetched
  if (connectionsLoading || momentsLoading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Loading relationship analytics...
            </p>
          </div>
        </div>
        <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  // Show no data message if no connections or moments
  if (!connections?.length && !moments?.length) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Smart patterns from your relationship data
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-700 dark:to-pink-700 rounded-full opacity-20 animate-pulse"></div>
            <Calendar className="h-16 w-16 mx-auto text-purple-500 relative z-10" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Keep tracking moments to unlock personalized relationship insights and patterns
          </p>
        </div>
      </div>
    );
  }

  // Simple insights based on available data
  const insights = [];
  
  if (connections?.length > 0) {
    insights.push({
      title: `${connections.length} Active Connection${connections.length > 1 ? 's' : ''}`,
      description: "Building meaningful relationships",
      icon: <Users className="h-4 w-4 text-blue-500" />
    });
  }
  
  if (moments?.length > 0) {
    insights.push({
      title: `${moments.length} Moment${moments.length > 1 ? 's' : ''} Tracked`,
      description: "Great progress in relationship awareness",
      icon: <Heart className="h-4 w-4 text-pink-500" />
    });
  }

  // Calculate activity in last 7 days
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const recentMoments = moments?.filter(m => 
    m.createdAt && new Date(m.createdAt) > lastWeek
  ) || [];

  if (recentMoments.length > 0) {
    insights.push({
      title: `${recentMoments.length} Recent Activities`,
      description: "Staying active in your relationships",
      icon: <TrendingUp className="h-4 w-4 text-green-500" />
    });
  }

  // Show simple fallback if no insights
  if (insights.length === 0) {
    insights.push({
      title: "Welcome to Kindra",
      description: "Start by adding your first connection to unlock insights",
      icon: <Heart className="h-4 w-4 text-purple-500" />
    });
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Insights
          </h3>
          <p className="text-sm text-muted-foreground">
            Smart patterns from your relationship data
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-100 dark:border-purple-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {insight.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}