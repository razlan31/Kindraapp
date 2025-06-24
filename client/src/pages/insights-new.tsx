import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { SimpleMomentCard } from "@/components/dashboard/simple-moment-card";
import { BadgeShowcase } from "@/components/dashboard/badge-showcase";
import { AIInsights } from "@/components/insights/ai-insights";
import { AIChat } from "@/components/ai-chat";
import { QuoteOfTheDay } from "@/components/dashboard/quote-of-the-day";
import { Connection, Moment, Badge, MenstrualCycle } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Sparkles, Calendar, ChevronDown, Heart, Plus, Circle, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";
import { FocusSelector } from "@/components/relationships/focus-selector";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InsightsNew() {
  const { user, loading } = useAuth();
  const { openMomentModal, openConnectionModal, setSelectedConnection } = useModal();
  const [insight, setInsight] = useState<string>("");
  const [dashboardConnection, setDashboardConnection] = useState<Connection | null>(null);
  const { mainFocusConnection } = useRelationshipFocus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query data
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    enabled: !!user
  });

  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ['/api/moments'],
    enabled: !!user
  });

  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['/api/user-badges'],
    enabled: !!user
  });

  const { data: cycles = [] } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
    enabled: !!user
  });

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-neutral-600 dark:text-neutral-400">Please log in to access insights</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  // Calculate statistics with safety checks
  const totalMoments = moments?.length || 0;
  const totalConnections = connections?.length || 0;
  const recentMoments = moments?.slice(0, 3) || [];
  const recentConnections = connections?.slice(0, 3) || [];
  const recentBadges = badges?.slice(0, 3) || [];

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="luna">Luna AI</TabsTrigger>
            <TabsTrigger value="quote">Daily Quote</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Subscription Banner */}
            <SubscriptionBanner />

            {/* Stats Overview - 4 cards like old homepage */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard 
                title="Connections" 
                value={connections.length} 
                icon={Users} 
                color="text-blue-600" 
              />
              <StatCard 
                title="Total Moments" 
                value={moments.length} 
                icon={Heart} 
                color="text-pink-600" 
              />
              <StatCard 
                title="This Week" 
                value={weeklyMoments.length} 
                icon={Calendar} 
                color="text-green-600" 
              />
              <StatCard 
                title="Badges Earned" 
                value={badges.length} 
                icon={Circle} 
                color="text-purple-600" 
              />
            </div>

            {/* Focus Selector */}
            <FocusSelector />

            {/* AI Insights */}
            <AIInsights />

            {/* Recent Activity */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>
                <Link href="/connection">
                  <Button variant="ghost" size="sm" className="text-purple-600">
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentMoments.filter(moment => moment && moment.id).map((moment) => (
                  <SimpleMomentCard key={moment.id} moment={moment} />
                ))}
                {recentMoments.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity to show</p>
                  </div>
                )}
              </div>
            </section>

            {/* Badge Showcase */}
            <BadgeShowcase badges={recentBadges} />
          </TabsContent>

          <TabsContent value="quote" className="space-y-6 mt-6">
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 mb-4">
                <Sparkles className="h-8 w-8 mx-auto mb-4 text-purple-600" />
                <p className="text-lg italic text-gray-700 dark:text-gray-300 mb-2">
                  "Every relationship teaches you something about yourself."
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Daily Inspiration</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
}