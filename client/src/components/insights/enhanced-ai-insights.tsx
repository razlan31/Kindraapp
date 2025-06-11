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
  // Generate advanced insights using the new analytics engine
  const advancedInsights = generateAnalyticsInsights(moments, connections);
  
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
    basicInsights.push({
      title: "Building Your Data Foundation",
      description: `You have ${moments.length} moments recorded. Continue tracking to unlock advanced pattern analysis, trend detection, and predictive insights about your relationships.`,
      type: 'neutral',
      confidence: 80,
      category: 'behavioral',
      dataPoints: [`${moments.length} moments tracked`, "Need 10+ for advanced analytics"],
      actionItems: ["Continue logging daily moments", "Track different types of interactions"]
    });
  }
  
  // Combine advanced and basic insights
  const allInsights = [...advancedInsights, ...basicInsights].slice(0, 6);
  
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
            AI-powered pattern recognition and predictive insights
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
            <p className="text-sm">No insights available yet</p>
            <p className="text-xs">Start tracking moments to unlock advanced analytics</p>
          </div>
        )}
      </div>
      
      {moments.length >= 10 && (
        <div className="mt-6 pt-4 border-t border-purple-200/50 dark:border-purple-800/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>
              Advanced analytics enabled with {moments.length} moments across {connections.length} connections
            </span>
          </div>
        </div>
      )}
    </div>
  );
}