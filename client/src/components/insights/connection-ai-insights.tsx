import { TrendingUp, Users, AlertCircle, Clock, Target, Brain, Zap, TrendingDown, Heart, MessageSquare } from "lucide-react";
import { Connection, Moment, MenstrualCycle } from "@shared/schema";
import { generateAnalyticsInsights, AnalyticsInsight } from "@/lib/relationship-analytics";
import { useQuery } from "@tanstack/react-query";

interface ConnectionAIInsightsProps {
  connection: Connection;
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

export function ConnectionAIInsights({ connection, moments, userData }: ConnectionAIInsightsProps) {
  // Fetch menstrual cycle data for correlation analysis
  const { data: menstrualCycles = [] } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter data for this specific connection
  const connectionMoments = moments.filter(m => m.connectionId === connection.id);
  const connectionCycles = menstrualCycles.filter(c => c.connectionId === connection.id);

  // Generate connection-specific insights
  const connectionInsights = generateConnectionSpecificInsights(connection, connectionMoments, connectionCycles, userData);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pattern': return <TrendingUp className="h-4 w-4" />;
      case 'trend': return <TrendingDown className="h-4 w-4" />;
      case 'correlation': return <Brain className="h-4 w-4" />;
      case 'prediction': return <Target className="h-4 w-4" />;
      case 'behavioral': return <Users className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pattern': return 'text-blue-600 dark:text-blue-400';
      case 'trend': return 'text-purple-600 dark:text-purple-400';
      case 'correlation': return 'text-green-600 dark:text-green-400';
      case 'prediction': return 'text-orange-600 dark:text-orange-400';
      case 'behavioral': return 'text-pink-600 dark:text-pink-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (connectionInsights.length === 0) {
    return (
      <div className="text-center py-8">
        <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Building Relationship Intelligence</h3>
        <p className="text-sm text-muted-foreground">
          Track more moments with {connection.name} to unlock AI-powered relationship insights and pattern analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">AI Relationship Insights for {connection.name}</h3>
      </div>

      <div className="grid gap-4">
        {connectionInsights.map((insight: AnalyticsInsight, index: number) => (
          <div
            key={index}
            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${getTypeStyles(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 ${getCategoryColor(insight.category)}`}>
                {getCategoryIcon(insight.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getCategoryColor(insight.category)} bg-white/60 dark:bg-black/20`}>
                      {insight.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {insight.description}
                </p>
                
                {insight.dataPoints && insight.dataPoints.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Key Data Points:</h5>
                    <div className="flex flex-wrap gap-1">
                      {insight.dataPoints.map((point: string, idx: number) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {insight.actionItems && insight.actionItems.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Insights:</h5>
                    <div className="space-y-1">
                      {insight.actionItems.map((item: string, idx: number) => (
                        <div key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Generate connection-specific insights
function generateConnectionSpecificInsights(
  connection: Connection, 
  moments: Moment[], 
  cycles: MenstrualCycle[], 
  userData: any
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  // Check if this is a self-connection (personal development tracking)
  const isSelfConnection = connection.name.toLowerCase() === 'self' || 
                          connection.name.toLowerCase() === 'myself' ||
                          connection.relationshipStage === 'Self';

  if (moments.length < 3) {
    if (isSelfConnection) {
      return [{
        title: "Personal Development Foundation",
        description: `Your self-reflection journey is beginning to take shape. With more personal moments tracked, you'll unlock deeper insights about your growth patterns, emotional trends, and personal development milestones.`,
        type: 'neutral',
        confidence: 100,
        category: 'behavioral',
        dataPoints: [`${moments.length} personal moments recorded`, "Self-development tracking active", "Growth analytics framework ready"],
        actionItems: ["Personal tracking enables self-awareness patterns", "AI insights improve with consistent self-reflection", "Personal growth analytics unlock over time"]
      }];
    } else {
      return [{
        title: "Relationship Foundation",
        description: `Your connection with ${connection.name} is in the early tracking phase. Building a pattern history will unlock detailed relationship analytics and personalized insights about your dynamic together.`,
        type: 'neutral',
        confidence: 100,
        category: 'behavioral',
        dataPoints: [`${moments.length} moments recorded`, `${connection.relationshipStage} stage`, "Analytics framework ready"],
        actionItems: ["Relationship tracking enables pattern detection", "AI insights improve with more data points", "Personalized analytics unlock over time"]
      }];
    }
  }

  // Connection activity patterns
  const recentMoments = moments.filter(m => {
    if (!m.createdAt) return false;
    const momentDate = new Date(m.createdAt);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return momentDate >= thirtyDaysAgo;
  });

  const positiveEmojis = ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖', '🌟', '✨', '💫', '🔥', '😘', '🥳', '🎉'];
  const conflictEmojis = ['😢', '😞', '😕', '💔', '😤', '😠', '🙄', '😣', '😭', '😰', '⚡'];

  const positiveCount = moments.filter(m => positiveEmojis.includes(m.emoji) || m.tags?.includes('Positive')).length;
  const conflictCount = moments.filter(m => conflictEmojis.includes(m.emoji) || m.tags?.includes('Conflict')).length;
  const intimateCount = moments.filter(m => m.isIntimate || m.tags?.includes('Sex') || m.tags?.includes('Intimacy')).length;

  // Self-reflection or communication frequency analysis
  if (recentMoments.length > 0) {
    const validMoments = moments.filter(m => m.createdAt);
    const avgDaysBetween = validMoments.length > 1 ? 
      (new Date(validMoments[0].createdAt!).getTime() - new Date(validMoments[validMoments.length - 1].createdAt!).getTime()) / (1000 * 60 * 60 * 24) / (validMoments.length - 1) : 0;

    if (isSelfConnection) {
      insights.push({
        title: "Self-Reflection Pattern",
        description: `Your personal development tracking shows ${recentMoments.length} self-reflection moments in the last 30 days, with an average of ${avgDaysBetween > 0 ? Math.round(avgDaysBetween) : 'daily'} days between personal check-ins. This ${recentMoments.length > 15 ? 'excellent' : recentMoments.length > 8 ? 'consistent' : 'developing'} self-awareness practice suggests ${recentMoments.length > 15 ? 'strong commitment to personal growth' : recentMoments.length > 8 ? 'regular self-reflection habits' : 'emerging mindfulness journey'}.`,
        type: recentMoments.length > 8 ? 'positive' : recentMoments.length > 4 ? 'neutral' : 'warning',
        confidence: Math.min(90, Math.round(recentMoments.length * 4 + 55)),
        category: 'pattern',
        dataPoints: [
          `${recentMoments.length} recent self-reflections`,
          `${moments.length} total personal moments`,
          `${Math.round(avgDaysBetween)} days between check-ins`,
          "Personal development tracking active"
        ],
        actionItems: [
          `Self-reflection frequency: ${recentMoments.length > 15 ? 'highly committed' : recentMoments.length > 8 ? 'consistently mindful' : 'building awareness'}`,
          "Regular self-check-ins enhance emotional intelligence",
          "Personal growth patterns emerge through consistent tracking"
        ]
      });
    } else {
      insights.push({
        title: `${connection.name} Communication Pattern`,
        description: `Your interaction frequency with ${connection.name} shows ${recentMoments.length} moments in the last 30 days, with an average of ${avgDaysBetween > 0 ? Math.round(avgDaysBetween) : 'daily'} days between recorded interactions. This ${recentMoments.length > 10 ? 'high' : recentMoments.length > 5 ? 'moderate' : 'low'} frequency suggests ${recentMoments.length > 10 ? 'strong engagement' : recentMoments.length > 5 ? 'steady connection' : 'casual interaction'} in your relationship dynamic.`,
        type: recentMoments.length > 10 ? 'positive' : recentMoments.length > 5 ? 'neutral' : 'warning',
        confidence: Math.min(85, Math.round(recentMoments.length * 5 + 50)),
        category: 'pattern',
        dataPoints: [
          `${recentMoments.length} recent interactions`,
          `${moments.length} total moments recorded`,
          `${Math.round(avgDaysBetween)} days average between interactions`,
          `${connection.relationshipStage} relationship stage`
        ],
        actionItems: [
          `Interaction frequency: ${recentMoments.length > 10 ? 'highly engaged' : recentMoments.length > 5 ? 'moderately active' : 'occasional contact'}`,
          `Communication pattern reflects ${connection.relationshipStage.toLowerCase()} stage dynamics`,
          "Consistent tracking reveals relationship rhythm patterns"
        ]
      });
    }
  }

  // Emotional dynamic analysis
  if (positiveCount > 0 || conflictCount > 0) {
    const emotionalRatio = positiveCount / Math.max(1, positiveCount + conflictCount);
    const dominantPattern = emotionalRatio > 0.7 ? 'positive' : emotionalRatio < 0.3 ? 'challenging' : 'balanced';

    if (isSelfConnection) {
      insights.push({
        title: "Personal Emotional Pattern",
        description: `Your self-reflection shows ${Math.round(emotionalRatio * 100)}% positive personal moments versus ${Math.round((1 - emotionalRatio) * 100)}% challenging periods. This ${dominantPattern} emotional pattern indicates ${dominantPattern === 'positive' ? 'strong self-compassion and growth mindset' : dominantPattern === 'challenging' ? 'awareness of areas needing personal attention' : 'healthy emotional self-awareness'} in your personal development journey.`,
        type: dominantPattern === 'positive' ? 'positive' : dominantPattern === 'challenging' ? 'neutral' : 'positive',
        confidence: Math.min(92, Math.round((positiveCount + conflictCount) * 7 + 50)),
        category: 'behavioral',
        dataPoints: [
          `${positiveCount} positive self-moments`,
          `${conflictCount} challenging reflections`,
          `${Math.round(emotionalRatio * 100)}% positive self-ratio`,
          `${dominantPattern} emotional self-awareness`
        ],
        actionItems: [
          `Self-emotional pattern: ${dominantPattern === 'positive' ? 'positive self-regard' : dominantPattern === 'challenging' ? 'growth-focused reflection' : 'balanced self-awareness'}`,
          dominantPattern === 'positive' ? "Strong foundation for continued personal growth" : dominantPattern === 'challenging' ? "Honest self-reflection enables targeted development" : "Balanced emotional self-awareness supports growth",
          "Self-awareness patterns enhance emotional regulation skills"
        ]
      });
    } else {
      insights.push({
        title: `${connection.name} Emotional Dynamic`,
        description: `Your emotional pattern with ${connection.name} shows ${Math.round(emotionalRatio * 100)}% positive moments versus ${Math.round((1 - emotionalRatio) * 100)}% challenging interactions. This ${dominantPattern} dynamic indicates ${dominantPattern === 'positive' ? 'strong emotional harmony' : dominantPattern === 'challenging' ? 'areas for relationship attention' : 'natural emotional complexity'} in your connection.`,
        type: dominantPattern === 'positive' ? 'positive' : dominantPattern === 'challenging' ? 'warning' : 'neutral',
        confidence: Math.min(88, Math.round((positiveCount + conflictCount) * 8 + 45)),
        category: 'behavioral',
        dataPoints: [
          `${positiveCount} positive moments`,
          `${conflictCount} challenging moments`,
          `${Math.round(emotionalRatio * 100)}% positive ratio`,
          `${dominantPattern} emotional pattern`
        ],
        actionItems: [
          `Emotional dynamic: ${dominantPattern} interaction pattern`,
          dominantPattern === 'positive' ? "Strong emotional foundation detected" : dominantPattern === 'challenging' ? "Consider relationship communication strategies" : "Natural emotional variety in relationship",
          "Pattern awareness enables emotional intelligence growth"
        ]
      });
    }
  }

  // Intimacy analysis
  if (intimateCount > 0 && moments.length > 5) {
    const intimacyFrequency = intimateCount / moments.length;
    
    insights.push({
      title: `${connection.name} Intimacy Pattern`,
      description: `Intimate moments with ${connection.name} represent ${Math.round(intimacyFrequency * 100)}% of your tracked interactions (${intimateCount} out of ${moments.length} moments). This ${intimacyFrequency > 0.3 ? 'high' : intimacyFrequency > 0.15 ? 'moderate' : 'low'} intimacy frequency aligns with ${connection.relationshipStage.toLowerCase()} stage expectations and suggests ${intimacyFrequency > 0.3 ? 'strong physical connection' : intimacyFrequency > 0.15 ? 'developing intimacy' : 'emerging physical connection'}.`,
      type: 'positive',
      confidence: Math.min(82, Math.round(intimateCount * 10 + 60)),
      category: 'correlation',
      dataPoints: [
        `${intimateCount} intimate moments recorded`,
        `${Math.round(intimacyFrequency * 100)}% intimacy frequency`,
        `${connection.relationshipStage} stage context`,
        `${moments.length} total interactions analyzed`
      ],
      actionItems: [
        `Intimacy level: ${intimacyFrequency > 0.3 ? 'highly intimate' : intimacyFrequency > 0.15 ? 'moderately intimate' : 'developing intimacy'}`,
        `Physical connection patterns align with ${connection.relationshipStage.toLowerCase()} expectations`,
        "Intimacy tracking reveals relationship progression patterns"
      ]
    });
  }

  // Cycle correlation analysis (if applicable)
  if (cycles.length > 0 && moments.length > 8) {
    const cycleInsights = generateAnalyticsInsights(moments, [connection], cycles);
    const cycleSpecificInsights = cycleInsights.filter(insight => 
      insight.category === 'correlation' && insight.title.toLowerCase().includes('cycle')
    );
    
    insights.push(...cycleSpecificInsights.map(insight => ({
      ...insight,
      title: `${connection.name} ${insight.title}`,
      description: insight.description.replace(/relationship/g, `relationship with ${connection.name}`)
    })));
  }

  return insights.slice(0, 4); // Return top 4 connection-specific insights
}