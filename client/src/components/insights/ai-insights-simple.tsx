
import { TrendingUp, Heart, AlertCircle, Calendar, Users, Target } from 'lucide-react';
import type { Connection, Moment } from '@shared/schema';

interface InsightData {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'neutral';
  confidence: number;
  icon: React.ReactNode;
  dataPoints: string[];
}

interface AIInsightsProps {
  connections: Connection[];
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

export function AIInsights({ connections, moments, userData }: AIInsightsProps) {
  const insights: InsightData[] = [];

  // Basic stats
  const totalMoments = moments.length;
  const totalConnections = connections.length;

  if (totalMoments === 0) {
    insights.push({
      title: "Start Your Journey",
      description: "Begin tracking your relationship moments to unlock personalized insights and growth patterns.",
      type: 'neutral',
      confidence: 100,
      icon: <Target className="h-4 w-4 text-blue-600" />,
      dataPoints: ["No moments tracked yet"]
    });
  } else {
    // Positive moments analysis
    const positiveMoments = moments.filter(m => 
      ['😍', '💕', '❤️', '🎉', '🌅', '✈️', '💝', '📚'].includes(m.emoji)
    ).length;
    
    const positiveRatio = positiveMoments / totalMoments;
    
    if (positiveRatio > 0.6) {
      insights.push({
        title: "Strong Positive Patterns",
        description: `${Math.round(positiveRatio * 100)}% of your moments are positive. You're building healthy relationship foundations with consistent positive interactions.`,
        type: 'positive',
        confidence: 85,
        icon: <Heart className="h-4 w-4 text-green-600" />,
        dataPoints: [`${positiveMoments} positive moments`, `${totalMoments} total tracked`]
      });
    }

    // Conflict analysis
    const conflictMoments = moments.filter(m => m.emoji === '😔').length;
    
    if (conflictMoments > 0) {
      const conflictRatio = conflictMoments / totalMoments;
      if (conflictRatio < 0.2) {
        insights.push({
          title: "Healthy Conflict Resolution",
          description: `You've tracked ${conflictMoments} conflicts out of ${totalMoments} moments. This shows balanced relationship dynamics with room for growth and resolution.`,
          type: 'positive',
          confidence: 75,
          icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
          dataPoints: [`${conflictMoments} conflicts tracked`, "Good resolution patterns"]
        });
      } else {
        insights.push({
          title: "Focus on Communication",
          description: `${Math.round(conflictRatio * 100)}% of moments involve conflicts. Consider focusing on communication strategies and conflict resolution techniques.`,
          type: 'warning',
          confidence: 80,
          icon: <AlertCircle className="h-4 w-4 text-orange-600" />,
          dataPoints: [`${conflictMoments} conflicts need attention`]
        });
      }
    }

    // Connection balance
    if (totalConnections > 1) {
      insights.push({
        title: "Multiple Connections",
        description: `You're tracking ${totalConnections} connections. Balancing attention across relationships helps maintain healthy boundaries and deeper understanding.`,
        type: 'neutral',
        confidence: 70,
        icon: <Users className="h-4 w-4 text-purple-600" />,
        dataPoints: [`${totalConnections} active connections`]
      });
    }

    // Activity frequency
    const avgMomentsPerConnection = totalMoments / Math.max(1, totalConnections);
    
    if (avgMomentsPerConnection < 3) {
      insights.push({
        title: "Increase Tracking Frequency",
        description: `Track more relationship moments to unlock deeper insights. Aim for 5-7 moments per week to better understand patterns and growth opportunities.`,
        type: 'neutral',
        confidence: 65,
        icon: <Calendar className="h-4 w-4 text-indigo-600" />,
        dataPoints: [`${avgMomentsPerConnection.toFixed(1)} moments per connection`]
      });
    }
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
            Building Your Insights
          </h3>
        </div>
        <p className="text-purple-700 dark:text-purple-300">
          Keep tracking your relationship moments to unlock personalized insights and growth patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <div
          key={index}
          className={`rounded-2xl p-6 border backdrop-blur-sm ${
            insight.type === 'positive'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800'
              : insight.type === 'warning'
              ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-100 dark:border-orange-800'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-2 rounded-lg ${
                insight.type === 'positive'
                  ? 'bg-green-100 dark:bg-green-800'
                  : insight.type === 'warning'
                  ? 'bg-orange-100 dark:bg-orange-800'
                  : 'bg-blue-100 dark:bg-blue-800'
              }`}
            >
              {insight.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4
                  className={`text-lg font-semibold ${
                    insight.type === 'positive'
                      ? 'text-green-800 dark:text-green-200'
                      : insight.type === 'warning'
                      ? 'text-orange-800 dark:text-orange-200'
                      : 'text-blue-800 dark:text-blue-200'
                  }`}
                >
                  {insight.title}
                </h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    insight.type === 'positive'
                      ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                      : insight.type === 'warning'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300'
                  }`}
                >
                  {insight.confidence}% confidence
                </span>
              </div>
              <p
                className={`mb-3 ${
                  insight.type === 'positive'
                    ? 'text-green-700 dark:text-green-300'
                    : insight.type === 'warning'
                    ? 'text-orange-700 dark:text-orange-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}
              >
                {insight.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {insight.dataPoints.map((point, pointIndex) => (
                  <span
                    key={pointIndex}
                    className={`text-xs px-2 py-1 rounded ${
                      insight.type === 'positive'
                        ? 'bg-green-200/50 text-green-800 dark:bg-green-700/50 dark:text-green-200'
                        : insight.type === 'warning'
                        ? 'bg-orange-200/50 text-orange-800 dark:bg-orange-700/50 dark:text-orange-200'
                        : 'bg-blue-200/50 text-blue-800 dark:bg-blue-700/50 dark:text-blue-200'
                    }`}
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}