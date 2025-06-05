import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Connection, Moment } from "@shared/schema";
import { AIInsights } from "@/components/insights/ai-insights";
import { AIAdvice } from "@/components/insights/ai-advice";
import { PersonalizedReflection } from "@/components/insights/personalized-reflection";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  Brain, 
  Calendar, 
  Flag, 
  Heart, 
  LineChart, 
  Sparkles, 
  Star,
  BarChart3,
  ChevronRight,
  Zap,
  Plus,
  TrendingUp,
  Users,
  MessageCircle,
  Activity
} from "lucide-react";

export default function Insights() {
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

  // Prepare relationship stage data
  const stageData = connections.reduce((acc: Record<string, number>, connection) => {
    if (!acc[connection.relationshipStage]) {
      acc[connection.relationshipStage] = 0;
    }
    acc[connection.relationshipStage]++;
    return acc;
  }, {});

  const relationshipStageData = Object.keys(stageData).map(stage => ({
    stage,
    value: stageData[stage]
  }));

  // Prepare tag data
  const tagCounts: Record<string, number> = {};
  moments.forEach(moment => {
    if (moment.tags && moment.tags.length) {
      moment.tags.forEach(tag => {
        if (!tagCounts[tag]) {
          tagCounts[tag] = 0;
        }
        tagCounts[tag]++;
      });
    }
  });

  const tagData = Object.keys(tagCounts).map(tag => ({
    tag,
    count: tagCounts[tag]
  })).sort((a, b) => b.count - a.count);

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

  // Calculate color for pie chart
  const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD166', '#20C997', '#FD7E14'];

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

        {/* AI Personalized Insights - Main Feature */}
        {connections.length > 0 && (
          <section className="px-4 mb-6">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Relationship Insights
                </CardTitle>
                <CardDescription>
                  Get personalized insights about your relationship with {connections[0]?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PersonalizedReflection
                  connectionId={connections[0].id}
                  connectionName={connections[0].name}
                  connectionHealthScore={connectionStrengths.find(c => c.id === connections[0].id)?.healthScore}
                />
              </CardContent>
            </Card>
          </section>
        )}

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
                    <p className="text-center py-10 text-neutral-500">No tags yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Zodiac Tab */}
            <TabsContent value="zodiac" className="px-4 py-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Zodiac Compatibility</CardTitle>
                  <CardDescription>
                    Astrological insights for your connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user?.zodiacSign ? (
                    <div className="space-y-4">
                      {connections.filter(c => c.zodiacSign).map(connection => {
                        const isCompatible = (() => {
                          const fireSign = ['Aries', 'Leo', 'Sagittarius'];
                          const earthSign = ['Taurus', 'Virgo', 'Capricorn'];
                          const airSign = ['Gemini', 'Libra', 'Aquarius'];
                          const waterSign = ['Cancer', 'Scorpio', 'Pisces'];
                          
                          const userElement = user?.zodiacSign ? 
                                              (fireSign.includes(user.zodiacSign) ? 'fire' :
                                              earthSign.includes(user.zodiacSign) ? 'earth' :
                                              airSign.includes(user.zodiacSign) ? 'air' : 'water')
                                              : 'unknown';
                                              
                          const connectionElement = connection.zodiacSign ? 
                                                    (fireSign.includes(connection.zodiacSign) ? 'fire' :
                                                    earthSign.includes(connection.zodiacSign) ? 'earth' :
                                                    airSign.includes(connection.zodiacSign) ? 'air' : 'water')
                                                    : 'unknown';
                          
                          // Most compatible: Fire-Air, Earth-Water
                          return (userElement === 'fire' && connectionElement === 'air') ||
                                (userElement === 'air' && connectionElement === 'fire') ||
                                (userElement === 'earth' && connectionElement === 'water') ||
                                (userElement === 'water' && connectionElement === 'earth') ||
                                (userElement === connectionElement);
                        })();
                        
                        return (
                          <div key={connection.id} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{connection.name}</span>
                              <span className="text-sm text-neutral-500 dark:text-neutral-400">{connection.zodiacSign}</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`h-2 rounded-full ${isCompatible ? 'bg-green-500' : 'bg-amber-500'} flex-1`}></div>
                              <span className="text-xs ml-2">
                                {isCompatible ? 'Compatible elements' : 'May require more effort'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {connections.filter(c => c.zodiacSign).length === 0 && (
                        <p className="text-center py-2 text-neutral-500">Add zodiac signs to your connections to see compatibility</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Star className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">Add your zodiac sign</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your profile to add your zodiac sign for personalized compatibility insights
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Love Language</CardTitle>
                  <CardDescription>
                    Insights based on how you give and receive love
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user?.loveLanguage ? (
                    <div className="space-y-4">
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                        <p className="text-sm mb-2">
                          Your love language is <span className="font-medium">{user.loveLanguage}</span>. This is how you prefer to receive affection.
                        </p>
                        
                        <p className="text-sm">
                          {user.loveLanguage === 'Words of Affirmation' ? 
                            'You feel most loved when receiving verbal compliments and hearing "I love you".' :
                           user.loveLanguage === 'Quality Time' ? 
                            'You feel most loved when someone gives you their undivided attention.' :
                           user.loveLanguage === 'Physical Touch' ? 
                            'You feel most loved through physical closeness, including hugs, kisses, and cuddling.' :
                           user.loveLanguage === 'Acts of Service' ? 
                            'You feel most loved when others do things to help you or ease your burden.' :
                           'You feel most loved when receiving thoughtful gifts that show you are known and valued.'}
                        </p>
                      </div>
                      
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Compatibility tip:</span> When connecting with others, pay attention to their love language. It may differ from yours, creating an opportunity for growth and understanding.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">Add your love language</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your profile to add your love language for personalized relationship insights
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patterns Tab */}
            <TabsContent value="patterns" className="px-4 py-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Tracking Patterns</CardTitle>
                  <CardDescription>
                    Insights from your relationship journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-primary mr-2" />
                        <span>Days tracking</span>
                      </div>
                      <span className="font-medium">{trackingDays}</span>
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 text-secondary mr-2" />
                        <span>Moments logged</span>
                      </div>
                      <span className="font-medium">{moments.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 text-primary mr-2" />
                        <span>Active connections</span>
                      </div>
                      <span className="font-medium">{connections.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <LineChart className="h-4 w-4 text-accent mr-2" />
                        <span>Emotions tracked</span>
                      </div>
                      <span className="font-medium">{Object.keys(emotionCounts).length}</span>
                    </div>
                    
                    <div className="pt-4">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        The relationship pattern analysis is now active! Log your emotions consistently to reveal deeper insights about your connections.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Relationship Signal Analysis</CardTitle>
                  <CardDescription>
                    Stage-specific patterns based on your emotional responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connections.length > 0 && moments.length > 0 ? (
                    <div className="space-y-4">
                      {connections.map(connection => {
                        // Get all moments for this connection
                        const connectionMoments = moments.filter(m => m.connectionId === connection.id);
                        
                        if (connectionMoments.length < 3) {
                          return null; // Not enough data for meaningful analysis
                        }
                        
                        // Analyze mood patterns
                        const happyMoments = connectionMoments.filter(m => 
                          ['😃', '🙂', '😊', '❤️', '😍', '🥰'].includes(m.emoji)
                        ).length;
                        
                        const unhappyMoments = connectionMoments.filter(m => 
                          ['😕', '😞', '😢', '😠', '😡'].includes(m.emoji)
                        ).length;
                        
                        const neutralMoments = connectionMoments.length - happyMoments - unhappyMoments;
                        
                        // Analyze flag patterns
                        const greenFlags = connectionMoments.filter(m => 
                          m.tags?.includes('Green Flag')
                        ).length;
                        
                        const redFlags = connectionMoments.filter(m => 
                          m.tags?.includes('Red Flag')
                        ).length;
                        
                        const blueFlags = connectionMoments.filter(m => 
                          m.tags?.includes('Blue Flag')
                        ).length;
                        
                        // Sort moments by date to check for patterns over time
                        const sortedMoments = [...connectionMoments].sort((a, b) => {
                          const dateA = new Date(a.createdAt || "");
                          const dateB = new Date(b.createdAt || "");
                          return dateA.valueOf() - dateB.valueOf();
                        });
                        
                        // Check for emotional fluctuations (potential mixed signals)
                        let fluctuationCount = 0;
                        for (let i = 1; i < sortedMoments.length; i++) {
                          const prevMood = ['😃', '🙂', '😊', '❤️', '😍', '🥰'].includes(sortedMoments[i-1].emoji) ? 'happy' :
                                          ['😕', '😞', '😢', '😠', '😡'].includes(sortedMoments[i-1].emoji) ? 'unhappy' : 'neutral';
                          
                          const currentMood = ['😃', '🙂', '😊', '❤️', '😍', '🥰'].includes(sortedMoments[i].emoji) ? 'happy' :
                                             ['😕', '😞', '😢', '😠', '😡'].includes(sortedMoments[i].emoji) ? 'unhappy' : 'neutral';
                          
                          if (prevMood !== currentMood && (prevMood === 'happy' || currentMood === 'happy')) {
                            fluctuationCount++;
                          }
                        }
                        
                        // Analyze relationship patterns based on stage and mood fluctuations
                        let patternType = "";
                        let patternDescription = "";
                        const hasFluctuations = fluctuationCount > connectionMoments.length * 0.4;
                        const isPositive = happyMoments > connectionMoments.length * 0.6;
                        const isNegative = unhappyMoments > connectionMoments.length * 0.5;
                        const isNeutral = neutralMoments > connectionMoments.length * 0.5;
                        
                        // Adjust insights based on relationship stage for more context-aware analysis
                        if (connection.relationshipStage === "Talking") {
                          // Talking Stage - focus on emotional consistency and communication patterns
                          if (hasFluctuations) {
                            patternType = "Emotional Fluctuations";
                            patternDescription = "You've experienced moments of both connection and emotional distance. These fluctuations are common in the Talking Stage while you're getting to know each other.";
                          } else if (isPositive) {
                            patternType = "Early Alignment";
                            patternDescription = "Your interactions show consistent positive emotional responses, suggesting a promising start to this connection.";
                          } else if (isNegative) {
                            patternType = "Early Friction";
                            patternDescription = "Your tracking shows some emotional challenges in this early stage. Consider whether your communication styles and expectations align.";
                          } else {
                            patternType = "Getting Acquainted";
                            patternDescription = "This new connection is still developing its own pattern. Continue exploring your compatibility through open communication.";
                          }
                        } else if (connection.relationshipStage === "FWB" || connection.relationshipStage === "Sneaky Link") {
                          // Casual Relationships - focus on boundaries and emotional complexity
                          if (hasFluctuations) {
                            patternType = "Complex Dynamics";
                            patternDescription = "Your relationship shows a mix of highs and lows, which is common in casual connections where boundaries and expectations can be fluid.";
                          } else if (isPositive) {
                            patternType = "Mutually Satisfying";
                            patternDescription = "This casual relationship appears to be consistently positive, suggesting both parties are satisfied with the current arrangement.";
                          } else if (isNegative) {
                            patternType = "Mismatched Expectations";
                            patternDescription = "There may be unspoken differences in expectations within this casual connection. Consider a conversation about boundaries.";
                          } else {
                            patternType = "Maintaining Balance";
                            patternDescription = "Your casual relationship shows a balance of different emotions, which can work well when both people understand the arrangement.";
                          }
                        } else if (connection.relationshipStage === "Exclusive") {
                          // Exclusive Relationships - focus on growth and conflict resolution
                          if (hasFluctuations) {
                            patternType = "Growth Through Challenges";
                            patternDescription = "Your relationship experiences both harmony and challenges, which is normal in committed relationships. How you navigate these together is key to growth.";
                          } else if (isPositive) {
                            patternType = "Strong Foundation";
                            patternDescription = "Your exclusive relationship shows consistent positive patterns, suggesting a healthy foundation of mutual understanding.";
                          } else if (isNegative) {
                            patternType = "Recurring Tension";
                            patternDescription = "There appear to be ongoing challenges that might benefit from direct communication and possibly relationship support resources.";
                          } else {
                            patternType = "Stable Connection";
                            patternDescription = "Your relationship shows a moderate, stable emotional pattern with room for deepening connection through vulnerability and communication.";
                          }
                        } else {
                          // Other relationship types or undefined
                          if (hasFluctuations) {
                            patternType = "Mixed Emotional Patterns";
                            patternDescription = "Your relationship shows varying emotional responses over time. Consider what might be causing these shifts in your connection.";
                          } else if (isPositive) {
                            patternType = "Positive Trend";
                            patternDescription = "This connection is generating consistently positive emotional responses, which is worth acknowledging and nurturing.";
                          } else if (isNegative) {
                            patternType = "Emotional Challenges";
                            patternDescription = "This relationship appears to present recurring emotional challenges. Reflect on whether this dynamic serves your wellbeing.";
                          } else {
                            patternType = "Balanced Dynamic";
                            patternDescription = "Your relationship shows a mix of different emotions, creating a balanced pattern that reflects the natural complexity of human connections.";
                          }
                        }
                        
                        // Only return connections with enough data for meaningful analysis
                        return (
                          <div key={connection.id} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">{connection.name}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                patternType.includes("Alignment") || patternType.includes("Positive") || patternType.includes("Strong") || patternType.includes("Satisfying") ? 
                                  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                patternType.includes("Fluctuation") || patternType.includes("Complex") || patternType.includes("Mixed") ? 
                                  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                                patternType.includes("Friction") || patternType.includes("Tension") || patternType.includes("Challenge") ? 
                                  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" :
                                patternType.includes("Growth") || patternType.includes("Balance") ? 
                                  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                                "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300"
                              }`}>
                                {patternType}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">{patternDescription}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/80 px-2 py-0.5 rounded-full">{connection.relationshipStage}</span>
                              <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 px-2 py-0.5 rounded-full">{connectionMoments.length} moments</span>
                              {happyMoments > 0 && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-full">{happyMoments} positive</span>
                              )}
                              {unhappyMoments > 0 && (
                                <span className="text-xs bg-rose-100 dark:bg-rose-900/20 text-rose-800 dark:text-rose-400 px-2 py-0.5 rounded-full">{unhappyMoments} challenging</span>
                              )}
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}
                      
                      {connections.filter(c => moments.filter(m => m.connectionId === c.id).length >= 3).length === 0 && (
                        <p className="text-center py-2 text-neutral-500">Log more moments for each connection to see relationship signal analysis</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center py-2 text-neutral-500">Add connections and log moments to see relationship signal analysis</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">AI Insights</CardTitle>
                  <CardDescription>
                    AI-powered observations about your relationships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {moments.length > 5 ? (
                    <div className="space-y-4">
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                        <p className="text-sm">
                          Your mood patterns suggest you experience both highs and lows in your relationships. This emotional variability is natural and provides opportunities for growth and deeper understanding.
                        </p>
                      </div>
                      
                      {moments.filter(m => m.content && m.content.length > 10).length > 0 && (
                        <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                          <p className="text-sm">
                            You've added detailed content to {moments.filter(m => m.content && m.content.length > 10).length} moments. Journaling about your experiences enhances self-awareness and helps identify patterns in your relationships.
                          </p>
                        </div>
                      )}
                      
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                        <p className="text-sm">
                          Looking for deeper AI insights? Visit the AI Coach tab for personalized advice based on your relationship patterns and emotional responses.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Keep logging moments to receive AI-powered insights about your relationship patterns
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="px-4 py-10 text-center">
            <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm">
              <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-2">Start Tracking Moments</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Log emotional moments and track mood patterns to unlock personalized insights and relationship analysis
              </p>
              <Link to="/moments" className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors">
                Create Your First Moment
              </Link>
            </div>
          </div>
        )}
        
        <BottomNavigation />
      </main>
    </div>
  );
}