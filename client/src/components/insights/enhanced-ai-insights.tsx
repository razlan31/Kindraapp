import { TrendingUp, Users, AlertCircle, Clock, Target, Brain, Zap, TrendingDown } from "lucide-react";
import { Connection, Moment } from "@shared/schema";
import { generateAnalyticsInsights, AnalyticsInsight } from "@/lib/relationship-analytics";

interface EnhancedAIInsightsProps {
  connections: Connection[];
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

export function EnhancedAIInsights({ connections, moments, userData }: EnhancedAIInsightsProps) {
  // Calculate current week number for rotation
  const getCurrentWeek = () => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(daysDiff / 7);
  };

  // Generate advanced insights using the new analytics engine
  const allAdvancedInsights = generateAnalyticsInsights(moments, connections);
  
  // Add some basic insights for when we don't have enough data for advanced analytics
  const basicInsights: AnalyticsInsight[] = [];
  
  if (moments.length === 0) {
    basicInsights.push({
      title: "Begin Your Relationship Journey",
      description: "Start tracking meaningful moments with your connections to unlock powerful relationship insights, pattern recognition, and personalized advice.",
      type: 'neutral',
      confidence: 100,
      category: 'behavioral',
      dataPoints: ["No data available yet", "Ready to start tracking"],
      actionItems: ["Log your first relationship moment", "Add connections to begin analysis"]
    });
  } else if (moments.length < 10) {
    const emotionalPatterns = moments.reduce((acc: Record<string, number>, moment) => {
      acc[moment.emoji] = (acc[moment.emoji] || 0) + 1;
      return acc;
    }, {});
    
    const dominantPattern = Object.entries(emotionalPatterns)
      .sort(([,a], [,b]) => b - a)[0];
    
    basicInsights.push({
      title: "Early Pattern Recognition",
      description: `Your ${moments.length} moments reveal early relationship patterns. The ${dominantPattern[0]} emotion appears most frequently, suggesting this represents a core aspect of your relationship experiences.`,
      type: 'neutral',
      confidence: 75,
      category: 'pattern',
      dataPoints: [`${moments.length} moments analyzed`, `${dominantPattern[0]} dominant pattern`],
      actionItems: [`${dominantPattern[1]} instances of primary emotion`, "Early behavioral indicators visible"]
    });
  }
  
  // Combine all insights and apply weekly rotation
  const combinedInsights = [...allAdvancedInsights, ...basicInsights];
  let allInsights: AnalyticsInsight[] = [];
  
  if (combinedInsights.length > 3) {
    const currentWeek = getCurrentWeek();
    const rotationIndex = currentWeek % Math.ceil(combinedInsights.length / 3);
    const startIndex = rotationIndex * 3;
    allInsights = combinedInsights.slice(startIndex, startIndex + 3);
    
    // If we don't have enough insights in this rotation, fill from beginning
    if (allInsights.length < 3) {
      const remaining = 3 - allInsights.length;
      allInsights = [...allInsights, ...combinedInsights.slice(0, remaining)];
    }
  } else {
    allInsights = combinedInsights.slice(0, 6);
  }
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pattern': return <Brain className="h-4 w-4" />;
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'correlation': return <Users className="h-4 w-4" />;
      case 'prediction': return <Zap className="h-4 w-4" />;
      case 'behavioral': return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pattern': return 'text-purple-600 dark:text-purple-400';
      case 'trend': return 'text-blue-600 dark:text-blue-400';
      case 'correlation': return 'text-green-600 dark:text-green-400';
      case 'prediction': return 'text-orange-600 dark:text-orange-400';
      case 'behavioral': return 'text-indigo-600 dark:text-indigo-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning': 
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Advanced Relationship Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered pattern recognition and predictive insights • Updates weekly
          </p>

        </div>
      </div>
      
      <div className="space-y-4">
        {allInsights.map((insight, index) => (
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
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Recommended Actions:</h5>
                    <ul className="text-xs space-y-0.5">
                      {insight.actionItems.map((action: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-muted-foreground">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {insight.relatedConnections && insight.relatedConnections.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Related Connections:</h5>
                    <div className="flex flex-wrap gap-1">
                      {insight.relatedConnections.map((name: string, idx: number) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-1 bg-purple-100/50 dark:bg-purple-900/30 rounded-md text-purple-700 dark:text-purple-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {allInsights.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Advanced analytics engine ready</p>
            <p className="text-xs">Relationship pattern analysis will appear here as data becomes available</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-purple-200/50 dark:border-purple-800/50">
        <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 rounded-md px-3 py-2">
          <strong>Confidence</strong> represents how reliable and trustworthy a particular statistic or analysis is based on the available data.
          <br />
          <strong>80%+</strong> Very reliable • <strong>60-79%</strong> Generally reliable • <strong>&lt;60%</strong> Early indicators
        </div>
        {moments.length >= 10 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <Zap className="h-3 w-3" />
            <span>
              Advanced analytics enabled with {moments.length} moments across {connections.length} connections
            </span>
          </div>
        )}
      </div>
    </div>
  );
}