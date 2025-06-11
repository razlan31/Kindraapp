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

// Add Connection Modal Component with Custom Relationship Stages
interface AddConnectionModalProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

function AddConnectionModal({ onClose, onSubmit, isLoading }: AddConnectionModalProps) {
  const [relationshipStage, setRelationshipStage] = useState("Potential");
  const [isCustomStage, setIsCustomStage] = useState(false);
  const [customStageValue, setCustomStageValue] = useState("");

  // Debug log to check if relationshipStages is properly imported
  console.log("AddConnectionModal rendered - relationshipStages array:", relationshipStages);
  console.log("Total options including Custom:", relationshipStages.length + 1);
  console.log("Custom option array:", [...relationshipStages, "Custom"]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Add the relationship stage to form data (use custom value if it's a custom stage)
    const finalStage = isCustomStage ? customStageValue : relationshipStage;
    formData.set('relationshipStage', finalStage);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add New Connection - INLINE MODAL</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Profile Image</label>
            <input 
              name="profileImage" 
              type="file" 
              accept="image/*" 
              className="w-full p-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
            <p className="text-xs text-gray-500 mt-1">Choose a photo from your device</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <Input name="name" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Relationship Stage</label>
            <select 
              value={isCustomStage ? "Custom" : relationshipStage}
              onChange={(e) => {
                console.log("Dropdown changed to:", e.target.value);
                if (e.target.value === "Custom") {
                  setIsCustomStage(true);
                  setRelationshipStage("");
                } else {
                  setIsCustomStage(false);
                  setRelationshipStage(e.target.value);
                }
              }}
              className="w-full p-3 border-2 border-blue-500 rounded bg-white text-black"
            >
              <option value="Potential">Potential</option>
              <option value="Talking">Talking</option>
              <option value="Situationship">Situationship</option>
              <option value="It's Complicated">It's Complicated</option>
              <option value="Dating">Dating</option>
              <option value="Spouse">Spouse</option>
              <option value="FWB">FWB</option>
              <option value="Ex">Ex</option>
              <option value="Friend">Friend</option>
              <option value="Best Friend">Best Friend</option>
              <option value="Siblings">Siblings</option>
              <option value="Custom" style={{ fontWeight: 'bold', backgroundColor: '#ffeb3b', color: '#000' }}>
                🎯 Custom
              </option>
            </select>
            
            {isCustomStage && (
              <div className="mt-2">
                <Input
                  value={customStageValue}
                  onChange={(e) => setCustomStageValue(e.target.value)}
                  placeholder="Enter custom relationship stage (e.g., Mom, Dad, Sister, Colleague)"
                  className="w-full"
                />
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Examples: Mom, Dad, Sister, Colleague, Mentor, etc.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input name="startDate" type="date" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Birthday</label>
            <Input name="birthday" type="date" />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Adding..." : "Add Connection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Connections() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'default' | 'activity' | 'stages' | 'timeline'>('default');
  const { openMomentModal, openConnectionModal } = useModal();
  const { mainFocusConnection, setMainFocusConnection } = useRelationshipFocus();
  const { toast } = useToast();

  // Fetch connections and moments
  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    staleTime: 0, // Force fresh data
    refetchOnMount: true,
  });

  const { data: moments = [] } = useQuery<any[]>({
    queryKey: ['/api/moments'],
  });

  // Debug connections data
  console.log('Raw connections data:', {
    connectionsCount: connections.length,
    isLoading,
    connections: connections.map(c => ({ id: c.id, name: c.name, stage: c.relationshipStage }))
  });
  
  // Additional debug for sorting
  if (connections.length > 0) {
    console.log('Connections before sorting:', connections.map(c => ({ 
      id: c.id, 
      name: c.name, 
      stage: c.relationshipStage,
      isSelf: c.relationshipStage === 'Self'
    })));
  }

  // Smart prioritization algorithm
  const prioritizeConnections = (connections: Connection[]) => {
    return connections
      .filter(connection => connection.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(connection => {
        const connectionMoments = moments.filter((m: any) => m.connectionId === connection.id);
        const lastActivity = connectionMoments.length > 0 
          ? new Date(Math.max(...connectionMoments.map((m: any) => new Date(m.createdAt).getTime())))
          : new Date(connection.createdAt || Date.now());
        
        const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        const activityCount = connectionMoments.length;
        
        // Priority score: recent activity + relationship importance + total activity
        const stageWeights = { 'Self': 10, 'Married': 5, 'Dating': 4, 'Best Friend': 4, 'Talking': 3, 'Ex': 1 };
        const stageWeight = stageWeights[connection.relationshipStage as keyof typeof stageWeights] || 2;
        
        const priority = (stageWeight * 10) + (activityCount * 2) - Math.min(daysSinceActivity, 30);
        
        return { ...connection, priority, daysSinceActivity, activityCount };
      })
      .sort((a, b) => {
        // Force Self connections to always be first
        if (a.relationshipStage === 'Self') return -1;
        if (b.relationshipStage === 'Self') return 1;
        // Then sort by priority
        return b.priority - a.priority;
      });
  };

  const prioritizedConnections = prioritizeConnections(connections);
  
  // Debug logging
  console.log('Connections sorting debug:', {
    originalCount: connections.length,
    prioritizedCount: prioritizedConnections.length,
    prioritizedConnections: prioritizedConnections.map(c => ({ 
      id: c.id, 
      name: c.name, 
      stage: c.relationshipStage, 
      priority: (c as any).priority 
    }))
  });

  // Filter connections based on search and stage filter
  const filteredConnections = prioritizedConnections
    .filter(connection => {
      const matchesSearch = connection.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = filterStage === null || connection.relationshipStage === filterStage;
      return matchesSearch && matchesStage;
    })
    .sort((a, b) => {
      // User profile (Self) always at top
      if (a.relationshipStage === 'Self') return -1;
      if (b.relationshipStage === 'Self') return 1;
      
      // Focus connection second
      if (mainFocusConnection) {
        if (a.id === mainFocusConnection.id) return -1;
        if (b.id === mainFocusConnection.id) return 1;
      }
      
      // Keep existing priority order for others
      return 0;
    });

  // Handle connection selection for navigation
  const handleSelectConnection = (connection: Connection) => {
    window.location.href = `/connections/${connection.id}`;
  };

  // Get recent emojis for a connection
  const getConnectionEmojis = (connectionId: number) => {
    const connectionMoments = moments
      .filter((m: any) => m.connectionId === connectionId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    const recentEmojis = connectionMoments.map((m: any) => m.emoji);
    return recentEmojis.length > 0 ? recentEmojis : ["😊", "❤️", "✨"];
  };

  // Calculate flag counts for each connection
  const getConnectionFlagCounts = (connectionId: number) => {
    const connectionMoments = moments.filter((m: any) => m.connectionId === connectionId);
    
    return {
      green: connectionMoments.filter((m: any) => m.tags?.includes('Green Flag')).length,
      red: connectionMoments.filter((m: any) => m.tags?.includes('Red Flag')).length
    };
  };

  // Get connection activity data
  const getConnectionActivity = (connectionId: number) => {
    const connectionMoments = moments.filter((m: any) => m.connectionId === connectionId);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentMoments = connectionMoments.filter((m: any) => {
      const createdAt = m.createdAt ? new Date(m.createdAt) : null;
      return createdAt && createdAt > weekAgo;
    });
    
    return {
      total: connectionMoments.length,
      thisWeek: recentMoments.length,
      lastActivity: connectionMoments.length > 0 ? 
        Math.max(...connectionMoments.map((m: any) => {
          const createdAt = m.createdAt ? new Date(m.createdAt) : null;
          return createdAt ? createdAt.getTime() : 0;
        })) : 0
    };
  };

  // Organize connections by different perspectives
  const getConnectionsByPerspective = () => {
    const baseConnections = filteredConnections;
    
    switch (viewMode) {
      case 'activity':
        return baseConnections.sort((a, b) => {
          // User profile always first
          if (a.relationshipStage === 'Self') return -1;
          if (b.relationshipStage === 'Self') return 1;
          
          // Focus connection second
          if (mainFocusConnection) {
            if (a.id === mainFocusConnection.id) return -1;
            if (b.id === mainFocusConnection.id) return 1;
          }
          
          // Then by activity
          const aActivity = getConnectionActivity(a.id);
          const bActivity = getConnectionActivity(b.id);
          return bActivity.thisWeek - aActivity.thisWeek || bActivity.total - aActivity.total;
        });
      
      case 'stages':
        return relationshipStages.reduce((acc, stage) => {
          const stageConnections = baseConnections.filter(c => c.relationshipStage === stage);
          if (stageConnections.length > 0) {
            // Sort within each stage to put user profile first and focus connection second
            const sorted = stageConnections.sort((a, b) => {
              if (a.relationshipStage === 'Self') return -1;
              if (b.relationshipStage === 'Self') return 1;
              if (mainFocusConnection) {
                if (a.id === mainFocusConnection.id) return -1;
                if (b.id === mainFocusConnection.id) return 1;
              }
              return 0;
            });
            acc[stage] = sorted;
          }
          return acc;
        }, {} as Record<string, typeof baseConnections>);
      
      case 'timeline':
        return baseConnections.sort((a, b) => {
          // User profile always first
          if (a.relationshipStage === 'Self') return -1;
          if (b.relationshipStage === 'Self') return 1;
          
          // Focus connection second
          if (mainFocusConnection) {
            if (a.id === mainFocusConnection.id) return -1;
            if (b.id === mainFocusConnection.id) return 1;
          }
          
          // Then by timeline
          const aActivity = getConnectionActivity(a.id);
          const bActivity = getConnectionActivity(b.id);
          return bActivity.lastActivity - aActivity.lastActivity;
        });
      
      default:
        return baseConnections.sort((a, b) => {
          // User profile always first
          if (a.relationshipStage === 'Self') return -1;
          if (b.relationshipStage === 'Self') return 1;
          
          // Focus connection second
          if (mainFocusConnection) {
            if (a.id === mainFocusConnection.id) return -1;
            if (b.id === mainFocusConnection.id) return 1;
          }
          
          // Then alphabetically by name
          return a.name.localeCompare(b.name);
        });
    }
  };

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
              All Stages
            </Button>
            {relationshipStages.map((stage) => (
              <Button
                key={stage}
                variant={filterStage === stage ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStage(filterStage === stage ? null : stage)}
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
          ) : (() => {
            const connectionsData = getConnectionsByPerspective();
            
            if (viewMode === 'stages' && typeof connectionsData === 'object' && !Array.isArray(connectionsData)) {
              // Render grouped by relationship stages
              return Object.keys(connectionsData).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(connectionsData).map(([stage, stageConnections]) => (
                    <div key={stage}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">{stage}</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {stageConnections.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {stageConnections.map((connection) => (
                          <ConnectionCard 
                            key={connection.id}
                            connection={connection} 
                            onSelect={handleSelectConnection}
                            recentEmojis={getConnectionEmojis(connection.id)}
                            flagCount={getConnectionFlagCounts(connection.id)}
                            mainFocusConnection={mainFocusConnection}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 dark:text-neutral-400">No connections found</p>
                </div>
              );
            } else {
              // Render as regular list with activity indicators
              const connectionsList = Array.isArray(connectionsData) ? connectionsData : [];
              return connectionsList.length > 0 ? (
                <div className="space-y-3">
                  {connectionsList.map((connection) => {
                    const activity = getConnectionActivity(connection.id);
                    return (
                      <div key={connection.id} className="relative">
                        <ConnectionCard 
                          connection={connection} 
                          onSelect={handleSelectConnection}
                          recentEmojis={getConnectionEmojis(connection.id)}
                          flagCount={getConnectionFlagCounts(connection.id)}
                          mainFocusConnection={mainFocusConnection}
                        />
                        {(viewMode === 'activity' || viewMode === 'timeline') && (
                          <div className="absolute bottom-3 left-3 flex gap-1">
                            {activity.thisWeek > 0 && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {activity.thisWeek} this week
                              </span>
                            )}
                            {viewMode === 'timeline' && activity.lastActivity > 0 && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {Math.floor((Date.now() - activity.lastActivity) / (1000 * 60 * 60 * 24))}d ago
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 dark:text-neutral-400">No connections found</p>
                </div>
              );
            }
          })()}
          
          {!isLoading && filteredConnections.length === 0 && connections.length > 0 && (
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
          )}
          
          {!isLoading && connections.length === 0 && (
            <Card className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Users className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                Start building your relationship network by adding your first connection.
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Connection
              </Button>
            </Card>
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

