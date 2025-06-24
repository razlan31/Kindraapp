import { useState, useEffect } from "react";
import { useAuth } from "../contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Connection, Moment } from "../../shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { ChevronDown, ChevronUp, TrendingUp, Calendar, Users, Heart, Brain, Sparkles } from "lucide-react";
import { AIInsights } from "../components/insights/ai-insights";
import { EnhancedAIInsights } from "../components/insights/enhanced-ai-insights";
import { QuoteOfTheDay } from "../components/insights/quote-of-the-day";
import { Header } from "../components/layout/header";
import { BottomNavigation } from "../components/layout/bottom-navigation";

export default function Insights() {
  const { user, loading } = useAuth();
  
  // Collapsible state management with localStorage persistence
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(true);
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(true);

  // Load saved states from localStorage on mount
  useEffect(() => {
    const savedInsightsState = localStorage.getItem('insights-section-expanded');
    const savedAnalyticsState = localStorage.getItem('analytics-section-expanded');
    
    if (savedInsightsState !== null) {
      setIsInsightsExpanded(savedInsightsState === 'true');
    }
    if (savedAnalyticsState !== null) {
      setIsAnalyticsExpanded(savedAnalyticsState === 'true');
    }
  }, []);

  // Save states to localStorage when they change
  useEffect(() => {
    localStorage.setItem('insights-section-expanded', isInsightsExpanded.toString());
  }, [isInsightsExpanded]);

  useEffect(() => {
    localStorage.setItem('analytics-section-expanded', isAnalyticsExpanded.toString());
  }, [isAnalyticsExpanded]);

  console.log("Insights - user:", !!user, "user ID:", user?.id, "loading:", loading);

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !loading && !!user,
  });

  // Fetch moments
  const { data: moments = [], isLoading: momentsLoading, error: momentsError } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !loading && !!user,
  });

  console.log("Insights - moments query:", {
    momentsLength: moments.length,
    momentsLoading,
    momentsError: momentsError ? String(momentsError) : null
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <div className="pt-16 pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-6"></div>
              <div className="grid gap-6">
                <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
                <div className="h-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <div className="pt-16 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="mb-6">
              <Brain className="h-16 w-16 mx-auto text-neutral-400 mb-4" />
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                Sign In Required
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Please sign in to view your relationship insights and analytics.
              </p>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <div className="pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="quote" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Daily Quote
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Connections</p>
                        <p className="text-2xl font-bold">{connections.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Moments</p>
                        <p className="text-2xl font-bold">{moments.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Insights</p>
                        <p className="text-2xl font-bold">
                          {moments.length > 0 ? Math.min(moments.length, 10) : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights Section */}
              <Collapsible open={isInsightsExpanded} onOpenChange={setIsInsightsExpanded}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <Brain className="h-5 w-5 text-white" />
                          </div>
                          AI Relationship Insights
                        </CardTitle>
                        <Button variant="ghost" size="sm">
                          {isInsightsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <AIInsights 
                        moments={moments} 
                        connections={connections}
                        userData={{
                          zodiacSign: (user as any).zodiacSign,
                          loveLanguage: (user as any).loveLanguage
                        }}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Enhanced Analytics Section */}
              <Collapsible open={isAnalyticsExpanded} onOpenChange={setIsAnalyticsExpanded}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-white" />
                          </div>
                          Advanced Analytics
                        </CardTitle>
                        <Button variant="ghost" size="sm">
                          {isAnalyticsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <EnhancedAIInsights 
                        moments={moments} 
                        connections={connections}
                        userData={{
                          zodiacSign: (user as any).zodiacSign,
                          loveLanguage: (user as any).loveLanguage
                        }}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </TabsContent>

            <TabsContent value="quote">
              <QuoteOfTheDay 
                connections={connections}
                moments={moments}
                userData={{
                  zodiacSign: (user as any).zodiacSign,
                  loveLanguage: (user as any).loveLanguage
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}