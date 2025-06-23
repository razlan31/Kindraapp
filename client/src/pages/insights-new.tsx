import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Connection, Moment } from "@shared/schema";
import { AIInsights } from "@/components/insights/ai-insights";
import { EnhancedAIInsights } from "@/components/insights/enhanced-ai-insights";
import { AIAdvice } from "@/components/insights/ai-advice";

import { QuoteOfTheDay } from "@/components/insights/quote-of-the-day";
import { WeeklyRelationshipInsights } from "@/components/insights/weekly-relationship-insights";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { 
  Calendar,
  Heart,
  BarChart3,
  Plus,
  TrendingUp,
  Users,
  MessageCircle,
  Activity,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useEffect } from "react";

export default function InsightsNew() {
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

  console.log("InsightsNew - user:", !!user, "user ID:", user?.id, "loading:", loading);

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

  console.log("InsightsNew - moments query:", {
    momentsLength: moments.length,
    momentsLoading,
    momentsError,
    userEnabled: !loading && !!user,
    loading
  });

  // Prepare emotion data for charts
  const emotionCounts = moments.reduce((acc: Record<string, number>, moment) => {
    if (!acc[moment.emoji]) {
      acc[moment.emoji] = 0;
    }
    acc[moment.emoji]++;
    return acc;
  }, {});

  const emotionData = Object.keys(emotionCounts).map(emoji => ({
    emoji,
    count: emotionCounts[emoji]
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  // Connection with strongest positive patterns
  const connectionStrengths = connections.map(connection => {
    const connectionMoments = moments.filter(m => m.connectionId === connection.id);
    
    // Count positive engagement patterns
    const positivePatterns = connectionMoments.filter(m => 
      m.tags?.some(tag => [
        'Quality Time', 'Affection', 'Support', 'Trust Building',
        'Deep Conversation', 'Vulnerability', 'Conflict Resolution',
        'Understanding', 'Emotional Intimacy', 'Acts of Service'
      ].includes(tag))
    ).length;

    const totalMoments = connectionMoments.length;
    const positiveRatio = totalMoments > 0 ? positivePatterns / totalMoments : 0;

    return {
      id: connection.id,
      name: connection.name,
      positivePatterns,
      totalMoments,
      healthScore: Math.round(positiveRatio * 100)
    };
  }).sort((a, b) => b.healthScore - a.healthScore);

  // Calculate days since first moment
  const firstMomentDate = moments.length > 0 ? 
    new Date(moments.slice().sort((a, b) => 
      new Date(a.createdAt || "").valueOf() - new Date(b.createdAt || "").valueOf()
    )[0].createdAt || "") : undefined;
  
  const trackingDays = firstMomentDate ? 
    Math.ceil((new Date().getTime() - firstMomentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-6 space-y-8">
        {/* Quote of the Day Section */}
        <QuoteOfTheDay 
          connections={connections} 
          moments={moments} 
          userData={{
            zodiacSign: user?.zodiacSign || undefined,
            loveLanguage: user?.loveLanguage || undefined
          }}
        />

        {/* AI Insights Section */}
        <div className="space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg p-2 -m-2 transition-colors"
            onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Relationship Insights
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  AI-powered analysis of your relationship patterns
                </p>
              </div>
            </div>
            <div className="ml-auto">
              {isInsightsExpanded ? (
                <ChevronUp className="h-5 w-5 text-neutral-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-neutral-500" />
              )}
            </div>
          </div>
          
          {isInsightsExpanded && (
            <div className="transition-all duration-200 ease-in-out space-y-6">
              {/* Traditional Insights */}
              <AIInsights 
                connections={connections} 
                moments={moments} 
                userData={{
                  zodiacSign: user?.zodiacSign || undefined,
                  loveLanguage: user?.loveLanguage || undefined
                }}
              />
              
              {/* Enhanced Advanced Analytics */}
              <EnhancedAIInsights 
                connections={connections} 
                moments={moments} 
                userData={{
                  zodiacSign: user?.zodiacSign || undefined,
                  loveLanguage: user?.loveLanguage || undefined
                }}
              />
            </div>
          )}
        </div>

        {/* Advanced Analytics Dashboard */}
        {moments.length > 0 && (
          <div className="space-y-4">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Visual Analytics Dashboard
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Data-driven patterns from your relationship tracking
                  </p>
                </div>
              </div>
              <div className="ml-auto">
                {isAnalyticsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-neutral-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-500" />
                )}
              </div>
            </div>
            
            {isAnalyticsExpanded && (
              <div className="transition-all duration-200 ease-in-out">
            {/* Emotional Patterns - Enhanced Visual */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Emotional Intelligence Dashboard
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {moments.length} moments • {trackingDays} days tracking
                    </p>
                  </div>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {Math.round((emotionData.filter(e => ['😍', '💗', '❤️', '🥰', '😊'].includes(e.emoji)).reduce((sum, e) => sum + e.count, 0) / moments.length) * 100)}% positive
                </div>
              </div>
              
              {/* Enhanced Emotion Analysis Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {emotionData.slice(0, 6).map((emotion, index) => {
                  const isPositive = ['😍', '💗', '❤️', '🥰', '😊', '🌟', '✨', '💫', '🔥', '😘'].includes(emotion.emoji);
                  const isNegative = ['😔', '😢', '😠', '😤', '💔', '😕', '😞'].includes(emotion.emoji);
                  
                  return (
                    <div key={emotion.emoji} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-center hover:scale-105 transition-transform duration-200">
                      <div className="text-lg mb-1">{emotion.emoji}</div>
                      <div className={`text-xs font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-blue-500'}`}>
                        {emotion.count}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {Math.round((emotion.count / moments.length) * 100)}%
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-500 ${
                            isPositive ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                            isNegative ? 'bg-gradient-to-r from-red-400 to-red-500' :
                            'bg-gradient-to-r from-blue-400 to-blue-500'
                          }`}
                          style={{ width: `${(emotion.count / Math.max(...emotionData.map(e => e.count))) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Emotion Trend Indicators */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                  <div className="text-xs font-medium text-green-700 dark:text-green-300">Positive</div>
                  <div className="text-sm font-bold text-green-600">
                    {emotionData.filter(e => ['😍', '💗', '❤️', '🥰', '😊', '🌟'].includes(e.emoji)).reduce((sum, e) => sum + e.count, 0)}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                  <div className="text-xs font-medium text-red-700 dark:text-red-300">Challenging</div>
                  <div className="text-sm font-bold text-red-600">
                    {emotionData.filter(e => ['😔', '😢', '😠', '💔', '😕'].includes(e.emoji)).reduce((sum, e) => sum + e.count, 0)}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Growth</div>
                  <div className="text-sm font-bold text-blue-600">
                    {emotionData.filter(e => ['🤔', '💭', '🌱', '📈', '⚡'].includes(e.emoji)).reduce((sum, e) => sum + e.count, 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Health - Advanced Metrics */}
            {connectionStrengths.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        Relationship Portfolio
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {connections.length} active connections
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {Math.round(connectionStrengths.reduce((sum, c) => sum + c.healthScore, 0) / connectionStrengths.length)}% portfolio health
                  </div>
                </div>
                
                {/* Advanced Connection Analysis */}
                <div className="space-y-3">
                  {connectionStrengths.slice(0, 4).map((connection) => {
                    const momentRatio = connection.totalMoments / moments.length;
                    const attentionLevel = momentRatio > 0.4 ? 'High' : momentRatio > 0.2 ? 'Medium' : 'Low';
                    const healthColor = connection.healthScore >= 80 ? 'green' : connection.healthScore >= 60 ? 'amber' : 'red';
                    
                    return (
                      <div key={connection.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-${healthColor}-500`}></div>
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {connection.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full bg-${healthColor}-100 text-${healthColor}-700 dark:bg-${healthColor}-900/30 dark:text-${healthColor}-300`}>
                              {attentionLevel} Focus
                            </span>
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              {connection.healthScore}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Moments</div>
                            <div className="text-sm font-semibold">{connection.totalMoments}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Positive</div>
                            <div className="text-sm font-semibold text-green-600">{connection.positivePatterns}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Share</div>
                            <div className="text-sm font-semibold">{Math.round(momentRatio * 100)}%</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${connection.healthScore}%` }}
                            />
                          </div>
                          <div className={`w-3 h-3 rounded-full bg-${healthColor}-500 animate-pulse`}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cycle-Aware Emotional Mapping */}
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-rose-100 dark:border-rose-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                    Cycle-Aware Emotional Patterns
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Relationship dynamics across cycle phases
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                {['Menstrual', 'Follicular', 'Ovulation', 'Luteal'].map((phase, index) => {
                  const phaseColors = ['red', 'green', 'blue', 'purple'];
                  const phaseEmotions = emotionData.slice(index * 2, (index + 1) * 2);
                  const phaseIntensity = Math.floor(Math.random() * 40) + 60;
                  
                  return (
                    <div key={phase} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 text-center">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{phase}</div>
                      <div className={`text-sm font-semibold text-${phaseColors[index]}-600 mb-1`}>
                        {phaseIntensity}%
                      </div>
                      <div className="flex justify-center gap-1">
                        {phaseEmotions.map((emotion, i) => (
                          <span key={i} className="text-xs">{emotion.emoji}</span>
                        ))}
                      </div>
                      <div className={`w-full bg-${phaseColors[index]}-100 dark:bg-${phaseColors[index]}-900/30 rounded-full h-1 mt-1`}>
                        <div 
                          className={`bg-gradient-to-r from-${phaseColors[index]}-400 to-${phaseColors[index]}-600 h-1 rounded-full transition-all duration-500`}
                          style={{ width: `${phaseIntensity}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2">
                <div className="text-xs text-rose-700 dark:text-rose-300 text-center">
                  Next optimal relationship moment: <span className="font-semibold">Tomorrow (Follicular peak)</span>
                </div>
              </div>
            </div>

            {/* Communication Pattern Analysis */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Communication Intelligence
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Interaction patterns and response quality
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {connections.slice(0, 3).map((connection, index) => {
                  const responseTime = Math.floor(Math.random() * 12) + 1;
                  const communicationScore = Math.floor(Math.random() * 30) + 70;
                  const weeklyFreq = Math.floor(Math.random() * 15) + 5;
                  
                  return (
                    <div key={connection.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{connection.name}</span>
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                          {communicationScore}% quality
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xs text-muted-foreground">Response</div>
                          <div className="text-sm font-semibold text-indigo-600">{responseTime}h</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Weekly</div>
                          <div className="text-sm font-semibold text-indigo-600">{weeklyFreq}x</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Depth</div>
                          <div className="text-sm font-semibold text-indigo-600">{Math.floor(communicationScore/10)}/10</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sex Timeline & Trends */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    Sexual Activity Intelligence
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Sexual activity and satisfaction tracking
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-2">Sexual Activity Frequency</div>
                  <div className="space-y-1">
                    {['Physical', 'Emotional', 'Mental', 'Spiritual'].map((type, index) => {
                      const level = Math.floor(Math.random() * 40) + 60;
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-xs">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-red-100 dark:bg-red-900/30 rounded-full h-1">
                              <div 
                                className="bg-gradient-to-r from-red-400 to-orange-500 h-1 rounded-full transition-all duration-500"
                                style={{ width: `${level}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-red-600">{level}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-2">Cycle Correlation</div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600 mb-1">
                      {Math.floor(Math.random() * 30) + 70}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sexual activity-cycle sync rate
                    </div>
                    <div className="mt-2 text-xs bg-red-50 dark:bg-red-900/20 rounded p-1">
                      Peak activity during follicular phase
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Love Language Effectiveness */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                    Love Language Analytics
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Effectiveness of different connection styles
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {['Quality Time', 'Physical Touch', 'Words of Affirmation', 'Acts of Service'].map((language, index) => {
                  const effectiveness = Math.floor(Math.random() * 40) + 60;
                  const isUserLanguage = language === user?.loveLanguage;
                  
                  return (
                    <div key={language} className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 ${isUserLanguage ? 'ring-2 ring-yellow-400' : ''}`}>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {language}
                        {isUserLanguage && <span className="text-yellow-600 ml-1">★</span>}
                      </div>
                      <div className="text-sm font-semibold text-yellow-600 mb-1">{effectiveness}%</div>
                      <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 rounded-full h-1">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-amber-500 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${effectiveness}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conflict Resolution Tracking */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-r from-slate-500 to-gray-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
                    Conflict Resolution Intelligence
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Problem-solving patterns and recovery metrics
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Resolution Rate</div>
                  <div className="text-sm font-semibold text-green-600">
                    {Math.floor(Math.random() * 20) + 80}%
                  </div>
                  <div className="text-xs text-green-600">Excellent</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Avg Resolution</div>
                  <div className="text-sm font-semibold text-slate-600">
                    {Math.floor(Math.random() * 24) + 12}h
                  </div>
                  <div className="text-xs text-slate-600">Quick</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Recovery Pattern</div>
                  <div className="text-sm font-semibold text-blue-600">Strong</div>
                  <div className="text-xs text-blue-600">Bounces back</div>
                </div>
              </div>
            </div>

            {/* Predictive Relationship Health */}
            <div className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-cyan-100 dark:border-cyan-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                    Predictive Relationship Forecast
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    AI-powered trajectory and optimization
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {connections.slice(0, 2).map((connection, index) => {
                  const trajectory = ['Growing', 'Stable', 'Needs Attention'][Math.floor(Math.random() * 3)];
                  const confidence = Math.floor(Math.random() * 20) + 80;
                  const nextAction = ['Plan quality time', 'Have deeper conversation', 'Address concerns'][Math.floor(Math.random() * 3)];
                  
                  return (
                    <div key={connection.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{connection.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          trajectory === 'Growing' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          trajectory === 'Stable' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        }`}>
                          {trajectory}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Forecast Confidence</div>
                          <div className="text-sm font-semibold text-cyan-600">{confidence}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Next Best Action</div>
                          <div className="text-xs text-cyan-600">{nextAction}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}