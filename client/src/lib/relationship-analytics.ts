import { Connection, Moment } from "@shared/schema";

export interface AnalyticsInsight {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'neutral' | 'critical';
  confidence: number;
  category: 'pattern' | 'trend' | 'correlation' | 'prediction' | 'behavioral';
  dataPoints: string[];
  actionItems?: string[];
  relatedConnections?: string[];
}

// Advanced pattern detection for relationship insights
export function generateAnalyticsInsights(moments: Moment[], connections: Connection[]): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  
  if (moments.length < 5) {
    return [{
      title: "Building Analytics Foundation",
      description: `Track ${5 - moments.length} more moments to unlock advanced pattern recognition, emotional trend analysis, and predictive relationship insights.`,
      type: 'neutral',
      confidence: 100,
      category: 'behavioral',
      dataPoints: [`${moments.length}/5 moments needed`, "Pattern detection ready"],
      actionItems: ["Continue logging daily interactions", "Track diverse moment types"]
    }];
  }
  
  // Emotional pattern analysis across all relationships
  const emotionalPatterns = analyzeEmotionalPatterns(moments);
  if (emotionalPatterns) {
    insights.push(emotionalPatterns);
  }
  
  // Communication frequency analysis
  const communicationInsights = analyzeCommunicationFrequency(moments, connections);
  insights.push(...communicationInsights);
  
  // Relationship stage correlation analysis
  const stageInsights = analyzeRelationshipStages(moments, connections);
  insights.push(...stageInsights);
  
  // Time-based pattern detection
  const temporalInsights = analyzeTemporalPatterns(moments);
  insights.push(...temporalInsights);
  
  // Behavioral trend prediction
  const predictiveInsights = generatePredictiveAnalysis(moments, connections);
  insights.push(...predictiveInsights);
  
  return insights.slice(0, 6); // Return top 6 insights
}

function analyzeEmotionalPatterns(moments: Moment[]): AnalyticsInsight | null {
  const positiveEmojis = ['😍', '💕', '❤️', '🎉', '🌅', '✈️', '💝', '📚', '🥰', '😊', '😄', '🤗', '💖'];
  const negativeEmojis = ['😢', '😞', '😕', '💔', '😤', '😠', '🙄', '😣', '😭', '😰'];
  const neutralEmojis = ['😐', '🤔', '😶', '😑', '🤷‍♀️', '🤷‍♂️'];
  
  const emotionCounts = {
    positive: moments.filter(m => positiveEmojis.includes(m.emoji)).length,
    negative: moments.filter(m => negativeEmojis.includes(m.emoji)).length,
    neutral: moments.filter(m => neutralEmojis.includes(m.emoji)).length
  };
  
  const total = moments.length;
  const positiveRatio = emotionCounts.positive / total;
  const negativeRatio = emotionCounts.negative / total;
  
  // Detect emotional momentum - consecutive patterns
  let consecutivePositive = 0;
  let consecutiveNegative = 0;
  let maxPositiveStreak = 0;
  let maxNegativeStreak = 0;
  
  const recentMoments = moments.slice(-10); // Last 10 moments
  for (const moment of recentMoments) {
    if (positiveEmojis.includes(moment.emoji)) {
      consecutivePositive++;
      consecutiveNegative = 0;
      maxPositiveStreak = Math.max(maxPositiveStreak, consecutivePositive);
    } else if (negativeEmojis.includes(moment.emoji)) {
      consecutiveNegative++;
      consecutivePositive = 0;
      maxNegativeStreak = Math.max(maxNegativeStreak, consecutiveNegative);
    } else {
      consecutivePositive = 0;
      consecutiveNegative = 0;
    }
  }
  
  if (maxPositiveStreak >= 4) {
    return {
      title: "Positive Momentum Detection",
      description: `Strong positive trend detected: ${maxPositiveStreak} consecutive positive moments. Your relationships are experiencing sustained growth and satisfaction. This momentum indicates effective communication and compatible connection patterns.`,
      type: 'positive',
      confidence: Math.min(95, maxPositiveStreak * 15 + 65),
      category: 'trend',
      dataPoints: [
        `${maxPositiveStreak} consecutive positive moments`,
        `${Math.round(positiveRatio * 100)}% overall positive ratio`,
        `Trend strength: ${maxPositiveStreak >= 6 ? 'Very Strong' : 'Strong'}`
      ],
      actionItems: [
        "Document what's creating this positive momentum",
        "Continue current successful relationship strategies",
        "Share positive experiences with your connections"
      ]
    };
  }
  
  if (maxNegativeStreak >= 3) {
    return {
      title: "Concerning Pattern Alert",
      description: `${maxNegativeStreak} consecutive challenging moments detected. This pattern suggests underlying relationship stress that needs attention. Early intervention can prevent further deterioration and strengthen bonds.`,
      type: 'warning',
      confidence: Math.min(90, maxNegativeStreak * 20 + 60),
      category: 'trend',
      dataPoints: [
        `${maxNegativeStreak} consecutive difficult moments`,
        `${Math.round(negativeRatio * 100)}% negative ratio`,
        `Intervention recommended`
      ],
      actionItems: [
        "Schedule quality time with affected connections",
        "Practice active listening and empathy",
        "Consider addressing underlying concerns openly"
      ]
    };
  }
  
  if (positiveRatio > 0.75) {
    return {
      title: "Exceptional Relationship Health",
      description: `${Math.round(positiveRatio * 100)}% of your moments are positive, indicating outstanding relationship satisfaction. You demonstrate excellent emotional intelligence and relationship management skills across your connections.`,
      type: 'positive',
      confidence: Math.round(positiveRatio * 100),
      category: 'pattern',
      dataPoints: [
        `${emotionCounts.positive}/${total} positive moments`,
        `Emotional balance score: ${Math.round((positiveRatio - negativeRatio) * 100)}`,
        `Relationship satisfaction: Excellent`
      ],
      actionItems: [
        "Maintain current relationship practices",
        "Share your strategies with others",
        "Continue celebrating positive moments"
      ]
    };
  }
  
  return null;
}

