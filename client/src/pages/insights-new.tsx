import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Connection, Moment } from "@shared/schema";
import { AIInsights } from "@/components/insights/ai-insights";
import { AIAdvice } from "@/components/insights/ai-advice";
import { AIChat } from "@/components/ai-chat";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { 
  Calendar,
  Heart,
  BarChart3,
  Plus,
  TrendingUp,
  Users,
  MessageCircle,
  Activity
} from "lucide-react";

export default function InsightsNew() {
  const { user } = useAuth();

  console.log("InsightsNew - user:", !!user, "user ID:", user?.id);

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  // Fetch moments
  const { data: moments = [], isLoading: momentsLoading, error: momentsError } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !!user,
  });

  console.log("InsightsNew - moments query:", {
    momentsLength: moments.length,
    momentsLoading,
    momentsError,
    userEnabled: !!user
  });

  // Prepare emotion data for charts
  const emotionCounts = moments.reduce((acc: Record<string, number>, moment) => {
    if (!acc[moment.emoji]) {
      acc[moment.emoji] = 0;
    }
    acc[moment.emoji]++;
    return acc;
  }, {});

  const emotionData = Object.keys(emotionCounts).map(emoji => ({
    emoji,
    count: emotionCounts[emoji]
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  // Connection with strongest positive patterns
  const connectionStrengths = connections.map(connection => {
    const connectionMoments = moments.filter(m => m.connectionId === connection.id);
    
    // Count positive engagement patterns
    const positivePatterns = connectionMoments.filter(m => 
      m.tags?.some(tag => [
        'Quality Time', 'Affection', 'Support', 'Trust Building',
        'Deep Conversation', 'Vulnerability', 'Conflict Resolution',
        'Understanding', 'Emotional Intimacy', 'Acts of Service'
      ].includes(tag))
    ).length;

    const totalMoments = connectionMoments.length;
    const positiveRatio = totalMoments > 0 ? positivePatterns / totalMoments : 0;

    return {
      id: connection.id,
      name: connection.name,
      positivePatterns,
      totalMoments,
      healthScore: Math.round(positiveRatio * 100)
    };
  }).sort((a, b) => b.healthScore - a.healthScore);

  // Calculate days since first moment
  const firstMomentDate = moments.length > 0 ? 
    new Date(moments.slice().sort((a, b) => 
      new Date(a.createdAt || "").valueOf() - new Date(b.createdAt || "").valueOf()
    )[0].createdAt || "") : undefined;
  
  const trackingDays = firstMomentDate ? 
    Math.ceil((new Date().getTime() - firstMomentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-6">
        {/* AI Insights Section */}
        <div className="mb-8">
          <AIInsights 
            connections={connections} 
            moments={moments} 
            userData={{
              zodiacSign: user?.zodiacSign || undefined,
              loveLanguage: user?.loveLanguage || undefined
            }}
          />
        </div>

        {/* AI Relationship Coach - Main Feature */}
        <div className="mb-8">
          <AIChat />
        </div>

        {/* Analytics Section */}
        {moments.length > 0 && (
          <div className="space-y-4">
            {/* Emotional Analysis */}
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <h3 className="font-medium text-sm mb-3">Emotional Patterns</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={emotionData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <XAxis dataKey="emoji" />
                    <YAxis hide />
                    <Tooltip 
                      formatter={(value) => [`${value} moments`, 'Frequency']}
                      labelFormatter={(label) => `Emoji: ${label}`}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Connection Health Summary */}
            {connectionStrengths.length > 0 && (
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                <h3 className="font-medium text-sm mb-3">Connection Health</h3>
                <div className="space-y-2">
                  {connectionStrengths.slice(0, 3).map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between">
                      <span className="text-sm">{connection.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1">
                          <div 
                            className="bg-primary h-1 rounded-full transition-all duration-300" 
                            style={{ width: `${connection.healthScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {connection.healthScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}