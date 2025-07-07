import { TrendingUp, Users, AlertCircle, Clock, Target, Brain, Zap, TrendingDown, Heart, MessageSquare } from "lucide-react";
import { Connection, Moment, MenstrualCycle } from "@shared/schema";
import { generateAnalyticsInsights, AnalyticsInsight } from "@/lib/relationship-analytics";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";

interface ConnectionAIInsightsProps {
  connection: Connection;
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

export function ConnectionAIInsights({ connection, moments, userData }: ConnectionAIInsightsProps) {
  const { isAuthenticated } = useAuth();
  
  // Fetch menstrual cycle data for correlation analysis
  const { data: menstrualCycles = [] } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
    enabled: isAuthenticated && !!user, // Only fetch when authenticated
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

// Generate connection-specific insights using custom analytics for individual connections
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

  // Early exit for insufficient data
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

  // Analyze recent activity patterns
  const recentMoments = moments.filter(m => {
    if (!m.createdAt) return false;
    const momentDate = new Date(m.createdAt);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return momentDate >= thirtyDaysAgo;
  });

  const positiveEmojis = ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖', '🌟', '✨', '💫', '🔥', '😘', '🥳', '🎉'];
  const conflictEmojis = ['😢', '😞', '😕', '💔', '😤', '😠', '🙄', '😣', '😭', '😰', '⚡'];
  const intimateEmojis = ['💋', '🔥', '😘', '🥰', '💖', '😍'];

  const positiveCount = moments.filter(m => positiveEmojis.includes(m.emoji) || m.tags?.includes('Green Flag')).length;
  const conflictCount = moments.filter(m => conflictEmojis.includes(m.emoji) || m.tags?.includes('Red Flag') || m.tags?.includes('Yellow Flag')).length;
  const intimateCount = moments.filter(m => m.isIntimate || intimateEmojis.includes(m.emoji) || m.tags?.includes('Physical Touch')).length;

  // Activity pattern analysis
  if (recentMoments.length > 0) {
    const validMoments = moments.filter(m => m.createdAt);
    const avgDaysBetween = validMoments.length > 1 ? 
      (new Date(validMoments[0].createdAt!).getTime() - new Date(validMoments[validMoments.length - 1].createdAt!).getTime()) / (1000 * 60 * 60 * 24) / (validMoments.length - 1) : 0;

    if (isSelfConnection) {
      insights.push({
        title: "Self-Reflection Pattern",
        description: `Your personal development tracking shows ${recentMoments.length} self-reflection moments in the last 30 days, with an average of ${avgDaysBetween > 0 ? Math.round(avgDaysBetween) : 'daily'} days between personal check-ins. This indicates ${recentMoments.length > 15 ? 'excellent' : recentMoments.length > 8 ? 'consistent' : 'developing'} self-awareness practice.`,
        type: recentMoments.length > 8 ? 'positive' : recentMoments.length > 4 ? 'neutral' : 'warning',
        confidence: Math.min(90, Math.round(recentMoments.length * 4 + 55)),
        category: 'pattern',
        dataPoints: [
          `${recentMoments.length} recent self-reflections`,
          `${moments.length} total personal moments`,
          `${Math.round(avgDaysBetween)} days between check-ins`
        ],
        actionItems: [
          `Self-reflection frequency: ${recentMoments.length > 15 ? 'highly committed' : recentMoments.length > 8 ? 'consistently mindful' : 'building awareness'}`,
          "Regular self-check-ins enhance emotional intelligence"
        ]
      });
    } else {
      insights.push({
        title: "Communication Pattern",
        description: `Your interaction frequency with ${connection.name} shows ${recentMoments.length} moments in the last 30 days, with an average of ${avgDaysBetween > 0 ? Math.round(avgDaysBetween) : 'daily'} days between recorded interactions. This suggests ${recentMoments.length > 10 ? 'strong engagement' : recentMoments.length > 5 ? 'steady connection' : 'casual interaction'} in your relationship dynamic.`,
        type: recentMoments.length > 10 ? 'positive' : recentMoments.length > 5 ? 'neutral' : 'warning',
        confidence: Math.min(85, Math.round(recentMoments.length * 5 + 50)),
        category: 'pattern',
        dataPoints: [
          `${recentMoments.length} recent interactions`,
          `${moments.length} total moments recorded`,
          `${Math.round(avgDaysBetween)} days between interactions`
        ],
        actionItems: [
          `Interaction frequency: ${recentMoments.length > 10 ? 'highly engaged' : recentMoments.length > 5 ? 'moderately active' : 'occasional contact'}`,
          `Communication pattern reflects ${connection.relationshipStage.toLowerCase()} stage dynamics`
        ]
      });
    }
  }

  // Emotional dynamic analysis
  if (positiveCount > 0 || conflictCount > 0) {
    const totalEmotional = positiveCount + conflictCount;
    const emotionalRatio = positiveCount / Math.max(1, totalEmotional);
    const dominantPattern = emotionalRatio > 0.7 ? 'positive' : emotionalRatio < 0.3 ? 'challenging' : 'balanced';

    if (isSelfConnection) {
      insights.push({
        title: "Personal Emotional Pattern",
        description: `Your self-reflection shows ${Math.round(emotionalRatio * 100)}% positive personal moments versus ${Math.round((1 - emotionalRatio) * 100)}% challenging periods. This ${dominantPattern} emotional pattern indicates ${dominantPattern === 'positive' ? 'strong self-compassion and growth mindset' : dominantPattern === 'challenging' ? 'honest self-reflection and growth focus' : 'healthy emotional self-awareness'}.`,
        type: dominantPattern === 'positive' ? 'positive' : dominantPattern === 'challenging' ? 'neutral' : 'positive',
        confidence: Math.min(92, Math.round(totalEmotional * 7 + 50)),
        category: 'behavioral',
        dataPoints: [
          `${positiveCount} positive self-moments`,
          `${conflictCount} challenging reflections`,
          `${Math.round(emotionalRatio * 100)}% positive ratio`
        ],
        actionItems: [
          `Self-emotional pattern: ${dominantPattern} self-awareness`,
          dominantPattern === 'positive' ? "Strong foundation for continued growth" : "Honest self-reflection enables development"
        ]
      });
    } else {
      insights.push({
        title: "Emotional Dynamic",
        description: `Your emotional pattern with ${connection.name} shows ${Math.round(emotionalRatio * 100)}% positive moments versus ${Math.round((1 - emotionalRatio) * 100)}% challenging interactions. This ${dominantPattern} dynamic indicates ${dominantPattern === 'positive' ? 'strong emotional harmony' : dominantPattern === 'challenging' ? 'areas for relationship attention' : 'natural emotional complexity'}.`,
        type: dominantPattern === 'positive' ? 'positive' : dominantPattern === 'challenging' ? 'warning' : 'neutral',
        confidence: Math.min(88, Math.round(totalEmotional * 8 + 45)),
        category: 'behavioral',
        dataPoints: [
          `${positiveCount} positive moments`,
          `${conflictCount} challenging moments`,
          `${Math.round(emotionalRatio * 100)}% positive ratio`
        ],
        actionItems: [
          `Emotional dynamic: ${dominantPattern} interaction pattern`,
          dominantPattern === 'positive' ? "Strong emotional foundation detected" : dominantPattern === 'challenging' ? "Consider communication strategies" : "Natural emotional variety"
        ]
      });
    }
  }

  // Intimacy analysis (for non-self connections)
  if (!isSelfConnection && intimateCount > 0 && moments.length > 5) {
    const intimacyFrequency = intimateCount / moments.length;
    
    insights.push({
      title: "Intimacy Pattern",
      description: `Intimate moments with ${connection.name} represent ${Math.round(intimacyFrequency * 100)}% of your tracked interactions (${intimateCount} out of ${moments.length} moments). This ${intimacyFrequency > 0.3 ? 'high' : intimacyFrequency > 0.15 ? 'moderate' : 'low'} intimacy frequency aligns with ${connection.relationshipStage.toLowerCase()} stage expectations.`,
      type: 'positive',
      confidence: Math.min(82, Math.round(intimateCount * 10 + 60)),
      category: 'correlation',
      dataPoints: [
        `${intimateCount} intimate moments recorded`,
        `${Math.round(intimacyFrequency * 100)}% intimacy frequency`,
        `${connection.relationshipStage} stage context`
      ],
      actionItems: [
        `Intimacy level: ${intimacyFrequency > 0.3 ? 'highly intimate' : intimacyFrequency > 0.15 ? 'moderately intimate' : 'developing intimacy'}`,
        `Physical connection patterns align with ${connection.relationshipStage.toLowerCase()} expectations`
      ]
    });
  }

  // Advanced menstrual cycle correlation analysis with deep insights
  if (cycles.length > 0 && moments.length > 3) {
    const cyclePhaseAnalysis = analyzeCyclePhaseCorrelations(moments, cycles);
    if (cyclePhaseAnalysis) {
      const primaryCharacteristics = cyclePhaseAnalysis.characteristics?.slice(0, 2) || [];
      const primaryInsights = cyclePhaseAnalysis.insights?.slice(0, 2) || [];
      const primaryRecommendations = cyclePhaseAnalysis.recommendations?.slice(0, 2) || [];
      
      // Build comprehensive description
      let description = isSelfConnection ? 
        `Your personal development patterns during ${cyclePhaseAnalysis.strongestPhase} phase reveal ` :
        `Your relationship dynamics with ${connection.name} during ${cyclePhaseAnalysis.strongestPhase} phase show `;
      
      if (primaryCharacteristics.length > 0) {
        description += primaryCharacteristics.join(' and ') + '. ';
      }
      
      if (cyclePhaseAnalysis.detailedAnalysis?.biologicalContext) {
        description += `${cyclePhaseAnalysis.detailedAnalysis.biologicalContext}. `;
      }
      
      if (primaryInsights.length > 0) {
        description += `Analysis reveals ${primaryInsights.join(' and ')}.`;
      }
      
      // Build comprehensive data points
      const dataPoints = [
        `${cyclePhaseAnalysis.totalCycleData} interactions across ${cycles.length} cycles`,
        `${cyclePhaseAnalysis.strongestPhase} phase: strongest correlation pattern`,
        ...(cyclePhaseAnalysis.phaseBreakdown ? 
          cyclePhaseAnalysis.phaseBreakdown
            .filter(p => p.interactions > 0)
            .slice(0, 3)
            .map(p => `${p.phase}: ${p.interactions} interactions (${p.positiveRate}% positive)`) : 
          []),
        ...(cyclePhaseAnalysis.detailedAnalysis?.patternConsistency ? 
          [cyclePhaseAnalysis.detailedAnalysis.patternConsistency] : [])
      ];
      
      // Build comprehensive action items
      const actionItems = [
        ...(primaryRecommendations || []),
        ...(cyclePhaseAnalysis.detailedAnalysis?.behavioralInsights?.slice(0, 2) || []),
        ...(cyclePhaseAnalysis.detailedAnalysis?.nextCyclePrediction ? 
          [`Next optimal ${cyclePhaseAnalysis.strongestPhase} phase: ${cyclePhaseAnalysis.detailedAnalysis.nextCyclePrediction.nextOptimalDate} (${cyclePhaseAnalysis.detailedAnalysis.nextCyclePrediction.daysUntilOptimal} days away)`] : 
          []),
        ...(cyclePhaseAnalysis.riskFactors?.length > 0 ? 
          [`Risk awareness: ${cyclePhaseAnalysis.riskFactors.join(', ')}`] : 
          []),
        ...(cyclePhaseAnalysis.detailedAnalysis?.cycleLengthVariability ? 
          [cyclePhaseAnalysis.detailedAnalysis.cycleLengthVariability] : [])
      ];
      
      insights.push({
        title: isSelfConnection ? 
          `Advanced Personal Cycle Intelligence: ${cyclePhaseAnalysis.strongestPhase.charAt(0).toUpperCase() + cyclePhaseAnalysis.strongestPhase.slice(1)} Phase Mastery` :
          `Advanced Cycle-Aware Relationship Intelligence: ${cyclePhaseAnalysis.strongestPhase.charAt(0).toUpperCase() + cyclePhaseAnalysis.strongestPhase.slice(1)} Phase Optimization`,
        description,
        type: cyclePhaseAnalysis.riskFactors?.length > 0 ? 'warning' : 'positive',
        confidence: cyclePhaseAnalysis.confidence,
        category: 'correlation',
        dataPoints: dataPoints.slice(0, 5),
        actionItems: actionItems.slice(0, 5)
      });
    }
  }

  // Tag pattern analysis
  if (moments.length > 10) {
    const tagAnalysis = analyzeTagPatterns(moments, connection);
    if (tagAnalysis) {
      insights.push(tagAnalysis);
    }
  }

  return insights.slice(0, 4); // Return top 4 insights
}

// Advanced cycle phase correlation analysis with deep insights
function analyzeCyclePhaseCorrelations(moments: Moment[], cycles: MenstrualCycle[]) {
  if (cycles.length === 0) return null;

  const phaseCorrelations = {
    menstrual: { count: 0, positive: 0, intimate: 0, conflict: 0, communication: 0, emotional: 0, dates: [] as Date[] },
    follicular: { count: 0, positive: 0, intimate: 0, conflict: 0, communication: 0, emotional: 0, dates: [] as Date[] },
    ovulation: { count: 0, positive: 0, intimate: 0, conflict: 0, communication: 0, emotional: 0, dates: [] as Date[] },
    luteal: { count: 0, positive: 0, intimate: 0, conflict: 0, communication: 0, emotional: 0, dates: [] as Date[] }
  };

  const positiveEmojis = ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖', '🌟', '✨', '💫', '🔥', '😘', '🥳', '🎉'];
  const conflictEmojis = ['😢', '😞', '😕', '💔', '😤', '😠', '🙄', '😣', '😭', '😰', '⚡'];
  const intimateEmojis = ['💋', '🔥', '😘', '🥰', '💖', '😍'];
  const communicationTags = ['Deep Talk', 'Quality Time', 'Heart to Heart', 'Advice', 'Support'];
  const emotionalTags = ['Emotional', 'Moody', 'Sensitive', 'Vulnerable', 'Caring'];

  moments.forEach(moment => {
    if (!moment.createdAt) return;
    
    const momentDate = new Date(moment.createdAt);
    const cycle = cycles.find(c => {
      const cycleStart = new Date(c.periodStartDate);
      const cycleEnd = c.cycleEndDate ? new Date(c.cycleEndDate) : new Date(cycleStart.getTime() + 28 * 24 * 60 * 60 * 1000);
      return momentDate >= cycleStart && momentDate <= cycleEnd;
    });

    if (cycle) {
      const phase = getCyclePhase(momentDate, cycle);
      if (phase && phaseCorrelations[phase as keyof typeof phaseCorrelations]) {
        const phaseData = phaseCorrelations[phase as keyof typeof phaseCorrelations];
        phaseData.count++;
        phaseData.dates.push(momentDate);
        
        // Positive interactions
        if (positiveEmojis.includes(moment.emoji) || moment.tags?.includes('Green Flag')) {
          phaseData.positive++;
        }
        
        // Conflict patterns
        if (conflictEmojis.includes(moment.emoji) || moment.tags?.includes('Red Flag') || moment.tags?.includes('Yellow Flag')) {
          phaseData.conflict++;
        }
        
        // Intimacy patterns
        if (moment.isIntimate || intimateEmojis.includes(moment.emoji) || moment.tags?.includes('Physical Touch')) {
          phaseData.intimate++;
        }
        
        // Communication patterns
        if (moment.tags?.some(tag => communicationTags.includes(tag))) {
          phaseData.communication++;
        }
        
        // Emotional sensitivity patterns
        if (moment.tags?.some(tag => emotionalTags.includes(tag))) {
          phaseData.emotional++;
        }
      }
    }
  });

  // Advanced analysis of phase patterns
  const phaseAnalysis = Object.entries(phaseCorrelations)
    .map(([phase, data]) => {
      if (data.count === 0) return null;
      
      const positiveRatio = data.positive / data.count;
      const conflictRatio = data.conflict / data.count;
      const intimateRatio = data.intimate / data.count;
      const communicationRatio = data.communication / data.count;
      const emotionalRatio = data.emotional / data.count;
      
      // Determine dominant characteristics
      let characteristics = [];
      let insights = [];
      let recommendations = [];
      let riskFactors = [];
      
      if (positiveRatio > 0.6) {
        characteristics.push(`${Math.round(positiveRatio * 100)}% positive interactions`);
        insights.push('strong emotional harmony during this phase');
        recommendations.push('optimal timing for important conversations');
      }
      
      if (intimateRatio > 0.3) {
        characteristics.push(`${Math.round(intimateRatio * 100)}% intimate moments`);
        insights.push('heightened physical connection');
        recommendations.push('natural intimacy peak period');
      }
      
      if (communicationRatio > 0.4) {
        characteristics.push(`${Math.round(communicationRatio * 100)}% deep conversations`);
        insights.push('enhanced emotional openness');
        recommendations.push('ideal time for meaningful discussions');
      }
      
      if (conflictRatio > 0.3) {
        characteristics.push(`${Math.round(conflictRatio * 100)}% challenging interactions`);
        insights.push('increased emotional sensitivity');
        riskFactors.push('potential for misunderstandings');
        recommendations.push('extra patience and gentle communication needed');
      }
      
      if (emotionalRatio > 0.4) {
        characteristics.push(`${Math.round(emotionalRatio * 100)}% emotionally charged moments`);
        insights.push('heightened emotional awareness');
        recommendations.push('supportive presence especially valued');
      }
      
      // Calculate phase significance score
      const significance = data.count * (Math.max(positiveRatio, intimateRatio, communicationRatio) + 
                          (conflictRatio > 0.3 ? conflictRatio * 0.8 : 0));
      
      return {
        phase,
        data,
        positiveRatio,
        conflictRatio,
        intimateRatio,
        communicationRatio,
        emotionalRatio,
        characteristics,
        insights,
        recommendations,
        riskFactors,
        significance
      };
    })
    .filter(item => item !== null && item.data.count >= 1)
    .sort((a, b) => b!.significance - a!.significance);

  if (phaseAnalysis.length > 0) {
    const strongestPhase = phaseAnalysis[0]!;
    const totalCycleData = Object.values(phaseCorrelations).reduce((sum, data) => sum + data.count, 0);
    
    // Generate comprehensive insights
    const detailedInsights = generateDetailedCycleInsights(strongestPhase, phaseAnalysis, cycles);
    
    return {
      strongestPhase: strongestPhase.phase,
      confidence: Math.min(95, Math.round(strongestPhase.data.count * 12 + 55)),
      totalCycleData,
      characteristics: strongestPhase.characteristics,
      insights: strongestPhase.insights,
      recommendations: strongestPhase.recommendations,
      riskFactors: strongestPhase.riskFactors,
      detailedAnalysis: detailedInsights,
      phaseBreakdown: phaseAnalysis.map(p => ({
        phase: p?.phase || 'Unknown',
        interactions: p?.data?.count || 0,
        positiveRate: Math.round((p?.positiveRatio || 0) * 100),
        conflictRate: Math.round((p?.conflictRatio || 0) * 100),
        intimacyRate: Math.round((p?.intimateRatio || 0) * 100)
      }))
    };
  }

  return null;
}

// Generate detailed cycle insights with timing predictions
function generateDetailedCycleInsights(strongestPhase: any, allPhases: any[], cycles: MenstrualCycle[]) {
  const phaseDescriptions = {
    menstrual: 'During menstruation (days 1-5), hormonal changes often bring increased emotional sensitivity and need for comfort',
    follicular: 'In the follicular phase (days 6-13), rising estrogen typically enhances mood, energy, and social connection',
    ovulation: 'Around ovulation (days 14-16), peak fertility hormones often boost confidence, attraction, and communication',
    luteal: 'During the luteal phase (days 17-28), progesterone fluctuations can affect mood stability and emotional needs'
  };
  
  const biologicalContext = phaseDescriptions[strongestPhase.phase as keyof typeof phaseDescriptions];
  
  // Predict next cycle timing
  const nextCyclePrediction = cycles.length > 0 ? 
    predictNextOptimalTiming(cycles, strongestPhase.phase) : null;
  
  // Generate behavioral recommendations
  const behavioralInsights = generateBehavioralRecommendations(strongestPhase, allPhases);
  
  return {
    biologicalContext,
    nextCyclePrediction,
    behavioralInsights,
    patternConsistency: calculatePatternConsistency(allPhases),
    cycleLengthVariability: calculateCycleVariability(cycles)
  };
}

// Predict optimal timing for next cycle
function predictNextOptimalTiming(cycles: MenstrualCycle[], optimalPhase: string) {
  if (cycles.length === 0) return null;
  
  const latestCycle = cycles.sort((a, b) => 
    new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
  )[0];
  
  // FIXED: Use cycle end date + 1 for next cycle start
  const nextCycleStart = latestCycle.cycleEndDate ? 
    new Date(new Date(latestCycle.cycleEndDate).getTime() + 24 * 60 * 60 * 1000) : // Add 1 day
    new Date(latestCycle.periodStartDate);
  
  const phaseOffsets = { menstrual: 0, follicular: 6, ovulation: 14, luteal: 17 };
  const nextOptimalDate = new Date(nextCycleStart);
  nextOptimalDate.setDate(nextOptimalDate.getDate() + phaseOffsets[optimalPhase as keyof typeof phaseOffsets]);
  
  return {
    nextCycleStart: nextCycleStart.toISOString().split('T')[0],
    nextOptimalDate: nextOptimalDate.toISOString().split('T')[0],
    daysUntilOptimal: Math.ceil((nextOptimalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  };
}

// Generate behavioral recommendations based on patterns
function generateBehavioralRecommendations(strongestPhase: any, allPhases: any[]) {
  const recommendations = [];
  
  if (strongestPhase.intimateRatio > 0.3) {
    recommendations.push('Physical affection and intimacy are most naturally received during this phase');
  }
  
  if (strongestPhase.communicationRatio > 0.4) {
    recommendations.push('Deep, meaningful conversations flow most easily during this time');
  }
  
  if (strongestPhase.conflictRatio > 0.3) {
    recommendations.push('Extra emotional support and understanding are especially valuable');
  }
  
  // Cross-phase recommendations
  const highConflictPhases = allPhases.filter(p => p.conflictRatio > 0.3);
  if (highConflictPhases.length > 0) {
    recommendations.push(`Avoid difficult conversations during ${highConflictPhases.map(p => p.phase).join(' and ')} phases`);
  }
  
  return recommendations;
}

// Calculate pattern consistency across cycles
function calculatePatternConsistency(phases: any[]) {
  if (phases.length < 2) return 'Insufficient data for consistency analysis';
  
  const consistencyScore = phases.reduce((acc, phase) => {
    return acc + (phase.data.count > 1 ? 1 : 0);
  }, 0) / phases.length;
  
  if (consistencyScore > 0.7) return 'Highly consistent patterns detected';
  if (consistencyScore > 0.4) return 'Moderately consistent patterns';
  return 'Patterns still emerging';
}

// Calculate cycle length variability
function calculateCycleVariability(cycles: MenstrualCycle[]) {
  if (cycles.length < 2) return 'Need more cycles for variability analysis';
  
  const lengths = [];
  for (let i = 1; i < cycles.length; i++) {
    const current = new Date(cycles[i-1].periodStartDate);
    const previous = new Date(cycles[i].periodStartDate);
    const length = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    lengths.push(length);
  }
  
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, length) => acc + Math.pow(length - avgLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev < 2) return `Very regular cycles (${Math.round(avgLength)} ± ${Math.round(stdDev)} days)`;
  if (stdDev < 4) return `Regular cycles with slight variation (${Math.round(avgLength)} ± ${Math.round(stdDev)} days)`;
  return `Variable cycle length (${Math.round(avgLength)} ± ${Math.round(stdDev)} days)`;
}

// Calculate average cycle length
function calculateAverageCycleLength(cycles: MenstrualCycle[]): number {
  if (cycles.length < 2) return 28; // Default assumption
  
  const lengths = [];
  for (let i = 1; i < cycles.length; i++) {
    const current = new Date(cycles[i-1].periodStartDate);
    const previous = new Date(cycles[i].periodStartDate);
    const length = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    lengths.push(length);
  }
  
  return lengths.reduce((a, b) => a + b, 0) / lengths.length;
}

// Helper function to determine cycle phase
function getCyclePhase(date: Date, cycle: MenstrualCycle): string {
  const cycleStart = new Date(cycle.periodStartDate);
  const daysSinceStart = Math.floor((date.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceStart < 0) return 'luteal'; // Before this cycle
  if (daysSinceStart <= 5) return 'menstrual';
  if (daysSinceStart <= 13) return 'follicular';
  if (daysSinceStart <= 16) return 'ovulation';
  return 'luteal';
}

// Helper function for tag pattern analysis
function analyzeTagPatterns(moments: Moment[], connection: Connection) {
  const tagCounts: Record<string, number> = {};
  
  moments.forEach(moment => {
    moment.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  if (sortedTags.length > 0) {
    const dominantTag = sortedTags[0];
    const tagFrequency = dominantTag[1] / moments.length;

    return {
      title: `Behavioral Pattern: ${dominantTag[0]}`,
      description: `The "${dominantTag[0]}" pattern appears in ${Math.round(tagFrequency * 100)}% of your moments with ${connection.name} (${dominantTag[1]} out of ${moments.length} interactions). This recurring theme suggests a significant aspect of your relationship dynamic.`,
      type: dominantTag[0].includes('Green') ? 'positive' as const : dominantTag[0].includes('Red') ? 'warning' as const : 'neutral' as const,
      confidence: Math.min(80, Math.round(dominantTag[1] * 8 + 40)),
      category: 'pattern' as const,
      dataPoints: [
        `${dominantTag[0]} appears ${dominantTag[1]} times`,
        `${Math.round(tagFrequency * 100)}% frequency rate`,
        `Top 3 patterns: ${sortedTags.map(([tag]) => tag).join(', ')}`
      ],
      actionItems: [
        `Dominant pattern: ${dominantTag[0]}`,
        "Behavioral themes reveal relationship dynamics"
      ]
    };
  }

  return null;
}

// Helper function to get analysis timeframe description
function getAnalysisTimeframe(moments: Moment[], cycles: MenstrualCycle[]): string {
  if (moments.length === 0) return "No data available";
  
  const validMoments = moments.filter(m => m.createdAt);
  if (validMoments.length === 0) return "No dated moments";
  
  const earliest = new Date(validMoments[validMoments.length - 1].createdAt!);
  const latest = new Date(validMoments[0].createdAt!);
  const monthsDiff = Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  if (monthsDiff < 1) return "Recent weeks";
  if (monthsDiff < 3) return `Past ${monthsDiff} months`;
  return `${monthsDiff} month history`;
}