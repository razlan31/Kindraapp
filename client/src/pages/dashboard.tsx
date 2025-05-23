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
import { Sparkles, Calendar } from "lucide-react";
import { Link } from "wouter";
import { RelationshipCalendar } from "@/components/calendar/relationship-calendar";

export default function Dashboard() {
  const { user } = useAuth();
  const { openMomentModal, openConnectionModal, setSelectedConnection } = useModal();
  const [insight, setInsight] = useState<string>("");
  const [selectedCalendarConnection, setSelectedCalendarConnection] = useState<Connection | null>(null);

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  // Fetch recent moments
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments", { limit: 5 }],
    enabled: !!user,
  });

  // Fetch badges
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
    enabled: !!user,
  });

  // Fetch user badges
  const { data: userBadges = [] } = useQuery<any[]>({
    queryKey: ["/api/user-badges"],
    enabled: !!user,
  });

  // Calculate stats
  const activeConnections = connections.length;
  const recentMoments = moments.length;
  const earnedBadges = userBadges.length;

  // Generate a simple insight based on the data
  useEffect(() => {
    if (connections.length > 0 && moments.length > 0) {
      // Find the connection with the most moments
      const connectionMoments: Record<number, number> = {};
      moments.forEach(moment => {
        connectionMoments[moment.connectionId] = (connectionMoments[moment.connectionId] || 0) + 1;
      });
      
      const mostActiveConnectionId = Object.keys(connectionMoments).reduce((a, b) => 
        connectionMoments[Number(a)] > connectionMoments[Number(b)] ? Number(a) : Number(b)
      , Number(Object.keys(connectionMoments)[0]));
      
      const mostActiveConnection = connections.find(c => c.id === Number(mostActiveConnectionId));
      
      if (mostActiveConnection) {
        const isPositive = moments.filter(m => 
          m.connectionId === mostActiveConnectionId && 
          ['😊', '❤️', '😍', '🥰', '💖', '✨'].includes(m.emoji)
        ).length > moments.filter(m => 
          m.connectionId === mostActiveConnectionId && 
          ['😕', '😢', '😠'].includes(m.emoji)
        ).length;
        
        if (isPositive) {
          setInsight(`You've been consistently logging positive moments with ${mostActiveConnection.name}. This is great for building your connection!`);
        } else {
          setInsight(`You've had some mixed feelings with ${mostActiveConnection.name} lately. Consider having a conversation about your needs.`);
        }
      }
    } else if (connections.length === 0) {
      setInsight("Add your first connection to start tracking your relationships!");
    } else if (moments.length === 0) {
      setInsight("Log your first moment to start building insights about your relationships!");
    }
  }, [connections, moments]);

  const handleSelectConnection = (connection: Connection) => {
    setSelectedConnection(connection.id);
  };

  const handleAddReflection = (momentId: number) => {
    // This would open a reflection modal in a full implementation
    console.log("Add reflection for moment:", momentId);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Welcome Section */}
        <section className="px-4 pt-5 pb-3">
          <h2 className="text-xl font-heading font-semibold">
            Welcome back, {user?.displayName || user?.username || "Friend"}!
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Track your relationships and emotional connections
          </p>
          
          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatCard value={activeConnections} label="Active Connections" color="primary" />
            <StatCard value={recentMoments} label="Recent Moments" color="secondary" />
            <StatCard value={earnedBadges} label="Badges Earned" color="accent" />
          </div>
        </section>

        {/* Daily Insight */}
        {insight && (
          <section className="px-4 py-3">
            <div className="bg-primary/10 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-heading font-medium text-primary">Today's Insight</h3>
                  <p className="text-sm mt-1">{insight}</p>
                </div>
                <Sparkles className="text-primary h-5 w-5" />
              </div>
            </div>
          </section>
        )}
        
        {/* Relationship Calendar */}
        <section className="px-4 pt-3">
          <RelationshipCalendar selectedConnection={selectedCalendarConnection} />
          
          {/* Connection filter for calendar */}
          {connections.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Filter Calendar By:</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant={!selectedCalendarConnection ? "secondary" : "outline"}
                  onClick={() => setSelectedCalendarConnection(null)}
                  className="text-xs h-7 px-2"
                >
                  All
                </Button>
                
                {connections.slice(0, 3).map(connection => (
                  <Button
                    key={connection.id}
                    size="sm"
                    variant={selectedCalendarConnection?.id === connection.id ? "secondary" : "outline"}
                    onClick={() => setSelectedCalendarConnection(connection)}
                    className="text-xs h-7 px-2"
                  >
                    {connection.name}
                  </Button>
                ))}
                
                {connections.length > 3 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2"
                  >
                    +{connections.length - 3} more
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Your Connections */}
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
                  <ConnectionCard 
                    key={connection.id} 
                    connection={connection} 
                    onSelect={handleSelectConnection}
                    // In a full implementation, we would fetch actual emoji data and flag counts
                    recentEmojis={['😊', '❤️', '✨']}
                    flagCount={{ 
                      green: moments.filter(m => 
                        m.connectionId === connection.id && 
                        m.tags?.includes('Green Flag')
                      ).length,
                      red: moments.filter(m => 
                        m.connectionId === connection.id && 
                        m.tags?.includes('Red Flag')
                      ).length,
                      blue: moments.filter(m => 
                        m.connectionId === connection.id && 
                        m.tags?.includes('Blue Flag')
                      ).length
                    }}
                  />
                ))}

                {connections.length > 3 && (
                  <div className="text-center">
                    <Button variant="link" className="text-primary text-sm font-medium py-2" asChild>
                      <Link href="/connections">View All Connections</Link>
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

        {/* Recent Moments */}
        <section className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-heading font-semibold">Recent Moments</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm text-primary font-medium flex items-center"
              onClick={openMomentModal}
            >
              <i className="fa-solid fa-plus mr-1"></i> Log
            </Button>
          </div>
          
          <div className="space-y-4">
            {moments.length > 0 ? (
              <>
                {moments.slice(0, 2).map((moment) => {
                  const connection = connections.find(c => c.id === moment.connectionId);
                  if (!connection) return null;

                  return (
                    <MomentCard 
                      key={moment.id} 
                      moment={moment} 
                      connection={{
                        id: connection.id,
                        name: connection.name,
                        profileImage: connection.profileImage ? connection.profileImage : undefined
                      }}
                      onAddReflection={handleAddReflection}
                      // In a full implementation, we would determine if there's an AI reflection
                      hasAiReflection={moment.id % 2 === 0} 
                    />
                  );
                })}

                <div className="text-center">
                  <Button variant="link" className="text-primary text-sm font-medium py-2" asChild>
                    <Link href="/moments">View All Moments</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                <p>No moments logged yet</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={openMomentModal}
                >
                  Log Your First Moment
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Badge Showcase */}
        <section className="px-4 py-3">
          <h3 className="font-heading font-semibold mb-3">Your Badges</h3>
          
          <BadgeShowcase 
            badges={badges}
            earnedBadgeIds={userBadges.map(ub => ub.badgeId)}
          />
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
