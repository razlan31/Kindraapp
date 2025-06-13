import { Connection, Moment } from "@shared/schema";

export interface AdvancedInsight {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'neutral' | 'critical';
  confidence: number;
  category: 'pattern' | 'trend' | 'correlation' | 'prediction' | 'behavioral';
  dataPoints: string[];
  actionItems?: string[];
  relatedConnections?: string[];
}

export interface PatternAnalysis {
  patterns: AdvancedInsight[];
  trends: AdvancedInsight[];
  correlations: AdvancedInsight[];
  predictions: AdvancedInsight[];
  recommendations: AdvancedInsight[];
}

// Time-based pattern analysis
export function analyzeTemporalPatterns(moments: Moment[]): AdvancedInsight[] {
  const insights: AdvancedInsight[] = [];
  
  if (moments.length < 10) return insights;
  
  // Sort moments by date
  const sortedMoments = [...moments].sort((a, b) => 
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );
  
  // Analyze weekly patterns
  const weeklyActivity = analyzeDayOfWeekPatterns(sortedMoments);
  if (weeklyActivity.peakDay) {
    insights.push({
      title: "Weekly Relationship Rhythm",
      description: `You're most relationship-active on ${weeklyActivity.peakDay}s (${weeklyActivity.peakPercentage}% of moments). ${weeklyActivity.lowDay}s show the least activity. This pattern suggests ${weeklyActivity.interpretation}.`,
      type: weeklyActivity.peakPercentage > 30 ? 'positive' : 'neutral',
      confidence: Math.min(90, weeklyActivity.peakPercentage * 2),
      category: 'pattern',
      dataPoints: [
        `Peak: ${weeklyActivity.peakDay} (${weeklyActivity.peakPercentage}%)`,
        `Low: ${weeklyActivity.lowDay} (${weeklyActivity.lowPercentage}%)`,
        `Pattern strength: ${weeklyActivity.consistency}/10`
      ],
      actionItems: weeklyActivity.recommendations
    });
  }
  
  // Analyze emotional momentum (consecutive positive/negative trends)
  const emotionalMomentum = analyzeEmotionalMomentum(sortedMoments);
  if (emotionalMomentum.longestStreak > 5) {
    insights.push({
      title: "Emotional Momentum Detection",
      description: `${emotionalMomentum.streakType === 'positive' ? 'Positive momentum' : 'Concerning pattern'}: ${emotionalMomentum.longestStreak} consecutive ${emotionalMomentum.streakType} moments detected. ${emotionalMomentum.analysis}`,
      type: emotionalMomentum.streakType === 'positive' ? 'positive' : 'warning',
      confidence: Math.min(95, emotionalMomentum.longestStreak * 8),
      category: 'trend',
      dataPoints: [
        `Longest streak: ${emotionalMomentum.longestStreak} moments`,
        `Current streak: ${emotionalMomentum.currentStreak}`,
        `Trend direction: ${emotionalMomentum.direction}`
      ],
      actionItems: emotionalMomentum.recommendations
    });
  }
  
  return insights;
}

