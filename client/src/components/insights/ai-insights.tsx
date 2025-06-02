import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Connection, Moment } from "@shared/schema";
import { TrendingUp, TrendingDown, AlertCircle, Calendar, Heart, Users, Clock } from "lucide-react";

interface AIInsightsProps {
  connections: Connection[];
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

export function AIInsights({ connections, moments, userData }: AIInsightsProps) {
  // Generate data-driven insights
  const insights = generateDataInsights(connections, moments, userData);

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Data-driven patterns from your relationship tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Track more moments to discover insights about your relationship patterns
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div 
          key={index} 
          className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm">{insight.title}</h4>
            <span className="text-xs text-muted-foreground">
              {insight.confidence}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
          {insight.dataPoints && (
            <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
              {insight.dataPoints.map((point, i) => (
                <span key={i} className="bg-white dark:bg-neutral-700 px-2 py-1 rounded text-xs">
                  {point}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface Insight {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'neutral';
  confidence: number;
  icon: React.ReactNode;
  dataPoints?: string[];
}

function generateDataInsights(connections: Connection[], moments: Moment[], userData: any): Insight[] {
  const insights: Insight[] = [];

  if (moments.length < 3) return insights;

  // Analyze emotional patterns
  const emotionCounts = moments.reduce((acc: Record<string, number>, moment) => {
    acc[moment.emoji] = (acc[moment.emoji] || 0) + 1;
    return acc;
  }, {});

  const totalMoments = moments.length;
  const positiveEmojis = ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖'];
  const negativeEmojis = ['😔', '😢', '😠', '😤', '💔', '😕', '😞'];

  const positiveCount = Object.entries(emotionCounts)
    .filter(([emoji]) => positiveEmojis.includes(emoji))
    .reduce((sum, [, count]) => sum + count, 0);

  const negativeCount = Object.entries(emotionCounts)
    .filter(([emoji]) => negativeEmojis.includes(emoji))
    .reduce((sum, [, count]) => sum + count, 0);

  const positiveRatio = positiveCount / totalMoments;
  const negativeRatio = negativeCount / totalMoments;

  // Positive emotion trend insight
  if (positiveRatio > 0.6) {
    insights.push({
      title: "High Positive Emotional Pattern",
      description: `${Math.round(positiveRatio * 100)}% of your tracked moments show positive emotions. This indicates strong emotional satisfaction in your relationships.`,
      type: 'positive',
      confidence: Math.min(95, Math.round(positiveRatio * 100 + totalMoments)),
      icon: <Heart className="h-4 w-4 text-green-600" />,
      dataPoints: [`${positiveCount}/${totalMoments} positive moments`]
    });
  }

  // Warning for negative trends
  if (negativeRatio > 0.4) {
    insights.push({
      title: "Elevated Stress Indicators",
      description: `${Math.round(negativeRatio * 100)}% of your moments show challenging emotions. Consider focusing on self-care and communication strategies.`,
      type: 'warning',
      confidence: Math.round(negativeRatio * 100 + 20),
      icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
      dataPoints: [`${negativeCount}/${totalMoments} challenging moments`]
    });
  }

  // Connection diversity analysis
  const connectionMomentCounts = connections.map(conn => ({
    name: conn.name,
    count: moments.filter(m => m.connectionId === conn.id).length,
    stage: conn.relationshipStage
  }));

  const mostTrackedConnection = connectionMomentCounts.reduce((max, conn) => 
    conn.count > max.count ? conn : max, connectionMomentCounts[0]);

  if (mostTrackedConnection && mostTrackedConnection.count > totalMoments * 0.5) {
    insights.push({
      title: "Primary Connection Focus",
      description: `${mostTrackedConnection.name} represents ${Math.round((mostTrackedConnection.count / totalMoments) * 100)}% of your tracked moments, indicating this is your primary emotional focus.`,
      type: 'neutral',
      confidence: 85,
      icon: <Users className="h-4 w-4 text-blue-600" />,
      dataPoints: [`${mostTrackedConnection.count} moments with ${mostTrackedConnection.name}`]
    });
  }

  // Recent activity analysis
  const recentMoments = moments.filter(m => {
    const momentDate = new Date(m.createdAt || '');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return momentDate > sevenDaysAgo;
  });

  if (recentMoments.length > 0) {
    const recentPositive = recentMoments.filter(m => positiveEmojis.includes(m.emoji)).length;
    const recentPositiveRatio = recentPositive / recentMoments.length;

    if (recentPositiveRatio > 0.7) {
      insights.push({
        title: "Recent Positive Trend",
        description: `Your last 7 days show ${Math.round(recentPositiveRatio * 100)}% positive moments. You're experiencing a good period in your relationships.`,
        type: 'positive',
        confidence: Math.round(recentPositiveRatio * 80 + 15),
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        dataPoints: [`${recentMoments.length} moments this week`]
      });
    } else if (recentPositiveRatio < 0.3) {
      insights.push({
        title: "Recent Challenges",
        description: `Your recent week shows more challenging moments. This might be a good time to focus on self-care and reach out for support.`,
        type: 'warning',
        confidence: Math.round((1 - recentPositiveRatio) * 70 + 20),
        icon: <TrendingDown className="h-4 w-4 text-yellow-600" />,
        dataPoints: [`${recentMoments.length} moments this week`]
      });
    }
  }

  // Intimacy patterns
  const intimateMoments = moments.filter(m => m.isIntimate);
  if (intimateMoments.length > 0) {
    const intimacyRatio = intimateMoments.length / totalMoments;
    insights.push({
      title: "Intimacy Tracking Pattern",
      description: `${Math.round(intimacyRatio * 100)}% of your moments include intimacy indicators. This suggests you're comfortable tracking personal relationship aspects.`,
      type: 'neutral',
      confidence: 75,
      icon: <Heart className="h-4 w-4 text-pink-600" />,
      dataPoints: [`${intimateMoments.length} intimate moments tracked`]
    });
  }

  // Time patterns
  const momentsByHour = moments.reduce((acc: Record<number, number>, moment) => {
    const hour = new Date(moment.createdAt || '').getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const peakHour = Object.entries(momentsByHour)
    .reduce((max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max, { hour: 0, count: 0 });

  if (peakHour.count > totalMoments * 0.25) {
    const timeOfDay = peakHour.hour < 12 ? 'morning' : peakHour.hour < 17 ? 'afternoon' : 'evening';
    insights.push({
      title: "Peak Emotional Activity",
      description: `You tend to track relationship moments most during the ${timeOfDay} hours (around ${peakHour.hour}:00).`,
      type: 'neutral',
      confidence: 65,
      icon: <Clock className="h-4 w-4 text-purple-600" />,
      dataPoints: [`${peakHour.count} moments at ${peakHour.hour}:00`]
    });
  }

  return insights.slice(0, 5); // Return top 5 insights
}