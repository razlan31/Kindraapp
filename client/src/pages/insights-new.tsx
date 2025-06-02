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

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  // Fetch moments
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !!user,
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

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Welcome Section */}
        <section className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-heading font-bold">Welcome back{user?.displayName ? `, ${user.displayName}` : ''}</h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Your relationship insights and patterns
              </p>
            </div>
            <Button
              onClick={() => window.location.href = "/dashboard"}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Track Moment
            </Button>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="px-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-lg font-semibold">{connections.length}</div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-lg font-semibold">{moments.length}</div>
                <div className="text-xs text-muted-foreground">Moments</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-lg font-semibold">{trackingDays}</div>
                <div className="text-xs text-muted-foreground">Days Tracking</div>
              </div>
            </Card>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/connections"}
              className="flex items-center gap-2 h-12"
            >
              <Users className="h-4 w-4" />
              Connections
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/calendar"}
              className="flex items-center gap-2 h-12"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Button>
          </div>
        </section>

        {/* AI Insights and Advice */}
        <section className="px-4 mb-6">
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="insights">
                <TrendingUp className="h-4 w-4 mr-1" /> Insights
              </TabsTrigger>
              <TabsTrigger value="advice">
                <MessageCircle className="h-4 w-4 mr-1" /> Coach
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-1" /> Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="py-4">
              <AIInsights 
                connections={connections} 
                moments={moments} 
                userData={{
                  zodiacSign: user?.zodiacSign || undefined,
                  loveLanguage: user?.loveLanguage || undefined
                }}
              />
            </TabsContent>

            <TabsContent value="advice" className="py-4">
              <AIAdvice 
                connections={connections} 
                moments={moments} 
                userData={{
                  zodiacSign: user?.zodiacSign || undefined,
                  loveLanguage: user?.loveLanguage || undefined
                }}
              />
            </TabsContent>

            <TabsContent value="analytics" className="py-4">
              {moments.length > 0 ? (
                <div className="space-y-6">
                  {/* Emotional Analysis */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Emotional Analysis</CardTitle>
                      <CardDescription>
                        Your most common emotional responses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {emotionData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={emotionData}
                              margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="emoji" />
                              <YAxis />
                              <Tooltip 
                                formatter={(value) => [`${value} moments`, 'Frequency']}
                                labelFormatter={(label) => `Emoji: ${label}`}
                              />
                              <Bar dataKey="count" fill="hsl(var(--primary))" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-center py-10 text-neutral-500">Not enough data yet</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Relationship Health */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Relationship Health</CardTitle>
                      <CardDescription>
                        Connection strength and growth patterns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {connectionStrengths.slice(0, 3).map((connection) => (
                          <div key={connection.id} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{connection.name}</span>
                              <span className="text-sm font-semibold text-primary">
                                {connection.healthScore}% Health Score
                              </span>
                            </div>
                            <div className="text-xs text-neutral-600 dark:text-neutral-400">
                              {connection.positivePatterns} positive patterns out of {connection.totalMoments} moments
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mt-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${connection.healthScore}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">Start Tracking</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Track your first moment to see analytics and patterns
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/dashboard"}
                    size="sm"
                  >
                    Track Your First Moment
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}