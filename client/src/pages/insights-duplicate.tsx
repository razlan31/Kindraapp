import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { MomentCard } from "@/components/dashboard/moment-card";
import { BadgeShowcase } from "@/components/dashboard/badge-showcase";
import { AIInsights } from "@/components/insights/ai-insights";
import { AIChat } from "@/components/ai-chat";
import { Connection, Moment, Badge, MenstrualCycle } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Sparkles, Calendar, ChevronDown, Heart, Plus, Circle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { FocusSelector } from "@/components/relationships/focus-selector";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";

export default function InsightsDuplicate() {
  console.log("InsightsDuplicate component rendered");
  const { user, loading } = useAuth();
  console.log("InsightsDuplicate: user loaded", !!user, "loading:", loading);
  const { openMomentModal, openConnectionModal, setSelectedConnection } = useModal();
  const [insight, setInsight] = useState<string>("");
  const [dashboardConnection, setDashboardConnection] = useState<Connection | null>(null);
  const { mainFocusConnection } = useRelationshipFocus();

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !loading && !!user,
  });

  // State for moments data
  const [moments, setMoments] = useState<Moment[]>([]);
  const [momentsLoading, setMomentsLoading] = useState(false);
  const [momentsError, setMomentsError] = useState<string | null>(null);

  // Function to fetch moments
  const refetchMoments = useCallback(() => {
    if (user?.id) {
      console.log("Starting to fetch moments for user:", user.id);
      setMomentsLoading(true);
      setMomentsError(null);
      fetch("/api/moments")
        .then(res => res.json())
        .then(data => {
          console.log("Moments data fetched:", data.length);
          setMoments(data);
          setMomentsLoading(false);
        })
        .catch(error => {
          console.error("Error fetching moments:", error);
          setMomentsError("Failed to load moments");
          setMomentsLoading(false);
        });
    }
  }, [user?.id]);

  // Fetch moments on user change
  useEffect(() => {
    refetchMoments();
  }, [refetchMoments]);

  // Fetch badges
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/user-badges"],
    enabled: !loading && !!user,
  });

  // Fetch cycles
  const { data: cycles = [] } = useQuery<MenstrualCycle[]>({
    queryKey: ["/api/menstrual-cycles"],
    enabled: !loading && !!user,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Quick actions
  const handleQuickMoment = (connectionId: number) => {
    setSelectedConnection(connectionId);
    openMomentModal('moment');
  };

  const handleQuickConnection = () => {
    openConnectionModal();
  };

  // Set main focus connection as dashboard connection when available
  useEffect(() => {
    if (mainFocusConnection) {
      console.log("Focus Context Debug: Setting dashboard connection to main focus:", mainFocusConnection.id);
      setDashboardConnection(mainFocusConnection);
    } else if (connections.length > 0 && !dashboardConnection) {
      console.log("Focus Context Debug: No main focus, setting first connection as dashboard connection");
      setDashboardConnection(connections[0]);
    }
  }, [mainFocusConnection, connections, dashboardConnection]);

  // Filter recent moments
  const recentMoments = moments.slice(0, 3);

  // Stats calculations
  const weeklyMoments = moments.filter(m => {
    const momentDate = new Date(m.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return momentDate >= weekAgo;
  }).length;

  const activeCycles = cycles.filter(c => c.isActive).length;

  if (loading) {
    console.log("InsightsDuplicate loading state");
    return (
      <div className="min-h-screen bg-background">
        <Header title="Insights" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    console.log("InsightsDuplicate no user state");
    return (
      <div className="min-h-screen bg-background">
        <Header title="Insights" />
        <div className="flex items-center justify-center h-96">
          <p>Please log in to view your insights.</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  console.log("InsightsDuplicate rendering main content", {
    connectionsCount: connections.length,
    momentsCount: moments.length,
    badgesCount: badges.length,
    dashboardConnection: dashboardConnection?.name
  });

  return (
    <div className="min-h-screen bg-background">
      <Header title="Insights" />
      
      <main className="pb-20">
        {/* Subscription Banner */}
        <SubscriptionBanner />
        
        {/* Focus Selector */}
        <section className="px-4 pt-4 pb-2">
          <FocusSelector 
            connections={connections}
            onConnectionSelect={(connection) => {
              console.log("InsightsDuplicate: Focus selector connection selected:", connection?.name);
              setDashboardConnection(connection);
            }}
          />
        </section>

        {/* Quick Stats */}
        <section className="px-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              title="Connections"
              value={connections.length}
              icon={<Heart className="h-4 w-4" />}
              trend={connections.length > 0 ? "up" : "neutral"}
            />
            <StatCard
              title="This Week"
              value={weeklyMoments}
              icon={<Calendar className="h-4 w-4" />}
              trend={weeklyMoments > 0 ? "up" : "neutral"}
            />
            <StatCard
              title="Badges"
              value={badges.length}
              icon={<Sparkles className="h-4 w-4" />}
              trend={badges.length > 0 ? "up" : "neutral"}
            />
          </div>
        </section>

        {/* Main Dashboard Connection */}
        {dashboardConnection && (
          <section className="px-4 py-2">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Current Focus</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickMoment(dashboardConnection.id)}
                  className="text-primary hover:text-primary/80"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Log Moment
                </Button>
              </div>
              <ConnectionCard
                connection={dashboardConnection}
                moments={moments.filter(m => m.connectionId === dashboardConnection.id)}
                onQuickMoment={() => handleQuickMoment(dashboardConnection.id)}
              />
            </div>
          </section>
        )}

        {/* AI Insights */}
        <section className="px-4 py-2">
          <AIInsights 
            moments={moments} 
            connections={connections}
            user={user}
          />
        </section>

        {/* Recent Moments */}
        {recentMoments.length > 0 && (
          <section className="px-4 py-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Moments</h2>
              <Link href="/activities">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {recentMoments.map((moment) => {
                const connection = connections.find(c => c.id === moment.connectionId);
                return (
                  <MomentCard
                    key={moment.id}
                    moment={moment}
                    connection={connection}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <section className="px-4 py-2">
            <BadgeShowcase badges={badges} />
          </section>
        )}

        {/* Empty state */}
        {connections.length === 0 && (
          <section className="px-4 py-8">
            <div className="text-center bg-white dark:bg-neutral-800 rounded-lg p-8 shadow-sm">
              <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Welcome to Kindra</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Start by adding your first connection to begin tracking your relationship journey
              </p>
              <Button
                onClick={handleQuickConnection}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </div>
          </section>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}