// Communication pattern analysis
export function analyzeCommunicationPatterns(moments: Moment[], connections: Connection[]): AdvancedInsight[] {
  const insights: AdvancedInsight[] = [];
  
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
  
  // Analyze interaction frequency imbalances
  const connectionStats = Object.entries(connectionMoments).map(([id, moments]) => {
    const connection = connections.find(c => c.id === parseInt(id));
    return {
      connection,
      momentCount: moments.length,
      avgMomentsPerWeek: calculateWeeklyAverage(moments),
      lastInteraction: new Date(Math.max(...moments.map(m => new Date(m.createdAt).getTime()))),
      emotionalBalance: calculateEmotionalBalance(moments)
    };
  }).filter(stat => stat.connection);
  
  // Detect attention imbalances
  if (connectionStats.length > 1) {
    const totalMoments = connectionStats.reduce((sum, stat) => sum + stat.momentCount, 0);
    const imbalances = connectionStats.filter(stat => 
      stat.momentCount / totalMoments > 0.6 || stat.momentCount / totalMoments < 0.1
    );
    
    if (imbalances.length > 0) {
      const dominantConnection = connectionStats.find(stat => stat.momentCount / totalMoments > 0.6);
      const neglectedConnections = connectionStats.filter(stat => stat.momentCount / totalMoments < 0.1);
      
      if (dominantConnection) {
        insights.push({
          title: "Relationship Focus Imbalance",
          description: `${dominantConnection.connection?.name} receives ${Math.round((dominantConnection.momentCount / totalMoments) * 100)}% of your relationship attention. While deep focus can strengthen bonds, consider balancing attention across your network to maintain healthy relationship diversity.`,
          type: 'warning',
          confidence: 85,
          category: 'pattern',
          dataPoints: [
            `${dominantConnection.connection?.name}: ${dominantConnection.momentCount} moments`,
            `Other connections: ${totalMoments - dominantConnection.momentCount} moments combined`,
            `Attention ratio: ${Math.round((dominantConnection.momentCount / totalMoments) * 100)}:${Math.round(((totalMoments - dominantConnection.momentCount) / totalMoments) * 100)}`
          ],
          actionItems: [
            `Schedule dedicated time with ${neglectedConnections.map(c => c.connection?.name).join(', ')}`,
            "Set weekly reminders to check in with all connections",
            "Practice intentional relationship maintenance"
          ],
          relatedConnections: [dominantConnection.connection?.name, ...neglectedConnections.map(c => c.connection?.name)].filter(Boolean) as string[]
        });
      }
    }
  }
  
  // Analyze response time patterns (if we had timestamp data)
  // This would detect communication urgency patterns, delayed responses, etc.
  
  return insights;
}

// Cross-connection correlation analysis
export function analyzeConnectionCorrelations(moments: Moment[], connections: Connection[]): AdvancedInsight[] {
  const insights: AdvancedInsight[] = [];
  
  // Analyze relationship stage progression patterns
  const stageGroups = connections.reduce((acc, conn) => {
    if (!acc[conn.relationshipStage || 'Unknown']) {
      acc[conn.relationshipStage || 'Unknown'] = [];
    }
    acc[conn.relationshipStage || 'Unknown'].push(conn);
    return acc;
  }, {} as Record<string, Connection[]>);
  
  // Calculate emotional patterns by relationship stage
  Object.entries(stageGroups).forEach(([stage, stageConnections]) => {
    if (stageConnections.length > 1) {
      const stageMoments = moments.filter(m => 
        stageConnections.some(c => c.id === m.connectionId)
      );
      
      if (stageMoments.length >= 10) {
        const positiveEmojis = ['😍', '💕', '❤️', '🎉', '🌅', '✈️', '💝', '📚', '🥰', '😊', '😄'];
        const negativeEmojis = ['😢', '😞', '😕', '💔', '😤', '😠', '🙄', '😣'];
        
        const positiveCount = stageMoments.filter(m => positiveEmojis.includes(m.emoji)).length;
        const negativeCount = stageMoments.filter(m => negativeEmojis.includes(m.emoji)).length;
        const positiveRatio = positiveCount / stageMoments.length;
        
        insights.push({
          title: `${stage} Stage Analysis`,
          description: `Your ${stage} relationships show ${Math.round(positiveRatio * 100)}% positive moments across ${stageConnections.length} connections. ${getStageInsight(stage, positiveRatio, stageConnections.length)}`,
          type: positiveRatio > 0.7 ? 'positive' : positiveRatio > 0.5 ? 'neutral' : 'warning',
          confidence: Math.min(90, stageMoments.length * 2),
          category: 'correlation',
          dataPoints: [
            `${stageConnections.length} ${stage} connections`,
            `${stageMoments.length} total moments`,
            `${Math.round(positiveRatio * 100)}% positive ratio`
          ],
          actionItems: getStageRecommendations(stage, positiveRatio),
          relatedConnections: stageConnections.map(c => c.name)
        });
      }
    }
  });
  
  return insights;
}

