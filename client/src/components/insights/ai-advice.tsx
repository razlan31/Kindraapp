import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Connection, Moment } from "@shared/schema";
import { MessageCircle, Send, Lightbulb, ArrowRight, Heart, Star } from "lucide-react";
import { useState } from "react";

interface AIAdviceProps {
  connections: Connection[];
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

export function AIAdvice({ connections, moments, userData }: AIAdviceProps) {
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState<Array<{question: string, advice: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const contextualAdvice = generateContextualAdvice(connections, moments, userData);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    
    // Check if this is a similar question to previous ones
    const previousQuestions = responses.map(r => r.question.toLowerCase());
    const isRepeatQuestion = previousQuestions.some(prev => 
      question.toLowerCase().includes(prev.slice(0, 20)) || 
      prev.includes(question.toLowerCase().slice(0, 20))
    );
    
    // Generate contextual response based on user's data and question
    const response = generateAdviceResponse(question, connections, moments, userData, responses.length, isRepeatQuestion);
    
    setResponses(prev => [...prev, { question, advice: response }]);
    setQuestion("");
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Relationship Coach
        </CardTitle>
        <CardDescription>
          Ask questions about your relationships and get personalized advice
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick contextual insights */}
          {contextualAdvice.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Based on your recent activity:
              </h4>
              <div className="space-y-2">
                {contextualAdvice.map((advice, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {advice}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Chat interface */}
          <div className="space-y-3">
            {responses.map((response, index) => (
              <div key={index} className="space-y-2">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-sm font-medium">You asked:</p>
                  <p className="text-sm">{response.question}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    AI Coach:
                  </p>
                  <p className="text-sm">{response.advice}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Question input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Ask about your relationships... e.g., 'How can I improve communication with Jordan?' or 'What should I do when I'm feeling distant?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px] resize-none"
              rows={5}
            />
            <Button 
              onClick={handleAskQuestion}
              disabled={!question.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? "Thinking..." : "Ask AI Coach"}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Suggested questions */}
          {responses.length === 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Try asking:</p>
              <div className="space-y-1">
                {getSuggestedQuestions(connections, moments).map((suggestedQ, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(suggestedQ)}
                    className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors block w-full p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    {suggestedQ}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function generateContextualAdvice(connections: Connection[], moments: Moment[], userData: any): string[] {
  const advice: string[] = [];

  // Recent activity-based insights
  const recentMoments = moments.filter(m => {
    const momentDate = new Date(m.createdAt || '');
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return momentDate > threeDaysAgo;
  });

  if (recentMoments.length > 0) {
    const recentEmotions = recentMoments.map(m => m.emoji);
    const positiveEmojis = ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖'];
    const challengingEmojis = ['😔', '😢', '😠', '😤', '💔', '😕', '😞'];
    
    const positiveCount = recentEmotions.filter(e => positiveEmojis.includes(e)).length;
    const challengingCount = recentEmotions.filter(e => challengingEmojis.includes(e)).length;

    if (positiveCount > challengingCount) {
      advice.push("You've been experiencing more positive moments lately. This is a great time to deepen your connections.");
    } else if (challengingCount > positiveCount) {
      advice.push("You've had some challenging moments recently. Consider what support you might need right now.");
    }
  }

  return advice;
}

function generateAdviceResponse(question: string, connections: Connection[], moments: Moment[], userData: any, conversationCount: number = 0, isRepeat: boolean = false): string {
  const lowerQuestion = question.toLowerCase();
  
  // Handle repeat questions
  if (isRepeat) {
    return "I notice you're asking about something similar to before. Let me offer a different perspective - sometimes the key is in the small, consistent actions rather than big changes. What specific aspect would you like to explore deeper?";
  }
  
  // Analyze the user's question context
  const connectionNames = connections.map(c => c.name.toLowerCase());
  const mentionedConnection = connections.find(c => 
    lowerQuestion.includes(c.name.toLowerCase())
  );

  // Add conversation-aware responses
  const responseVariations = {
    communication: [
      "Communication is the foundation of any strong relationship. Focus on being present and truly listening.",
      "Try the 'mirror and validate' approach - repeat back what you heard and acknowledge their feelings before sharing your perspective.",
      "Sometimes the best conversations happen during activities together - walking, cooking, or shared interests can create natural openings.",
      "Consider timing - the best conversations often happen when both people feel relaxed and open, not during stressful moments."
    ],
    distance: [
      "Feeling distant is natural in relationships. It often signals a need for reconnection rather than a problem with the relationship itself.",
      "Distance can be emotional or physical. Try to identify which type you're experiencing and address it specifically.",
      "Sometimes distance happens when we're growing as individuals. Make sure you're maintaining your own interests and growth.",
      "Consider reaching out with low-pressure connection - a simple message about something that reminded you of them can bridge distance."
    ],
    conflict: [
      "Conflict isn't always negative - it can signal that both people care enough to work through differences.",
      "Focus on the specific behavior or situation, not personality traits. Use 'I feel' statements rather than 'you always' statements.",
      "Take breaks during heated discussions. Sometimes the best resolutions come after both people have had time to process.",
      "Look for the underlying need beneath the disagreement. Often conflicts are about unmet needs rather than the surface issue."
    ]
  };

  // Communication-related questions
  if (lowerQuestion.includes('communication') || lowerQuestion.includes('talk') || lowerQuestion.includes('conversation')) {
    if (mentionedConnection) {
      const connectionMoments = moments.filter(m => m.connectionId === mentionedConnection.id);
      const conversationMoments = connectionMoments.filter(m => 
        m.tags?.some(tag => ['Deep Conversation', 'Communication', 'Understanding'].includes(tag))
      );
      
      if (conversationMoments.length > 0) {
        const baseResponse = `Based on your tracking with ${mentionedConnection.name}, you've had ${conversationMoments.length} meaningful conversation moments.`;
        const variation = responseVariations.communication[conversationCount % responseVariations.communication.length];
        return `${baseResponse} ${variation}`;
      } else {
        return `For improving communication with ${mentionedConnection.name}, start small. Try asking open-ended questions about their day or feelings. Since you're both at the ${mentionedConnection.relationshipStage} stage, focus on creating safe spaces for honest sharing.`;
      }
    } else {
      if (userData.loveLanguage === 'Words of Affirmation') {
        return "Since Words of Affirmation is your love language, clear communication is especially important to you. Express your needs openly and encourage others to share their feelings with you.";
      }
      const variation = responseVariations.communication[conversationCount % responseVariations.communication.length];
      return variation;
    }
  }

  // Distance/disconnection questions
  if (lowerQuestion.includes('distant') || lowerQuestion.includes('disconnected') || lowerQuestion.includes('drift')) {
    if (mentionedConnection) {
      const recentMoments = moments.filter(m => {
        const momentDate = new Date(m.createdAt || '');
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        return momentDate > twoWeeksAgo && m.connectionId === mentionedConnection.id;
      });

      if (recentMoments.length === 0) {
        const variation = responseVariations.distance[conversationCount % responseVariations.distance.length];
        return `It looks like you haven't tracked moments with ${mentionedConnection.name} recently. ${variation}`;
      } else {
        const variation = responseVariations.distance[conversationCount % responseVariations.distance.length];
        return `Even though you've been tracking moments with ${mentionedConnection.name}, feeling distant can happen. ${variation}`;
      }
    } else {
      const variation = responseVariations.distance[conversationCount % responseVariations.distance.length];
      return variation;
    }
  }

  // Conflict resolution questions
  if (lowerQuestion.includes('conflict') || lowerQuestion.includes('fight') || lowerQuestion.includes('argument') || lowerQuestion.includes('disagree')) {
    const conflictMoments = moments.filter(m => 
      m.tags?.some(tag => ['Conflict', 'Disagreement', 'Tension'].includes(tag))
    );

    if (conflictMoments.length > 0) {
      const resolvedConflicts = conflictMoments.filter(m => m.isResolved);
      if (resolvedConflicts.length > 0) {
        return `You've successfully resolved ${resolvedConflicts.length} conflicts before. Think about what worked in those situations - was it taking time to cool down, having honest conversations, or finding compromise? Apply those same strategies.`;
      }
    }

    if (userData.zodiacSign === 'Libra' || userData.zodiacSign === 'Pisces') {
      return "As someone who likely values harmony, conflicts can feel especially draining. Remember that healthy disagreements can strengthen relationships when handled with care and respect.";
    }

    return "Healthy conflict resolution involves understanding both perspectives. Take breaks when emotions are high, focus on specific behaviors rather than character, and look for solutions together.";
  }

  // Intimacy questions
  if (lowerQuestion.includes('intimacy') || lowerQuestion.includes('close') || lowerQuestion.includes('physical')) {
    if (userData.loveLanguage === 'Physical Touch') {
      return "Physical touch is your primary love language, so this is especially important for you. Communicate your needs clearly and discuss comfort levels openly with your partners.";
    }

    const intimateMoments = moments.filter(m => m.isIntimate);
    if (intimateMoments.length > 0) {
      return `You've tracked ${intimateMoments.length} intimate moments, which shows you value this aspect of relationships. Intimacy grows through trust, communication, and patience. Focus on emotional safety first.`;
    }

    return "Building intimacy takes time and trust. Start with emotional intimacy through vulnerability and deep conversations. Physical intimacy naturally follows when both people feel safe and connected.";
  }

  // General relationship questions
  if (lowerQuestion.includes('improve') || lowerQuestion.includes('better') || lowerQuestion.includes('help')) {
    const totalPositiveMoments = moments.filter(m => 
      ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖'].includes(m.emoji)
    ).length;

    if (totalPositiveMoments > moments.length * 0.6) {
      return "Your tracking shows many positive moments, which suggests your relationships are generally healthy. Focus on consistency and continue doing what's working while staying open to growth.";
    }

    return "Every relationship is unique and grows at its own pace. Focus on being your authentic self, communicating your needs clearly, and showing genuine interest in understanding others.";
  }

  // Default response
  return "That's a thoughtful question. Based on your relationship patterns, focus on consistent communication, honoring both your needs and your partner's, and remember that healthy relationships require patience and understanding from everyone involved.";
}

function getSuggestedQuestions(connections: Connection[], moments: Moment[]): string[] {
  const suggestions = [
    "How can I better communicate my needs?",
    "What should I do when I'm feeling overwhelmed in a relationship?",
    "How do I know if a relationship is worth pursuing?",
    "What are healthy boundaries in relationships?"
  ];

  // Add connection-specific suggestions
  if (connections.length > 0) {
    const primaryConnection = connections[0];
    suggestions.unshift(`How can I improve my connection with ${primaryConnection.name}?`);
  }

  // Add stage-specific suggestions
  const stages = connections.map(c => c.relationshipStage);
  if (stages.includes('Talking')) {
    suggestions.push("How do I know if someone is truly interested?");
  }
  if (stages.includes('Dating')) {
    suggestions.push("How do I navigate the transition from dating to something more serious?");
  }

  return suggestions.slice(0, 5);
}