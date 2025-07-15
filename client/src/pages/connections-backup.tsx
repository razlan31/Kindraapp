import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Connection, relationshipStages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Camera, Heart, Users, Activity, BarChart3, Clock, Calendar, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AddConnectionModal } from "@/components/modals/add-connection-modal";
import { useAuth } from "@/contexts/auth-context";

export default function Connections() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { setSelectedConnection } = useModal();
  const { mainFocusConnection, setMainFocusConnection } = useRelationshipFocus();
  const { toast } = useToast();

  // Fetch connections
  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: isAuthenticated && !!user,
  });

  // Fetch moments to calculate emoji data and flag counts
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: isAuthenticated && !!user,
  });

  // Create connection mutation
  const { mutate: createConnection, isPending } = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/connections', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      setShowAddModal(false);
      toast({
        title: "Success",
        description: "Connection added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add connection. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddConnection = (formData: FormData) => {
    const data = {
      name: formData.get('name') as string,
      relationshipStage: formData.get('relationshipStage') as string,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : null,
      birthday: formData.get('birthday') ? new Date(formData.get('birthday') as string) : null,
      zodiacSign: formData.get('zodiacSign') as string || null,
      loveLanguage: formData.get('loveLanguage') as string || null,
    };

    createConnection(data);
  };

  // Filter connections based on search and stage filter
  const filteredConnections = connections
    .filter(connection => {
      const matchesSearch = connection.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = filterStage === null || connection.relationshipStage === filterStage;
      return matchesSearch && matchesStage;
    });

  // Handle connection selection for navigation
  const handleSelectConnection = (connection: Connection) => {
    window.location.href = `/connections/${connection.id}`;
  };

  // Get recent emojis for a connection
  const getConnectionEmojis = (connectionId: number) => {
    return moments
      .filter(m => m.connectionId === connectionId)
      .slice(0, 3)
      .map(m => m.emoji)
      .filter(Boolean);
  };

  // Get flag counts for a connection
  const getFlagCount = (connectionId: number) => {
    const connectionMoments = moments.filter(m => m.connectionId === connectionId);
    return {
      green: connectionMoments.filter(m => m.category === 'green_flag').length,
      red: connectionMoments.filter(m => m.category === 'red_flag').length,
    };
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <section className="px-4 pt-4 pb-2 border-b border-border/40 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Connections</h1>
              <p className="text-sm text-muted-foreground">
                {connections.length} people in your network
              </p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="px-4 pt-2 pb-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Relationship Stage Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStage === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStage(null)}
            >
              All
            </Button>
            {relationshipStages.map(stage => (
              <Button
                key={stage}
                variant={filterStage === stage ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStage(stage)}
              >
                {stage}
              </Button>
            ))}
          </div>
        </section>

        {/* Connections List */}
        <section className="px-4 pt-2 space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading connections...</p>
            </div>
          ) : filteredConnections.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No connections found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filterStage ? "Try adjusting your search or filters" : "Start building your network"}
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </Card>
          ) : (
            filteredConnections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                onSelect={handleSelectConnection}
                recentEmojis={getConnectionEmojis(connection.id)}
                flagCount={getFlagCount(connection.id)}
                mainFocusConnection={mainFocusConnection}
              />
            ))
          )}
        </section>
      </main>

      {/* Add Connection Modal */}
      {showAddModal && (
        <AddConnectionModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddConnection}
          isLoading={isPending}
        />
      )}

      <BottomNavigation />
    </div>
  );
}

// Connection Card Component
interface ConnectionCardProps {
  connection: Connection;
  onSelect: (connection: Connection) => void;
  recentEmojis: string[];
  flagCount: { green: number; red: number };
  mainFocusConnection: Connection | null;
}

function ConnectionCard({ connection, onSelect, recentEmojis, flagCount, mainFocusConnection }: ConnectionCardProps) {
  return (
    <div className="relative">
      <Card 
        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onSelect(connection)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-semibold">
              {connection.profileImage ? (
                <img 
                  src={connection.profileImage} 
                  alt={connection.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                connection.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{connection.name}</h3>
              <p className="text-sm text-muted-foreground">{connection.relationshipStage}</p>
              <div className="flex space-x-1 mt-1">
                {recentEmojis.map((emoji, index) => (
                  <span key={index} className="text-lg">{emoji}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {flagCount.green > 0 && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {flagCount.green} 🟢
              </span>
            )}
            {flagCount.red > 0 && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {flagCount.red} 🔴
              </span>
            )}
          </div>
        </div>
      </Card>
      {mainFocusConnection?.id === connection.id && (
        <div className="absolute top-3 right-3 bg-red-500 rounded-full p-2 shadow-lg border-2 border-white z-10">
          <Heart className="h-4 w-4 text-white fill-white" />
        </div>
      )}
    </div>
  );
}