// Predictive analytics
export function generatePredictiveInsights(moments: Moment[], connections: Connection[]): AdvancedInsight[] {
  const insights: AdvancedInsight[] = [];
  
  if (moments.length < 20) return insights;
  
  // Predict relationship trajectory based on recent trends
  connections.forEach(connection => {
    const connectionMoments = moments.filter(m => m.connectionId === connection.id);
    if (connectionMoments.length >= 8) {
      const trajectory = predictRelationshipTrajectory(connectionMoments);
      
      if (trajectory.confidence > 70) {
        insights.push({
          title: `${connection.name} Relationship Forecast`,
          description: `Based on recent patterns, your relationship with ${connection.name} is trending ${trajectory.direction}. ${trajectory.analysis} Probability of continued ${trajectory.direction} trend: ${trajectory.confidence}%.`,
          type: trajectory.direction === 'upward' ? 'positive' : trajectory.direction === 'downward' ? 'warning' : 'neutral',
          confidence: trajectory.confidence,
          category: 'prediction',
          dataPoints: [
            `Trend direction: ${trajectory.direction}`,
            `Confidence level: ${trajectory.confidence}%`,
            `Based on ${connectionMoments.length} recent moments`
          ],
          actionItems: trajectory.recommendations,
          relatedConnections: [connection.name]
        });
      }
    }
  });
  
  return insights;
}

// Behavioral pattern recognition
export function analyzeBehavioralPatterns(moments: Moment[]): AdvancedInsight[] {
  const insights: AdvancedInsight[] = [];
  
  // Analyze conflict resolution patterns
  const conflictPatterns = detectConflictResolutionPatterns(moments);
  if (conflictPatterns.length > 0) {
    insights.push({
      title: "Conflict Resolution Pattern",
      description: `You typically resolve conflicts through ${conflictPatterns[0].method}. Success rate: ${conflictPatterns[0].successRate}%. ${conflictPatterns[0].analysis}`,
      type: conflictPatterns[0].successRate > 70 ? 'positive' : 'neutral',
      confidence: Math.min(90, conflictPatterns[0].frequency * 15),
      category: 'behavioral',
      dataPoints: [
        `Resolution method: ${conflictPatterns[0].method}`,
        `Success rate: ${conflictPatterns[0].successRate}%`,
        `Pattern frequency: ${conflictPatterns[0].frequency} instances`
      ],
      actionItems: conflictPatterns[0].recommendations
    });
  }
  
  return insights;
}

// Helper functions for pattern analysis
function analyzeDayOfWeekPatterns(moments: Moment[]) {
  const dayCount: Record<string, number> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  moments.forEach(moment => {
    const dayOfWeek = days[new Date(moment.createdAt || 0).getDay()];
    dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
  });
  
  const sortedDays = Object.entries(dayCount).sort((a, b) => b[1] - a[1]);
  const peakDay = sortedDays[0]?.[0];
  const lowDay = sortedDays[sortedDays.length - 1]?.[0];
  const peakPercentage = Math.round((sortedDays[0]?.[1] || 0) / moments.length * 100);
  const lowPercentage = Math.round((sortedDays[sortedDays.length - 1]?.[1] || 0) / moments.length * 100);
  
  const interpretation = peakDay === 'Friday' || peakDay === 'Saturday' || peakDay === 'Sunday' 
    ? "you prioritize relationships during weekends and leisure time"
    : "you actively nurture relationships during busy weekdays";
  
  const recommendations = peakPercentage > 40 
    ? ["Consider spreading relationship activities more evenly throughout the week", "Schedule quality time on typically low-activity days"]
    : ["Your relationship timing is well-balanced", "Continue maintaining consistent connection patterns"];
  
  return {
    peakDay,
    lowDay,
    peakPercentage,
    lowPercentage,
    consistency: Math.round((1 - (peakPercentage - lowPercentage) / 100) * 10),
    interpretation,
    recommendations
  };
}

