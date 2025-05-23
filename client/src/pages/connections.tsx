import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { Connection, Moment } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { relationshipStages } from "@shared/schema";

export default function Connections() {
  const { user } = useAuth();
  const { openConnectionModal, setSelectedConnection } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string | null>(null);

  // Fetch connections
  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  // Fetch moments to calculate emoji data and flag counts
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !!user,
  });

  const handleSelectConnection = (connection: Connection) => {
    setSelectedConnection(connection.id);
    // In a full implementation, this would navigate to a connection details page
    // navigate(`/connections/${connection.id}`);
  };

  // Filter connections based on search term and filter stage
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = connection.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = filterStage ? connection.relationshipStage === filterStage : true;
    return matchesSearch && matchesStage;
  });

  // Get recent emojis for each connection
  const getConnectionEmojis = (connectionId: number) => {
    const connectionMoments = moments.filter(m => m.connectionId === connectionId);
    const recentEmojis = connectionMoments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map(m => m.emoji);
    
    return recentEmojis.length > 0 ? recentEmojis : ["😊", "❤️", "✨"];
  };

  // Calculate flag counts for each connection
  const getConnectionFlagCounts = (connectionId: number) => {
    const connectionMoments = moments.filter(m => m.connectionId === connectionId);
    
    return {
      green: connectionMoments.filter(m => m.tags?.includes('Green Flag')).length,
      red: connectionMoments.filter(m => m.tags?.includes('Red Flag')).length
    };
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Search and Filter Section */}
        <section className="px-4 pt-4 pb-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                type="text"
                placeholder="Search connections..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full"
              onClick={openConnectionModal}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            <Button
              variant={filterStage === null ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setFilterStage(null)}
            >
              All
            </Button>
            {relationshipStages.map((stage) => (
              <Button
                key={stage}
                variant={filterStage === stage ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs whitespace-nowrap"
                onClick={() => setFilterStage(stage === filterStage ? null : stage)}
              >
                {stage}
              </Button>
            ))}
          </div>
        </section>

        {/* Connections List */}
        <section className="px-4 py-3">
          {isLoading ? (
            <div className="text-center py-10">
              <p>Loading connections...</p>
            </div>
          ) : filteredConnections.length > 0 ? (
            <div className="space-y-3">
              {filteredConnections.map((connection) => (
                <ConnectionCard 
                  key={connection.id} 
                  connection={connection} 
                  onSelect={handleSelectConnection}
                  recentEmojis={getConnectionEmojis(connection.id)}
                  flagCount={getConnectionFlagCounts(connection.id)}
                />
              ))}
            </div>
          ) : connections.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 dark:text-neutral-400 mb-2">No connections found matching your filters</p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStage(null);
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold mb-1">No Connections Yet</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                Add your first connection to start tracking your relationships
              </p>
              <Button 
                onClick={openConnectionModal}
                className="bg-primary text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Connection
              </Button>
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}

// Import at the top of the file
import { Users } from "lucide-react";
