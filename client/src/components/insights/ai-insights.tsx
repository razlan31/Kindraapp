import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Connection, Moment } from "@shared/schema";
import { TrendingUp, TrendingDown, AlertCircle, Calendar, Heart, Users, Clock } from "lucide-react";
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

  // Safe debug logging without circular references
  console.log("AI Insights Debug:", {
    connectionsLength: connections?.length || 0,
    momentsLength: moments?.length || 0,
    userData: user || {},
    momentsPreview: moments?.slice(0, 3).map(m => ({
      id: m?.id || 'unknown',
      emoji: m?.emoji || '❓',
      content: m?.content?.substring(0, 50) || ""
    })) || []
  });

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
  const simpleInsights = [];
  
  if (connections?.length > 0) {
    simpleInsights.push({
      title: `${connections.length} Active Connection${connections.length > 1 ? 's' : ''}`,
      description: "Building meaningful relationships",
      type: 'positive'
    });
  }
  
  if (moments?.length > 0) {
    simpleInsights.push({
      title: `${moments.length} Moment${moments.length > 1 ? 's' : ''} Tracked`,
      description: "Great progress in relationship awareness",
      type: 'positive'
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
        {simpleInsights.map((insight, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-100 dark:border-purple-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              {insight.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {insight.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  // Calculate current week number for rotation
  const getCurrentWeek = () => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(daysDiff / 7);
  };

  // Generate data-driven insights with error handling
  let allInsights: InsightData[] = [];
  try {
    allInsights = generateDataInsights(connections, moments, userData);
    console.log("Generated insights count:", allInsights.length);
    console.log("Generated insights preview:", allInsights.map(i => ({ title: i.title, type: i.type })));
  } catch (error) {
    console.error("Error generating insights:", error);
    allInsights = [{
      title: "Loading Insights",
      description: "Analyzing your relationship data...",
      type: 'neutral',
      confidence: 50,
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
      dataPoints: ["Processing data"]
    }];
  }

  // Weekly rotation: show different insights each week when there's enough data
  let insights: InsightData[] = [];
  if (allInsights.length > 3) {
    const currentWeek = getCurrentWeek();
    const rotationIndex = currentWeek % Math.ceil(allInsights.length / 3);
    const startIndex = rotationIndex * 3;
    insights = allInsights.slice(startIndex, startIndex + 3);
    
    // If we don't have enough insights in this rotation, fill from beginning
    if (insights.length < 3) {
      const remaining = 3 - insights.length;
      insights = [...insights, ...allInsights.slice(0, remaining)];
    }
  } else {
    insights = allInsights;
  }

  console.log("Final insights check:", { insightsLength: insights.length });
  
  if (insights.length === 0) {
    console.log("Rendering no insights fallback");
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



  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Insights
          </h3>
          <p className="text-sm text-muted-foreground">
            Smart patterns from your relationship data • Updates weekly
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const getTypeStyles = (type: string) => {
            switch (type) {
              case 'positive':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
              case 'warning': 
                return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
              default:
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            }
          };

          return (
            <div 
              key={index} 
              className={`${getTypeStyles(insight.type)} p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {insight.confidence}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    {insight.description}
                  </p>
                  {insight.dataPoints && (
                    <div className="flex flex-wrap gap-2">
                      {insight.dataPoints.map((point, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-purple-200/50 dark:border-purple-800/50">
        <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 rounded-md px-3 py-2">
          <strong>Confidence</strong> represents how reliable and trustworthy a particular statistic or analysis is based on the available data.
          <br />
          <strong>80%+</strong> Very reliable • <strong>60-79%</strong> Generally reliable • <strong>&lt;60%</strong> Early indicators
        </div>
      </div>
    </div>
  );
}

interface InsightData {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'neutral';
  confidence: number;
  icon: React.ReactNode;
  dataPoints?: string[];
}

function generateDataInsights(connections: Connection[], moments: Moment[], userData: any): InsightData[] {
  const insights: InsightData[] = [];
  
  console.log("Starting insights generation:", { 
    momentsCount: moments.length, 
    connectionsCount: connections.length,
    userData: userData
  });

  // Always generate insights from available data, even with minimal moments
  if (moments.length === 0) {
    return [{
      title: "Relationship Tracking Foundation",
      description: "Your relationship journey is ready to begin. Each moment you track becomes part of understanding your unique connection patterns.",
      type: 'neutral',
      confidence: 100,
      icon: <Calendar className="h-4 w-4 text-blue-600" />,
      dataPoints: ["Ready to capture meaningful moments"]
    }];
  }

  // Identify self-connection for personal growth tracking
  const selfConnection = connections.find(c => 
    c.relationshipStage === 'Self' || c.name.includes('(ME)')
  );
  
  const selfMoments = selfConnection ? 
    moments.filter(m => m.connectionId === selfConnection.id) : [];
  
  const relationshipMoments = moments.filter(m => 
    !selfConnection || m.connectionId !== selfConnection.id
  );

  // Enhanced emotional pattern analysis with more emojis
  const emotionCounts = moments.reduce((acc: Record<string, number>, moment) => {
    acc[moment.emoji] = (acc[moment.emoji] || 0) + 1;
    return acc;
  }, {});

  const totalMoments = moments.length;
  const positiveEmojis = ['😍', '💗', '❤️', '🥰', '😊', '🤗', '💖', '🌟', '✨', '💫', '🔥', '😘', '🥳', '🎉', '🌸', '🎬', '🍰', '🏃‍♀️', '💝', '🌅', '🎭', '🎯', '🍜', '☕', '🎁', '🏖️', '💃', '💋'];
  const negativeEmojis = ['😔', '😢', '😠', '😤', '💔', '😕', '😞', '😰', '😟', '😭', '🤔', '😬', '😩', '🙄', '📱', '😒'];
  const neutralEmojis = ['😐', '🤷', '😑', '😶', '🤨', '😏', '🤷‍♀️', '🎮', '📚', '🚗', '🛠️', '🏥', '🍕'];

  const positiveCount = Object.entries(emotionCounts)
    .filter(([emoji]) => positiveEmojis.includes(emoji))
    .reduce((sum, [, count]) => sum + count, 0);

  const negativeCount = Object.entries(emotionCounts)
    .filter(([emoji]) => negativeEmojis.includes(emoji))
    .reduce((sum, [, count]) => sum + count, 0);

  const neutralCount = Object.entries(emotionCounts)
    .filter(([emoji]) => neutralEmojis.includes(emoji))
    .reduce((sum, [, count]) => sum + count, 0);

  const positiveRatio = positiveCount / totalMoments;
  const negativeRatio = negativeCount / totalMoments;
  const neutralRatio = neutralCount / totalMoments;

  // Advanced emotional pattern insights with actionable advice
  if (positiveRatio > 0.7) {
    insights.push({
      title: "Exceptional Relationship Harmony",
      description: `${Math.round(positiveRatio * 100)}% of your moments are positive. You're thriving! Consider what specific behaviors and communication patterns are working so well, and maintain these habits.`,
      type: 'positive',
      confidence: Math.min(95, Math.round(positiveRatio * 100 + totalMoments)),
      icon: <Heart className="h-4 w-4 text-green-600" />,
      dataPoints: [`${positiveCount}/${totalMoments} positive moments`, `Top performing connections`]
    });
  } else if (positiveRatio > 0.5) {
    insights.push({
      title: "Strong Positive Foundation",
      description: `${Math.round(positiveRatio * 100)}% positive moments show healthy relationship patterns. Focus on deepening emotional intimacy and celebrating small wins together.`,
      type: 'positive',
      confidence: Math.round(positiveRatio * 90),
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      dataPoints: [`${positiveCount}/${totalMoments} positive moments`, `Room for growth`]
    });
  }

  if (negativeRatio > 0.5) {
    insights.push({
      title: "Relationship Stress Alert",
      description: `${Math.round(negativeRatio * 100)}% negative emotions detected. Immediate action needed: schedule quality time, practice active listening, and consider couples communication techniques.`,
      type: 'warning',
      confidence: Math.round(negativeRatio * 100 + 15),
      icon: <AlertCircle className="h-4 w-4 text-red-600" />,
      dataPoints: [`${negativeCount}/${totalMoments} challenging moments`, `Action required`]
    });
  } else if (negativeRatio > 0.3) {
    insights.push({
      title: "Emotional Balance Needed",
      description: `${Math.round(negativeRatio * 100)}% challenging moments suggest room for improvement. Try weekly check-ins, express appreciation daily, and address conflicts promptly.`,
      type: 'warning',
      confidence: Math.round(negativeRatio * 80 + 20),
      icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
      dataPoints: [`${negativeCount}/${totalMoments} challenging moments`, `Preventive care needed`]
    });
  }

  // Emotional variety analysis - focus on what the current pattern reveals
  const uniqueEmotions = Object.keys(emotionCounts).length;
  if (totalMoments >= 1) {
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (uniqueEmotions === 1) {
      insights.push({
        title: "Consistent Emotional Pattern",
        description: `Your tracked moments show a consistent ${dominantEmotion[0]} pattern. This suggests a stable emotional foundation in your relationships, with clear understanding of what brings you fulfillment.`,
        type: 'positive',
        confidence: 85,
        icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
        dataPoints: [`${uniqueEmotions} primary emotion`, `${dominantEmotion[1]} instances`]
      });
    } else if (uniqueEmotions <= 3) {
      insights.push({
        title: "Focused Emotional Awareness",
        description: `Your ${uniqueEmotions} tracked emotions (${dominantEmotion[0]} most common) reveal focused relationship experiences. This indicates intentional attention to meaningful moments over scattered activity.`,
        type: 'positive',
        confidence: 80,
        icon: <Heart className="h-4 w-4 text-blue-600" />,
        dataPoints: [`${uniqueEmotions} emotion types`, `Quality over quantity approach`]
      });
    }
  }

  // Self-connection analysis for personal growth tracking
  if (selfConnection && selfMoments.length > 0) {
    const selfPositiveCount = selfMoments.filter(m => 
      positiveEmojis.includes(m.emoji)
    ).length;
    
    const selfNegativeCount = selfMoments.filter(m => 
      negativeEmojis.includes(m.emoji)
    ).length;
    
    const selfPositiveRatio = selfPositiveCount / selfMoments.length;
    
    // Analyze personal growth patterns
    const achievementTags = ['Achievement', 'Success', 'Growth', 'Milestone', 'Goal'];
    const selfReflectionTags = ['Reflection', 'Learning', 'Insight', 'Realization'];
    const selfCareTags = ['Self Care', 'Health', 'Wellness', 'Exercise', 'Rest'];
    
    const achievementMoments = selfMoments.filter(m => 
      m.tags?.some(tag => achievementTags.includes(tag)) ||
      ['🏆', '🎯', '✅', '💪', '🌟', '🎉', '🥳'].includes(m.emoji)
    ).length;
    
    const reflectionMoments = selfMoments.filter(m => 
      m.tags?.some(tag => selfReflectionTags.includes(tag)) ||
      ['🤔', '💭', '📝', '🧠', '💡'].includes(m.emoji)
    ).length;
    
    const selfCareMoments = selfMoments.filter(m => 
      m.tags?.some(tag => selfCareTags.includes(tag)) ||
      ['🧘', '🏃‍♀️', '🛀', '💆', '🌿', '🍃', '☕'].includes(m.emoji)
    ).length;

    if (selfPositiveRatio > 0.7) {
      insights.push({
        title: "Strong Self-Awareness",
        description: `${Math.round(selfPositiveRatio * 100)}% of your self-reflection moments are positive. You're maintaining healthy self-awareness and celebrating personal growth. Continue documenting achievements and insights.`,
        type: 'positive',
        confidence: Math.round(selfPositiveRatio * 90),
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        dataPoints: [`${selfMoments.length} self-moments`, `${achievementMoments} achievements logged`]
      });
    } else if (selfMoments.length >= 5) {
      insights.push({
        title: "Personal Growth Opportunity",
        description: `You're tracking your personal journey with ${selfMoments.length} self-moments. Consider focusing more on celebrating wins and achievements to build a positive self-relationship.`,
        type: 'neutral',
        confidence: 75,
        icon: <Clock className="h-4 w-4 text-blue-600" />,
        dataPoints: [`${selfMoments.length} self-reflections`, `${selfCareMoments} self-care moments`]
      });
    }

    // Personal development insights based on moment types
    if (achievementMoments > reflectionMoments * 2) {
      insights.push({
        title: "Achievement-Focused Mindset",
        description: `You're great at celebrating wins (${achievementMoments} achievement moments)! Consider adding more reflection moments to process learnings and plan future growth.`,
        type: 'positive',
        confidence: 80,
        icon: <TrendingUp className="h-4 w-4 text-purple-600" />,
        dataPoints: [`${achievementMoments} achievements`, `${reflectionMoments} reflections`]
      });
    } else if (reflectionMoments > achievementMoments && achievementMoments < 2) {
      insights.push({
        title: "Reflection-Heavy Pattern",
        description: `You're thoughtful about self-analysis (${reflectionMoments} reflection moments). Balance this with celebrating more achievements and small wins to boost confidence.`,
        type: 'neutral',
        confidence: 75,
        icon: <Clock className="h-4 w-4 text-blue-600" />,
        dataPoints: [`${reflectionMoments} reflections`, `Consider tracking achievements`]
      });
    }
  } else if (selfConnection && selfMoments.length === 0) {
    // Focus on the fact that they have a self-connection set up rather than suggesting activity
    const otherConnectionCount = connections.length - 1; // Exclude self-connection
    insights.push({
      title: "Self-Awareness Framework Ready",
      description: `You've established a self-connection alongside ${otherConnectionCount} other relationships. This shows intentional focus on personal growth as part of your relationship journey, indicating a holistic approach to emotional development.`,
      type: 'positive',
      confidence: 85,
      icon: <Users className="h-4 w-4 text-purple-600" />,
      dataPoints: [`Self-connection established`, `${otherConnectionCount} relationship connections`]
    });
  }

  // Advanced connection analysis with stage-specific insights
  const connectionMomentCounts = connections.map(conn => ({
    id: conn.id,
    name: conn.name,
    count: moments.filter(m => m.connectionId === conn.id).length,
    stage: conn.relationshipStage,
    positiveCount: moments.filter(m => m.connectionId === conn.id && positiveEmojis.includes(m.emoji)).length,
    negativeCount: moments.filter(m => m.connectionId === conn.id && negativeEmojis.includes(m.emoji)).length,
    loveLanguage: conn.loveLanguage
  }));

  const mostTrackedConnection = connectionMomentCounts.length > 0 
    ? connectionMomentCounts.reduce((max, conn) => 
        conn.count > max.count ? conn : max, connectionMomentCounts[0])
    : null;

  // Primary focus analysis with stage-specific advice
  if (mostTrackedConnection && mostTrackedConnection.count > totalMoments * 0.5 && mostTrackedConnection.name) {
    const positiveRatio = mostTrackedConnection.positiveCount / mostTrackedConnection.count;
    let stageAdvice = "";
    
    switch (mostTrackedConnection.stage) {
      case "Talking":
        stageAdvice = positiveRatio > 0.7 ? "Great foundation! Consider planning a special date to deepen your connection." : "Focus on consistent communication and showing genuine interest in their life.";
        break;
      case "Dating":
        stageAdvice = positiveRatio > 0.6 ? "Strong dating phase! Discuss future goals and values to assess long-term compatibility." : "Address any concerns openly and plan activities that bring you closer together.";
        break;
      case "Committed":
        stageAdvice = positiveRatio > 0.6 ? "Solid relationship foundation. Maintain intimacy through regular date nights and appreciation rituals." : "Schedule weekly relationship check-ins and practice active listening to strengthen your bond.";
        break;
      default:
        stageAdvice = "Continue nurturing this important connection with consistent attention and care.";
    }
    
    insights.push({
      title: `Primary Focus: ${mostTrackedConnection.name}`,
      description: `${Math.round((mostTrackedConnection.count / totalMoments) * 100)}% of your emotional energy goes here (${mostTrackedConnection.stage} stage). ${stageAdvice}`,
      type: positiveRatio > 0.6 ? 'positive' : 'neutral',
      confidence: 88,
      icon: <Users className="h-4 w-4 text-blue-600" />,
      dataPoints: [`${mostTrackedConnection.count} moments tracked`, `${Math.round(positiveRatio * 100)}% positive`]
    });
  }

  // Connection distribution analysis - interpret what the current pattern shows
  if (connections.length > 1) {
    const primaryConnection = connectionMomentCounts.reduce((max, conn) => 
      conn.count > max.count ? conn : max, connectionMomentCounts[0]);
    
    const focusPercentage = Math.round((primaryConnection.count / totalMoments) * 100);
    
    if (focusPercentage > 70) {
      insights.push({
        title: "Concentrated Relationship Focus",
        description: `${focusPercentage}% of your emotional energy centers on ${primaryConnection.name}. This deep focus pattern suggests either a primary relationship priority or intensive relationship development phase.`,
        type: focusPercentage > 85 ? 'warning' : 'neutral',
        confidence: 88,
        icon: <Users className="h-4 w-4 text-blue-600" />,
        dataPoints: [`${focusPercentage}% focus on primary connection`, `${connections.length - 1} other relationships maintained`]
      });
    } else if (focusPercentage < 40 && connections.length > 2) {
      insights.push({
        title: "Distributed Relationship Investment",
        description: `Your attention is well-balanced across ${connections.length} connections, with no single relationship consuming more than ${focusPercentage}% of your tracked moments. This indicates strong relationship portfolio management.`,
        type: 'positive',
        confidence: 85,
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        dataPoints: [`${focusPercentage}% max focus per connection`, `${connections.length} active relationships`]
      });
    }
  }

  // Advanced recent activity and trend analysis
  const recentMoments = moments.filter(m => {
    const momentDate = new Date(m.createdAt || '');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return momentDate > sevenDaysAgo;
  });

  const olderMoments = moments.filter(m => {
    const momentDate = new Date(m.createdAt || '');
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return momentDate > fourteenDaysAgo && momentDate <= sevenDaysAgo;
  });

  if (recentMoments.length > 0) {
    const recentPositive = recentMoments.filter(m => positiveEmojis.includes(m.emoji)).length;
    const recentPositiveRatio = recentPositive / recentMoments.length;
    
    // Compare with previous week if available
    const trend = olderMoments.length > 0 ? 
      (recentPositive / recentMoments.length) - (olderMoments.filter(m => positiveEmojis.includes(m.emoji)).length / olderMoments.length) : 0;

    if (recentPositiveRatio > 0.8) {
      insights.push({
        title: "Exceptional Recent Performance",
        description: `${Math.round(recentPositiveRatio * 100)}% positive moments this week! ${trend > 0.1 ? 'Improving trend - keep up the momentum!' : 'Maintain this excellence with gratitude practices and continued investment in your relationships.'}`,
        type: 'positive',
        confidence: Math.round(recentPositiveRatio * 90 + 10),
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        dataPoints: [`${recentMoments.length} moments this week`, trend > 0 ? '↗️ Improving' : '→ Stable']
      });
    } else if (recentPositiveRatio < 0.4) {
      const actionPlan = recentMoments.length < 3 ? 
        "Start tracking more moments daily to identify patterns. Schedule quality time with your connections." :
        "Immediate action needed: Have honest conversations, plan stress-relief activities, and consider relationship counseling if patterns persist.";
      
      insights.push({
        title: "Recent Relationship Stress",
        description: `Only ${Math.round(recentPositiveRatio * 100)}% positive moments this week. ${actionPlan}`,
        type: 'warning',
        confidence: Math.round((1 - recentPositiveRatio) * 85 + 15),
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        dataPoints: [`${recentMoments.length} moments tracked`, 'Action needed']
      });
    }
  }

  // Tracking frequency analysis with personalized recommendations
  const avgMomentsPerWeek = totalMoments / Math.max(1, Math.ceil((Date.now() - new Date(moments[moments.length - 1]?.createdAt || '').getTime()) / (7 * 24 * 60 * 60 * 1000)));
  
  if (avgMomentsPerWeek < 3) {
    insights.push({
      title: "Increase Relationship Awareness",
      description: `You track ${avgMomentsPerWeek.toFixed(1)} moments per week. Aim for 5-7 weekly moments to better understand patterns. Set daily reminders to capture both positive and challenging interactions.`,
      type: 'neutral',
      confidence: 78,
      icon: <Calendar className="h-4 w-4 text-purple-600" />,
      dataPoints: [`${avgMomentsPerWeek.toFixed(1)}/week current rate`, 'Target: 5-7/week']
    });
  }

  // Love language compatibility analysis
  const userLoveLanguage = userData.loveLanguage;
  if (userLoveLanguage && connections.length > 0) {
    const compatibleConnections = connections.filter(conn => conn.loveLanguage === userLoveLanguage);
    const mismatchedConnections = connections.filter(conn => conn.loveLanguage && conn.loveLanguage !== userLoveLanguage);
    
    if (mismatchedConnections.length > 0) {
      const mismatchedNames = mismatchedConnections.map(c => `${c.name} (${c.loveLanguage})`).join(', ');
      insights.push({
        title: "Love Language Misalignment",
        description: `Your love language (${userLoveLanguage}) differs from ${mismatchedConnections.length} connection(s): ${mismatchedNames}. Learn their languages to improve connection quality.`,
        type: 'neutral',
        confidence: 85,
        icon: <Heart className="h-4 w-4 text-pink-600" />,
        dataPoints: [`${compatibleConnections.length} compatible`, `${mismatchedConnections.length} need adaptation`]
      });
    }
  }

  // Intimacy and vulnerability analysis
  const intimateMoments = moments.filter(m => m.isIntimate);
  
  if (intimateMoments.length > 0) {
    const intimacyRatio = intimateMoments.length / totalMoments;
    
    // Calculate intimate moments per connection safely
    const intimateByConnection = connectionMomentCounts.map(conn => ({
      ...conn,
      intimateCount: moments.filter(m => m.connectionId === conn.id && m.isIntimate).length
    })).filter(conn => conn.intimateCount > 0);

    if (intimacyRatio > 0.3 && intimateByConnection.length > 0) {
      const mostIntimateConnection = intimateByConnection.reduce((max, conn) => 
        conn.intimateCount > max.intimateCount ? conn : max);
      
      // Find the actual connection object to get the name safely
      const connectionData = connections.find(c => c.id === mostIntimateConnection.id);
      const connectionName = connectionData?.name || "a connection";
      
      insights.push({
        title: "High Sexual Connection Awareness",
        description: `${Math.round(intimacyRatio * 100)}% of moments include sexual connection. Your strongest emotional bond appears to be with ${connectionName}. Continue nurturing deep connections while maintaining healthy boundaries.`,
        type: 'positive',
        confidence: 80,
        icon: <Heart className="h-4 w-4 text-pink-600" />,
        dataPoints: [`${intimateMoments.length} intimate moments`, `${connectionName} leads with ${mostIntimateConnection.intimateCount}`]
      });
    }
  }

  // Content depth analysis
  const momentsWithContent = moments.filter(m => m.content && m.content.trim().length > 5);
  const contentRatio = momentsWithContent.length / totalMoments;
  
  if (contentRatio < 0.4) {
    insights.push({
      title: "Improve Moment Detail",
      description: `Only ${Math.round(contentRatio * 100)}% of your moments include detailed descriptions. Adding context about what happened, how you felt, and why it mattered will unlock deeper insights and growth opportunities.`,
      type: 'neutral',
      confidence: 72,
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
      dataPoints: [`${momentsWithContent.length}/${totalMoments} have details`, 'Target: 70%+']
    });
  }

  // Personalized growth recommendation based on user's zodiac (if available)
  if (userData.zodiacSign && positiveRatio < 0.6) {
    const zodiacAdvice = getZodiacRelationshipAdvice(userData.zodiacSign, mostTrackedConnection?.stage || 'Dating');
    insights.push({
      title: `${userData.zodiacSign} Relationship Guidance`,
      description: zodiacAdvice,
      type: 'neutral',
      confidence: 68,
      icon: <TrendingUp className="h-4 w-4 text-purple-600" />,
      dataPoints: ['Personalized advice', 'Based on astrological traits']
    });
  }

  // Baseline insights that should always generate with sufficient data
  
  // Basic relationship activity insight
  if (totalMoments >= 5) {
    const recentMoments = moments.slice(-7); // Last 7 moments
    const recentPositive = recentMoments.filter(m => positiveEmojis.includes(m.emoji)).length;
    const positivePercent = Math.round((recentPositive / recentMoments.length) * 100);
    
    console.log("Adding Recent Activity Pattern insight:", {
      totalMoments,
      recentMomentsCount: recentMoments.length,
      recentPositive,
      positivePercent
    });
    
    insights.push({
      title: "Recent Activity Pattern",
      description: `${positivePercent}% of your last ${recentMoments.length} moments were positive. You've logged ${totalMoments} total relationship moments, showing consistent tracking habits.`,
      type: positivePercent >= 60 ? 'positive' : 'neutral',
      confidence: 85,
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
      dataPoints: [`${recentPositive}/${recentMoments.length} recent positive`, `${totalMoments} total moments`]
    });
    
    console.log("Insights array after adding first insight:", insights.length);
  }

  // Connection diversity analysis
  if (connections.length > 1) {
    const stages = connections.map(c => c.relationshipStage);
    const uniqueStages = Array.from(new Set(stages));
    
    insights.push({
      title: "Multiple Connections",
      description: `You're actively tracking ${connections.length} relationships across ${uniqueStages.length} different stages: ${uniqueStages.join(', ')}. This provides valuable perspective on different relationship dynamics.`,
      type: 'positive',
      confidence: 82,
      icon: <Users className="h-4 w-4 text-purple-600" />,
      dataPoints: [`${connections.length} active connections`, `${uniqueStages.length} relationship types`]
    });
  }

  // Emotional balance insight
  if (totalMoments >= 10) {
    const balanceScore = Math.round((positiveRatio - (negativeCount / totalMoments)) * 100);
    const balanceType = balanceScore > 30 ? 'positive' : balanceScore > 0 ? 'neutral' : 'warning';
    
    insights.push({
      title: "Emotional Balance",
      description: `Your emotional balance score is ${balanceScore}%. With ${positiveCount} positive moments vs ${negativeCount} challenging ones, you're ${balanceScore > 0 ? 'maintaining healthy' : 'working through some'} relationship dynamics.`,
      type: balanceType,
      confidence: 78,
      icon: <Heart className="h-4 w-4 text-pink-600" />,
      dataPoints: [`${positiveCount} positive moments`, `${negativeCount} challenges`]
    });
  }

  // Activity pattern analysis
  const activityMoments = moments.filter(m => m.content && m.content.includes('date') || m.content && m.content.includes('night') || m.content && m.content.includes('together'));
  if (activityMoments.length > 0) {
    const activityRatio = activityMoments.length / totalMoments;
    insights.push({
      title: "Quality Time Investment",
      description: `${Math.round(activityRatio * 100)}% of your moments involve shared activities. This shows strong commitment to building experiences together. Consider varying activity types to deepen different aspects of your connections.`,
      type: 'positive',
      confidence: 77,
      icon: <Calendar className="h-4 w-4 text-blue-600" />,
      dataPoints: [`${activityMoments.length} activity moments`, 'Quality time focused']
    });
  }

  // Communication pattern insights
  const communicationMoments = moments.filter(m => 
    m.content && (
      m.content.includes('text') || 
      m.content.includes('call') || 
      m.content.includes('conversation') ||
      m.content.includes('talk')
    )
  );
  
  if (communicationMoments.length > 0) {
    const commRatio = communicationMoments.length / totalMoments;
    insights.push({
      title: "Communication Focus",
      description: `${Math.round(commRatio * 100)}% of tracked moments involve communication. Strong verbal connection is evident. Balance this with physical presence and shared experiences for well-rounded relationships.`,
      type: 'neutral',
      confidence: 75,
      icon: <TrendingUp className="h-4 w-4 text-indigo-600" />,
      dataPoints: [`${communicationMoments.length} communication moments`, 'Strong verbal connection']
    });
  }

  // Conflict resolution analysis
  const conflictMoments = moments.filter(m => 
    m.tags?.includes('Yellow Flag') || 
    m.tags?.includes('Red Flag') || 
    m.tags?.includes('Conflict') ||
    negativeEmojis.includes(m.emoji)
  );
  
  const resolutionMoments = moments.filter(m => 
    m.content && (
      m.content.includes('made up') || 
      m.content.includes('apolog') || 
      m.content.includes('resolved') ||
      m.content.includes('better')
    )
  );

  if (conflictMoments.length > 0 && resolutionMoments.length > 0) {
    const resolutionRatio = resolutionMoments.length / conflictMoments.length;
    insights.push({
      title: "Conflict Resolution Skills",
      description: `You actively resolve ${Math.round(resolutionRatio * 100)}% of relationship challenges. This demonstrates emotional maturity and commitment to growth. Continue practicing open communication during difficult moments.`,
      type: 'positive',
      confidence: 85,
      icon: <Heart className="h-4 w-4 text-green-600" />,
      dataPoints: [`${resolutionMoments.length}/${conflictMoments.length} conflicts resolved`, 'Healthy problem-solving']
    });
  }

  // Emotional growth tracking
  const recentPositiveGrowth = moments.slice(-10).filter(m => positiveEmojis.includes(m.emoji)).length;
  if (recentPositiveGrowth >= 7) {
    insights.push({
      title: "Recent Positive Momentum",
      description: `${recentPositiveGrowth}/10 of your most recent moments are positive. You're experiencing an upward trend in relationship satisfaction. Maintain this momentum by continuing current successful strategies.`,
      type: 'positive',
      confidence: 88,
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      dataPoints: [`${recentPositiveGrowth}/10 recent positive`, 'Upward trend']
    });
  }

  return insights.slice(0, 6); // Return top 6 insights
}

function getZodiacRelationshipAdvice(zodiacSign: string, relationshipStage: string): string {
  const advice: Record<string, Record<string, string>> = {
    'Aries': {
      'Talking': 'Channel your natural enthusiasm into genuine curiosity about them. Ask engaging questions and share your passions.',
      'Dating': 'Your direct communication style is an asset. Be patient with building deeper emotional intimacy.',
      'Committed': 'Balance your independence with partnership needs. Plan exciting adventures together to keep the spark alive.'
    },
    'Gemini': {
      'Talking': 'Use your natural communication skills to create meaningful conversations. Share your diverse interests and listen actively.',
      'Dating': 'Your adaptability helps you connect on multiple levels. Focus on consistency to build trust.',
      'Committed': 'Keep conversations fresh and engaging. Your partner appreciates your intellectual curiosity and humor.'
    },
    'Cancer': {
      'Talking': 'Your emotional intuition is a strength. Create safe spaces for vulnerable sharing and deep connection.',
      'Dating': 'Trust your instincts about emotional compatibility. Share your caring nature while maintaining healthy boundaries.',
      'Committed': 'Your nurturing nature builds strong foundations. Remember to communicate your own needs clearly too.'
    }
  };
  
  return advice[zodiacSign]?.[relationshipStage] || 
    'Focus on authentic communication, emotional awareness, and consistent care in your relationships.';
}