function analyzeEmotionalMomentum(moments: Moment[]) {
  const positiveEmojis = ['😍', '💕', '❤️', '🎉', '🌅', '✈️', '💝', '📚', '🥰', '😊', '😄'];
  const negativeEmojis = ['😢', '😞', '😕', '💔', '😤', '😠', '🙄', '😣'];
  
  let currentStreak = 0;
  let longestStreak = 0;
  let streakType: 'positive' | 'negative' | 'mixed' = 'mixed';
  let currentStreakType: 'positive' | 'negative' | 'neutral' = 'neutral';
  
  for (let i = moments.length - 1; i >= 0; i--) {
    const moment = moments[i];
    const isPositive = positiveEmojis.includes(moment.emoji);
    const isNegative = negativeEmojis.includes(moment.emoji);
    
    if (i === moments.length - 1) {
      currentStreakType = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
      currentStreak = 1;
    } else {
      const prevType = currentStreakType;
      const newType = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
      
      if (newType === prevType && newType !== 'neutral') {
        currentStreak++;
      } else {
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          streakType = currentStreakType as 'positive' | 'negative';
        }
        currentStreak = 1;
        currentStreakType = newType;
      }
    }
  }
  
  const analysis = streakType === 'positive' 
    ? "This positive momentum indicates strong relationship satisfaction and effective communication patterns."
    : "This pattern suggests underlying issues that may need attention to prevent relationship deterioration.";
  
  const recommendations = streakType === 'positive'
    ? ["Continue the practices that created this positive momentum", "Document what's working well for future reference"]
    : ["Schedule a calm conversation to address underlying concerns", "Consider relationship counseling if patterns persist", "Focus on one positive interaction daily"];
  
  return {
    longestStreak,
    currentStreak,
    streakType,
    direction: currentStreak > 3 ? 'continuing' : 'variable',
    analysis,
    recommendations
  };
}

