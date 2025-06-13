import { useState } from "react";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, Brain, ArrowRight, MessageCircle } from "lucide-react";

export default function AICoach() {
  const { user } = useAuth();
  const [userQuestion, setUserQuestion] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [personalizedAdvice, setPersonalizedAdvice] = useState<string[]>([]);

  // Fetch connections and moments
  const { data: connections = [] } = useQuery({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  const { data: moments = [] } = useQuery({
    queryKey: ["/api/moments"],
    enabled: !!user,
  });

  // Generate sample insights
  const insights = [
    "Based on your emotional patterns, I notice you experience more joy in exclusive relationships compared to casual connections. Consider what makes these deeper connections fulfilling for you.",
    
    user?.zodiacSign ? 
      `As a ${user.zodiacSign}, you likely appreciate ${
        ['Aries', 'Leo', 'Sagittarius'].includes(user.zodiacSign || "") ? 'passion and authenticity in your relationships. Look for partners who can match your energy and enthusiasm.' 
        : ['Taurus', 'Virgo', 'Capricorn'].includes(user.zodiacSign || "") ? 'stability and reliability in your relationships. Partners who show consistency will help you feel secure.'
        : ['Gemini', 'Libra', 'Aquarius'].includes(user.zodiacSign || "") ? 'intellectual stimulation and variety in your relationships. Look for partners who can engage your mind.'
        : 'emotional depth and intuitive connection in your relationships. Partners who understand your sensitivity will be most compatible.'
      }` 
    : "Adding your zodiac sign to your profile will unlock more personalized insights about your relationship patterns.",
    
    user?.loveLanguage ?
      `Your love language is ${user.loveLanguage}. This means you particularly value ${
        user.loveLanguage === 'Words of Affirmation' ? 'verbal expressions of love and appreciation. Make sure your partners understand how important their words are to you.'
        : user.loveLanguage === 'Quality Time' ? 'undivided attention and shared experiences. Partners who prioritize being present with you will help you feel most loved.'
        : user.loveLanguage === 'Physical Touch' ? 'physical closeness and affection. Express this need clearly to ensure your emotional needs are met.'
        : user.loveLanguage === 'Acts of Service' ? 'when others show love through helpful actions. You appreciate practical support as an expression of care.'
        : 'thoughtful gifts that show you are understood and appreciated. These tokens represent care and attention to you.'
      }`
    : "Adding your love language to your profile will help you receive more tailored relationship insights.",
    
    "Logging your emotional reactions consistently can reveal patterns in how different relationship dynamics affect your wellbeing. Keep tracking to build deeper self-awareness."
  ];

  // Handle user question submission
  const handleAskQuestion = () => {
    if (!userQuestion.trim()) return;
    
    setIsAskingQuestion(true);
    
    // Simulate AI processing with a delay
    setTimeout(() => {
      // Generate personalized response
      let response = "";
      const lowerQuestion = userQuestion.toLowerCase();
      
      // Communication advice
      if (lowerQuestion.includes('communicate') || lowerQuestion.includes('communication') || lowerQuestion.includes('talk')) {
        response = "Improving communication starts with active listening and sharing your needs clearly. Try using 'I feel' statements instead of accusatory language. Practice validating your partner's perspective even when you disagree. Set aside regular time for meaningful conversations without distractions.";
      }
      // Anxiety in relationships
      else if (lowerQuestion.includes('anxious') || lowerQuestion.includes('anxiety') || lowerQuestion.includes('nervous')) {
        response = "Relationship anxiety often stems from past experiences or attachment patterns. This is common and can be managed by: 1) Practicing mindfulness when anxious thoughts arise, 2) Communicating your needs clearly, and 3) Building self-trust through positive self-talk. Remember that some uncertainty is normal in relationships.";
      }
      // Pattern recognition
      else if (lowerQuestion.includes('pattern') || lowerQuestion.includes('trends') || lowerQuestion.includes('repeat')) {
        response = "Looking at relationship patterns requires honesty with yourself. Consider: What attracts you initially? What qualities do you consistently seek? Are there recurring issues that emerge in your relationships? Identifying these patterns is the first step to making conscious choices rather than repeating unconscious habits.";
      }
      // Compatibility questions
      else if (lowerQuestion.includes('compatible') || lowerQuestion.includes('compatibility') || lowerQuestion.includes('match')) {
        response = "Compatibility goes beyond zodiac signs and involves alignment in values, communication styles, and life goals. Look for connections where you feel respected, heard, and free to be authentic. Pay attention to how you feel after spending time with someone - energized or drained? True compatibility should feel supportive and growth-oriented.";
      }
      // Love language related questions
      else if (lowerQuestion.includes('love language') || lowerQuestion.includes('show love') || lowerQuestion.includes('express love')) {
        response = "Understanding love languages can transform your relationships. The five languages are: Words of Affirmation, Quality Time, Physical Touch, Acts of Service, and Receiving Gifts. Reflect on which makes you feel most loved and share this with your partners. Equally important is discovering their love languages and making conscious efforts to express affection in ways meaningful to them.";
      }
      // Default response
      else {
        response = "Building healthy relationships starts with self-awareness. Continue tracking your emotional responses and relationship patterns in the app. Over time, you'll notice valuable insights about what truly nurtures your wellbeing in connections. Remember that authentic relationships should generally increase your energy and joy rather than consistently depleting you.";
      }
      
      setPersonalizedAdvice([...personalizedAdvice, response]);
      setUserQuestion("");
      setIsAskingQuestion(false);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Title Section */}
        <section className="px-4 pt-5 pb-3">
          <h2 className="text-xl font-heading font-semibold">AI Relationship Coach</h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Personalized insights and guidance for your relationships
          </p>
        </section>

        <div className="px-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Your Personalized Insights
                  </CardTitle>
                  <CardDescription>
                    Based on your emotional patterns and profile
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
      </main>

      <BottomNavigation />
    </div>
  );
}