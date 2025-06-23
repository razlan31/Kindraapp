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

  // Determine which connection to focus on - prioritize dashboard selection, then main focus
  const focusConnection = dashboardConnection || mainFocusConnection || null;
  
  // Initialize dashboard connection to main focus on first load
  useEffect(() => {
    if (mainFocusConnection && !dashboardConnection) {
      setDashboardConnection(mainFocusConnection);
    }
  }, [mainFocusConnection, dashboardConnection]);
  
  // Filter moments based on focus connection
  const filteredMoments = focusConnection 
    ? moments.filter(m => m.connectionId === focusConnection.id)
    : moments;

  // Calculate stats based on filtered data
  const activeConnections = connections.length;
  const totalMoments = filteredMoments.length;
  const earnedBadges = badges.length;

  // Calculate detailed stats for the focused connection
  const positiveMoments = filteredMoments.filter(m => 
    ['😊', '❤️', '😍', '🥰', '💖', '✨', '🌱'].includes(m.emoji)
  ).length;
  
  const conflictMoments = filteredMoments.filter(m => 
    m.emoji === '⚡' || (m.tags && m.tags.includes('Conflict'))
  ).length;
  
  const intimateMoments = filteredMoments.filter(m => 
    m.emoji === '💕' || m.isIntimate
  ).length;

  // Generate insights based on focused connection or all connections
  useEffect(() => {
    if (!user) {
      setInsight("Sign in to start tracking your relationships and building insights!");
      return;
    }

    if (focusConnection) {
      // Insights for main connection
      const connectionMoments = moments.filter(m => m.connectionId === focusConnection.id);
      
      if (connectionMoments.length === 0) {
        setInsight(`Start logging moments with ${focusConnection.name} to build relationship insights!`);
      } else if (connectionMoments.length >= 5) {
        const positiveRatio = positiveMoments / connectionMoments.length;
        if (positiveRatio > 0.7) {
          setInsight(`Your relationship with ${focusConnection.name} is flourishing! ${Math.round(positiveRatio * 100)}% of moments are positive.`);
        } else if (conflictMoments > 0) {
          setInsight(`You've had ${conflictMoments} conflicts with ${focusConnection.name}. Consider focusing on communication and resolution.`);
        } else {
          setInsight(`You're building a solid foundation with ${focusConnection.name}. Keep nurturing this connection!`);
        }
      } else {
        setInsight(`You have ${connectionMoments.length} moments with ${focusConnection.name}. Keep logging to unlock deeper insights!`);
      }
    } else {
      // Insights for all connections
      if (connections.length === 0) {
        setInsight("Add your first connection to start tracking your relationships!");
      } else if (moments.length === 0) {
        setInsight("Log your first moment to start building insights about your relationships!");
      } else {
        const avgMomentsPerConnection = moments.length / connections.length;
        setInsight(`You're actively tracking ${connections.length} relationships with an average of ${Math.round(avgMomentsPerConnection)} moments each.`);
      }
    }
  }, [connections, moments, user, focusConnection, positiveMoments, conflictMoments]);

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
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Welcome Section */}
        <section className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-heading font-semibold">
              {focusConnection ? `${focusConnection.name} Summary` : `Welcome back, ${user?.displayName || user?.username || "Friend"}!`}
            </h2>
            
            {/* Connection Switcher */}
            {connections.length > 1 && (
              <div className="relative">
                <select
                  value={focusConnection?.id || "all"}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "all") {
                      setDashboardConnection(null);
                    } else {
                      const selectedConnection = connections.find(c => c.id === parseInt(value));
                      setDashboardConnection(selectedConnection || null);
                    }
                  }}
                  className="appearance-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Connections</option>
                  {connections.map((connection) => (
                    <option key={connection.id} value={connection.id}>
                      {connection.name} {mainFocusConnection?.id === connection.id ? '♥' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
              </div>
            )}
          </div>
          
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            {focusConnection ? `Your relationship tracking and insights for ${focusConnection.name}` : insight}
          </p>
        </section>

        {/* Stats Overview */}
        <section className="px-4 py-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <p className="text-lg font-heading font-bold text-primary">{totalMoments}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Total Moments</p>
            </div>
            
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-lg font-heading font-bold text-secondary">{positiveMoments}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Positive</p>
            </div>
            
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <p className="text-lg font-heading font-bold text-accent">{earnedBadges}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Badges</p>
            </div>
          </div>
        </section>

        {/* Connection Cards */}
        {connections.length > 0 && (
          <section className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-heading font-semibold">
                {focusConnection ? "Connection Overview" : "Your Connections"}
              </h3>
              {!focusConnection && connections.length > 3 && (
                <Link href="/connections">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    View All
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="space-y-3">
              {(focusConnection ? [focusConnection] : connections.slice(0, 3)).map((connection) => {
                const connectionMoments = moments.filter(m => m.connectionId === connection.id);
                return (
                  <div key={connection.id} className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-700">
                    <ConnectionCard
                      connection={connection}
                      moments={connectionMoments}
                      onQuickMoment={() => handleQuickMoment(connection.id)}
                      onSelect={() => handleSelectConnection(connection)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Moments */}
        {filteredMoments.length > 0 && (
          <section className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-heading font-semibold">Recent Activity</h3>
              <Link href="/activities">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="space-y-2">
              {filteredMoments.slice(0, 5).map((moment) => {
                const connection = connections.find(c => c.id === moment.connectionId);
                if (!connection) return null;
                
                return (
                  <div key={moment.id} className="bg-white dark:bg-neutral-800 rounded-lg p-3 shadow-sm border border-neutral-100 dark:border-neutral-700">
                    <MomentCard
                      moment={moment}
                      connection={connection}
                      onAddReflection={() => handleAddReflection(moment.id)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Badges Section */}
        {userBadges.length > 0 && (
          <section className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-heading font-semibold">Recent Achievements</h3>
              <Link href="/badges">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="bg-gradient-to-r from-accent/10 to-primary/5 rounded-xl p-4">
              <div className="grid grid-cols-4 gap-3">
                {userBadges.slice(0, 4).map((userBadge) => {
                  const badge = badges.find(b => b.id === userBadge.badgeId);
                  if (!badge) return null;
                  
                  return (
                    <div key={userBadge.id} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-1 text-2xl flex items-center justify-center bg-white dark:bg-neutral-800 rounded-full shadow-sm">
                        {badge.icon}
                      </div>
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                        {badge.name}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {userBadges.length > 4 && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    +{userBadges.length - 4} more achievements
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Empty State */}
        {connections.length === 0 && (
          <section className="px-4 py-8">
            <div className="text-center bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-sm">
              <Heart className="h-16 w-16 mx-auto text-primary mb-4 opacity-50" />
              <h3 className="text-xl font-heading font-semibold mb-2">Welcome to Kindra!</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                Start your relationship journey by adding your first connection. Track moments, build insights, and strengthen your bonds.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleQuickConnection}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Connection
                </Button>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  It takes just a minute to get started
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}