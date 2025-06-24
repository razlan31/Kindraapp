import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { SimpleMomentCard } from "@/components/dashboard/simple-moment-card";
import { BadgeShowcase } from "@/components/dashboard/badge-showcase";
import { AIInsights } from "@/components/insights/ai-insights";
import { QuoteOfTheDay } from "@/components/insights/quote-of-the-day";
import { Connection, Moment, Badge } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Heart, Calendar, Circle, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";

export default function InsightsNew() {
  const { user, loading } = useAuth();
  const { openMomentModal, openConnectionModal } = useModal();

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !loading && !!user,
  });

  // Fetch moments
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !loading && !!user,
  });

  // Fetch badges
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
    enabled: !loading && !!user,
  });

  // Fetch user badges
  const { data: userBadges = [] } = useQuery<any[]>({
    queryKey: ["/api/user-badges"],
    enabled: !loading && !!user,
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

  // Calculate weekly moments
  const weeklyMoments = moments?.filter(moment => {
    if (!moment?.createdAt) return false;
    const momentDate = new Date(moment.createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return momentDate >= oneWeekAgo;
  }) || [];

  const recentMoments = moments?.slice(0, 5) || [];

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-6">
        {/* Subscription Banner */}
        <SubscriptionBanner />

        {/* Stats Overview - 4 cards like old homepage */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard 
            title="Connections" 
            value={connections.length.toString()} 
            icon={Users} 
            color="text-blue-600" 
          />
          <StatCard 
            title="Total Moments" 
            value={moments.length.toString()} 
            icon={Heart} 
            color="text-pink-600" 
          />
          <StatCard 
            title="This Week" 
            value={weeklyMoments.length.toString()} 
            icon={Calendar} 
            color="text-green-600" 
          />
          <StatCard 
            title="Badges Earned" 
            value={userBadges.length.toString()} 
            icon={Circle} 
            color="text-purple-600" 
          />
        </div>

        {/* Quote of the Day */}
        <div className="mb-6">
          <QuoteOfTheDay connections={connections} moments={moments} userData={{
            zodiacSign: user?.zodiacSign || undefined,
            loveLanguage: user?.loveLanguage || undefined
          }} />
        </div>

        {/* AI Insights */}
        <div className="mb-6">
          <AIInsights connections={connections} moments={moments} userData={{
            zodiacSign: user?.zodiacSign || undefined,
            loveLanguage: user?.loveLanguage || undefined
          }} />
        </div>

        {/* Recent Activity */}
        <section className="space-y-4 mb-6">
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
                <Button 
                  onClick={() => openMomentModal()}
                  className="mt-3"
                  size="sm"
                >
                  Add First Moment
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Active Connections */}
        {connections.length > 0 && (
          <section className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Connections
            </h2>
            <div className="grid gap-4">
              {connections.slice(0, 3).map((connection) => (
                <ConnectionCard key={connection.id} connection={connection} />
              ))}
              {connections.length > 3 && (
                <div className="text-center">
                  <Link href="/connection">
                    <Button variant="outline" size="sm">
                      View All {connections.length} Connections
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Badge Showcase */}
        {userBadges.length > 0 && (
          <BadgeShowcase badges={userBadges.map((ub: any) => ub.badge || ub)} />
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}