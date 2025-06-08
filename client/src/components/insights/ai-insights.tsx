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
  // Safe debug logging without circular references
  console.log("AI Insights Debug:", {
    connectionsLength: connections.length,
    momentsLength: moments.length,
    userData: userData || {},
    momentsPreview: moments.slice(0, 3).map(m => ({
      id: m.id,
      emoji: m.emoji,
      content: m.content?.substring(0, 50) || ""
    }))
  });

  // Generate data-driven insights with error handling
  let insights: InsightData[] = [];
  try {
    insights = generateDataInsights(connections, moments, userData);
  } catch (error) {
    console.error("Error generating insights:", error);
    insights = [{
      title: "Loading Insights",
      description: "Analyzing your relationship data...",
      type: 'neutral',
      confidence: 50,
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
      dataPoints: ["Processing data"]
    }];
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Smart patterns from your relationship data
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-700 dark:to-pink-700 rounded-full opacity-20 animate-pulse"></div>
            <Calendar className="h-16 w-16 mx-auto text-purple-500 relative z-10" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Keep tracking moments to unlock personalized relationship insights and patterns
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Insights
          </h3>
          <p className="text-sm text-muted-foreground">
            Smart patterns from your relationship data
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const getTypeStyles = (type: string) => {
            switch (type) {
              case 'positive':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
              case 'warning': 
                return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
              default:
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            }
          };

          return (
            <div 
              key={index} 
              className={`${getTypeStyles(insight.type)} p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {insight.confidence}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    {insight.description}
                  </p>
                  {insight.dataPoints && (
                    <div className="flex flex-wrap gap-2">
                      {insight.dataPoints.map((point, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface InsightData {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'neutral';
  confidence: number;
  icon: React.ReactNode;
  dataPoints?: string[];
}

function generateDataInsights(connections: Connection[], moments: Moment[], userData: any): InsightData[] {
  const insights: InsightData[] = [];

  if (moments.length < 2) return insights;

  // Enhanced emotional pattern analysis with more emojis
  const emotionCounts = moments.reduce((acc: Record<string, number>, moment) => {
    acc[moment.emoji] = (acc[moment.emoji] || 0) + 1;
    return acc;
  }, {});

  const totalMoments = moments.length;
  const positiveEmojis = ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖', '🌟', '✨', '💫', '🔥', '😘', '🥳', '🎉', '🌸', '🎬', '🍰', '🏃‍♀️', '💝', '🌅', '🎭', '🎯', '🍜', '☕', '🎁', '🏖️', '💃', '💋'];
  const negativeEmojis = ['😔', '😢', '😠', '😤', '💔', '😕', '😞', '😰', '😟', '😭', '🤔', '😬', '😩', '🙄', '📱', '😒'];
  const neutralEmojis = ['😐', '🤷', '😑', '😶', '🤨', '😏', '🤷‍♀️', '🎮', '📚', '🚗', '🛠️', '🏥', '🍕'];

  const positiveCount = Object.entries(emotionCounts)
    .filter(([emoji]) => positiveEmojis.includes(emoji))
    .reduce((sum, [, count]) => sum + count, 0);

  const negativeCount = Object.entries(emotionCounts)
    .filter(([emoji]) => negativeEmojis.includes(emoji))
    .reduce((sum, [, count]) => sum + count, 0);

  const neutralCount = Object.entries(emotionCounts)
    .filter(([emoji]) => neutralEmojis.includes(emoji))
    .reduce((sum, [, count]) => sum + count, 0);

  const positiveRatio = positiveCount / totalMoments;
  const negativeRatio = negativeCount / totalMoments;
  const neutralRatio = neutralCount / totalMoments;

  // Advanced emotional pattern insights with actionable advice
  if (positiveRatio > 0.7) {
    insights.push({
      title: "Exceptional Relationship Harmony",
      description: `${Math.round(positiveRatio * 100)}% of your moments are positive. You're thriving! Consider what specific behaviors and communication patterns are working so well, and maintain these habits.`,
      type: 'positive',
      confidence: Math.min(95, Math.round(positiveRatio * 100 + totalMoments)),
      icon: <Heart className="h-4 w-4 text-green-600" />,
      dataPoints: [`${positiveCount}/${totalMoments} positive moments`, `Top performing connections`]
    });
  } else if (positiveRatio > 0.5) {
    insights.push({
      title: "Strong Positive Foundation",
      description: `${Math.round(positiveRatio * 100)}% positive moments show healthy relationship patterns. Focus on deepening emotional intimacy and celebrating small wins together.`,
      type: 'positive',
      confidence: Math.round(positiveRatio * 90),
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      dataPoints: [`${positiveCount}/${totalMoments} positive moments`, `Room for growth`]
    });
  }

  if (negativeRatio > 0.5) {
    insights.push({
      title: "Relationship Stress Alert",
      description: `${Math.round(negativeRatio * 100)}% negative emotions detected. Immediate action needed: schedule quality time, practice active listening, and consider couples communication techniques.`,
      type: 'warning',
      confidence: Math.round(negativeRatio * 100 + 15),
      icon: <AlertCircle className="h-4 w-4 text-red-600" />,
      dataPoints: [`${negativeCount}/${totalMoments} challenging moments`, `Action required`]
    });
  } else if (negativeRatio > 0.3) {
    insights.push({
      title: "Emotional Balance Needed",
      description: `${Math.round(negativeRatio * 100)}% challenging moments suggest room for improvement. Try weekly check-ins, express appreciation daily, and address conflicts promptly.`,
      type: 'warning',
      confidence: Math.round(negativeRatio * 80 + 20),
      icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
      dataPoints: [`${negativeCount}/${totalMoments} challenging moments`, `Preventive care needed`]
    });
  }

  // Emotional variety analysis
  const uniqueEmotions = Object.keys(emotionCounts).length;
  if (uniqueEmotions < 4 && totalMoments > 5) {
    insights.push({
      title: "Limited Emotional Range",
      description: `Only ${uniqueEmotions} different emotions tracked. Expanding emotional awareness can improve relationship depth. Try identifying more nuanced feelings like contentment, excitement, or curiosity.`,
      type: 'neutral',
      confidence: 75,
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
      dataPoints: [`${uniqueEmotions} emotion types`, `Expand emotional vocabulary`]
    });
  }

  // Advanced connection analysis with stage-specific insights
  const connectionMomentCounts = connections.map(conn => ({
    id: conn.id,
    name: conn.name,
    count: moments.filter(m => m.connectionId === conn.id).length,
    stage: conn.relationshipStage,
    positiveCount: moments.filter(m => m.connectionId === conn.id && positiveEmojis.includes(m.emoji)).length,
    negativeCount: moments.filter(m => m.connectionId === conn.id && negativeEmojis.includes(m.emoji)).length,
    loveLanguage: conn.loveLanguage
  }));

  const mostTrackedConnection = connectionMomentCounts.length > 0 
    ? connectionMomentCounts.reduce((max, conn) => 
        conn.count > max.count ? conn : max, connectionMomentCounts[0])
    : null;

  // Primary focus analysis with stage-specific advice
  if (mostTrackedConnection && mostTrackedConnection.count > totalMoments * 0.5 && mostTrackedConnection.name) {
    const positiveRatio = mostTrackedConnection.positiveCount / mostTrackedConnection.count;
    let stageAdvice = "";
    
    switch (mostTrackedConnection.stage) {
      case "Talking":
        stageAdvice = positiveRatio > 0.7 ? "Great foundation! Consider planning a special date to deepen your connection." : "Focus on consistent communication and showing genuine interest in their life.";
        break;
      case "Dating":
        stageAdvice = positiveRatio > 0.6 ? "Strong dating phase! Discuss future goals and values to assess long-term compatibility." : "Address any concerns openly and plan activities that bring you closer together.";
        break;
      case "Committed":
        stageAdvice = positiveRatio > 0.6 ? "Solid relationship foundation. Maintain intimacy through regular date nights and appreciation rituals." : "Schedule weekly relationship check-ins and practice active listening to strengthen your bond.";
        break;
      default:
        stageAdvice = "Continue nurturing this important connection with consistent attention and care.";
    }
    
    insights.push({
      title: `Primary Focus: ${mostTrackedConnection.name}`,
      description: `${Math.round((mostTrackedConnection.count / totalMoments) * 100)}% of your emotional energy goes here (${mostTrackedConnection.stage} stage). ${stageAdvice}`,
      type: positiveRatio > 0.6 ? 'positive' : 'neutral',
      confidence: 88,
      icon: <Users className="h-4 w-4 text-blue-600" />,
      dataPoints: [`${mostTrackedConnection.count} moments tracked`, `${Math.round(positiveRatio * 100)}% positive`]
    });
  }

  // Connection balance analysis
  if (connections.length > 1) {
    const connectionImbalance = connectionMomentCounts.some(conn => conn.count > totalMoments * 0.8);
    const neglectedConnections = connectionMomentCounts.filter(conn => conn.count < 2);
    
    if (connectionImbalance && neglectedConnections.length > 0) {
      const neglectedNames = neglectedConnections
        .filter(c => c.name) // Safety check for name property
        .map(c => c.name)
        .join(', ');
      
      if (neglectedNames) {
        insights.push({
          title: "Connection Balance Alert",
          description: `You're heavily focused on one relationship while ${neglectedConnections.length} other connection(s) need attention. Schedule dedicated time with ${neglectedNames} to maintain relationship health.`,
          type: 'warning',
          confidence: 82,
          icon: <AlertCircle className="h-4 w-4 text-orange-600" />,
          dataPoints: [`${neglectedConnections.length} connections need attention`]
        });
      }
    }
  }

  // Advanced recent activity and trend analysis
  const recentMoments = moments.filter(m => {
    const momentDate = new Date(m.createdAt || '');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return momentDate > sevenDaysAgo;
  });

  const olderMoments = moments.filter(m => {
    const momentDate = new Date(m.createdAt || '');
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return momentDate > fourteenDaysAgo && momentDate <= sevenDaysAgo;
  });

  if (recentMoments.length > 0) {
    const recentPositive = recentMoments.filter(m => positiveEmojis.includes(m.emoji)).length;
    const recentPositiveRatio = recentPositive / recentMoments.length;
    
    // Compare with previous week if available
    const trend = olderMoments.length > 0 ? 
      (recentPositive / recentMoments.length) - (olderMoments.filter(m => positiveEmojis.includes(m.emoji)).length / olderMoments.length) : 0;

    if (recentPositiveRatio > 0.8) {
      insights.push({
        title: "Exceptional Recent Performance",
        description: `${Math.round(recentPositiveRatio * 100)}% positive moments this week! ${trend > 0.1 ? 'Improving trend - keep up the momentum!' : 'Maintain this excellence with gratitude practices and continued investment in your relationships.'}`,
        type: 'positive',
        confidence: Math.round(recentPositiveRatio * 90 + 10),
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        dataPoints: [`${recentMoments.length} moments this week`, trend > 0 ? '↗️ Improving' : '→ Stable']
      });
    } else if (recentPositiveRatio < 0.4) {
      const actionPlan = recentMoments.length < 3 ? 
        "Start tracking more moments daily to identify patterns. Schedule quality time with your connections." :
        "Immediate action needed: Have honest conversations, plan stress-relief activities, and consider relationship counseling if patterns persist.";
      
      insights.push({
        title: "Recent Relationship Stress",
        description: `Only ${Math.round(recentPositiveRatio * 100)}% positive moments this week. ${actionPlan}`,
        type: 'warning',
        confidence: Math.round((1 - recentPositiveRatio) * 85 + 15),
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        dataPoints: [`${recentMoments.length} moments tracked`, 'Action needed']
      });
    }
  }

  // Tracking frequency analysis with personalized recommendations
  const avgMomentsPerWeek = totalMoments / Math.max(1, Math.ceil((Date.now() - new Date(moments[moments.length - 1]?.createdAt || '').getTime()) / (7 * 24 * 60 * 60 * 1000)));
  
  if (avgMomentsPerWeek < 3) {
    insights.push({
      title: "Increase Relationship Awareness",
      description: `You track ${avgMomentsPerWeek.toFixed(1)} moments per week. Aim for 5-7 weekly moments to better understand patterns. Set daily reminders to capture both positive and challenging interactions.`,
      type: 'neutral',
      confidence: 78,
      icon: <Calendar className="h-4 w-4 text-purple-600" />,
      dataPoints: [`${avgMomentsPerWeek.toFixed(1)}/week current rate`, 'Target: 5-7/week']
    });
  }

  // Love language compatibility analysis
  const userLoveLanguage = userData.loveLanguage;
  if (userLoveLanguage && connections.length > 0) {
    const compatibleConnections = connections.filter(conn => conn.loveLanguage === userLoveLanguage);
    const mismatchedConnections = connections.filter(conn => conn.loveLanguage && conn.loveLanguage !== userLoveLanguage);
    
    if (mismatchedConnections.length > 0) {
      const mismatchedNames = mismatchedConnections.map(c => `${c.name} (${c.loveLanguage})`).join(', ');
      insights.push({
        title: "Love Language Misalignment",
        description: `Your love language (${userLoveLanguage}) differs from ${mismatchedConnections.length} connection(s): ${mismatchedNames}. Learn their languages to improve connection quality.`,
        type: 'neutral',
        confidence: 85,
        icon: <Heart className="h-4 w-4 text-pink-600" />,
        dataPoints: [`${compatibleConnections.length} compatible`, `${mismatchedConnections.length} need adaptation`]
      });
    }
  }

  // Intimacy and vulnerability analysis
  const intimateMoments = moments.filter(m => m.isIntimate);
  
  if (intimateMoments.length > 0) {
    const intimacyRatio = intimateMoments.length / totalMoments;
    
    // Calculate intimate moments per connection safely
    const intimateByConnection = connectionMomentCounts.map(conn => ({
      ...conn,
      intimateCount: moments.filter(m => m.connectionId === conn.id && m.isIntimate).length
    })).filter(conn => conn.intimateCount > 0);

    if (intimacyRatio > 0.3 && intimateByConnection.length > 0) {
      const mostIntimateConnection = intimateByConnection.reduce((max, conn) => 
        conn.intimateCount > max.intimateCount ? conn : max);
      
      // Find the actual connection object to get the name safely
      const connectionData = connections.find(c => c.id === mostIntimateConnection.id);
      const connectionName = connectionData?.name || "a connection";
      
      insights.push({
        title: "High Sexual Connection Awareness",
        description: `${Math.round(intimacyRatio * 100)}% of moments include sexual connection. Your strongest emotional bond appears to be with ${connectionName}. Continue nurturing deep connections while maintaining healthy boundaries.`,
        type: 'positive',
        confidence: 80,
        icon: <Heart className="h-4 w-4 text-pink-600" />,
        dataPoints: [`${intimateMoments.length} intimate moments`, `${connectionName} leads with ${mostIntimateConnection.intimateCount}`]
      });
    }
  }

  // Content depth analysis
  const momentsWithContent = moments.filter(m => m.content && m.content.trim().length > 5);
  const contentRatio = momentsWithContent.length / totalMoments;
  
  if (contentRatio < 0.4) {
    insights.push({
      title: "Improve Moment Detail",
      description: `Only ${Math.round(contentRatio * 100)}% of your moments include detailed descriptions. Adding context about what happened, how you felt, and why it mattered will unlock deeper insights and growth opportunities.`,
      type: 'neutral',
      confidence: 72,
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
      dataPoints: [`${momentsWithContent.length}/${totalMoments} have details`, 'Target: 70%+']
    });
  }

  // Personalized growth recommendation based on user's zodiac (if available)
  if (userData.zodiacSign && positiveRatio < 0.6) {
    const zodiacAdvice = getZodiacRelationshipAdvice(userData.zodiacSign, mostTrackedConnection?.stage || 'Dating');
    insights.push({
      title: `${userData.zodiacSign} Relationship Guidance`,
      description: zodiacAdvice,
      type: 'neutral',
      confidence: 68,
      icon: <TrendingUp className="h-4 w-4 text-purple-600" />,
      dataPoints: ['Personalized advice', 'Based on astrological traits']
    });
  }

  // Additional insights for comprehensive analysis
  
  // Connection type diversity analysis
  if (connections.length > 1) {
    const stages = connections.map(c => c.relationshipStage);
    const uniqueStages = Array.from(new Set(stages));
    
    if (uniqueStages.length >= 3) {
      insights.push({
        title: "Diverse Relationship Portfolio",
        description: `You maintain ${uniqueStages.length} different relationship types: ${uniqueStages.join(', ')}. This diversity provides valuable learning opportunities and emotional growth across various connection styles.`,
        type: 'positive',
        confidence: 82,
        icon: <Users className="h-4 w-4 text-purple-600" />,
        dataPoints: [`${uniqueStages.length} relationship types`, `${connections.length} total connections`]
      });
    }
  }

  // Activity pattern analysis
  const activityMoments = moments.filter(m => m.content && m.content.includes('date') || m.content && m.content.includes('night') || m.content && m.content.includes('together'));
  if (activityMoments.length > 0) {
    const activityRatio = activityMoments.length / totalMoments;
    insights.push({
      title: "Quality Time Investment",
      description: `${Math.round(activityRatio * 100)}% of your moments involve shared activities. This shows strong commitment to building experiences together. Consider varying activity types to deepen different aspects of your connections.`,
      type: 'positive',
      confidence: 77,
      icon: <Calendar className="h-4 w-4 text-blue-600" />,
      dataPoints: [`${activityMoments.length} activity moments`, 'Quality time focused']
    });
  }

  // Communication pattern insights
  const communicationMoments = moments.filter(m => 
    m.content && (
      m.content.includes('text') || 
      m.content.includes('call') || 
      m.content.includes('conversation') ||
      m.content.includes('talk')
    )
  );
  
  if (communicationMoments.length > 0) {
    const commRatio = communicationMoments.length / totalMoments;
    insights.push({
      title: "Communication Focus",
      description: `${Math.round(commRatio * 100)}% of tracked moments involve communication. Strong verbal connection is evident. Balance this with physical presence and shared experiences for well-rounded relationships.`,
      type: 'neutral',
      confidence: 75,
      icon: <TrendingUp className="h-4 w-4 text-indigo-600" />,
      dataPoints: [`${communicationMoments.length} communication moments`, 'Strong verbal connection']
    });
  }

  // Conflict resolution analysis
  const conflictMoments = moments.filter(m => 
    m.tags?.includes('Yellow Flag') || 
    m.tags?.includes('Red Flag') || 
    m.tags?.includes('Conflict') ||
    negativeEmojis.includes(m.emoji)
  );
  
  const resolutionMoments = moments.filter(m => 
    m.content && (
      m.content.includes('made up') || 
      m.content.includes('apolog') || 
      m.content.includes('resolved') ||
      m.content.includes('better')
    )
  );

  if (conflictMoments.length > 0 && resolutionMoments.length > 0) {
    const resolutionRatio = resolutionMoments.length / conflictMoments.length;
    insights.push({
      title: "Conflict Resolution Skills",
      description: `You actively resolve ${Math.round(resolutionRatio * 100)}% of relationship challenges. This demonstrates emotional maturity and commitment to growth. Continue practicing open communication during difficult moments.`,
      type: 'positive',
      confidence: 85,
      icon: <Heart className="h-4 w-4 text-green-600" />,
      dataPoints: [`${resolutionMoments.length}/${conflictMoments.length} conflicts resolved`, 'Healthy problem-solving']
    });
  }

  // Emotional growth tracking
  const recentPositiveGrowth = moments.slice(-10).filter(m => positiveEmojis.includes(m.emoji)).length;
  if (recentPositiveGrowth >= 7) {
    insights.push({
      title: "Recent Positive Momentum",
      description: `${recentPositiveGrowth}/10 of your most recent moments are positive. You're experiencing an upward trend in relationship satisfaction. Maintain this momentum by continuing current successful strategies.`,
      type: 'positive',
      confidence: 88,
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      dataPoints: [`${recentPositiveGrowth}/10 recent positive`, 'Upward trend']
    });
  }

  return insights.slice(0, 6); // Return top 6 insights
}

