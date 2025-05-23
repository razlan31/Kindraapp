import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { Connection, Moment } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { relationshipStages } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users } from "lucide-react";

export default function ConnectionsNew() {
  const { user } = useAuth();
  const { setSelectedConnection } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
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
              variant="outline" 
              size="icon"
              className="rounded-full"
              onClick={() => setShowModal(true)}
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
                onClick={() => setShowModal(true)}
                className="bg-primary text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Connection
              </Button>
            </Card>
          )}
        </section>
      </main>

      {/* Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-heading font-semibold text-lg">Add New Connection</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name"
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name" 
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 flex flex-col items-center h-auto"
                  onClick={() => {
                    setProfileImage("https://randomuser.me/api/portraits/men/32.jpg");
                  }}
                >
                  <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <Camera className="h-6 w-6 text-neutral-400" />
                    )}
                  </div>
                  <span className="text-sm text-primary font-medium">Upload Photo</span>
                </Button>
                <p className="text-sm text-gray-500">Choose a profile photo for this connection</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stage">Relationship Stage</Label>
                <Select value={relationshipStage} onValueChange={setRelationshipStage}>
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.relationshipStage && <p className="text-sm text-red-500">{errors.relationshipStage}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Started talking/dating</Label>
                <Input 
                  id="startDate"
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              
              <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
                <h3 className="text-sm font-medium">Optional Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="zodiac" className="text-xs text-neutral-500">Zodiac Sign</Label>
                  <Select value={zodiacSign} onValueChange={setZodiacSign}>
                    <SelectTrigger id="zodiac">
                      <SelectValue placeholder="Select sign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {zodiacSigns.map((sign) => (
                        <SelectItem key={sign} value={sign}>
                          {sign}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="love" className="text-xs text-neutral-500">Love Language</Label>
                  <Select value={loveLanguage} onValueChange={setLoveLanguage}>
                    <SelectTrigger id="love">
                      <SelectValue placeholder="Select love language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {loveLanguages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <Checkbox
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(checked === true)}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="private">Keep this connection private</Label>
                  <p className="text-sm text-gray-500">
                    Private connections are only visible to you
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full bg-primary text-white" disabled={isPending}>
                  {isPending ? "Adding..." : "Add Connection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}