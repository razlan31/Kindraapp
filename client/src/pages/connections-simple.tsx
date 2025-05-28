import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Connection, relationshipStages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Camera, Heart, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Connections() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const { openMomentModal, openConnectionModal } = useModal();
  const { mainFocusConnection, setMainFocusConnection } = useRelationshipFocus();
  const { toast } = useToast();

  // Fetch connections and moments
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });

  const { data: moments = [] } = useQuery<any[]>({
    queryKey: ['/api/moments'],
  });

  // Smart prioritization algorithm
  const prioritizeConnections = (connections: Connection[]) => {
    return connections
      .filter(connection => connection.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(connection => {
        const connectionMoments = moments.filter((m: any) => m.connectionId === connection.id);
        const lastActivity = connectionMoments.length > 0 
          ? new Date(Math.max(...connectionMoments.map((m: any) => new Date(m.createdAt).getTime())))
          : new Date(connection.createdAt);
        
        const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        const activityCount = connectionMoments.length;
        
        // Priority score: recent activity + relationship importance + total activity
        const stageWeights = { 'Married': 5, 'Dating': 4, 'Best Friend': 4, 'Talking': 3, 'Ex': 1 };
        const stageWeight = stageWeights[connection.relationshipStage as keyof typeof stageWeights] || 2;
        
        const priority = (stageWeight * 10) + (activityCount * 2) - Math.min(daysSinceActivity, 30);
        
        return { ...connection, priority, daysSinceActivity, activityCount };
      })
      .sort((a, b) => b.priority - a.priority);
  };

  const prioritizedConnections = prioritizeConnections(connections);

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
    
    return connectionMoments.map((m: any) => m.emoji).join(' ');
  };

  // Get flag counts for a connection
  const getFlagCounts = (connectionId: number) => {
    const connectionMoments = moments.filter((m: any) => m.connectionId === connectionId);
    const greenFlags = connectionMoments.filter((m: any) => 
      m.tags && m.tags.some((tag: string) => tag.toLowerCase().includes('green'))
    ).length;
    const redFlags = connectionMoments.filter((m: any) => 
      m.tags && m.tags.some((tag: string) => tag.toLowerCase().includes('red'))
    ).length;
    
    return { greenFlags, redFlags };
  };

  // Create connection mutation
  const { mutate: createConnection, isPending } = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/connections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      setShowAddModal(false);
      toast({
        title: "Connection created",
        description: "New connection has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create connection.",
        variant: "destructive",
      });
    },
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

        {/* Search Section */}
        <section className="px-4 pt-2 pb-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowAddModal(true)} size="sm" className="shrink-0">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </section>

        {/* Connections List */}
        <section className="px-4 pb-4">
          <div className="space-y-3">
            {prioritizedConnections.map((connection: any) => {
              const emojis = getConnectionEmojis(connection.id);
              const { greenFlags, redFlags } = getFlagCounts(connection.id);
              const isMainFocus = mainFocusConnection?.id === connection.id;

              return (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  emojis={emojis}
                  greenFlags={greenFlags}
                  redFlags={redFlags}
                  isMainFocus={isMainFocus}
                  onSelect={handleSelectConnection}
                  onToggleFocus={() => {
                    if (isMainFocus) {
                      setMainFocusConnection(null);
                    } else {
                      setMainFocusConnection(connection);
                    }
                  }}
                  daysSinceActivity={connection.daysSinceActivity}
                  activityCount={connection.activityCount}
                />
              );
            })}

            {prioritizedConnections.length === 0 && searchTerm && (
              <div className="text-center py-8 text-neutral-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No connections found matching "{searchTerm}"</p>
              </div>
            )}

            {connections.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No connections yet</p>
                <Button onClick={() => setShowAddModal(true)} className="mt-2">
                  Add your first connection
                </Button>
              </div>
            )}
          </div>
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
  connection: any;
  emojis: string;
  greenFlags: number;
  redFlags: number;
  isMainFocus: boolean;
  onSelect: (connection: Connection) => void;
  onToggleFocus: () => void;
  daysSinceActivity: number;
  activityCount: number;
}

function ConnectionCard({ 
  connection, 
  emojis, 
  greenFlags, 
  redFlags, 
  isMainFocus, 
  onSelect, 
  onToggleFocus,
  daysSinceActivity,
  activityCount 
}: ConnectionCardProps) {
  return (
    <Card 
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isMainFocus ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={() => onSelect(connection)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Profile Image or Initial */}
          <div className="relative">
            {connection.profileImage ? (
              <img 
                src={connection.profileImage} 
                alt={connection.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {connection.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isMainFocus && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Heart className="h-3 w-3 text-white fill-current" />
              </div>
            )}
          </div>

          {/* Connection Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">{connection.name}</h3>
              <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                {connection.relationshipStage}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {emojis && <span>{emojis}</span>}
                {greenFlags > 0 && <span className="text-green-600">🟢{greenFlags}</span>}
                {redFlags > 0 && <span className="text-red-600">🔴{redFlags}</span>}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {daysSinceActivity === 0 ? 'Today' : 
                 daysSinceActivity === 1 ? '1 day ago' : 
                 daysSinceActivity < 7 ? `${daysSinceActivity} days ago` : 
                 daysSinceActivity < 30 ? `${Math.floor(daysSinceActivity / 7)} weeks ago` : 
                 '30+ days ago'}
              </div>
            </div>
          </div>
        </div>

        {/* Focus Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus();
          }}
          className="ml-2"
        >
          <Heart className={`h-4 w-4 ${isMainFocus ? 'fill-current text-primary' : ''}`} />
        </Button>
      </div>
    </Card>
  );
}

// Add Connection Modal Component
interface AddConnectionModalProps {
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}

function AddConnectionModal({ onClose, onSubmit, isLoading }: AddConnectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add Connection</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <Input name="name" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Relationship Stage</label>
            <select name="relationshipStage" className="w-full p-2 border rounded-md">
              {relationshipStages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input name="startDate" type="date" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Birthday</label>
            <Input name="birthday" type="date" />
          </div>
          
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Connection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}