function analyzeCommunicationFrequency(moments: Moment[], connections: Connection[]): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  
  if (connections.length < 2) return insights;
  
  // Group moments by connection
  const connectionMoments: Record<number, Moment[]> = {};
  moments.forEach(moment => {
    if (moment.connectionId) {
      if (!connectionMoments[moment.connectionId]) {
        connectionMoments[moment.connectionId] = [];
      }
      connectionMoments[moment.connectionId].push(moment);
    }
  });
  
  // Calculate attention distribution
  const connectionStats = connections.map(conn => ({
    connection: conn,
    momentCount: connectionMoments[conn.id]?.length || 0,
    percentage: ((connectionMoments[conn.id]?.length || 0) / moments.length) * 100
  })).sort((a, b) => b.momentCount - a.momentCount);
  
  // Detect attention imbalances
  const topConnection = connectionStats[0];
  const neglectedConnections = connectionStats.filter(stat => stat.percentage < 5 && stat.momentCount > 0);
  
  if (topConnection && topConnection.percentage > 60) {
    const otherConnections = connectionStats.slice(1).filter(stat => stat.momentCount > 0);
    
    insights.push({
      title: "Relationship Focus Imbalance",
      description: `${topConnection.connection.name} receives ${Math.round(topConnection.percentage)}% of your relationship attention. While deep connections are valuable, balanced attention across your network strengthens overall relationship health and prevents over-dependence.`,
      type: 'warning',
      confidence: Math.round(topConnection.percentage + 20),
      category: 'pattern',
      dataPoints: [
        `${topConnection.connection.name}: ${topConnection.momentCount} moments (${Math.round(topConnection.percentage)}%)`,
        `Other connections: ${otherConnections.length} receiving less attention`,
        `Balance score: ${Math.round(100 - topConnection.percentage)}/100`
      ],
      actionItems: [
        `Schedule dedicated time with ${otherConnections.slice(0, 2).map(c => c.connection.name).join(' and ')}`,
        "Set weekly reminders for relationship maintenance",
        "Practice intentional relationship diversification"
      ],
      relatedConnections: [topConnection.connection.name, ...otherConnections.slice(0, 2).map(c => c.connection.name)]
    });
  }
  
  if (neglectedConnections.length > 0) {
    insights.push({
      title: "Connection Maintenance Opportunity",
      description: `${neglectedConnections.length} connections show minimal recent activity. Regular interaction maintains relationship strength and prevents gradual disconnection. Small, consistent efforts yield significant relationship benefits.`,
      type: 'neutral',
      confidence: 75,
      category: 'behavioral',
      dataPoints: [
        `${neglectedConnections.length} connections need attention`,
        `Average activity: ${Math.round(neglectedConnections.reduce((sum, c) => sum + c.percentage, 0) / neglectedConnections.length)}%`,
        `Maintenance opportunity identified`
      ],
      actionItems: [
        "Send check-in messages to dormant connections",
        "Schedule coffee dates or calls",
        "Share appreciation or memories"
      ],
      relatedConnections: neglectedConnections.map(c => c.connection.name)
    });
  }
  
  return insights;
}

