import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { Connection, Moment } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context-simple";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Camera, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { relationshipStages } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function Connections() {
  const { user } = useAuth();
  const { setSelectedConnection } = useModal();
  const { mainFocusConnection } = useRelationshipFocus();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickStage, setQuickStage] = useState("Talking Stage");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createConnectionMutation = useMutation({
    mutationFn: async (data: { name: string; relationshipStage: string }) => {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create connection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      setShowQuickAdd(false);
      setQuickName("");
      setQuickStage("Talking Stage");
      toast({
        title: "Success",
        description: "Connection created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create connection",
        variant: "destructive",
      });
    },
  });
  
  // Form state for connection modal
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [relationshipStage, setRelationshipStage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [loveLanguage, setLoveLanguage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setLocation(`/connections/${connection.id}`);
  };

  // Filter and sort connections - put main focus at the top
  const filteredConnections = connections
    .filter(connection => {
      const matchesSearch = connection.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = filterStage ? connection.relationshipStage === filterStage : true;
      return matchesSearch && matchesStage;
    })
    .sort((a, b) => {
      // Main focus connection always comes first
      if (mainFocusConnection?.id === a.id) return -1;
      if (mainFocusConnection?.id === b.id) return 1;
      // Then sort by creation date (newest first)
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
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

  // Create connection mutation
  const { mutate: createConnection, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/connections", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection added successfully",
        description: "Your new connection has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to add connection",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setName("");
    setProfileImage("");
    setRelationshipStage("");
    setStartDate("");
    setZodiacSign("");
    setLoveLanguage("");
    setIsPrivate(false);
    setErrors({});
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!relationshipStage) {
      newErrors.relationshipStage = "Please select a relationship stage";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;
    
    const data = {
      name,
      profileImage: profileImage || null,
      relationshipStage,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      zodiacSign: zodiacSign || null,
      loveLanguage: loveLanguage || null,
      isPrivate,
    };
    
    createConnection(data);
  };
  
  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  
  const loveLanguages = [
    "Words of Affirmation", "Quality Time", "Physical Touch",
    "Acts of Service", "Receiving Gifts"
  ];
  
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
              variant="default" 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setLocation("/connections/basic")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </div>

          {/* Quick Add Form */}
          {showQuickAdd && (
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold mb-3">Create New Connection</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="quickName">Name</Label>
                  <Input
                    id="quickName"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Enter person's name"
                  />
                </div>
                <div>
                  <Label htmlFor="quickStage">Relationship Stage</Label>
                  <Select value={quickStage} onValueChange={setQuickStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Talking Stage">Talking Stage</SelectItem>
                      <SelectItem value="Dating">Dating</SelectItem>
                      <SelectItem value="In a Relationship">In a Relationship</SelectItem>
                      <SelectItem value="It's Complicated">It's Complicated</SelectItem>
                      <SelectItem value="Friends">Friends</SelectItem>
                      <SelectItem value="Ex">Ex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      if (quickName.trim()) {
                        createConnectionMutation.mutate({
                          name: quickName.trim(),
                          relationshipStage: quickStage
                        });
                      }
                    }}
                    disabled={!quickName.trim() || createConnectionMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createConnectionMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowQuickAdd(false);
                      setQuickName("");
                      setQuickStage("Talking Stage");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

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
                <div key={connection.id} className="relative">
                  <ConnectionCard 
                    connection={connection} 
                    onSelect={handleSelectConnection}
                    recentEmojis={getConnectionEmojis(connection.id)}
                    flagCount={getConnectionFlagCounts(connection.id)}
                  />
                  {mainFocusConnection?.id === connection.id && (
                    <div className="absolute top-3 right-3 bg-red-500 rounded-full p-2 shadow-lg border-2 border-white z-10">
                      <Heart className="h-4 w-4 text-white fill-white" />
                    </div>
                  )}
                  {/* Debug indicator */}
                  {console.log('Connection List Debug:', {
                    connectionId: connection.id,
                    mainFocusId: mainFocusConnection?.id,
                    isMatch: mainFocusConnection?.id === connection.id,
                    mainFocusConnection
                  })}
                </div>
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
              <p className="text-neutral-400 text-sm">
                Use the "Add Connection" button at the top to get started
              </p>
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
