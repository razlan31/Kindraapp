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
  const { user, loading } = useAuth();

  console.log("InsightsNew - user:", !!user, "user ID:", user?.id, "loading:", loading);

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !loading && !!user,
  });

  // Fetch moments
  const { data: moments = [], isLoading: momentsLoading, error: momentsError } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !loading && !!user,
  });

  console.log("InsightsNew - moments query:", {
    momentsLength: moments.length,
    momentsLoading,
    momentsError,
    userEnabled: !loading && !!user,
    loading
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

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-6 space-y-8">
        {/* AI Relationship Coach - Main Feature */}
        <AIChat />

        {/* AI Insights Section */}
        <AIInsights 
          connections={connections} 
          moments={moments} 
          userData={{
            zodiacSign: user?.zodiacSign || undefined,
            loveLanguage: user?.loveLanguage || undefined
          }}
        />

        {/* Enhanced Analytics Section */}
        {moments.length > 0 && (
          <div className="space-y-6">
            {/* Emotional Patterns Card */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Emotional Patterns
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your emotional journey over time
                  </p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 h-56">
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
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#emotionGradient)" 
                      radius={[6, 6, 0, 0]} 
                    />
                    <defs>
                      <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Connection Health Card */}
            {connectionStrengths.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      Connection Health
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Strength of your relationships
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {connectionStrengths.slice(0, 3).map((connection) => (
                    <div key={connection.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {connection.name}
                        </span>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {connection.healthScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${connection.healthScore}%` }}
                        />
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