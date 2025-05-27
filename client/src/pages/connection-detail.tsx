import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Connection } from "@shared/schema";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Calendar, Star, MessageCircle, Edit, Trash2, Plus, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/contexts/modal-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";

export default function ConnectionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { openMomentModal, setSelectedConnection } = useModal();
  const { mainFocusConnection, setMainFocusConnection } = useRelationshipFocus();
  const queryClient = useQueryClient();
  const connectionId = parseInt(id as string);
  
  const isMainFocus = mainFocusConnection?.id === connectionId;
  
  console.log('Focus Debug - Connection Detail:', {
    connectionId,
    mainFocusConnection,
    isMainFocus,
    mainFocusId: mainFocusConnection?.id
  });
  
  // Fetch connection details
  const { data: connection, isLoading, error } = useQuery({
    queryKey: ['/api/connections', connectionId],
    queryFn: async () => {
      const response = await fetch(`/api/connections/${connectionId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch connection details');
      }
      
      return response.json() as Promise<Connection>;
    },
    enabled: !isNaN(connectionId),
  });
  
  // Fetch moments for this connection
  const { data: moments } = useQuery({
    queryKey: ['/api/moments', { connectionId }],
    queryFn: async () => {
      const response = await fetch(`/api/moments?connectionId=${connectionId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch moments');
      }
      
      return response.json();
    },
    enabled: !isNaN(connectionId),
  });
  
  // Calculate flag counts
  const flagCounts = {
    green: 0,
    red: 0,
    blue: 0
  };
  
  if (moments) {
    moments.forEach((moment: any) => {
      if (moment.tags) {
        const tags = Array.isArray(moment.tags) ? moment.tags : [];
        if (tags.includes('Green Flag')) flagCounts.green++;
        if (tags.includes('Red Flag')) flagCounts.red++;
        if (tags.includes('Mixed Signals')) flagCounts.blue++;
      }
    });
  }
  
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent double-clicking
    
    if (window.confirm('Are you sure you want to delete this connection?')) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/connections/${connectionId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok || response.status === 404) {
          // Both 200 (success) and 404 (already deleted) are fine
          // Invalidate the connections cache to refresh the list
          queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
          
          toast({
            title: 'Connection deleted',
            description: 'The connection has been removed'
          });
          
          setLocation('/connections');
        } else {
          throw new Error('Failed to delete connection');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete connection',
          variant: 'destructive'
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSetAsFocus = () => {
    if (connection) {
      console.log('Setting as focus:', connection);
      setMainFocusConnection(connection);
      
      toast({
        title: 'Focus updated',
        description: 'This connection is now your main focus'
      });
    }
  };
  
  const handleEdit = () => {
    // Navigate to the edit page
    setLocation(`/connections/${connectionId}/edit`);
  };
  

  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const getFormattedDate = (date: Date | null) => {
    if (!date) return "Not specified";
    return format(new Date(date), 'MMMM d, yyyy');
  };
  
  const getDurationText = (startDate: Date | null) => {
    if (!startDate) return "Not specified";
    
    const start = new Date(startDate);
    const now = new Date();
    
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    
    // Adjust for negative days
    if (days < 0) {
      months--;
      const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += daysInPrevMonth;
    }
    
    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    
    if (parts.length === 0) return "Today";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts.join(" and ");
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading connection details...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  if (error || !connection) {
    return (
      <div className="min-h-screen pb-16 p-4">
        <div className="max-w-md mx-auto text-center mt-12">
          <h2 className="text-xl font-semibold mb-2">Connection not found</h2>
          <p className="text-neutral-500 mb-4">The connection you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => setLocation('/connections')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Connections
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b px-4 py-3 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/connections')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Connection Details</h1>
        </div>
        
        {/* Profile section */}
        <div className="bg-white dark:bg-neutral-900 p-6 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 rounded-full">
              <AvatarImage 
                src={connection.profileImage || undefined} 
                alt={connection.name} 
                className="h-full w-full object-cover"
              />
              <AvatarFallback className="text-lg bg-neutral-200 dark:bg-neutral-700">
                {getInitials(connection.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{connection.name}</h2>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="px-2 py-1 text-xs">
                  {connection.relationshipStage}
                </Badge>
                {connection.isPrivate && (
                  <Badge variant="outline" className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800">
                    Private
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex mt-6 gap-2">
            <Button 
              variant={isMainFocus ? "secondary" : "default"}
              className={`flex-1 ${isMainFocus ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary text-white'}`}
              onClick={handleSetAsFocus}
              disabled={isMainFocus}
            >
              <Heart className={`mr-2 h-4 w-4 ${isMainFocus ? 'fill-white' : ''}`} />
              {isMainFocus ? 'Main Focus' : 'Set as Focus'}
            </Button>
            
            <Button 
              variant="outline"
              size="icon"
              onClick={handleEdit}
              className="h-10 w-10"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDelete}
              className="h-10 w-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Details section */}
        <div className="bg-white dark:bg-neutral-900 mt-2 p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Relationship Details</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="text-neutral-500">Connection Started</div>
              <div>{getFormattedDate(connection.startDate)}</div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-neutral-500">Relationship Duration</div>
              <div>{getDurationText(connection.startDate)}</div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-neutral-500">Birthday</div>
              <div>{getFormattedDate(connection.birthday)}</div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-neutral-500">Zodiac Sign</div>
              <div>{connection.zodiacSign || "Not specified"}</div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-neutral-500">Love Language</div>
              <div>{connection.loveLanguage || "Not specified"}</div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Relationship Insights</h4>
              <div className="flex gap-3">
                {flagCounts.green > 0 && (
                  <div className="text-center flex-1">
                    <div className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 text-lg font-semibold rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-1">
                      {flagCounts.green}
                    </div>
                    <div className="text-xs">Green Flags</div>
                  </div>
                )}
                
                {flagCounts.red > 0 && (
                  <div className="text-center flex-1">
                    <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-lg font-semibold rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-1">
                      {flagCounts.red}
                    </div>
                    <div className="text-xs">Red Flags</div>
                  </div>
                )}
                
                {flagCounts.blue > 0 && (
                  <div className="text-center flex-1">
                    <div className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-lg font-semibold rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-1">
                      {flagCounts.blue}
                    </div>
                    <div className="text-xs">Mixed Signals</div>
                  </div>
                )}
                
                {flagCounts.green === 0 && flagCounts.red === 0 && flagCounts.blue === 0 && (
                  <div className="text-neutral-500 text-sm py-3 text-center w-full">
                    No insights available yet. Start tracking moments to build insights.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 p-4 space-y-3">
          <Button 
            className="w-full h-12"
            onClick={() => {
              console.log("Setting connection before modal:", connection);
              setSelectedConnection(connectionId, connection);
              // Add small delay to ensure connection is set before opening modal
              setTimeout(() => {
                openMomentModal();
              }, 10);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Moment with {connection.name}
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/activities?connection=${connectionId}`)}
            >
              <Activity className="h-4 w-4 mr-2" />
              View Activities
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                const url = `/calendar?connection=${connectionId}`;
                console.log("Navigating to calendar with URL:", url);
                setLocation(url);
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}