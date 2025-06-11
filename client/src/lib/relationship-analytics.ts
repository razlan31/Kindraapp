import { Connection, Moment, MenstrualCycle } from "@shared/schema";

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
export function generateAnalyticsInsights(moments: Moment[], connections: Connection[], menstrualCycles?: MenstrualCycle[]): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  
  if (moments.length < 5) {
    // Analyze what the existing moments reveal rather than requesting more
    if (moments.length === 0) {
      return [{
        title: "Analytics Engine Ready",
        description: "Your relationship analytics system is prepared to identify emotional patterns, communication trends, and behavioral insights once relationship data becomes available.",
        type: 'neutral',
        confidence: 100,
        category: 'behavioral',
        dataPoints: ["Analytics framework initialized", "Pattern detection algorithms ready"],
        actionItems: ["Real-time analysis enabled", "Multi-dimensional relationship tracking available"]
      }];
    }
    
    // Analyze existing moments for early patterns
    const emotionCounts = moments.reduce((acc: Record<string, number>, moment) => {
      acc[moment.emoji] = (acc[moment.emoji] || 0) + 1;
      return acc;
    }, {});
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return [{
      title: "Early Pattern Detection",
      description: `Initial analysis of ${moments.length} moments reveals ${dominantEmotion[0]} as the primary emotional pattern. This early data suggests baseline relationship dynamics and emotional preferences.`,
      type: 'neutral',
      confidence: 70,
      category: 'pattern',
      dataPoints: [`${moments.length} data points analyzed`, `${dominantEmotion[0]} dominant pattern`],
      actionItems: [`${dominantEmotion[1]} instances recorded`, "Baseline emotional profile emerging"]
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
  
  // Menstrual cycle correlation analysis
  if (menstrualCycles && menstrualCycles.length > 0) {
    const cycleInsights = analyzeMenstrualCycleCorrelations(moments, connections, menstrualCycles);
    insights.push(...cycleInsights);
  }
  
  return insights.slice(0, 6);
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
        "Pattern indicates sustainable relationship practices",
        "Communication styles proving highly effective",
        "Emotional investment strategies yielding strong returns"
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
        "Pattern suggests need for relationship attention",
        "Communication frequency may require adjustment",
        "Stress indicators present in relationship dynamics"
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
        "Current strategies demonstrate high effectiveness",
        "Relationship management skills well-developed",
        "Emotional intelligence patterns consistently strong"
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
        "Primary relationship receives majority attention allocation",
        "Secondary connections show reduced engagement levels",
        "Focus concentration pattern indicates relationship priority"
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
        "Low engagement patterns identified across multiple connections",
        "Minimal activity suggests dormant relationship status",
        "Attention distribution skewed toward primary relationships"
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
        "Weekend-focused relationship investment pattern identified",
        "Leisure time strongly associated with connection activities",
        "Time allocation suggests work-life relationship boundaries"
      ] : [
        "Weekday relationship integration demonstrates routine prioritization",
        "Consistent daily connection patterns established",
        "Work-relationship balance successfully maintained"
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
          ? ["Dating strategy effectiveness confirmed", "Relationship building skills well-developed"]
          : ["Dating phase challenges identified", "Compatibility exploration patterns emerging"]
      };
      
    case 'Committed Relationship':
      return {
        description: positiveRatio > 0.7
          ? `Committed relationships demonstrate strong emotional stability (${Math.round(positiveRatio * 100)}% positive). You maintain healthy long-term connection patterns.`
          : `Consider focusing on appreciation exercises and quality time to strengthen committed bonds and reignite passion.`,
        type: baseType,
        recommendations: positiveRatio > 0.7
          ? ["Long-term relationship management skills demonstrated", "Partnership stability patterns confirmed"]
          : ["Committed relationship optimization opportunities identified", "Emotional investment patterns require attention"]
      };
      
    case 'Best Friend':
      return {
        description: positiveRatio > 0.8
          ? `Friendships are thriving with high positive energy (${Math.round(positiveRatio * 100)}%) and mutual support across ${connectionCount} friends.`
          : `Friendships might benefit from more shared activities and regular check-ins to maintain closeness.`,
        type: baseType,
        recommendations: positiveRatio > 0.7
          ? ["Friendship network management demonstrates strong social skills", "Group dynamic facilitation patterns successful"]
          : ["Friendship maintenance patterns show optimization opportunities", "Social connection depth requires strategic attention"]
      };
      
    default:
      return {
        description: `${stage} relationships show ${Math.round(positiveRatio * 100)}% positive moments across ${connectionCount} connections, indicating ${positiveRatio > 0.6 ? 'healthy' : 'developing'} relationship patterns.`,
        type: baseType,
        recommendations: ["Standard relationship development patterns observed", "Baseline communication frequency established"]
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
    recommendations = ["Consistent relationship stability patterns confirmed", "Predictable interaction quality maintained"];
  } else if (trendChange > 0) {
    direction = 'upward';
    confidence = Math.min(95, Math.round(trendChange * 400 + 70));
    analysis = "Recent interactions indicate strengthening emotional connection and growing satisfaction.";
    recommendations = ["Positive trajectory confirmed through data analysis", "Relationship satisfaction metrics trending upward", "Emotional investment strategies proving effective"];
  } else {
    direction = 'downward';
    confidence = Math.min(95, Math.round(trendMagnitude * 400 + 70));
    analysis = "Recent patterns suggest declining satisfaction or emerging relationship stress requiring attention.";
    recommendations = ["Declining satisfaction patterns detected in data", "Relationship stress indicators present", "Attention and care metrics show downward trend"];
  }
  
  return { direction, confidence, analysis, recommendations };
}

// Menstrual cycle correlation analysis
function analyzeMenstrualCycleCorrelations(moments: Moment[], connections: Connection[], menstrualCycles: MenstrualCycle[]): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  
  if (moments.length < 10 || menstrualCycles.length < 2) {
    return insights;
  }
  
  // Define cycle phases
  const getCyclePhase = (momentDate: Date, cycleStart: Date, cycleLength: number = 28): string => {
    const dayInCycle = Math.floor((momentDate.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    if (dayInCycle >= 1 && dayInCycle <= 5) return 'menstrual';
    if (dayInCycle >= 6 && dayInCycle <= 13) return 'follicular';
    if (dayInCycle >= 14 && dayInCycle <= 16) return 'ovulation';
    if (dayInCycle >= 17 && dayInCycle <= cycleLength) return 'luteal';
    return 'unknown';
  };
  
  // Categorize moments by cycle phase
  const phaseData: Record<string, {
    total: number;
    positive: number;
    conflicts: number;
    intimate: number;
    moments: Moment[];
  }> = {
    menstrual: { total: 0, positive: 0, conflicts: 0, intimate: 0, moments: [] },
    follicular: { total: 0, positive: 0, conflicts: 0, intimate: 0, moments: [] },
    ovulation: { total: 0, positive: 0, conflicts: 0, intimate: 0, moments: [] },
    luteal: { total: 0, positive: 0, conflicts: 0, intimate: 0, moments: [] }
  };
  
  const positiveEmojis = ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖', '🌟', '✨', '💫', '🔥', '😘', '🥳', '🎉'];
  const conflictTags = ['Argument', 'Disagreement', 'Misunderstanding', 'Conflict'];
  
  // Analyze each moment against cycle phases
  moments.forEach(moment => {
    if (!moment.createdAt) return;
    
    const momentDate = new Date(moment.createdAt);
    
    // Find the relevant cycle
    const relevantCycle = menstrualCycles.find(cycle => {
      const cycleStart = new Date(cycle.startDate);
      const cycleEnd = cycle.endDate ? new Date(cycle.endDate) : new Date(cycleStart.getTime() + 28 * 24 * 60 * 60 * 1000);
      return momentDate >= cycleStart && momentDate <= cycleEnd;
    });
    
    if (!relevantCycle) return;
    
    const phase = getCyclePhase(momentDate, new Date(relevantCycle.startDate));
    if (phase === 'unknown') return;
    
    const phaseStats = phaseData[phase];
    phaseStats.total++;
    phaseStats.moments.push(moment);
    
    // Categorize moment types
    if (positiveEmojis.includes(moment.emoji)) {
      phaseStats.positive++;
    }
    
    if (moment.tags && moment.tags.some(tag => conflictTags.includes(tag))) {
      phaseStats.conflicts++;
    }
    
    if (moment.isIntimate) {
      phaseStats.intimate++;
    }
  });
  
  // Generate insights based on phase patterns
  const totalMoments = Object.values(phaseData).reduce((sum, phase) => sum + phase.total, 0);
  
  if (totalMoments < 10) {
    return insights;
  }
  
  // Enhanced phase-specific analysis for detailed correlations
  const phaseAnalysis = analyzeEachPhaseIndividually(phaseData, totalMoments);
  insights.push(...phaseAnalysis);
  
  // Cross-phase correlation patterns
  const crossPhaseInsights = analyzeCrossPhasePatterns(phaseData);
  insights.push(...crossPhaseInsights);
  
  // Original logic for multiple phases
  const conflictPhases = Object.entries(phaseData)
    .map(([phase, data]) => ({
      phase,
      conflictRate: data.total > 0 ? data.conflicts / data.total : 0,
      totalConflicts: data.conflicts,
      sampleSize: data.total
    }))
    .filter(p => p.sampleSize >= 3)
    .sort((a, b) => b.conflictRate - a.conflictRate);
  
  if (conflictPhases.length >= 2 && conflictPhases[0].conflictRate > 0.1) {
    const highestConflictPhase = conflictPhases[0];
    const lowestConflictPhase = conflictPhases[conflictPhases.length - 1];
    
    insights.push({
      title: "Cycle-Conflict Correlation Detected",
      description: `Conflict patterns show strong correlation with menstrual cycle phases. ${Math.round(highestConflictPhase.conflictRate * 100)}% of ${highestConflictPhase.phase} phase moments involve conflicts, compared to ${Math.round(lowestConflictPhase.conflictRate * 100)}% during ${lowestConflictPhase.phase} phase. This suggests hormonal influences on relationship dynamics.`,
      type: 'warning',
      confidence: Math.min(90, Math.round(highestConflictPhase.sampleSize * 10 + 50)),
      category: 'correlation',
      dataPoints: [
        `${highestConflictPhase.phase} phase: ${Math.round(highestConflictPhase.conflictRate * 100)}% conflict rate`,
        `${lowestConflictPhase.phase} phase: ${Math.round(lowestConflictPhase.conflictRate * 100)}% conflict rate`,
        `${totalMoments} moments analyzed across cycles`
      ],
      actionItems: [
        "Hormonal cycle patterns significantly influence conflict frequency",
        "Relationship stress peaks during specific menstrual phases",
        "Cycle awareness could improve relationship management strategies"
      ]
    });
  }
  
  // Intimacy correlation analysis
  const intimacyPhases = Object.entries(phaseData)
    .map(([phase, data]) => ({
      phase,
      intimacyRate: data.total > 0 ? data.intimate / data.total : 0,
      totalIntimate: data.intimate,
      sampleSize: data.total
    }))
    .filter(p => p.sampleSize >= 3)
    .sort((a, b) => b.intimacyRate - a.intimacyRate);
  
  if (intimacyPhases.length >= 2 && intimacyPhases[0].intimacyRate > 0.1) {
    const highestIntimacyPhase = intimacyPhases[0];
    const lowestIntimacyPhase = intimacyPhases[intimacyPhases.length - 1];
    
    insights.push({
      title: "Cycle-Intimacy Pattern Analysis",
      description: `Intimate moments show clear cycle phase correlation. ${Math.round(highestIntimacyPhase.intimacyRate * 100)}% of ${highestIntimacyPhase.phase} phase interactions are intimate, versus ${Math.round(lowestIntimacyPhase.intimacyRate * 100)}% during ${lowestIntimacyPhase.phase} phase. This reflects natural hormonal fluctuations affecting relationship intimacy.`,
      type: 'positive',
      confidence: Math.min(88, Math.round(highestIntimacyPhase.sampleSize * 8 + 60)),
      category: 'correlation',
      dataPoints: [
        `${highestIntimacyPhase.phase} phase: ${Math.round(highestIntimacyPhase.intimacyRate * 100)}% intimacy rate`,
        `${lowestIntimacyPhase.phase} phase: ${Math.round(lowestIntimacyPhase.intimacyRate * 100)}% intimacy rate`,
        `Natural hormonal cycle influences detected`
      ],
      actionItems: [
        "Intimacy patterns align with natural hormonal cycles",
        "Cycle awareness reveals optimal connection timing",
        "Biological rhythms strongly influence relationship dynamics"
      ]
    });
  }
  
  // Overall positive mood correlation
  const positivePhases = Object.entries(phaseData)
    .map(([phase, data]) => ({
      phase,
      positiveRate: data.total > 0 ? data.positive / data.total : 0,
      totalPositive: data.positive,
      sampleSize: data.total
    }))
    .filter(p => p.sampleSize >= 3)
    .sort((a, b) => b.positiveRate - a.positiveRate);
  
  if (positivePhases.length >= 3) {
    const bestPhase = positivePhases[0];
    const worstPhase = positivePhases[positivePhases.length - 1];
    const differential = bestPhase.positiveRate - worstPhase.positiveRate;
    
    if (differential > 0.25) {
      insights.push({
        title: "Cycle-Mood Relationship Correlation",
        description: `Relationship satisfaction varies significantly across menstrual cycle phases. ${bestPhase.phase} phase shows ${Math.round(bestPhase.positiveRate * 100)}% positive interactions, while ${worstPhase.phase} phase shows ${Math.round(worstPhase.positiveRate * 100)}%. This ${Math.round(differential * 100)}% variation indicates strong hormonal influence on relationship experiences.`,
        type: 'neutral',
        confidence: Math.min(85, Math.round(totalMoments / 2 + 50)),
        category: 'pattern',
        dataPoints: [
          `${bestPhase.phase} phase: ${Math.round(bestPhase.positiveRate * 100)}% positive moments`,
          `${worstPhase.phase} phase: ${Math.round(worstPhase.positiveRate * 100)}% positive moments`,
          `${Math.round(differential * 100)}% variation across cycle phases`
        ],
        actionItems: [
          "Menstrual cycle significantly impacts relationship satisfaction",
          "Hormonal fluctuations create predictable mood patterns",
          "Cycle tracking reveals relationship optimization opportunities"
        ]
      });
    }
  }
  
  return insights;
}

// Analyze each menstrual cycle phase individually for detailed correlations
function analyzeEachPhaseIndividually(phaseData: Record<string, any>, totalMoments: number): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  
  const phaseDescriptions = {
    menstrual: {
      name: "Menstrual Phase",
      biology: "Low estrogen and progesterone levels",
      expectedPatterns: "potential mood sensitivity, energy fluctuations"
    },
    follicular: {
      name: "Follicular Phase", 
      biology: "Rising estrogen levels",
      expectedPatterns: "increasing energy, optimism, social openness"
    },
    ovulation: {
      name: "Ovulation Phase",
      biology: "Peak estrogen and LH surge",
      expectedPatterns: "heightened confidence, attraction, communication"
    },
    luteal: {
      name: "Luteal Phase",
      biology: "High progesterone, declining estrogen",
      expectedPatterns: "introspection, sensitivity, potential irritability"
    }
  };

  Object.entries(phaseData).forEach(([phase, data]) => {
    if (data.total < 5) return; // Only analyze phases with sufficient data
    
    const phaseInfo = phaseDescriptions[phase as keyof typeof phaseDescriptions];
    const conflictRate = data.conflicts / data.total;
    const intimacyRate = data.intimate / data.total;
    const positiveRate = data.positive / data.total;
    
    // Only generate insights if there are clear patterns (significant deviations)
    const hasSignificantConflictPattern = conflictRate > 0.2 || conflictRate < 0.05;
    const hasSignificantIntimacyPattern = intimacyRate > 0.3 || (intimacyRate < 0.1 && data.total > 8);
    const hasSignificantPositivePattern = positiveRate > 0.7 || positiveRate < 0.2;
    
    if (!hasSignificantConflictPattern && !hasSignificantIntimacyPattern && !hasSignificantPositivePattern) {
      return; // Skip this phase if no significant patterns
    }
    
    const phaseInsights = [];
    
    // Conflict analysis for this phase
    if (conflictRate > 0.2) {
      phaseInsights.push(`Elevated conflict rate (${Math.round(conflictRate * 100)}%) during ${phaseInfo.name.toLowerCase()}`);
    } else if (conflictRate < 0.05) {
      phaseInsights.push(`Remarkably low conflict rate (${Math.round(conflictRate * 100)}%) during ${phaseInfo.name.toLowerCase()}`);
    }
    
    // Intimacy analysis for this phase
    if (intimacyRate > 0.3) {
      phaseInsights.push(`High intimacy frequency (${Math.round(intimacyRate * 100)}%) aligns with ${phaseInfo.biology.toLowerCase()}`);
    } else if (intimacyRate < 0.1 && data.total > 8) {
      phaseInsights.push(`Notably lower intimacy frequency (${Math.round(intimacyRate * 100)}%) during ${phaseInfo.name.toLowerCase()}`);
    }
    
    // Positive interaction analysis
    if (positiveRate > 0.7) {
      phaseInsights.push(`High positive interaction rate (${Math.round(positiveRate * 100)}%) supports expected ${phaseInfo.expectedPatterns}`);
    } else if (positiveRate < 0.2) {
      phaseInsights.push(`Lower positive interaction rate (${Math.round(positiveRate * 100)}%) during ${phaseInfo.name.toLowerCase()}`);
    }
    
    // Create insight with meaningful patterns
    const insight: AnalyticsInsight = {
      title: `${phaseInfo.name} Pattern Analysis`,
      description: `During the ${phaseInfo.name.toLowerCase()} (${phaseInfo.biology.toLowerCase()}), analysis of ${data.total} relationship moments reveals distinct patterns. ${phaseInsights.join('. ')}. These patterns align with expected hormonal influences during this cycle phase.`,
      type: conflictRate > 0.2 ? 'warning' : positiveRate > 0.7 ? 'positive' : 'neutral',
      confidence: Math.min(88, Math.round(data.total * 6 + 50)),
      category: 'correlation',
      dataPoints: [
        `${data.total} moments during ${phaseInfo.name.toLowerCase()}`,
        `${Math.round(conflictRate * 100)}% conflict rate`,
        `${Math.round(intimacyRate * 100)}% intimacy rate`,
        `${Math.round(positiveRate * 100)}% positive interactions`,
        `Biological context: ${phaseInfo.biology}`
      ],
      actionItems: [
        `${phaseInfo.name} characteristics: ${phaseInfo.expectedPatterns}`,
        `Hormonal influence: ${phaseInfo.biology}`,
        phaseInsights.length > 1 ? "Multiple significant patterns detected" : "Single significant pattern identified"
      ]
    };
    
    insights.push(insight);
  });
  
  return insights;
}

// Analyze cross-phase correlation patterns
function analyzeCrossPhasePatterns(phaseData: Record<string, any>): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  
  const phasesWithData = Object.entries(phaseData)
    .filter(([_, data]) => data.total >= 5)
    .map(([phase, data]) => ({
      phase,
      conflictRate: data.conflicts / data.total,
      intimacyRate: data.intimate / data.total,
      positiveRate: data.positive / data.total,
      total: data.total
    }));
  
  if (phasesWithData.length < 2) return insights;
  
  // Find most and least conflicted phases
  const sortedByConflict = [...phasesWithData].sort((a, b) => b.conflictRate - a.conflictRate);
  const highConflictPhase = sortedByConflict[0];
  const lowConflictPhase = sortedByConflict[sortedByConflict.length - 1];
  
  // Only create insight if there's a significant difference
  if (highConflictPhase.conflictRate - lowConflictPhase.conflictRate > 0.15) {
    insights.push({
      title: "Cycle Conflict Correlation",
      description: `Conflict patterns vary significantly across menstrual cycle phases. ${highConflictPhase.phase} phase shows ${Math.round(highConflictPhase.conflictRate * 100)}% conflict rate compared to ${Math.round(lowConflictPhase.conflictRate * 100)}% during ${lowConflictPhase.phase} phase. This ${Math.round((highConflictPhase.conflictRate - lowConflictPhase.conflictRate) * 100)}% difference indicates strong cycle influence on relationship stress.`,
      type: 'warning',
      confidence: Math.min(85, Math.round((highConflictPhase.total + lowConflictPhase.total) * 3 + 45)),
      category: 'correlation',
      dataPoints: [
        `${highConflictPhase.phase}: ${Math.round(highConflictPhase.conflictRate * 100)}% conflict rate`,
        `${lowConflictPhase.phase}: ${Math.round(lowConflictPhase.conflictRate * 100)}% conflict rate`,
        `${Math.round((highConflictPhase.conflictRate - lowConflictPhase.conflictRate) * 100)}% variance between phases`
      ],
      actionItems: [
        `Avoid sensitive discussions during ${highConflictPhase.phase} phase`,
        `Schedule important conversations during ${lowConflictPhase.phase} phase`,
        "Cycle awareness enables strategic relationship timing"
      ]
    });
  }
  
  // Find most and least intimate phases
  const sortedByIntimacy = [...phasesWithData].sort((a, b) => b.intimacyRate - a.intimacyRate);
  const highIntimacyPhase = sortedByIntimacy[0];
  const lowIntimacyPhase = sortedByIntimacy[sortedByIntimacy.length - 1];
  
  // Only create insight if there's a significant difference
  if (highIntimacyPhase.intimacyRate - lowIntimacyPhase.intimacyRate > 0.2) {
    insights.push({
      title: "Cycle Intimacy Patterns",
      description: `Intimacy frequency shows clear cycle correlation. ${highIntimacyPhase.phase} phase demonstrates ${Math.round(highIntimacyPhase.intimacyRate * 100)}% intimacy rate versus ${Math.round(lowIntimacyPhase.intimacyRate * 100)}% during ${lowIntimacyPhase.phase} phase. This natural ${Math.round((highIntimacyPhase.intimacyRate - lowIntimacyPhase.intimacyRate) * 100)}% fluctuation reflects hormonal influences on desire and connection.`,
      type: 'positive',
      confidence: Math.min(82, Math.round((highIntimacyPhase.total + lowIntimacyPhase.total) * 3 + 40)),
      category: 'correlation',
      dataPoints: [
        `${highIntimacyPhase.phase}: ${Math.round(highIntimacyPhase.intimacyRate * 100)}% intimacy rate`,
        `${lowIntimacyPhase.phase}: ${Math.round(lowIntimacyPhase.intimacyRate * 100)}% intimacy rate`,
        `Natural ${Math.round((highIntimacyPhase.intimacyRate - lowIntimacyPhase.intimacyRate) * 100)}% hormonal variation`
      ],
      actionItems: [
        `${highIntimacyPhase.phase} phase: natural peak intimacy period`,
        `${lowIntimacyPhase.phase} phase: focus on emotional connection`,
        "Understanding natural rhythms reduces relationship pressure"
      ]
    });
  }
  
  return insights;
}