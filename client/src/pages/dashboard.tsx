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
import { CompactBadgeDisplay } from "@/components/dashboard/compact-badge-display";
import { Connection, Moment, Badge } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Sparkles, ChevronDown, Plus, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";

export default function Dashboard() {
  console.log("Dashboard component rendered");
  const { user, loading } = useAuth();
  console.log("Dashboard: user loaded", !!user, "loading:", loading);
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
          console.log("Moments fetch successful:", data.length);
          setMoments(data);
          setMomentsLoading(false);
        })
        .catch(err => {
          console.error("Moments fetch error:", err);
          setMomentsError(err.message);
          setMomentsLoading(false);
        });
    }
  }, [user?.id]);

  // Fetch moments on mount and user change
  useEffect(() => {
    refetchMoments();
  }, [refetchMoments]);

  // Fetch badges
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/badges/all"],
    enabled: !loading && !!user,
  });

  // Fetch user badges
  const { data: userBadges = [] } = useQuery<any[]>({
    queryKey: ["/api/badges"],
    enabled: !loading && !!user,
  });

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
            <p className="text-neutral-600 dark:text-neutral-400">Please log in to view your dashboard</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  // Focus connection logic
  const focusConnection = dashboardConnection || mainFocusConnection;

  // Calculate statistics
  const totalMoments = moments.length;
  const activeConnections = connections.filter(c => 
    moments.some(m => m.connectionId === c.id && 
      new Date(m.createdAt || '').getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    )
  ).length;
  const earnedBadges = userBadges.length;

  // Focus-specific stats
  const focusedMoments = focusConnection ? 
    moments.filter(m => m.connectionId === focusConnection.id) : moments;
  
  const filteredMoments = focusedMoments.sort((a, b) => 
    new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  );

  const positiveMoments = filteredMoments.filter(m => 
    m.tags?.some(tag => ['positive', 'happy', 'love', 'support'].includes(tag.toLowerCase()))
  ).length;
  
  const conflictMoments = filteredMoments.filter(m => 
    m.tags?.some(tag => ['conflict', 'argument', 'disagreement', 'tension'].includes(tag.toLowerCase()))
  ).length;
  
  const intimateMoments = filteredMoments.filter(m => 
    m.tags?.some(tag => ['intimate', 'romantic', 'physical', 'emotional'].includes(tag.toLowerCase()))
  ).length;

  const handleAddReflection = (momentId: number) => {
    console.log("Adding reflection for moment:", momentId);
  };

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
            {focusConnection ? `Your relationship insights and activity` : `Track your relationships and emotional connections`}
          </p>
          
          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {focusConnection ? (
              <>
                <StatCard value={positiveMoments} label="Positive Moments" color="primary" />
                <StatCard value={conflictMoments} label="Conflicts" color="secondary" />
                <StatCard value={intimateMoments} label="Intimate Moments" color="accent" />
              </>
            ) : (
              <>
                <StatCard value={activeConnections} label="Active Connections" color="primary" />
                <StatCard value={totalMoments} label="Total Moments" color="secondary" />
                <StatCard value={earnedBadges} label="Badges Earned" color="accent" />
              </>
            )}
          </div>
        </section>

        {/* Daily Insight */}
        {insight && (
          <section className="px-3 py-2">
            <div className="bg-primary/10 rounded-xl p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-heading font-medium text-primary">
                    {focusConnection ? "Relationship Insight" : "Today's Insight"}
                  </h3>
                  <p className="text-sm mt-1">{insight}</p>
                </div>
                <Sparkles className="text-primary h-5 w-5" />
              </div>
            </div>
          </section>
        )}

        {/* Compact Badge Display */}
        <CompactBadgeDisplay />

        {/* AI Insights Section */}
        <section className="px-3 py-2">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-heading font-semibold text-primary">AI Insights</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log("Manual refresh clicked, user:", user?.id);
                    if (user?.id) {
                      console.log("Manually fetching moments...");
                      setMomentsLoading(true);
                      fetch("/api/moments")
                        .then(res => res.json())
                        .then(data => {
                          console.log("Manual moments fetch successful:", data.length);
                          setMoments(data);
                          setMomentsLoading(false);
                        })
                        .catch(err => {
                          console.error("Manual moments fetch error:", err);
                          setMomentsError(err.message);
                          setMomentsLoading(false);
                        });
                    }
                  }}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>
            </div>
            <div className="p-4">
              {!user ? (
                <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                  <div className="text-sm">Please log in to view insights</div>
                </div>
              ) : momentsLoading ? (
                <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                  <div className="text-sm">Loading insights...</div>
                </div>
              ) : momentsError ? (
                <div className="text-center text-red-500 py-8">
                  <div className="text-sm">Error loading insights: {momentsError}</div>
                </div>
              ) : (
                <>
                  <AIInsights 
                    moments={moments}
                    connections={connections}
                    loading={momentsLoading}
                    onInsightClick={(insight: any) => {
                      console.log("Insight clicked:", insight);
                      setInsight(insight);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {/* AI Chat Section */}
        <section className="px-3 py-2">
          <AIChat />
        </section>

        {/* Recent Activities */}
        <section className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-heading font-semibold">
              {focusConnection ? `Recent with ${focusConnection.name}` : "Recent Activities"}
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm text-primary font-medium flex items-center"
              onClick={() => {
                if (focusConnection) {
                  setSelectedConnection(focusConnection.id);
                }
                openMomentModal();
              }}
            >
              <i className="fa-solid fa-plus mr-1"></i> Add
            </Button>
          </div>
          
          {/* Recent Moments */}
          <div className="space-y-3">
            {filteredMoments.length > 0 ? (
              <>
                {filteredMoments.slice(0, 4).map((moment) => {
                  const connection = connections.find(c => c.id === moment.connectionId);
                  if (!connection) return null;
                  return (
                    <MomentCard 
                      key={moment.id} 
                      moment={moment} 
                      connection={{
                        id: connection.id,
                        name: connection.name,
                        profileImage: connection.profileImage || undefined
                      }}
                      onAddReflection={() => handleAddReflection(moment.id)}
                    />
                  );
                })}
                {filteredMoments.length > 4 && (
                  <div className="text-center">
                    <Button variant="link" className="text-primary text-sm font-medium py-2" asChild>
                      <Link href="/activities">View All Activities</Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                <p className="text-sm mb-2">
                  {focusConnection ? `No moments with ${focusConnection.name} yet` : "No moments yet"}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (focusConnection) {
                      setSelectedConnection(focusConnection.id);
                    }
                    openMomentModal();
                  }}
                >
                  Add First Moment
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Connections Grid */}
        {!focusConnection && (
          <section className="px-4 py-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-heading font-semibold">Connections</h3>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-sm text-primary font-medium flex items-center"
                onClick={openConnectionModal}
              >
                <i className="fa-solid fa-plus mr-1"></i> Add
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {connections.length > 0 ? (
                connections.slice(0, 4).map((connection) => (
                  <ConnectionCard key={connection.id} connection={connection} />
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <p className="text-sm mb-2">No connections yet</p>
                  <Button variant="outline" size="sm" onClick={openConnectionModal}>
                    Add First Connection
                  </Button>
                </div>
              )}
            </div>
            
            {connections.length > 4 && (
              <div className="text-center mt-3">
                <Button variant="link" className="text-primary text-sm font-medium py-2" asChild>
                  <Link href="/connections">View All Connections</Link>
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Badges */}
        <section className="px-4 py-3">
          <BadgeShowcase badges={badges} earnedBadgeIds={userBadges.map((ub: any) => ub.badgeId)} />
        </section>

      </main>

      <BottomNavigation />
    </div>
  );
}