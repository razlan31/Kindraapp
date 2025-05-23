import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { MomentCard } from "@/components/dashboard/moment-card";
import { Moment, Connection } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function Moments() {
  const { user } = useAuth();
  const { openMomentModal } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);

  // Fetch moments
  const { data: moments = [], isLoading } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !!user,
  });

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  const handleAddReflection = (momentId: number) => {
    // This would open a reflection modal in a full implementation
    console.log("Add reflection for moment:", momentId);
  };

  // Group moments by date
  const groupMomentsByDate = (moments: Moment[]) => {
    const grouped: Record<string, Moment[]> = {};
    
    moments.forEach(moment => {
      const date = format(new Date(moment.createdAt), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(moment);
    });
    
    return grouped;
  };

  // Filter moments based on search and selected connection
  const filteredMoments = moments.filter(moment => {
    const connection = connections.find(c => c.id === moment.connectionId);
    if (!connection) return false;
    
    const matchesSearch = moment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           connection.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConnection = selectedConnection ? moment.connectionId === selectedConnection : true;
    
    return matchesSearch && matchesConnection;
  });

  const groupedMoments = groupMomentsByDate(filteredMoments);
  const sortedDates = Object.keys(groupedMoments).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

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
                placeholder="Search moments..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedConnection(null)}>
                  All Connections
                </DropdownMenuItem>
                {connections.map((connection) => (
                  <DropdownMenuItem 
                    key={connection.id}
                    onClick={() => setSelectedConnection(connection.id)}
                  >
                    {connection.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full"
              onClick={openMomentModal}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Moments List */}
        <section className="px-4 py-3">
          {isLoading ? (
            <div className="text-center py-10">
              <p>Loading moments...</p>
            </div>
          ) : filteredMoments.length > 0 ? (
            <div>
              {sortedDates.map(date => (
                <div key={date} className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="flex-grow h-px bg-neutral-200 dark:bg-neutral-800"></div>
                    <span className="px-3 text-sm text-neutral-500 dark:text-neutral-400 font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(date), 'MMMM d, yyyy')}
                    </span>
                    <div className="flex-grow h-px bg-neutral-200 dark:bg-neutral-800"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {groupedMoments[date].map(moment => {
                      const connection = connections.find(c => c.id === moment.connectionId);
                      if (!connection) return null;

                      return (
                        <MomentCard 
                          key={moment.id} 
                          moment={moment} 
                          connection={{
                            id: connection.id,
                            name: connection.name,
                            profileImage: connection.profileImage
                          }}
                          onAddReflection={handleAddReflection}
                          hasAiReflection={moment.id % 3 === 0} // Simulated AI reflection flag
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : moments.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 dark:text-neutral-400 mb-2">No moments found matching your filters</p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedConnection(null);
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold mb-1">No Moments Yet</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                Log your first moment to start tracking your emotional journey
              </p>
              <Button 
                onClick={openMomentModal}
                className="bg-primary text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Log Moment
              </Button>
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
