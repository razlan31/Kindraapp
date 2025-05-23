import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { Connection, Moment, relationshipStages } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Input } from "@/components/ui/input";
import { Search, Plus, UserPlus } from "lucide-react";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context-simple";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ConnectionsNew() {
  const { user } = useAuth();
  const { setSelectedConnection } = useModal();
  const { setMainFocusConnection } = useRelationshipFocus();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStage, setNewStage] = useState("Talking Stage");
  const [newStartDate, setNewStartDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Filter connections based on search term and stage filter
  const filteredConnections = connections.filter((connection) => {
    const matchesSearch = connection.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = !filterStage || connection.relationshipStage === filterStage;
    return matchesSearch && matchesStage;
  });

  // Calculate flag counts for each connection
  const getConnectionFlags = (connectionId: number) => {
    const connectionMoments = moments.filter(m => m.connectionId === connectionId);
    
    const flagCounts = {
      green: 0,
      red: 0,
      blue: 0
    };
    
    connectionMoments.forEach(moment => {
      if (moment.tags) {
        const tags = Array.isArray(moment.tags) ? moment.tags : [];
        if (tags.includes('Green Flag')) flagCounts.green++;
        if (tags.includes('Red Flag')) flagCounts.red++;
        if (tags.includes('Mixed Signals')) flagCounts.blue++;
      }
    });
    
    return flagCounts;
  };

  const handleSelectConnection = (connection: Connection) => {
    setSelectedConnection(connection.id, connection);
    setMainFocusConnection(connection);
    setLocation(`/connections/${connection.id}`);
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-xl mx-auto">
        <Header title="Connections" subtitle="Track the people in your life" />
        
        {/* Quick Add Form */}
        {showQuickAdd ? (
          <div className="px-4 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Quick Add Connection</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="quick-name">Name</Label>
                <Input 
                  id="quick-name" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="quick-stage">Relationship Stage</Label>
                <Select value={newStage} onValueChange={setNewStage}>
                  <SelectTrigger id="quick-stage">
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
              </div>
              <div>
                <Label htmlFor="quick-start-date" className="text-sm font-medium">When did you start talking/dating?</Label>
                <Input
                  id="quick-start-date"
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  placeholder="Select the date you started connecting"
                  className="w-full"
                />
                <p className="text-xs text-neutral-500 mt-1">Track when this connection began</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="default" 
                  className="flex-1"
                  disabled={isCreating || !newName.trim()}
                  onClick={async () => {
                    if (!newName.trim()) return;
                    
                    console.log("Creating connection with data:", { name: newName.trim(), relationshipStage: newStage });
                    setIsCreating(true);
                    try {
                      const response = await fetch("/api/connections", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: newName.trim(),
                          relationshipStage: newStage,
                          startDate: newStartDate || null
                        }),
                        credentials: "include"
                      });
                      
                      console.log("Response status:", response.status);
                      console.log("Response headers:", response.headers);
                      
                      if (response.ok) {
                        const result = await response.json();
                        console.log("Connection created successfully:", result);
                        toast({
                          title: "Success!",
                          description: "Connection created successfully"
                        });
                        setNewName("");
                        setNewStartDate("");
                        setShowQuickAdd(false);
                        // Refresh connections
                        queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
                      } else {
                        const errorText = await response.text();
                        console.error("Failed to create connection:", response.status, errorText);
                        toast({
                          title: "Error",
                          description: "Failed to create connection",
                          variant: "destructive"
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Something went wrong",
                        variant: "destructive"
                      });
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowQuickAdd(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 mb-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600"
              onClick={() => setShowQuickAdd(true)}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-base">Quick Add Connection</span>
            </Button>
            <Button 
              variant="default" 
              className="w-full py-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={() => setLocation("/connections/basic")}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-base">Add New Connection (Full Form)</span>
            </Button>
          </div>
        )}
        
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search connections..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            <Button
              variant={filterStage === null ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap text-xs"
              onClick={() => setFilterStage(null)}
            >
              All
            </Button>
            <Button
              variant={filterStage === "Talking Stage" ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap text-xs"
              onClick={() => setFilterStage("Talking Stage")}
            >
              Talking Stage
            </Button>
            <Button
              variant={filterStage === "Friends with Benefits" ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap text-xs"
              onClick={() => setFilterStage("Friends with Benefits")}
            >
              FWB
            </Button>
            <Button
              variant={filterStage === "Exclusive" ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap text-xs"
              onClick={() => setFilterStage("Exclusive")}
            >
              Exclusive
            </Button>
            <Button
              variant={filterStage === "Just Friends" ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap text-xs"
              onClick={() => setFilterStage("Just Friends")}
            >
              Friends
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center mt-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
              <h3 className="font-medium text-lg mb-1">No connections yet</h3>
              <p className="text-neutral-500 mb-4">
                {searchTerm ? "No matches found. Try a different search." : "Add your first connection to get started."}
              </p>
              <Link href="/connections/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mt-4">
              {filteredConnections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onSelect={() => handleSelectConnection(connection)}
                  flagCount={getConnectionFlags(connection.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}