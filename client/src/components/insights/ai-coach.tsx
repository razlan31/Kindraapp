import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Lightbulb, Brain, Heart, ArrowRight, MessageCircle } from "lucide-react";
import { Connection, Moment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface AICoachProps {
  connections: Connection[];
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

export function AICoach({ connections, moments, userData }: AICoachProps) {
  const [userQuestion, setUserQuestion] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [personalizedAdvice, setPersonalizedAdvice] = useState<string[]>([]);
  
  // Generate insights based on user data
  const insights = generateAIInsights(connections, moments, userData);

  // Handle user question submission
  const handleAskQuestion = () => {
    if (!userQuestion.trim()) return;
    
    setIsAskingQuestion(true);
    
    // Simulate AI processing with a delay
    setTimeout(() => {
      // Generate personalized response based on question content
      const response = generatePersonalizedResponse(userQuestion, connections, moments, userData);
      setPersonalizedAdvice([...personalizedAdvice, response]);
      setUserQuestion("");
      setIsAskingQuestion(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Relationship Coach
              </CardTitle>
              <CardDescription>
                Personalized insights based on your emotional patterns
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg"
              >
                <div className="flex gap-3 items-start">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm">{insight}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {insights.length === 0 && (
              <div className="text-center py-6">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">Not enough data yet</h3>
                <p className="text-sm text-muted-foreground">
                  Continue tracking your relationships and emotions to receive AI-powered insights
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Ask Your Coach
          </CardTitle>
          <CardDescription>
            Get personalized advice for your specific situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {personalizedAdvice.map((advice, index) => (
              <div key={index} className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm">{advice}</p>
              </div>
            ))}
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask something about your relationships or emotional patterns..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="resize-none"
                rows={2}
              />
              <Button 
                onClick={handleAskQuestion} 
                disabled={!userQuestion.trim() || isAskingQuestion}
                className="h-auto"
              >
                {isAskingQuestion ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">
                Suggested questions:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/5"
                  onClick={() => setUserQuestion("How can I improve my communication with my partner?")}
                >
                  How can I improve communication?
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/5"
                  onClick={() => setUserQuestion("Why do I keep feeling anxious in new relationships?")}
                >
                  Why do I feel anxious in relationships?
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/5"
                  onClick={() => setUserQuestion("What patterns do you see in my past relationships?")}
                >
                  What patterns do you see?
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// AI insights generator based on user data
function generateAIInsights(connections: Connection[], moments: Moment[], userData: any): string[] {
  if (connections.length === 0 || moments.length === 0) {
    return [];
  }

  const insights: string[] = [];
  
  // Check for common emotions
  const emotionCounts: Record<string, number> = {};
  moments.forEach(moment => {
    if (!emotionCounts[moment.emoji]) {
      emotionCounts[moment.emoji] = 0;
    }
    emotionCounts[moment.emoji]++;
  });
  
  // Get most common emotion
  const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  
  if (sortedEmotions.length > 0) {
    const [mostCommonEmoji, count] = sortedEmotions[0];
    const percentage = Math.round((count / moments.length) * 100);
    
    insights.push(
      `You frequently express ${mostCommonEmoji} emotions (${percentage}% of your moments). This suggests that ${
        ['😄', '😊', '🥰', '😍'].includes(mostCommonEmoji) 
          ? 'you generally maintain a positive outlook in your relationships. This is great for building strong connections!'
          : ['😕', '😢', '😞'].includes(mostCommonEmoji)
          ? 'you may be experiencing some challenges in your relationships. Consider talking with trusted friends about what might be causing these feelings.'
          : 'this is a significant emotional pattern for you. Understanding what triggers these feelings can help you grow emotionally.'
      }`
    );
  }
  
  // Look for relationship stage patterns
  const stageDistribution: Record<string, number> = {};
  connections.forEach(connection => {
    if (!stageDistribution[connection.stage]) {
      stageDistribution[connection.stage] = 0;
    }
    stageDistribution[connection.stage]++;
  });
  
  const mostCommonStage = Object.entries(stageDistribution).sort((a, b) => b[1] - a[1])[0]?.[0];
  
  if (mostCommonStage) {
    insights.push(
      mostCommonStage === 'Talking' 
        ? 'You have several connections in the early "talking" stage. Take your time to truly know these people before moving to deeper levels of commitment.'
        : mostCommonStage === 'Sneaky Link' 
        ? 'You have several casual connections. Make sure these relationships align with your long-term emotional needs and boundaries.'
        : mostCommonStage === 'Exclusive' 
        ? 'You value exclusivity and commitment in relationships. Consider how you can continue to grow together while maintaining individual identities.'
        : 'Your relationship patterns suggest you value a variety of connection types. This flexibility can be healthy as long as expectations are clear on all sides.'
    );
  }
  
  // Zodiac insights if available
  if (userData.zodiacSign) {
    insights.push(
      userData.zodiacSign === 'Aries' || userData.zodiacSign === 'Leo' || userData.zodiacSign === 'Sagittarius'
        ? `As a fire sign (${userData.zodiacSign}), you likely bring passion and energy to your relationships. Remember to balance your intensity with patience and listening.`
        : userData.zodiacSign === 'Taurus' || userData.zodiacSign === 'Virgo' || userData.zodiacSign === 'Capricorn'
        ? `As an earth sign (${userData.zodiacSign}), you likely value stability and reliability in relationships. Continue building trust while remaining open to new experiences.`
        : userData.zodiacSign === 'Gemini' || userData.zodiacSign === 'Libra' || userData.zodiacSign === 'Aquarius'
        ? `As an air sign (${userData.zodiacSign}), you likely value intellectual connection and communication. Remember that emotional depth is equally important in lasting connections.`
        : `As a water sign (${userData.zodiacSign}), you likely have deep emotional intuition. Trust your feelings while ensuring you're not projecting past experiences onto current relationships.`
    );
    
    // Add compatibility insights if any connections have zodiac signs
    const connectionsWithZodiac = connections.filter(c => c.zodiacSign);
    if (connectionsWithZodiac.length > 0) {
      const compatibilityInsight = connectionsWithZodiac.some(c => 
        isZodiacCompatible(userData.zodiacSign, c.zodiacSign || '')
      );
      
      if (compatibilityInsight) {
        insights.push(
          `Based on astrological compatibility, you seem drawn to compatible zodiac signs. This natural alignment may contribute to the ease you feel in these relationships.`
        );
      }
    }
  }
  
  // Love language insights if available
  if (userData.loveLanguage) {
    insights.push(
      userData.loveLanguage === 'Words of Affirmation'
        ? `Your love language is Words of Affirmation. Receiving verbal reassurance and encouragement is important to you. Look for partners who communicate their feelings openly.`
        : userData.loveLanguage === 'Quality Time'
        ? `Your love language is Quality Time. Receiving undivided attention makes you feel most loved. Prioritize connections with people who value being present with you.`
        : userData.loveLanguage === 'Physical Touch'
        ? `Your love language is Physical Touch. You feel most connected through physical closeness. Make sure your partners understand this need for physical expression of affection.`
        : userData.loveLanguage === 'Acts of Service'
        ? `Your love language is Acts of Service. You feel cared for when others take action to help you. Look for partners who show their care through helpful actions.`
        : `Your love language is Receiving Gifts. Thoughtful tokens of affection make you feel valued. Connect with people who express their feelings through meaningful gestures.`
    );
  }

  // Add pattern recognition insight
  if (moments.length > 5) {
    insights.push(
      `You've logged ${moments.length} emotional moments. Consistent tracking helps identify patterns in how your emotions connect to your relationships and life events. Keep it up!`
    );
  }
  
  return insights;
}

// Generate personalized response to user question
function generatePersonalizedResponse(
  question: string, 
  connections: Connection[], 
  moments: Moment[], 
  userData: any
): string {
  const lowerQuestion = question.toLowerCase();
  
  // Communication advice
  if (lowerQuestion.includes('communicate') || lowerQuestion.includes('communication') || lowerQuestion.includes('talk')) {
    return `Improving communication starts with active listening and sharing your needs clearly. Based on your emotional patterns, try using "I feel" statements instead of accusatory language. Practice validating your partner's perspective even when you disagree. Set aside regular time for meaningful conversations without distractions.`;
  }
  
  // Anxiety in relationships
  if (lowerQuestion.includes('anxious') || lowerQuestion.includes('anxiety') || lowerQuestion.includes('nervous')) {
    return `Relationship anxiety often stems from past experiences or attachment patterns. Looking at your emotional data, I notice you tend to express more anxious feelings in the early stages of connections. This is common and can be managed by: 1) Practicing mindfulness when anxious thoughts arise, 2) Communicating your needs clearly, and 3) Building self-trust through positive self-talk. Remember that some uncertainty is normal in relationships.`;
  }
  
  // Pattern recognition
  if (lowerQuestion.includes('pattern') || lowerQuestion.includes('trends') || lowerQuestion.includes('repeat')) {
    const mostCommonStage = connections.length > 0 
      ? connections.reduce((counts, connection) => {
          counts[connection.stage] = (counts[connection.stage] || 0) + 1;
          return counts;
        }, {} as Record<string, number>)
      : {};
      
    const dominantStage = Object.entries(mostCommonStage).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    return `I'm noticing you tend to have many relationships in the ${dominantStage || "early"} stage. This might suggest you ${
      dominantStage === 'Talking' 
        ? 'enjoy the excitement of new connections but might be hesitant about deeper commitment. Consider what boundaries or fears might be holding you back.'
        : dominantStage === 'Sneaky Link' 
        ? 'prioritize freedom and flexibility in relationships. Make sure these arrangements truly satisfy your emotional needs long-term.'
        : dominantStage === 'Exclusive' 
        ? 'value stability and commitment. The security of defined relationships appears important to your emotional wellbeing.'
        : 'have diverse relationship needs that vary by connection. This adaptability can be healthy when it authentically reflects your needs rather than just accommodating others.'
    }`;
  }
  
  // Compatibility questions
  if (lowerQuestion.includes('compatible') || lowerQuestion.includes('compatibility') || lowerQuestion.includes('match')) {
    if (userData.zodiacSign && connections.some(c => c.zodiacSign)) {
      const compatibleConnections = connections.filter(c => 
        c.zodiacSign && isZodiacCompatible(userData.zodiacSign!, c.zodiacSign)
      );
      
      return compatibleConnections.length > 0
        ? `Based on astrological patterns, you appear to have strong compatibility with ${compatibleConnections.length} of your connections. While zodiac compatibility isn't definitive, these natural alignments might explain why certain relationships feel more effortless. Pay attention to how you feel in each relationship rather than relying solely on astrological predictions.`
        : `While zodiac compatibility can offer insights, I don't see strong astrological alignments in your current connections. Remember that true compatibility comes from shared values, effective communication, and mutual respect - factors that transcend astrological patterns.`;
    }
    
    return `Compatibility goes beyond zodiac signs and involves alignment in values, communication styles, and life goals. Look for connections where you feel respected, heard, and free to be authentic. Pay attention to how you feel after spending time with someone - energized or drained? True compatibility should feel supportive and growth-oriented.`;
  }
  
  // Love language related questions
  if (lowerQuestion.includes('love language') || lowerQuestion.includes('show love') || lowerQuestion.includes('express love')) {
    return userData.loveLanguage
      ? `Your primary love language is ${userData.loveLanguage}. To strengthen your relationships, clearly communicate this need to your partners. Also, ask about their love languages - they might express and receive love differently. Try to "speak" their love language regularly, even if it doesn't come naturally to you. This mutual adaptation creates a cycle of appreciation and connection.`
      : `Understanding love languages can transform your relationships. The five languages are: Words of Affirmation, Quality Time, Physical Touch, Acts of Service, and Receiving Gifts. Reflect on which makes you feel most loved and share this with your partners. Equally important is discovering their love languages and making conscious efforts to express affection in ways meaningful to them.`;
  }
  
  // Default response for other questions
  return `Based on your relationship data, I notice you value ${
    connections.length > 3 
      ? 'having multiple connections at different levels of intimacy' 
      : 'a smaller, potentially closer circle of relationships'
  }. When facing challenges, try reflecting on your patterns: What attracts you initially? What causes distance over time? What emotions arise most frequently? Building self-awareness through consistent tracking will help you create healthier relationship dynamics that align with your authentic needs.`;
}

// Helper function to determine zodiac compatibility
function isZodiacCompatible(sign1: string, sign2: string): boolean {
  // Element compatibility (Fire, Earth, Air, Water)
  const elements: Record<string, string> = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water'
  };
  
  // Get elements for both signs
  const element1 = elements[sign1];
  const element2 = elements[sign2];
  
  // Compatible combinations: Fire+Air, Earth+Water, Same Element
  return (
    (element1 === 'Fire' && element2 === 'Air') ||
    (element1 === 'Air' && element2 === 'Fire') ||
    (element1 === 'Earth' && element2 === 'Water') ||
    (element1 === 'Water' && element2 === 'Earth') ||
    element1 === element2
  );
}