function getZodiacRelationshipAdvice(zodiacSign: string, relationshipStage: string): string {
  const advice: Record<string, Record<string, string>> = {
    'Aries': {
      'Talking': 'Channel your natural enthusiasm into genuine curiosity about them. Ask engaging questions and share your passions.',
      'Dating': 'Your direct communication style is an asset. Be patient with building deeper emotional intimacy.',
      'Committed': 'Balance your independence with partnership needs. Plan exciting adventures together to keep the spark alive.'
    },
    'Gemini': {
      'Talking': 'Use your natural communication skills to create meaningful conversations. Share your diverse interests and listen actively.',
      'Dating': 'Your adaptability helps you connect on multiple levels. Focus on consistency to build trust.',
      'Committed': 'Keep conversations fresh and engaging. Your partner appreciates your intellectual curiosity and humor.'
    },
    'Cancer': {
      'Talking': 'Your emotional intuition is a strength. Create safe spaces for vulnerable sharing and deep connection.',
      'Dating': 'Trust your instincts about emotional compatibility. Share your caring nature while maintaining healthy boundaries.',
      'Committed': 'Your nurturing nature builds strong foundations. Remember to communicate your own needs clearly too.'
    }
  };
  
  return advice[zodiacSign]?.[relationshipStage] || 
    'Focus on authentic communication, emotional awareness, and consistent care in your relationships.';
}