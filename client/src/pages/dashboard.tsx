import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { MomentCard } from "@/components/dashboard/moment-card";
import { BadgeShowcase } from "@/components/dashboard/badge-showcase";
import { Connection, Moment, Badge } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Sparkles, Calendar, ChevronDown, Heart } from "lucide-react";
import { Link } from "wouter";
import { SimplifiedCalendar } from "@/components/calendar/simplified-calendar";
import { FocusSelector } from "@/components/relationships/focus-selector";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { openMomentModal, openConnectionModal, setSelectedConnection } = useModal();
  const [insight, setInsight] = useState<string>("");
  const [selectedCalendarConnection, setSelectedCalendarConnection] = useState<Connection | null>(null);
  const [dashboardConnection, setDashboardConnection] = useState<Connection | null>(null);
  const { mainFocusConnection } = useRelationshipFocus();

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !loading && !!user,
  });

  // Fetch recent moments
  const { data: moments = [], isLoading: momentsLoading, error: momentsError, refetch: refetchMoments } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: true,
  });

  // Listen for moment creation and update events to refetch data immediately
  useEffect(() => {
    const handleMomentCreated = () => refetchMoments();
    const handleMomentUpdated = () => refetchMoments();
    
    window.addEventListener('momentCreated', handleMomentCreated);
    window.addEventListener('momentUpdated', handleMomentUpdated);
    
    return () => {
      window.removeEventListener('momentCreated', handleMomentCreated);
      window.removeEventListener('momentUpdated', handleMomentUpdated);
    };
  }, [refetchMoments]);

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

  // Debug logging
  console.log("Dashboard Debug:", { 
    user: !!user, 
    loading,
    momentsLength: moments.length, 
    momentsLoading,
    momentsError,
    moments 
  });

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
  const earnedBadges = userBadges.length;

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

  const handleSelectConnection = (connection: Connection) => {
    setSelectedConnection(connection.id);
  };

  const handleAddReflection = (momentId: number) => {
    console.log("Add reflection for moment:", momentId);
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
          <section className="px-4 py-3">
            <div className="bg-primary/10 rounded-xl p-4">
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

        {/* Connection Focus Section */}
        {focusConnection && (
          <section className="px-4 py-3">
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                {focusConnection.profileImage ? (
                  <img 
                    src={focusConnection.profileImage} 
                    alt={focusConnection.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {focusConnection.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{focusConnection.name}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {focusConnection.relationshipStage}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white dark:bg-neutral-700 rounded-lg p-3">
                  <div className="text-lg font-semibold text-green-600">{positiveMoments}</div>
                  <div className="text-xs text-neutral-500">Positive</div>
                </div>
                <div className="bg-white dark:bg-neutral-700 rounded-lg p-3">
                  <div className="text-lg font-semibold text-red-600">{conflictMoments}</div>
                  <div className="text-xs text-neutral-500">Conflicts</div>
                </div>
              </div>
            </div>
          </section>
        )}

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
                <p>{focusConnection ? `No moments with ${focusConnection.name} yet` : "No activities yet"}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    if (focusConnection) {
                      setSelectedConnection(focusConnection.id);
                    }
                    openMomentModal();
                  }}
                >
                  {focusConnection ? `Add First Moment with ${focusConnection.name}` : "Log Your First Moment"}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Connection Management */}
        {!focusConnection && (
          <section className="px-4 py-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-heading font-semibold">Your Connections</h3>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-sm text-primary font-medium flex items-center"
                onClick={openConnectionModal}
              >
                <i className="fa-solid fa-plus mr-1"></i> Add
              </Button>
            </div>
          
            {/* Connection Cards */}
            <div className="space-y-3">
              {connections.length > 0 ? (
                <>
                  {connections.slice(0, 3).map((connection) => (
                    <div key={connection.id} className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {connection.profileImage ? (
                          <img 
                            src={connection.profileImage} 
                            alt={connection.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {connection.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{connection.name}</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {connection.relationshipStage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {connections.length > 3 && (
                    <div className="text-center">
                      <Button variant="link" className="text-primary text-sm font-medium py-2" asChild>
                        <Link href="/activities">View All Connections</Link>
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <p>No connections yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={openConnectionModal}
                  >
                    Add Your First Connection
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Badges Section */}
        <section className="px-4 py-3">
          <BadgeShowcase badges={badges} userBadges={userBadges.map(ub => ub.badge)} />
        </section>

        {/* Calendar Section */}
        <section className="px-4 py-5">
          <SimplifiedCalendar 
            moments={filteredMoments}
            connections={connections}
            selectedConnection={focusConnection || selectedCalendarConnection}
            onSelectConnection={setSelectedCalendarConnection}
          />
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}