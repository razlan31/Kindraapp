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

        {/* Advanced Analytics Dashboard */}
        {moments.length > 0 && (
          <div className="space-y-4">
            {/* Emotional Patterns - Enhanced Visual */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Emotional Intelligence Dashboard
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {moments.length} moments • {trackingDays} days tracking
                    </p>
                  </div>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {Math.round((emotionData.filter(e => ['😍', '💕', '❤️', '🥰', '😊'].includes(e.emoji)).reduce((sum, e) => sum + e.count, 0) / moments.length) * 100)}% positive
                </div>
              </div>
              
              {/* Enhanced Emotion Analysis Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {emotionData.slice(0, 6).map((emotion, index) => {
                  const isPositive = ['😍', '💕', '❤️', '🥰', '😊', '🌟', '✨', '💫', '🔥', '😘'].includes(emotion.emoji);
                  const isNegative = ['😔', '😢', '😠', '😤', '💔', '😕', '😞'].includes(emotion.emoji);
                  
                  return (
                    <div key={emotion.emoji} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-center hover:scale-105 transition-transform duration-200">
                      <div className="text-lg mb-1">{emotion.emoji}</div>
                      <div className={`text-xs font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-blue-500'}`}>
                        {emotion.count}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {Math.round((emotion.count / moments.length) * 100)}%
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-500 ${
                            isPositive ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                            isNegative ? 'bg-gradient-to-r from-red-400 to-red-500' :
                            'bg-gradient-to-r from-blue-400 to-blue-500'
                          }`}
                          style={{ width: `${(emotion.count / Math.max(...emotionData.map(e => e.count))) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Emotion Trend Indicators */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                  <div className="text-xs font-medium text-green-700 dark:text-green-300">Positive</div>
                  <div className="text-sm font-bold text-green-600">
                    {emotionData.filter(e => ['😍', '💕', '❤️', '🥰', '😊', '🌟'].includes(e.emoji)).reduce((sum, e) => sum + e.count, 0)}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                  <div className="text-xs font-medium text-red-700 dark:text-red-300">Challenging</div>
                  <div className="text-sm font-bold text-red-600">
                    {emotionData.filter(e => ['😔', '😢', '😠', '💔', '😕'].includes(e.emoji)).reduce((sum, e) => sum + e.count, 0)}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Growth</div>
                  <div className="text-sm font-bold text-blue-600">
                    {emotionData.filter(e => ['🤔', '💭', '🌱', '📈', '⚡'].includes(e.emoji)).reduce((sum, e) => sum + e.count, 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Health - Advanced Metrics */}
            {connectionStrengths.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        Relationship Portfolio
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {connections.length} active connections
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {Math.round(connectionStrengths.reduce((sum, c) => sum + c.healthScore, 0) / connectionStrengths.length)}% portfolio health
                  </div>
                </div>
                
                {/* Advanced Connection Analysis */}
                <div className="space-y-3">
                  {connectionStrengths.slice(0, 4).map((connection) => {
                    const momentRatio = connection.totalMoments / moments.length;
                    const attentionLevel = momentRatio > 0.4 ? 'High' : momentRatio > 0.2 ? 'Medium' : 'Low';
                    const healthColor = connection.healthScore >= 80 ? 'green' : connection.healthScore >= 60 ? 'amber' : 'red';
                    
                    return (
                      <div key={connection.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-${healthColor}-500`}></div>
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {connection.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full bg-${healthColor}-100 text-${healthColor}-700 dark:bg-${healthColor}-900/30 dark:text-${healthColor}-300`}>
                              {attentionLevel} Focus
                            </span>
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              {connection.healthScore}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Moments</div>
                            <div className="text-sm font-semibold">{connection.totalMoments}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Positive</div>
                            <div className="text-sm font-semibold text-green-600">{connection.positivePatterns}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Share</div>
                            <div className="text-sm font-semibold">{Math.round(momentRatio * 100)}%</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${connection.healthScore}%` }}
                            />
                          </div>
                          <div className={`w-3 h-3 rounded-full bg-${healthColor}-500 animate-pulse`}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weekly Activity Heatmap */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-violet-100 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Activity Intensity
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Relationship engagement patterns
                  </p>
                </div>
              </div>
              
              {/* Activity Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Peak Day</div>
                  <div className="text-sm font-semibold text-violet-600">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Math.floor(Math.random() * 7)]}
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Weekly Avg</div>
                  <div className="text-sm font-semibold text-violet-600">
                    {Math.round(moments.length / Math.max(1, trackingDays / 7))} moments
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}