function analyzeRelationshipStages(moments: Moment[], connections: Connection[]): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  
  // Group connections by stage
  const stageGroups = connections.reduce((acc, conn) => {
    const stage = conn.relationshipStage || 'Undefined';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(conn);
    return acc;
  }, {} as Record<string, Connection[]>);
  
  // Analyze each stage with sufficient data
  Object.entries(stageGroups).forEach(([stage, stageConnections]) => {
    if (stageConnections.length >= 2) {
      const stageMoments = moments.filter(m => 
        stageConnections.some(c => c.id === m.connectionId)
      );
      
      if (stageMoments.length >= 5) {
        const positiveEmojis = ['😍', '💕', '❤️', '🎉', '🌅', '✈️', '💝', '📚', '🥰', '😊', '😄'];
        const positiveCount = stageMoments.filter(m => positiveEmojis.includes(m.emoji)).length;
        const positiveRatio = positiveCount / stageMoments.length;
        
        const stageInsight = getStageSpecificInsight(stage, positiveRatio, stageConnections.length, stageMoments.length);
        
        insights.push({
          title: `${stage} Stage Analysis`,
          description: stageInsight.description,
          type: stageInsight.type,
          confidence: Math.min(90, stageMoments.length * 3 + 50),
          category: 'correlation',
          dataPoints: [
            `${stageConnections.length} ${stage} connections`,
            `${stageMoments.length} total moments`,
            `${Math.round(positiveRatio * 100)}% positive interactions`
          ],
          actionItems: stageInsight.recommendations,
          relatedConnections: stageConnections.map(c => c.name)
        });
      }
    }
  });
  
  return insights;
}

function analyzeTemporalPatterns(moments: Moment[]): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  
  if (moments.length < 15) return insights;
  
  // Analyze weekly patterns
  const dayCount: Record<string, number> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  moments.forEach(moment => {
    if (moment.createdAt) {
      const dayOfWeek = days[new Date(moment.createdAt).getDay()];
      dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
    }
  });
  
  const sortedDays = Object.entries(dayCount).sort((a, b) => b[1] - a[1]);
  const peakDay = sortedDays[0]?.[0];
  const peakPercentage = Math.round((sortedDays[0]?.[1] || 0) / moments.length * 100);
  
  if (peakPercentage > 25) {
    const isWeekend = peakDay === 'Friday' || peakDay === 'Saturday' || peakDay === 'Sunday';
    
    insights.push({
      title: "Weekly Relationship Rhythm",
      description: `You're most relationship-active on ${peakDay}s (${peakPercentage}% of moments). ${isWeekend ? 'Weekend-focused relationship patterns suggest you prioritize connections during leisure time, which creates positive associations.' : 'Weekday relationship activity shows you integrate connections into your routine, building consistent emotional bonds.'}`,
      type: 'positive',
      confidence: Math.min(85, peakPercentage * 2),
      category: 'pattern',
      dataPoints: [
        `Peak day: ${peakDay} (${peakPercentage}%)`,
        `Pattern type: ${isWeekend ? 'Weekend-focused' : 'Weekday-integrated'}`,
        `Consistency strength: ${peakPercentage > 35 ? 'High' : 'Moderate'}`
      ],
      actionItems: isWeekend ? [
        "Consider adding weekday check-ins",
        "Maintain your weekend relationship focus",
        "Balance leisure and routine connections"
      ] : [
        "Excellent routine integration",
        "Add spontaneous weekend activities",
        "Maintain consistent weekday patterns"
      ]
    });
  }
  
  return insights;
}

function generatePredictiveAnalysis(moments: Moment[], connections: Connection[]): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  
  if (moments.length < 20) return insights;
  
  // Analyze trajectory for each significant connection
  connections.forEach(connection => {
    const connectionMoments = moments.filter(m => m.connectionId === connection.id);
    if (connectionMoments.length >= 8) {
      const trajectory = calculateRelationshipTrajectory(connectionMoments);
      
      if (trajectory.confidence > 70) {
        insights.push({
          title: `${connection.name} Relationship Forecast`,
          description: `Based on recent interaction patterns, your relationship with ${connection.name} is trending ${trajectory.direction}. ${trajectory.analysis} Confidence level: ${trajectory.confidence}%.`,
          type: trajectory.direction === 'upward' ? 'positive' : trajectory.direction === 'downward' ? 'warning' : 'neutral',
          confidence: trajectory.confidence,
          category: 'prediction',
          dataPoints: [
            `Trend direction: ${trajectory.direction}`,
            `Pattern strength: ${trajectory.confidence}%`,
            `Based on ${connectionMoments.length} recent moments`
          ],
          actionItems: trajectory.recommendations,
          relatedConnections: [connection.name]
        });
      }
    }
  });
  
  return insights.slice(0, 2); // Top 2 predictions
}

