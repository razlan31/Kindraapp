import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Connection, Moment } from "@shared/schema";
import { AICoach } from "@/components/insights/ai-coach";
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
  Zap 
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

  // Connection with most green flags
  const connectionGreenFlags = connections.map(connection => {
    const greenFlagCount = moments.filter(m => 
      m.connectionId === connection.id && 
      m.tags?.includes('Green Flag')
    ).length;

    return {
      id: connection.id,
      name: connection.name,
      greenFlags: greenFlagCount
    };
  }).sort((a, b) => b.greenFlags - a.greenFlags);

  // Calculate color for pie chart
  const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD166', '#20C997', '#FD7E14'];

  // Calculate days since first moment
  const firstMomentDate = moments.length > 0 ? 
    new Date(moments.slice().sort((a, b) => 
      new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()
    )[0].createdAt) : undefined;
  
  const trackingDays = firstMomentDate ? 
    Math.ceil((new Date().getTime() - firstMomentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Title Section */}
        <section className="px-4 pt-5 pb-3">
          <h2 className="text-xl font-heading font-semibold">Relationship Insights</h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Discover patterns and trends in your relationships
          </p>
        </section>
        
        {/* Reports Quick Link - New Feature */}
        <div className="px-4 mb-4">
          <a href="/summary-report" className="w-full flex items-center justify-between py-3 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">View Relationship Report</span>
            </div>
            <div>
              <ChevronRight className="h-5 w-5" />
            </div>
          </a>
        </div>
        
        {/* AI Coach Card - Always shown regardless of moments */}
        <div className="px-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Relationship Coach
                  </CardTitle>
                  <CardDescription>
                    Personalized insights based on your profile
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <div className="flex gap-3 items-start">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm">
                        {user?.zodiacSign ? 
                          `As a ${user.zodiacSign}, you likely value ${
                            ['Aries', 'Leo', 'Sagittarius'].includes(user.zodiacSign) ? 
                              'passion and excitement in your relationships. Consider partners who can match your energy and enthusiasm.'
                            : ['Taurus', 'Virgo', 'Capricorn'].includes(user.zodiacSign) ?
                              'stability and reliability in your connections. Look for consistency in your relationships.'
                            : ['Gemini', 'Libra', 'Aquarius'].includes(user.zodiacSign) ?
                              'mental stimulation and variety. Connect with people who engage you intellectually.'
                            : 'emotional depth and intuitive understanding. Seek partners who honor your sensitivity.'
                          }`
                        : "Add your zodiac sign in your profile to receive personalized astrological insights about your relationship patterns."}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <div className="flex gap-3 items-start">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm">
                        {user?.loveLanguage ? 
                          `Your love language is ${user.loveLanguage}. This means you feel most loved through ${
                            user.loveLanguage === 'Words of Affirmation' ? 
                              'verbal expressions of appreciation and care. Make sure to communicate this need to your partners.'
                            : user.loveLanguage === 'Quality Time' ?
                              'dedicated, undivided attention. Prioritize meaningful time together in your relationships.'
                            : user.loveLanguage === 'Physical Touch' ?
                              'physical closeness and affection. Express the importance of this connection to your partners.'
                            : user.loveLanguage === 'Acts of Service' ?
                              'actions that show care and support. Look for partners who demonstrate their love through helpful gestures.'
                            : 'thoughtful and meaningful gifts that show you are seen and understood.'
                          }`
                        : "Add your love language to your profile to receive more personalized relationship coaching."}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <div className="flex gap-3 items-start">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm">
                        {moments.length > 0 ? 
                          `You've tracked ${moments.length} emotional moments. Keep logging to discover deeper patterns in your relationship dynamics.`
                        : "Start tracking emotional moments to receive AI-powered insights about your relationship patterns."}
                      </p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => window.location.href = "/ai-coach"} 
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Get More AI Coaching
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {moments.length > 0 ? (
          <Tabs defaultValue="coach" className="w-full">
            <div className="px-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="coach">
                  <Sparkles className="h-4 w-4 mr-1" /> Coach
                </TabsTrigger>
                <TabsTrigger value="emotions">
                  <Heart className="h-4 w-4 mr-1" /> Emotions
                </TabsTrigger>
                <TabsTrigger value="flags">
                  <Flag className="h-4 w-4 mr-1" /> Flags
                </TabsTrigger>
                <TabsTrigger value="zodiac">
                  <Star className="h-4 w-4 mr-1" /> Zodiac
                </TabsTrigger>
                <TabsTrigger value="patterns">
                  <Brain className="h-4 w-4 mr-1" /> Patterns
                </TabsTrigger>
              </TabsList>
            </div>

            {/* AI Coach Tab */}
            <TabsContent value="coach" className="px-4 py-4">
              <AICoach 
                connections={connections} 
                moments={moments} 
                userData={{
                  zodiacSign: user?.zodiacSign || undefined,
                  loveLanguage: user?.loveLanguage || undefined
                }}
              />
            </TabsContent>

            {/* Emotions Tab */}
            <TabsContent value="emotions" className="px-4 py-4">
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

              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Relationship Stages</CardTitle>
                  <CardDescription>
                    Distribution of your connections by stage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {relationshipStageData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={relationshipStageData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ stage, percent }) => `${stage} ${(percent * 100).toFixed(0)}%`}
                          >
                            {relationshipStageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center py-10 text-neutral-500">Not enough data yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Flags Tab */}
            <TabsContent value="flags" className="px-4 py-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Flag Distribution</CardTitle>
                  <CardDescription>
                    Green and red flags across your connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {connectionGreenFlags.slice(0, 3).map((connection) => (
                      <div key={connection.id} className="flex justify-between items-center">
                        <span className="font-medium">{connection.name}</span>
                        <div className="flex items-center">
                          <span className="text-greenFlag mr-2">{connection.greenFlags} Green Flags</span>
                          <span className="text-redFlag">
                            {moments.filter(m => 
                              m.connectionId === connection.id && 
                              m.tags?.includes('Red Flag')
                            ).length} Red Flags
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Moment Tags</CardTitle>
                  <CardDescription>
                    Most common tags in your logged moments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tagData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={tagData}
                          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="tag" />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--secondary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center py-10 text-neutral-500">Not enough tagged moments yet</p>
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
                    Astrological insights about your connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user?.zodiacSign ? (
                    <div className="space-y-4">
                      {connections.filter(c => c.zodiacSign).map((connection) => (
                        <div key={connection.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{connection.name}</span>
                            <span className="text-sm text-neutral-500">
                              {connection.zodiacSign}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Sparkles className="h-4 w-4 text-accent mr-2" />
                            <span className="text-sm">
                              {getZodiacCompatibility(user?.zodiacSign, connection.zodiacSign)}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {connections.filter(c => c.zodiacSign).length === 0 && (
                        <p className="text-center py-6 text-neutral-500">
                          No connections with zodiac signs yet
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <p>Set your zodiac sign in your profile to see compatibility insights</p>
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
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Relationship Signal Analysis</CardTitle>
                  <CardDescription>
                    Detecting patterns in your relationship signals
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
                        const sortedMoments = [...connectionMoments].sort((a, b) => 
                          new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()
                        );
                        
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
                        
                        // Determine relationship signal pattern based on data
                        let signalType = "";
                        let signalDescription = "";
                        
                        if (fluctuationCount > connectionMoments.length * 0.4) {
                          // High fluctuation indicates mixed signals
                          signalType = "Mixed Signals";
                          if (connection.relationshipStage === "Talking") {
                            signalDescription = "Your emotions show frequent shifts between positive and negative, typical in early relationships when expectations are still forming.";
                          } else if (connection.relationshipStage === "FWB" || connection.relationshipStage === "Sneaky Link") {
                            signalDescription = "This connection shows emotional ups and downs, common in casual relationships where expectations may be unclear.";
                          } else {
                            signalDescription = "There seem to be emotional fluctuations in this relationship. Open communication might help address these shifts.";
                          }
                        } else if (happyMoments > connectionMoments.length * 0.6 && greenFlags > redFlags) {
                          // Consistently positive
                          signalType = "Consistent Interest";
                          signalDescription = "This connection shows consistent positive patterns, suggesting mutual interest and emotional alignment.";
                        } else if (unhappyMoments > connectionMoments.length * 0.5 || redFlags > greenFlags + blueFlags) {
                          // Consistently negative
                          signalType = "Concerning Pattern";
                          signalDescription = "This relationship shows signs of recurring challenges. Consider reflecting on whether this connection meets your needs.";
                        } else if (neutralMoments > connectionMoments.length * 0.5 || blueFlags > greenFlags + redFlags) {
                          // Growth-focused
                          signalType = "Growth Opportunity";
                          signalDescription = "This relationship shows signs of development and learning, with opportunities for mutual growth.";
                        } else {
                          // Not enough clear patterns
                          signalType = "Developing Pattern";
                          signalDescription = "There isn't a clear pattern yet in this relationship. Continue tracking to reveal deeper insights.";
                        }
                        
                        // Only return connections with enough data for meaningful analysis
                        return (
                          <div key={connection.id} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">{connection.name}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                signalType === "Consistent Interest" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                signalType === "Mixed Signals" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                                signalType === "Concerning Pattern" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                signalType === "Growth Opportunity" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                                "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300"
                              }`}>
                                {signalType}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">{signalDescription}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-full">{greenFlags} green</span>
                              <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 px-2 py-0.5 rounded-full">{redFlags} red</span>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded-full">{blueFlags} blue</span>
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
                  <div className="space-y-3">
                    {generateAIInsights(connections, moments, user).map((insight, index) => (
                      <div key={index} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                        <div className="flex items-start">
                          <Brain className="h-4 w-4 text-primary mt-1 mr-2 flex-shrink-0" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="px-4 py-10 text-center">
            <div className="rounded-full bg-primary/10 p-4 h-16 w-16 mx-auto mb-4 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-heading font-semibold mb-2">No Insights Yet</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs mx-auto mb-4">
              Start tracking your relationships and logging moments to generate insights and patterns
            </p>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}

// Helper function to generate fake zodiac compatibility
function getZodiacCompatibility(sign1?: string, sign2?: string): string {
  if (!sign1 || !sign2) return "Unknown compatibility";
  
  const compatibilityPhrases = [
    "Strong emotional connection, good communication.",
    "Great intellectual compatibility, work on emotional bond.",
    "Passionate match with some communication challenges.",
    "Balanced relationship with mutual understanding.",
    "Complementary energies create a harmonious bond."
  ];
  
  // This is just a simplified example - in a real app you'd have actual compatibility logic
  const index = (sign1.length + sign2.length) % compatibilityPhrases.length;
  return compatibilityPhrases[index];
}

// Helper function to generate simple AI insights
function generateAIInsights(connections: Connection[], moments: Moment[], user: any): string[] {
  if (!moments.length || !connections.length) return [];
  
  const insights: string[] = [];
  
  // Add a few rule-based insights
  if (moments.length > 0) {
    // Check for positive emotion trends
    const positiveEmojis = ['😊', '❤️', '😍', '🥰', '💖', '✨'];
    const percentPositive = moments.filter(m => positiveEmojis.includes(m.emoji)).length / moments.length;
    
    if (percentPositive > 0.7) {
      insights.push("You're experiencing a lot of positive emotions in your relationships. This is a great sign of emotional well-being!");
    } else if (percentPositive < 0.3) {
      insights.push("You seem to be experiencing some challenging emotions recently. Consider discussing your feelings with someone you trust.");
    }
    
    // Check for green flags
    const greenFlagMoments = moments.filter(m => m.tags?.includes('Green Flag'));
    if (greenFlagMoments.length > 5) {
      insights.push("You've identified multiple green flags in your relationships, showing good awareness of healthy relationship traits.");
    }
    
    // Check for red flags
    const redFlagMoments = moments.filter(m => m.tags?.includes('Red Flag'));
    if (redFlagMoments.length > 3) {
      insights.push("You've noted several red flags. Consider reflecting on patterns across relationships that might need attention.");
    }
    
    // Check connection with most moments
    const connectionMoments: Record<number, number> = {};
    moments.forEach(moment => {
      connectionMoments[moment.connectionId] = (connectionMoments[moment.connectionId] || 0) + 1;
    });
    
    const mostActiveConnectionId = Object.keys(connectionMoments).reduce((a, b) => 
      connectionMoments[Number(a)] > connectionMoments[Number(b)] ? Number(a) : Number(b)
    , Number(Object.keys(connectionMoments)[0]));
    
    const mostActiveConnection = connections.find(c => c.id === mostActiveConnectionId);
    if (mostActiveConnection) {
      insights.push(`Your relationship with ${mostActiveConnection.name} shows the most activity. You're investing good energy in this connection.`);
    }
  }
  
  // Limit to 3 insights
  return insights.slice(0, 3);
}
