import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Star, HeartHandshake, Activity, Heart } from "lucide-react";
import { Connection, Moment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface AICoachProps {
  connections: Connection[];
  moments: Moment[];
  userData?: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

export function AICoach({ connections, moments, userData }: AICoachProps) {
  // Generate personalized insights based on user data
  const insights = useMemo(() => {
    return generatePersonalizedInsights(connections, moments, userData);
  }, [connections, moments, userData]);

  // Calculate emotional patterns
  const emotionalPatterns = useMemo(() => {
    return analyzeEmotionalPatterns(moments);
  }, [moments]);

  // Find connection strengths and areas for growth
  const connectionInsights = useMemo(() => {
    return analyzeConnectionStrengths(connections, moments);
  }, [connections, moments]);

  // Check love language compatibility
  const loveLanguageInsights = useMemo(() => {
    return analyzeLoveLanguageCompatibility(connections, userData?.loveLanguage);
  }, [connections, userData?.loveLanguage]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 text-primary mr-2" />
            AI Relationship Coach
          </CardTitle>
          <CardDescription>
            Personalized insights based on your emotional patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                <div className="flex items-start">
                  <Brain className="h-4 w-4 text-primary mt-1 mr-2 flex-shrink-0" />
                  <p className="text-sm">{insight.text}</p>
                </div>
                {insight.actionable && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="text-xs w-full">
                      <Star className="h-3 w-3 mr-1" /> Try this insight
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {emotionalPatterns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 text-secondary mr-2" />
              Emotional Patterns
            </CardTitle>
            <CardDescription>
              Understanding your emotional responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emotionalPatterns.map((pattern, index) => (
                <div key={index} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">{pattern.emoji}</span>
                    <h4 className="font-medium text-sm">{pattern.name}</h4>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{pattern.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {connectionInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <HeartHandshake className="h-5 w-5 text-primary mr-2" />
              Relationship Insights
            </CardTitle>
            <CardDescription>
              Strengths and growth opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectionInsights.map((insight, index) => (
                <div key={index} className="p-3 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{insight.connectionName}</h4>
                    <Badge variant="outline" className={insight.strengthLevel === 'high' ? 'bg-greenFlag/10 text-greenFlag' : 'bg-neutral-100 dark:bg-neutral-800'}>
                      {insight.relationshipStage}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-greenFlag/10 p-2 rounded">
                      <p className="text-xs font-medium text-greenFlag">Strengths</p>
                      <p className="text-xs mt-1">{insight.strengths}</p>
                    </div>
                    <div className="bg-secondary/10 p-2 rounded">
                      <p className="text-xs font-medium text-secondary">Growth Areas</p>
                      <p className="text-xs mt-1">{insight.growthAreas}</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500">{insight.tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loveLanguageInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Heart className="h-5 w-5 text-primary mr-2" />
              Love Language Compatibility
            </CardTitle>
            <CardDescription>
              Understanding how to connect better
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loveLanguageInsights.map((insight, index) => (
                <div key={index} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">{insight.connectionName}</h4>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {insight.loveLanguage}
                    </Badge>
                  </div>
                  <p className="text-sm">{insight.advice}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to generate personalized insights
function generatePersonalizedInsights(
  connections: Connection[],
  moments: Moment[],
  userData?: { zodiacSign?: string; loveLanguage?: string }
): { text: string; actionable: boolean }[] {
  const insights: { text: string; actionable: boolean }[] = [];

  // General insights based on user activity
  if (moments.length > 0) {
    // Check for emotional patterns
    const positiveEmotions = moments.filter(m => 
      ['😊', '❤️', '😍', '🥰', '💖', '✨'].includes(m.emoji)
    ).length;
    
    const negativeEmotions = moments.filter(m => 
      ['😕', '😢', '😠'].includes(m.emoji)
    ).length;

    if (positiveEmotions > negativeEmotions * 2) {
      insights.push({
        text: "You've been logging many positive emotions lately! This is a good sign for your emotional health. Consider reflecting on what's been making you happy.",
        actionable: true
      });
    } else if (negativeEmotions > positiveEmotions) {
      insights.push({
        text: "You seem to be experiencing more challenging emotions recently. Consider practicing self-care and reaching out for support when needed.",
        actionable: true
      });
    }

    // Look for connections with many logged moments
    const connectionMoments: Record<number, number> = {};
    moments.forEach(moment => {
      connectionMoments[moment.connectionId] = (connectionMoments[moment.connectionId] || 0) + 1;
    });

    const mostActiveConnectionId = Object.keys(connectionMoments).reduce((a, b) => 
      connectionMoments[Number(a)] > connectionMoments[Number(b)] ? Number(a) : Number(b)
    , Number(Object.keys(connectionMoments)[0]));

    const mostActiveConnection = connections.find(c => c.id === Number(mostActiveConnectionId));
    
    if (mostActiveConnection && connectionMoments[mostActiveConnectionId] > 5) {
      insights.push({
        text: `You've been frequently logging moments with ${mostActiveConnection.name}. This relationship seems significant in your life right now.`,
        actionable: false
      });
    }
  }

  // Add insights based on zodiac sign if provided
  if (userData?.zodiacSign) {
    const zodiacInsight = getZodiacInsight(userData.zodiacSign);
    if (zodiacInsight) {
      insights.push({
        text: zodiacInsight,
        actionable: false
      });
    }
  }

  // Add insights based on love language if provided
  if (userData?.loveLanguage) {
    const loveLanguageInsight = getLoveLanguageInsight(userData.loveLanguage);
    if (loveLanguageInsight) {
      insights.push({
        text: loveLanguageInsight,
        actionable: true
      });
    }
  }

  // If we have connections but few moments
  if (connections.length > 0 && moments.length < 3) {
    insights.push({
      text: "Try logging more emotional moments with your connections to receive deeper insights and track your relationship journey.",
      actionable: true
    });
  }

  // If no insights were generated, add a default one
  if (insights.length === 0) {
    insights.push({
      text: "Start logging more connections and emotional moments to receive personalized insights and relationship guidance.",
      actionable: false
    });
  }

  return insights;
}

function getZodiacInsight(zodiacSign: string): string | null {
  const insights: Record<string, string> = {
    "Aries": "As an Aries, your passionate nature can bring excitement to relationships. Try to balance your enthusiasm with patience when conflicts arise.",
    "Taurus": "Your Taurus nature values stability and reliability. Express appreciation for the consistent aspects of your relationships to strengthen bonds.",
    "Gemini": "With your Gemini curiosity, you thrive on mental connection. Deep conversations will help you feel more connected to your partners.",
    "Cancer": "Your Cancer intuition gives you emotional intelligence. Use this gift to create nurturing spaces where loved ones feel safe to be vulnerable.",
    "Leo": "As a Leo, you bring warmth and generosity. Remember that sometimes quietly supporting others can be as impactful as grand gestures.",
    "Virgo": "Your Virgo analytical skills help you understand relationships deeply. Be mindful that not all partners communicate through detailed analysis.",
    "Libra": "Your Libra nature seeks harmony. While compromise is valuable, ensure you're not neglecting your own needs for the sake of peace.",
    "Scorpio": "With your Scorpio intensity, you value authentic connection. Allow relationships to evolve gradually rather than expecting immediate depth.",
    "Sagittarius": "Your Sagittarius spirit craves adventure. Including loved ones in your explorations can create meaningful shared experiences.",
    "Capricorn": "As a Capricorn, you value commitment. Remember that emotional investment is as important as practical support in relationships.",
    "Aquarius": "Your Aquarius perspective offers unique insights. When connecting with others, balance intellectual discussion with emotional presence.",
    "Pisces": "With your Pisces empathy, you easily absorb others' feelings. Practice healthy boundaries to maintain your emotional wellbeing."
  };

  return insights[zodiacSign] || null;
}

function getLoveLanguageInsight(loveLanguage: string): string | null {
  const insights: Record<string, string> = {
    "Words of Affirmation": "You value verbal expressions of love. Try keeping a journal of meaningful compliments you receive and give to strengthen your connections.",
    "Quality Time": "Your love language is Quality Time. Consider scheduling regular, distraction-free moments with important connections to deepen your bonds.",
    "Physical Touch": "With Physical Touch as your love language, even small gestures like a hand on the shoulder can make you feel connected. Communicate this need respectfully.",
    "Acts of Service": "You appreciate Acts of Service. Notice when others help you and acknowledge their efforts—this reciprocity strengthens relationships.",
    "Receiving Gifts": "Your love language of Receiving Gifts is about the thoughtfulness behind presents. Try creating a wishlist to share with close connections."
  };

  return insights[loveLanguage] || null;
}

function analyzeEmotionalPatterns(moments: Moment[]): { emoji: string; name: string; description: string }[] {
  if (moments.length < 3) return [];

  const patterns: { emoji: string; name: string; description: string }[] = [];
  
  // Count emotion frequencies
  const emotionCounts: Record<string, number> = {};
  moments.forEach(moment => {
    if (!emotionCounts[moment.emoji]) {
      emotionCounts[moment.emoji] = 0;
    }
    emotionCounts[moment.emoji]++;
  });

  // Map common emotions to patterns
  const emotionPatterns: Record<string, { name: string; description: string }> = {
    "😊": { 
      name: "Contentment Seeker", 
      description: "You frequently experience moments of contentment and satisfaction in your relationships. This suggests a positive approach to connection."
    },
    "❤️": { 
      name: "Heart Connector", 
      description: "You feel and express love deeply. Your capacity for emotional connection is a strength in building meaningful relationships."
    },
    "😍": { 
      name: "Passionate Appreciator", 
      description: "You experience moments of intense admiration and attraction. This can bring excitement and energy to your connections."
    },
    "😢": { 
      name: "Emotional Processor", 
      description: "You allow yourself to feel and express sadness. This emotional honesty can actually strengthen the authenticity in your relationships."
    },
    "😠": { 
      name: "Boundary Protector", 
      description: "Your anger signals when boundaries are crossed. Learning to express this constructively can lead to healthier relationships."
    },
    "😕": { 
      name: "Thoughtful Evaluator", 
      description: "You often find yourself in moments of confusion or uncertainty. This reflective quality can lead to deeper understanding over time."
    }
  };

  // Add the top 3 patterns to the results
  Object.keys(emotionCounts)
    .sort((a, b) => emotionCounts[b] - emotionCounts[a])
    .slice(0, 3)
    .forEach(emoji => {
      if (emotionPatterns[emoji]) {
        patterns.push({
          emoji: emoji,
          name: emotionPatterns[emoji].name,
          description: emotionPatterns[emoji].description
        });
      }
    });

  return patterns;
}

function analyzeConnectionStrengths(
  connections: Connection[],
  moments: Moment[]
): {
  connectionName: string;
  relationshipStage: string;
  strengths: string;
  growthAreas: string;
  tip: string;
  strengthLevel: 'low' | 'medium' | 'high';
}[] {
  if (connections.length === 0 || moments.length === 0) return [];

  return connections.slice(0, 3).map(connection => {
    const connectionMoments = moments.filter(m => m.connectionId === connection.id);
    
    // Count green and red flags
    const greenFlags = connectionMoments.filter(m => m.tags?.includes('Green Flag')).length;
    const redFlags = connectionMoments.filter(m => m.tags?.includes('Red Flag')).length;
    
    // Count positive and negative emotions
    const positiveEmotions = connectionMoments.filter(m => 
      ['😊', '❤️', '😍', '🥰', '💖', '✨'].includes(m.emoji)
    ).length;
    
    const negativeEmotions = connectionMoments.filter(m => 
      ['😕', '😢', '😠'].includes(m.emoji)
    ).length;

    // Determine strength level
    let strengthLevel: 'low' | 'medium' | 'high' = 'medium';
    if (greenFlags > redFlags && positiveEmotions > negativeEmotions) {
      strengthLevel = 'high';
    } else if (redFlags > greenFlags && negativeEmotions > positiveEmotions) {
      strengthLevel = 'low';
    }

    // Generate insights based on the data
    let strengths = "Insufficient data";
    let growthAreas = "Log more moments";
    let tip = "Try logging more specific moments to get personalized insights.";

    if (connectionMoments.length > 0) {
      // Determine strengths
      if (greenFlags > 0) {
        strengths = "You've identified positive patterns that make this relationship valuable.";
      } else if (positiveEmotions > negativeEmotions) {
        strengths = "You generally feel positive emotions in this relationship.";
      } else if (connectionMoments.filter(m => m.tags?.includes('Intimacy')).length > 0) {
        strengths = "You've shared moments of closeness and connection.";
      } else {
        strengths = "You're consistently tracking this relationship, which shows it matters to you.";
      }

      // Determine growth areas
      if (redFlags > 0) {
        growthAreas = "There are some concerning patterns to be mindful of.";
      } else if (negativeEmotions > positiveEmotions) {
        growthAreas = "This relationship seems to bring up challenging emotions for you.";
      } else if (connectionMoments.filter(m => m.tags?.includes('Conflict')).length > 0) {
        growthAreas = "You've experienced conflicts that might need resolution.";
      } else {
        growthAreas = "Consider exploring more aspects of this relationship.";
      }

      // Generate a tip
      if (strengthLevel === 'high') {
        tip = "Continue nurturing the positive aspects of this relationship.";
      } else if (strengthLevel === 'low') {
        tip = "Reflect on whether this relationship meets your needs or requires a conversation.";
      } else {
        tip = "Try being more specific when logging moments to identify patterns.";
      }
    }

    return {
      connectionName: connection.name,
      relationshipStage: connection.relationshipStage,
      strengths,
      growthAreas,
      tip,
      strengthLevel
    };
  });
}

function analyzeLoveLanguageCompatibility(
  connections: Connection[],
  userLoveLanguage?: string
): { connectionName: string; loveLanguage: string; advice: string }[] {
  if (!userLoveLanguage || connections.length === 0) return [];

  return connections
    .filter(connection => connection.loveLanguage) // Only include connections with love languages
    .map(connection => {
      const connectionLoveLanguage = connection.loveLanguage!;
      let advice = "";

      if (connectionLoveLanguage === userLoveLanguage) {
        advice = `You and ${connection.name} share the same love language! This mutual understanding can strengthen your connection.`;
      } else {
        advice = getLoveLanguageCompatibilityAdvice(userLoveLanguage, connectionLoveLanguage, connection.name);
      }

      return {
        connectionName: connection.name,
        loveLanguage: connectionLoveLanguage,
        advice
      };
    });
}

function getLoveLanguageCompatibilityAdvice(
  userLanguage: string,
  connectionLanguage: string,
  connectionName: string
): string {
  const adviceMap: Record<string, Record<string, string>> = {
    "Words of Affirmation": {
      "Quality Time": `While you appreciate verbal affirmation, ${connectionName} values dedicated time together. Try expressing your feelings during quality moments together.`,
      "Physical Touch": `You value verbal expressions, but ${connectionName} connects through touch. Consider combining compliments with appropriate physical gestures.`,
      "Acts of Service": `You appreciate verbal affirmation, while ${connectionName} values helpful actions. Try verbalizing your appreciation when they do things for you.`,
      "Receiving Gifts": `Your words mean a lot to you, while ${connectionName} appreciates thoughtful gifts. Consider writing heartfelt notes to accompany small presents.`
    },
    "Quality Time": {
      "Words of Affirmation": `You value shared time, while ${connectionName} appreciates verbal affirmation. During your time together, make space for expressing appreciation.`,
      "Physical Touch": `You connect through dedicated time, and ${connectionName} through physical touch. Focus on being fully present during physical interactions.`,
      "Acts of Service": `You value undivided attention, while ${connectionName} appreciates helpful actions. Consider engaging in activities where you collaborate.`,
      "Receiving Gifts": `You appreciate quality time, while ${connectionName} values meaningful gifts. Consider experiential gifts that allow you to spend time together.`
    },
    "Physical Touch": {
      "Words of Affirmation": `You connect through touch, while ${connectionName} values verbal affirmation. Remember to express your feelings in words too.`,
      "Quality Time": `You appreciate physical connection, and ${connectionName} values dedicated time. Focus on being fully present during physical interactions.`,
      "Acts of Service": `You value physical touch, while ${connectionName} appreciates helpful actions. Show appreciation with touch when they do things for you.`,
      "Receiving Gifts": `You connect through touch, while ${connectionName} values thoughtful gifts. Consider combining physical affection when giving presents.`
    },
    "Acts of Service": {
      "Words of Affirmation": `You value helpful actions, while ${connectionName} appreciates verbal affirmation. Ask for the specific words that make them feel valued.`,
      "Quality Time": `You show love through actions, while ${connectionName} values dedicated time. Consider helping with tasks that create more quality time together.`,
      "Physical Touch": `You express care through helpful actions, while ${connectionName} connects through touch. Be open to physical expressions of gratitude.`,
      "Receiving Gifts": `You show love through actions, while ${connectionName} values thoughtful gifts. Consider practical gifts that make their life easier.`
    },
    "Receiving Gifts": {
      "Words of Affirmation": `You appreciate thoughtful gifts, while ${connectionName} values verbal affirmation. Tell them how their words impact you.`,
      "Quality Time": `You value meaningful presents, while ${connectionName} appreciates dedicated time. Consider giving the gift of experiences you can share.`,
      "Physical Touch": `You connect through thoughtful gifts, while ${connectionName} values physical touch. Be receptive to physical expressions of gratitude.`,
      "Acts of Service": `You appreciate meaningful gifts, while ${connectionName} values helpful actions. Express how much their practical support means to you.`
    }
  };

  return adviceMap[userLanguage]?.[connectionLanguage] || 
    `You and ${connectionName} have different love languages (${userLanguage} vs ${connectionLanguage}). Understanding each other's preferences can improve your communication.`;
}