function calculateWeeklyAverage(moments: Moment[]): number {
  if (moments.length === 0) return 0;
  
  const firstMoment = new Date(moments[0].createdAt);
  const lastMoment = new Date(moments[moments.length - 1].createdAt);
  const weeksDiff = Math.max(1, (lastMoment.getTime() - firstMoment.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  return Math.round((moments.length / weeksDiff) * 10) / 10;
}

function calculateEmotionalBalance(moments: Moment[]): number {
  const positiveEmojis = ['😍', '💕', '❤️', '🎉', '🌅', '✈️', '💝', '📚', '🥰', '😊', '😄'];
  const negativeEmojis = ['😢', '😞', '😕', '💔', '😤', '😠', '🙄', '😣'];
  
  const positiveCount = moments.filter(m => positiveEmojis.includes(m.emoji)).length;
  const negativeCount = moments.filter(m => negativeEmojis.includes(m.emoji)).length;
  
  return positiveCount - negativeCount;
}

function getStageInsight(stage: string, positiveRatio: number, connectionCount: number): string {
  if (stage === 'Dating') {
    return positiveRatio > 0.8 
      ? "Your dating connections show exceptional positivity - you're excellent at creating enjoyable early-stage experiences."
      : "Dating relationships could benefit from more fun, spontaneous activities to build positive associations.";
  } else if (stage === 'Committed Relationship') {
    return positiveRatio > 0.7
      ? "Your committed relationships demonstrate strong emotional stability and satisfaction."
      : "Consider focusing on appreciation exercises and quality time to strengthen committed bonds.";
  } else if (stage === 'Best Friend') {
    return positiveRatio > 0.8
      ? "Your friendships are thriving with high positive energy and mutual support."
      : "Friendships might benefit from more shared activities and regular check-ins.";
  }
  return "This relationship stage shows unique patterns worth exploring further.";
}

function getStageRecommendations(stage: string, positiveRatio: number): string[] {
  const base = positiveRatio > 0.7 
    ? ["Continue current successful strategies", "Document what's working well"]
    : ["Increase positive shared experiences", "Practice active appreciation"];
    
  if (stage === 'Dating') {
    return [...base, "Plan exciting new activities together", "Focus on discovering compatibility"];
  } else if (stage === 'Committed Relationship') {
    return [...base, "Schedule regular date nights", "Practice daily gratitude sharing"];
  } else if (stage === 'Best Friend') {
    return [...base, "Plan regular friend dates", "Create shared memory-making activities"];
  }
  return base;
}

function predictRelationshipTrajectory(moments: Moment[]) {
  const positiveEmojis = ['😍', '💕', '❤️', '🎉', '🌅', '✈️', '💝', '📚', '🥰', '😊', '😄'];
  const negativeEmojis = ['😢', '😞', '😕', '💔', '😤', '😠', '🙄', '😣'];
  
  // Analyze recent trend (last 30% of moments)
  const recentCount = Math.max(3, Math.floor(moments.length * 0.3));
  const recentMoments = moments.slice(-recentCount);
  const olderMoments = moments.slice(0, -recentCount);
  
  const recentPositive = recentMoments.filter(m => positiveEmojis.includes(m.emoji)).length / recentMoments.length;
  const olderPositive = olderMoments.filter(m => positiveEmojis.includes(m.emoji)).length / olderMoments.length;
  
  const trendChange = recentPositive - olderPositive;
  
  let direction: 'upward' | 'downward' | 'stable';
  let confidence: number;
  let analysis: string;
  let recommendations: string[];
  
  if (Math.abs(trendChange) < 0.1) {
    direction = 'stable';
    confidence = 75;
    analysis = "Relationship patterns are consistent and stable.";
    recommendations = ["Maintain current positive patterns", "Consider introducing new shared experiences"];
  } else if (trendChange > 0.1) {
    direction = 'upward';
    confidence = Math.min(95, Math.round(trendChange * 300 + 70));
    analysis = "Recent interactions show improving emotional connection and satisfaction.";
    recommendations = ["Continue current successful strategies", "Build on this positive momentum"];
  } else {
    direction = 'downward';
    confidence = Math.min(95, Math.round(Math.abs(trendChange) * 300 + 70));
    analysis = "Recent patterns suggest potential relationship stress or declining satisfaction.";
    recommendations = ["Address concerns proactively", "Schedule quality time together", "Consider professional guidance if needed"];
  }
  
  return { direction, confidence, analysis, recommendations };
}

function detectConflictResolutionPatterns(moments: Moment[]) {
  const conflictEmojis = ['😤', '😠', '🙄', '😣', '💔', '😞'];
  const resolutionEmojis = ['🤝', '💕', '❤️', '😊', '🥰'];
  
  const patterns: Array<{
    method: string;
    successRate: number;
    frequency: number;
    analysis: string;
    recommendations: string[];
  }> = [];
  
  // Find conflict-resolution sequences
  const conflictSequences: Array<{ conflict: Moment; resolution?: Moment; timeToResolve?: number }> = [];
  
  for (let i = 0; i < moments.length; i++) {
    const moment = moments[i];
    if (conflictEmojis.includes(moment.emoji)) {
      // Look for resolution within next 5 moments or 48 hours
      const sequence = { conflict: moment, resolution: undefined, timeToResolve: undefined };
      
      for (let j = i + 1; j < Math.min(i + 6, moments.length); j++) {
        const nextMoment = moments[j];
        const timeDiff = new Date(nextMoment.createdAt).getTime() - new Date(moment.createdAt).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff > 48) break;
        
        if (resolutionEmojis.includes(nextMoment.emoji)) {
          sequence.resolution = nextMoment;
          sequence.timeToResolve = hoursDiff;
          break;
        }
      }
      
      conflictSequences.push(sequence);
    }
  }
  
  if (conflictSequences.length >= 3) {
    const resolvedCount = conflictSequences.filter(seq => seq.resolution).length;
    const successRate = Math.round((resolvedCount / conflictSequences.length) * 100);
    const avgResolutionTime = conflictSequences
      .filter(seq => seq.timeToResolve)
      .reduce((sum, seq) => sum + (seq.timeToResolve || 0), 0) / resolvedCount;
    
    const method = avgResolutionTime < 2 
      ? "immediate communication" 
      : avgResolutionTime < 24 
      ? "thoughtful reflection and discussion"
      : "extended processing time";
    
    patterns.push({
      method,
      successRate,
      frequency: conflictSequences.length,
      analysis: successRate > 80 
        ? "You demonstrate strong conflict resolution skills with consistent positive outcomes."
        : "Conflict resolution could be improved with more proactive communication strategies.",
      recommendations: successRate > 80
        ? ["Continue using your effective resolution approach", "Share your strategies with others"]
        : ["Practice active listening during conflicts", "Set regular check-ins to prevent issues", "Consider learning new communication techniques"]
    });
  }
  
  return patterns;
}

// Main orchestrator function
export function generateAdvancedInsights(moments: Moment[], connections: Connection[]): AdvancedInsight[] {
  const allInsights: AdvancedInsight[] = [];
  
  // Run all analysis modules
  allInsights.push(...analyzeTemporalPatterns(moments));
  allInsights.push(...analyzeCommunicationPatterns(moments, connections));
  allInsights.push(...analyzeConnectionCorrelations(moments, connections));
  allInsights.push(...generatePredictiveInsights(moments, connections));
  allInsights.push(...analyzeBehavioralPatterns(moments));
  
  // Sort by confidence and relevance
  return allInsights.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}