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

  console.log(`Connection ${connection.name} (ID: ${connection.id}) debug:`, {
    totalMoments: moments.length,
    connectionMoments: connectionMoments.length,
    connectionCycles: connectionCycles.length,
    momentsPreview: connectionMoments.slice(0, 3).map(m => ({ id: m.id, emoji: m.emoji, tags: m.tags }))
  });

  // Generate connection-specific insights
  const connectionInsights = generateConnectionSpecificInsights(connection, connectionMoments, connectionCycles, userData);
  
  console.log(`Generated ${connectionInsights.length} insights for ${connection.name}:`, connectionInsights.map(i => i.title));

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

// Generate connection-specific insights using full main insights functionality
function generateConnectionSpecificInsights(
  connection: Connection, 
  moments: Moment[], 
  cycles: MenstrualCycle[], 
  userData: any
): AnalyticsInsight[] {
  // Check if this is a self-connection (personal development tracking)
  const isSelfConnection = connection.name.toLowerCase() === 'self' || 
                          connection.name.toLowerCase() === 'myself' ||
                          connection.relationshipStage === 'Self';

  // Use the full generateAnalyticsInsights function with connection-filtered data
  const allConnectionInsights = generateAnalyticsInsights(moments, [connection], cycles);

  // If we don't have enough data for advanced analytics, provide basic insights
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

  // Add basic pattern recognition for small datasets
  const basicInsights: AnalyticsInsight[] = [];
  
  if (moments.length >= 3 && moments.length < 10) {
    const emotionalPatterns = moments.reduce((acc: Record<string, number>, moment) => {
      acc[moment.emoji] = (acc[moment.emoji] || 0) + 1;
      return acc;
    }, {});
    
    const dominantPattern = Object.entries(emotionalPatterns)
      .sort(([,a], [,b]) => b - a)[0];
    
    basicInsights.push({
      title: isSelfConnection ? "Early Self-Awareness Pattern" : `Early Pattern with ${connection.name}`,
      description: isSelfConnection ? 
        `Your ${moments.length} personal moments reveal early self-awareness patterns. The ${dominantPattern[0]} emotion appears most frequently, suggesting this represents a core aspect of your personal development journey.` :
        `Your ${moments.length} moments with ${connection.name} reveal early relationship patterns. The ${dominantPattern[0]} emotion appears most frequently, suggesting this represents a core aspect of your dynamic together.`,
      type: 'neutral',
      confidence: 75,
      category: 'pattern',
      dataPoints: [`${moments.length} moments analyzed`, `${dominantPattern[0]} dominant pattern`, `${dominantPattern[1]} occurrences`],
      actionItems: [`Primary emotional indicator: ${dominantPattern[0]}`, "Early behavioral patterns visible", "Foundation for deeper analysis emerging"]
    });
  }

  // Connection-specific adaptations of insights
  const adaptedInsights = allConnectionInsights.map(insight => {
    let adaptedInsight = { ...insight };
    
    if (isSelfConnection) {
      // Adapt insights for self-reflection
      adaptedInsight.title = insight.title
        .replace(/Relationship/g, 'Personal')
        .replace(/relationship/g, 'personal development')
        .replace(/Connection/g, 'Self-Development');
        
      adaptedInsight.description = insight.description
        .replace(/relationship/g, 'personal development')
        .replace(/interactions/g, 'personal moments')
        .replace(/your connection/g, 'your self-awareness')
        .replace(/partner/g, 'yourself')
        .replace(/relationships/g, 'personal growth');
    } else {
      // Adapt insights for specific connection
      if (!insight.title.includes(connection.name)) {
        adaptedInsight.title = `${connection.name} ${insight.title}`;
      }
      
      adaptedInsight.description = insight.description
        .replace(/relationship/g, `relationship with ${connection.name}`)
        .replace(/your connection/g, `your connection with ${connection.name}`)
        .replace(/relationships/g, `relationship with ${connection.name}`);
    }
    
    return adaptedInsight;
  });

  // Combine basic insights with advanced insights
  const combinedInsights = [...adaptedInsights, ...basicInsights];

  // Apply weekly rotation if we have many insights (copied from main insights logic)
  const getCurrentWeek = () => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(daysDiff / 7);
  };

  let finalInsights: AnalyticsInsight[] = [];
  
  if (combinedInsights.length > 4) {
    const currentWeek = getCurrentWeek();
    const rotationIndex = currentWeek % Math.ceil(combinedInsights.length / 4);
    const startIndex = rotationIndex * 4;
    finalInsights = combinedInsights.slice(startIndex, startIndex + 4);
    
    // If we don't have enough insights in this rotation, fill from beginning
    if (finalInsights.length < 4) {
      const remaining = 4 - finalInsights.length;
      finalInsights = [...finalInsights, ...combinedInsights.slice(0, remaining)];
    }
  } else {
    finalInsights = combinedInsights.slice(0, 6);
  }

  return finalInsights;
}