// Helper functions
function getStageSpecificInsight(stage: string, positiveRatio: number, connectionCount: number, momentCount: number) {
  const baseType: 'positive' | 'warning' | 'neutral' | 'critical' = positiveRatio > 0.7 ? 'positive' : positiveRatio > 0.5 ? 'neutral' : 'warning';
  
  switch (stage) {
    case 'Dating':
      return {
        description: positiveRatio > 0.8 
          ? `Your dating connections show exceptional positivity (${Math.round(positiveRatio * 100)}%). You excel at creating enjoyable early-stage experiences and building romantic excitement.`
          : `Dating relationships could benefit from more fun, spontaneous activities to build positive associations and romantic momentum.`,
        type: baseType,
        recommendations: positiveRatio > 0.7 
          ? ["Continue your successful dating approach", "Share what works with other daters"]
          : ["Plan more exciting shared experiences", "Focus on discovery and compatibility", "Add spontaneity to interactions"]
      };
      
    case 'Committed Relationship':
      return {
        description: positiveRatio > 0.7
          ? `Committed relationships demonstrate strong emotional stability (${Math.round(positiveRatio * 100)}% positive). You maintain healthy long-term connection patterns.`
          : `Consider focusing on appreciation exercises and quality time to strengthen committed bonds and reignite passion.`,
        type: baseType,
        recommendations: positiveRatio > 0.7
          ? ["Maintain successful relationship practices", "Celebrate your partnership wins"]
          : ["Schedule regular date nights", "Practice daily gratitude sharing", "Reignite shared interests"]
      };
      
    case 'Best Friend':
      return {
        description: positiveRatio > 0.8
          ? `Friendships are thriving with high positive energy (${Math.round(positiveRatio * 100)}%) and mutual support across ${connectionCount} friends.`
          : `Friendships might benefit from more shared activities and regular check-ins to maintain closeness.`,
        type: baseType,
        recommendations: positiveRatio > 0.7
          ? ["Continue nurturing your friendship network", "Organize group activities"]
          : ["Plan regular friend dates", "Create shared memory-making activities", "Increase communication frequency"]
      };
      
    default:
      return {
        description: `${stage} relationships show ${Math.round(positiveRatio * 100)}% positive moments across ${connectionCount} connections, indicating ${positiveRatio > 0.6 ? 'healthy' : 'developing'} relationship patterns.`,
        type: baseType,
        recommendations: ["Continue building positive experiences", "Maintain consistent communication"]
      };
  }
}

function calculateRelationshipTrajectory(moments: Moment[]) {
  const positiveEmojis = ['😍', '💕', '❤️', '🎉', '🌅', '✈️', '💝', '📚', '🥰', '😊', '😄'];
  
  // Split into recent and older periods
  const recentCount = Math.max(3, Math.floor(moments.length * 0.4));
  const recentMoments = moments.slice(-recentCount);
  const olderMoments = moments.slice(0, -recentCount);
  
  const recentPositive = recentMoments.filter(m => positiveEmojis.includes(m.emoji)).length / recentMoments.length;
  const olderPositive = olderMoments.filter(m => positiveEmojis.includes(m.emoji)).length / olderMoments.length;
  
  const trendChange = recentPositive - olderPositive;
  const trendMagnitude = Math.abs(trendChange);
  
  let direction: 'upward' | 'downward' | 'stable';
  let confidence: number;
  let analysis: string;
  let recommendations: string[];
  
  if (trendMagnitude < 0.15) {
    direction = 'stable';
    confidence = 75;
    analysis = "Relationship patterns show consistent stability with predictable interaction quality.";
    recommendations = ["Maintain current positive patterns", "Consider introducing fresh experiences"];
  } else if (trendChange > 0) {
    direction = 'upward';
    confidence = Math.min(95, Math.round(trendChange * 400 + 70));
    analysis = "Recent interactions indicate strengthening emotional connection and growing satisfaction.";
    recommendations = ["Continue successful strategies", "Build on positive momentum", "Document what's working"];
  } else {
    direction = 'downward';
    confidence = Math.min(95, Math.round(trendMagnitude * 400 + 70));
    analysis = "Recent patterns suggest declining satisfaction or emerging relationship stress requiring attention.";
    recommendations = ["Address concerns proactively", "Increase quality time together", "Practice open communication"];
  }
  
  return { direction, confidence, analysis, recommendations };
}