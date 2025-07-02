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
import { Sparkles, Calendar, ChevronDown, Heart, Plus, Circle, TrendingUp, X } from "lucide-react";
import { Link } from "wouter";
import { FocusSelector } from "@/components/relationships/focus-selector";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";

export default function DashboardSocial() {
  const { user, loading } = useAuth();
  const { openMomentModal, setSelectedConnection } = useModal();
  const [insight, setInsight] = useState<string>("");
  const [dashboardConnection, setDashboardConnection] = useState<Connection | null>(null);
  const { mainFocusConnection } = useRelationshipFocus();

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !loading && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // State for moments data
  const [moments, setMoments] = useState<Moment[]>([]);
  const [momentsLoading, setMomentsLoading] = useState(false);
  const [momentsError, setMomentsError] = useState<string | null>(null);

  // Function to fetch moments
  const refetchMoments = useCallback(() => {
    if (user?.id) {
      setMomentsLoading(true);
      setMomentsError(null);
      fetch("/api/moments")
        .then(res => res.json())
        .then(data => {
          setMoments(data);
        })
        .catch(err => {
          setMomentsError("Failed to load moments");
        })
        .finally(() => setMomentsLoading(false));
    }
  }, [user?.id]);

  // Fetch moments when user loads
  useEffect(() => {
    if (!loading && user?.id) {
      refetchMoments();
    }
  }, [user?.id, loading]);

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

  // Fetch badges with performance optimization
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
    enabled: !loading && !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes - badges rarely change
    refetchOnWindowFocus: false,
  });

  // Fetch user badges with performance optimization
  const { data: userBadges = [] } = useQuery<any[]>({
    queryKey: ["/api/user-badges"],
    enabled: !loading && !!user,
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  // Force refetch moments if they're empty but user is loaded
  useEffect(() => {
    if (!loading && user && moments.length === 0 && !momentsLoading) {
      refetchMoments();
    }
  }, [loading, user, moments.length, momentsLoading, refetchMoments]);

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
    m.emoji === '💗' || m.isIntimate
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

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-gray-50 dark:bg-black min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 dark:bg-black min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Stories-Style Header */}
        <section className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 p-0.5">
                <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {user?.displayName?.[0] || user?.username?.[0] || "K"}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user?.displayName || user?.username || "Kindra"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your relationship feed</p>
              </div>
            </div>
            
            {/* Connection Stories */}
            <div className="flex gap-2">
              {connections.slice(0, 3).map((connection) => (
                <button
                  key={connection.id}
                  onClick={() => setDashboardConnection(connection)}
                  className={`relative ${focusConnection?.id === connection.id ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 p-0.5">
                    {connection.profileImage ? (
                      <img 
                        src={connection.profileImage} 
                        alt={connection.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {connection.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  {focusConnection?.id === connection.id && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black"></div>
                  )}
                </button>
              ))}
              {connections.length > 3 && (
                <button className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    +{connections.length - 3}
                  </span>
                </button>
              )}
            </div>
          </div>
          
          {/* Active Connection Banner */}
          {focusConnection && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/20 p-0.5">
                  {focusConnection.profileImage ? (
                    <img 
                      src={focusConnection.profileImage} 
                      alt={focusConnection.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {focusConnection.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{focusConnection.name}</h3>
                  <p className="text-white/80 text-sm">{focusConnection.relationshipStage}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-white/70">
                    <span>{totalMoments} moments</span>
                    <span>{positiveMoments} positive</span>
                    {intimateMoments > 0 && <span>{intimateMoments} intimate</span>}
                  </div>
                </div>
                <button 
                  onClick={() => setDashboardConnection(null)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Social Media Style Stats Cards */}
        <section className="px-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            {focusConnection ? (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{positiveMoments}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Positive</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-red-500 dark:text-red-400">{conflictMoments}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Conflicts</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-pink-500 dark:text-pink-400">{intimateMoments}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Intimate</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activeConnections}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Connections</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">{totalMoments}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Moments</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{earnedBadges}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Badges</div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Daily Insight Card */}
        {insight && (
          <section className="px-4 py-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Today's Insight</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{insight}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Moments Feed */}
        <section className="px-4 py-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Moments</h3>
            <Button 
              onClick={() => openMomentModal()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          <div className="space-y-3">
            {filteredMoments.slice(0, 5).map((moment) => {
              const connection = connections.find(c => c.connectionId === moment.connectionId);
              return (
                <div key={moment.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-0.5">
                      {connection?.profileImage ? (
                        <img 
                          src={connection.profileImage} 
                          alt={connection.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {connection?.name?.[0] || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {connection?.name || 'Unknown'}
                        </span>
                        <span className="text-2xl">{moment.emoji}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{moment.content}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(moment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SubscriptionBanner */}
        <SubscriptionBanner />
      </main>

      <BottomNavigation />
    </div>
  );
}