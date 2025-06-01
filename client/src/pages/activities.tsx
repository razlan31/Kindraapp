import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { MomentCard } from "@/components/dashboard/moment-card";
import { ReflectionModal } from "@/components/modals/reflection-modal";
import { EntryDetailModal } from "@/components/modals/entry-detail-modal";
import { MilestoneModal } from "@/components/modals/milestone-modal";
import { PlanModal } from "@/components/modals/plan-modal";
import { ConflictResolutionModal } from "@/components/modals/conflict-resolution-modal";
import { ConnectionDetailedModal } from "@/components/modals/connection-detailed-modal";
import { Moment, Connection, Plan } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar, ChevronDown, Activity, Users, Camera, X, UserPlus, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function Activities() {
  const { user, isAuthenticated, loading } = useAuth();
  const { openMomentModal, openPlanModal, closePlanModal, planModalOpen, setSelectedConnection: setModalConnection, editingMoment } = useModal();
  const { mainFocusConnection, loading: focusLoading } = useRelationshipFocus();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [selectedConnections, setSelectedConnections] = useState<number[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'moments' | 'conflicts' | 'intimacy' | 'plans' | 'timeline'>(() => {
    // Preserve tab selection across page reloads
    const savedTab = localStorage.getItem('activitiesTab');
    return (savedTab as any) || 'timeline';
  });

  // Save tab selection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activitiesTab', activeTab);
  }, [activeTab]);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'moments' | 'conflicts' | 'intimacy' | 'plans' | 'milestones'>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Connection modal state
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle navigation connection filtering and focus connection
  const [hasUserSelectedConnection, setHasUserSelectedConnection] = useState(false);
  
  useEffect(() => {
    // First check for navigation connection (highest priority)
    const navigationConnectionId = localStorage.getItem('navigationConnectionId');
    console.log("Activities navigation check:", { navigationConnectionId });
    if (navigationConnectionId) {
      const connectionId = parseInt(navigationConnectionId);
      console.log("Setting activities connection from navigation:", connectionId);
      setSelectedConnections([connectionId]);
      setHasUserSelectedConnection(true);
      // Clear the navigation state after using it
      localStorage.removeItem('navigationConnectionId');
      return;
    }

    // If no navigation connection and user hasn't manually selected, use focus connection
    if (!hasUserSelectedConnection && mainFocusConnection && !focusLoading) {
      console.log("Setting activities to focus connection:", mainFocusConnection.name);
      setSelectedConnections([mainFocusConnection.id]);
    }
  }, [mainFocusConnection, focusLoading, hasUserSelectedConnection]);

  // Fetch moments - use simple approach like Dashboard
  const { data: moments = [], isLoading, refetch: refetchMoments } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });



  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  // Fetch milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ["/api/milestones", selectedConnection],
    staleTime: 0,
    enabled: !!user,
  });

  // Get plans from moments with "Plan" tag
  const plans = moments.filter(moment => moment.tags?.includes('Plan')) || [];
  const plansLoading = isLoading;
  const plansError = null;

  // Debug plans data
  console.log("Plans Debug:", { plans, plansLoading, plansError, activeTab, user: !!user, isAuthenticated, loading });

  // Force UI refresh when moments data changes
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  useEffect(() => {
    setForceRefreshKey(prev => prev + 1);
  }, [moments.length]);

  // Listen for moment creation events and force immediate refresh
  useEffect(() => {
    const handleMomentCreated = () => {
      refetchMoments();
      setForceRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('momentCreated', handleMomentCreated);
    return () => window.removeEventListener('momentCreated', handleMomentCreated);
  }, [refetchMoments]);

  // Connection modal helper functions
  const openConnectionModal = () => {
    console.log("Opening connection modal from context");
    setConnectionModalOpen(true);
  };

  const closeConnectionModal = () => {
    setConnectionModalOpen(false);
    setUploadedImage(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Get all selected love languages
      const selectedLoveLanguages = formData.getAll('loveLanguages');
      const loveLanguageString = selectedLoveLanguages.length > 0 ? selectedLoveLanguages.join(', ') : null;

      const data: any = {
        name: formData.get('name'),
        relationshipStage: formData.get('relationshipStage') || 'Potential',
        startDate: formData.get('startDate') || null,
        birthday: formData.get('birthday') || null,
        zodiacSign: formData.get('zodiacSign') || null,
        loveLanguage: loveLanguageString,
        isPrivate: formData.get('isPrivate') === 'on',
      };

      // Use the uploaded image from state if available
      if (uploadedImage) {
        data.profileImage = uploadedImage;
      }

      return apiRequest('POST', '/api/connections', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      closeConnectionModal();
      toast({
        title: "Connection Added",
        description: "New connection has been successfully added.",
      });
    },
    onError: (error) => {
      console.error('Connection creation error:', error);
      toast({
        title: "Error",
        description: "Failed to add connection. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  useEffect(() => {
    const handleMomentCreated = () => {
      console.log("Moment created event received, forcing refresh...");
      setRefreshTrigger(prev => prev + 1);
      refetchMoments();
    };
    const handleMomentUpdated = () => {
      console.log("Moment updated event received, forcing refresh...");
      setRefreshTrigger(prev => prev + 1);
      refetchMoments();
    };
    
    window.addEventListener('momentCreated', handleMomentCreated);
    window.addEventListener('momentUpdated', handleMomentUpdated);
    
    return () => {
      window.removeEventListener('momentCreated', handleMomentCreated);
      window.removeEventListener('momentUpdated', handleMomentUpdated);
    };
  }, [refetchMoments]);

  // Reflection modal state
  const [reflectionModalOpen, setReflectionModalOpen] = useState(false);
  const [selectedMomentForReflection, setSelectedMomentForReflection] = useState<Moment | null>(null);
  
  // Entry detail modal state
  const [entryDetailModalOpen, setEntryDetailModalOpen] = useState(false);
  const [selectedMomentForDetail, setSelectedMomentForDetail] = useState<Moment | null>(null);
  const [selectedConnectionForDetail, setSelectedConnectionForDetail] = useState<Connection | null>(null);
  
  // Milestone modal state
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  
  // Conflict resolution modal state
  const [conflictResolutionModalOpen, setConflictResolutionModalOpen] = useState(false);
  const [selectedMomentForResolution, setSelectedMomentForResolution] = useState<Moment | null>(null);
  
  // Connection details modal state
  const [connectionDetailModalOpen, setConnectionDetailModalOpen] = useState(false);
  const [selectedConnectionForModal, setSelectedConnectionForModal] = useState<Connection | null>(null);

  const handleAddReflection = (momentId: number) => {
    console.log("Add reflection for moment:", momentId);
    const moment = moments.find(m => m.id === momentId);
    console.log("Found moment for reflection:", moment);
    if (moment) {
      setSelectedMomentForReflection(moment);
      setReflectionModalOpen(true);
    }
  };

  const handleResolveConflict = (momentId: number) => {
    console.log("Handle resolve conflict for moment:", momentId);
    const moment = moments.find(m => m.id === momentId);
    if (moment) {
      setSelectedMomentForResolution(moment);
      setConflictResolutionModalOpen(true);
    }
  };

  const handleViewEntryDetail = (momentId: number | string) => {
    console.log("handleViewEntryDetail called with momentId:", momentId);
    const moment = filteredMoments.find(m => m.id === momentId);
    const connection = connections.find(c => c.id === moment?.connectionId);
    console.log("Found moment and connection:", { moment, connection });
    if (moment && connection) {
      console.log("Setting entry detail modal state");
      console.log("Current entryDetailModalOpen state:", entryDetailModalOpen);
      setSelectedMomentForDetail(moment);
      setSelectedConnectionForDetail(connection);
      setEntryDetailModalOpen(true);
      console.log("Entry detail modal should now be open");
    }
  };

  const handleViewConnectionDetail = (connection: Connection, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent triggering the moment detail modal
    }
    setSelectedConnectionForModal(connection);
    setConnectionDetailModalOpen(true);
  };

  const handleAddTestMoment = async () => {
    if (connections.length === 0) return;
    
    const testMoments = [
      { content: "Had an amazing dinner together", emoji: "🍽️", tags: ["Green Flag", "Quality Time"] },
      { content: "Great communication about future plans", emoji: "💬", tags: ["Green Flag", "Communication"] },
      { content: "Feeling really connected today", emoji: "❤️", tags: ["Intimacy", "Growth"] },
      { content: "Enjoyed a fun movie night", emoji: "🎬", tags: ["Green Flag", "Fun"] },
      { content: "Deep conversation about dreams", emoji: "✨", tags: ["Blue Flag", "Vulnerability"] }
    ];
    
    const randomMoment = testMoments[Math.floor(Math.random() * testMoments.length)];
    const randomConnection = connections[Math.floor(Math.random() * connections.length)];
    
    try {
      await fetch('/api/moments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: randomConnection.id,
          content: randomMoment.content,
          emoji: randomMoment.emoji,
          tags: randomMoment.tags,
          isPrivate: false
        })
      });
      // Refresh the page data
      window.location.reload();
    } catch (error) {
      console.error('Failed to create test moment:', error);
    }
  };

  // Group moments by date
  const groupMomentsByDate = (moments: Moment[]) => {
    const grouped: Record<string, Moment[]> = {};
    
    moments.forEach(moment => {
      const date = format(new Date(moment.createdAt || new Date()), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(moment);
    });
    
    return grouped;
  };

  // Filter plans based on search and selected connection
  const filteredPlans = plans.filter(plan => {
    const connection = connections.find(c => c.id === plan.connectionId);
    if (!connection) return false;
    
    const matchesSearch = (plan.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConnection = selectedConnections.length > 0 ? selectedConnections.includes(plan.connectionId) : true;
    
    return matchesSearch && matchesConnection;
  });



  // Use only real moments from the database (including real milestones)
  const allTimelineEntries = moments;

  // Filter moments based on tab, search and selected connection
  const filteredMoments = allTimelineEntries.filter(moment => {
    const connection = connections.find(c => c.id === moment.connectionId);
    if (!connection) return false;
    
    const tags = moment.tags || [];
    
    // Filter by tab type
    let matchesTab = false;
    if (activeTab === 'timeline') {
      // Timeline shows entries based on the timeline filter
      if (timelineFilter === 'all') {
        matchesTab = true;
      } else if (timelineFilter === 'moments') {
        // Show regular moments (exclude conflicts, intimacy, plans, and milestones)
        const isConflict = tags.includes('Conflict') || moment.emoji === '⚡';
        const isIntimacy = moment.isIntimate === true || tags.includes('Intimacy') || moment.emoji === '💕';
        const isPlan = tags.includes('Plan');
        const isMilestone = tags.includes('Milestone') || (moment as any).isConnectionMilestone;
        matchesTab = !isConflict && !isIntimacy && !isPlan && !isMilestone;
      } else if (timelineFilter === 'conflicts') {
        // Show conflicts
        matchesTab = tags.includes('Conflict') || moment.emoji === '⚡';
      } else if (timelineFilter === 'intimacy') {
        // Show intimacy entries
        matchesTab = moment.isIntimate === true || tags.includes('Intimacy') || moment.emoji === '💕';
      } else if (timelineFilter === 'plans') {
        // Show plan entries
        matchesTab = tags.includes('Plan');
      } else if (timelineFilter === 'milestones') {
        // Show milestone entries
        matchesTab = tags.includes('Milestone') || (moment as any).isConnectionMilestone;
      }
    } else if (activeTab === 'moments') {
      // Show regular moments (positive, negative, neutral) - exclude conflicts, intimacy, and plans
      const isConflict = tags.includes('Conflict') || moment.emoji === '⚡';
      const isIntimacy = moment.isIntimate === true || tags.includes('Intimacy') || moment.emoji === '💕';
      const isPlan = tags.includes('Plan');
      matchesTab = !isConflict && !isIntimacy && !isPlan;
    } else if (activeTab === 'conflicts') {
      // Show conflicts - only show entries that are actually conflicts
      matchesTab = tags.includes('Conflict') || moment.emoji === '⚡';
    } else if (activeTab === 'intimacy') {
      // Show intimacy entries
      matchesTab = moment.isIntimate === true || tags.includes('Intimacy') || moment.emoji === '💕';
    }
    
    const matchesSearch = moment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           connection.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConnection = selectedConnections.length > 0 ? selectedConnections.includes(moment.connectionId) : true;
    
    return matchesTab && matchesSearch && matchesConnection;
  });

  // Debug logging for filtering
  console.log("Activities Debug - Filtering:", {
    totalMoments: moments.length,
    activeTab,
    timelineFilter,
    selectedConnections,
    filteredMomentsCount: filteredMoments.length,
    firstFewFiltered: filteredMoments.slice(0, 3).map(m => ({
      id: m.id,
      emoji: m.emoji,
      isIntimate: m.isIntimate,
      tags: m.tags,
      connectionId: m.connectionId
    }))
  });

  const groupedMoments = groupMomentsByDate(filteredMoments);
  const sortedDates = Object.keys(groupedMoments).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Page Title */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">Activities</h1>
          </div>
          

          
          {/* Activity Types */}
          <div className="grid grid-cols-5 gap-1 bg-muted rounded-lg p-1 mb-3">
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'timeline' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Timeline
            </button>
            <button 
              onClick={() => setActiveTab('moments')}
              className={`py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'moments' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Moments
            </button>
            <button 
              onClick={() => setActiveTab('conflicts')}
              className={`py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'conflicts' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Conflicts
            </button>
            <button 
              onClick={() => setActiveTab('intimacy')}
              className={`py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'intimacy' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Intimacy
            </button>
            <button 
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'plans' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Plans
            </button>
          </div>

          {/* Connection Picker */}
          <Card className="p-4 bg-card/50 backdrop-blur-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Viewing activities for</h3>
              <span className="text-xs text-muted-foreground">
                {selectedConnections.length === 0 ? 'All Connections' : 
                 selectedConnections.length === 1 ? 
                   connections.find(c => c.id === selectedConnections[0])?.name || 'Unknown' :
                 `${selectedConnections.length} connections selected`}
              </span>
            </div>
            <div className="relative">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>
                  {selectedConnections.length === 0 ? 'All Connections' : 
                   selectedConnections.length === 1 ? 
                     connections.find(c => c.id === selectedConnections[0])?.name || 'Unknown' :
                   `${selectedConnections.length} connections selected`}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              {dropdownOpen && (
                <>
                  {/* Backdrop overlay */}
                  <div 
                    className="fixed inset-0 z-[9990] bg-black/20"
                    onClick={() => setDropdownOpen(false)}
                  />
                  {/* Dropdown */}
                  <div className="absolute top-full left-0 w-full z-[9999] mt-1 bg-background border rounded-md shadow-xl max-h-64 flex flex-col">
                  {/* Connection list - scrollable area */}
                  <div className="overflow-y-auto flex-1 p-1">
                    {/* All Connections Option */}
                    <div 
                      className="flex items-center gap-3 py-3 px-3 text-base cursor-pointer hover:bg-accent rounded-sm"
                      onClick={() => {
                        setSelectedConnections([]);
                        setHasUserSelectedConnection(true);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">All</span>
                      </div>
                      <span>All Connections</span>
                    </div>
                    
                    <div className="border-t border-border my-1" />
                    
                    {/* Individual Connections */}
                    {connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center gap-3 py-3 px-3 text-base cursor-pointer hover:bg-accent rounded-sm"
                        onClick={() => {
                          const isSelected = selectedConnections.includes(connection.id);
                          if (isSelected) {
                            setSelectedConnections(selectedConnections.filter(id => id !== connection.id));
                          } else {
                            setSelectedConnections([...selectedConnections, connection.id]);
                          }
                          setHasUserSelectedConnection(true);
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {connection.profileImage ? (
                            <img 
                              src={connection.profileImage} 
                              alt={connection.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {connection.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span>{connection.name}</span>
                          {mainFocusConnection?.id === connection.id && (
                            <Heart className="h-3 w-3 text-red-500 fill-current ml-1" />
                          )}
                        </div>
                        {selectedConnections.includes(connection.id) && (
                          <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                            <span className="text-xs text-white">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="border-t border-border my-1" />
                    
                    {/* Add Connection Option */}
                    <div 
                      className="flex items-center gap-3 py-3 px-3 text-base cursor-pointer hover:bg-accent rounded-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openConnectionModal();
                        setDropdownOpen(false);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-primary">Add Connection</span>
                    </div>
                  </div>
                  
                  {/* Multi-selection controls at bottom */}
                  <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedConnections([]);
                        setHasUserSelectedConnection(true);
                      }}
                      className="h-8 px-3 text-xs font-medium border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Clear All
                    </Button>
                    <div className="text-xs font-medium text-foreground">
                      {selectedConnections.length} selected
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDropdownOpen(false);
                      }}
                      className="h-8 px-3 text-xs font-medium"
                    >
                      Done
                    </Button>
                  </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Add Button for Active Tab - Hide for Timeline */}
          {activeTab !== 'timeline' && (
            <div className="mb-4">
              <Button onClick={() => {
                console.log("Add button clicked:", { activeTab, selectedConnection, connectionsLength: connections.length });
                
                if (activeTab === 'plans') {
                  // Open plan modal
                  if (selectedConnections.length > 0) {
                    // Use the first selected connection when multiple are selected
                    const firstSelectedId = selectedConnections[0];
                    const connection = connections.find(c => c.id === firstSelectedId);
                    console.log("Opening plan modal with connection:", connection);
                    if (connection) {
                      setModalConnection(firstSelectedId, connection);
                      openPlanModal(connection);
                    }
                  } else {
                    // If "All Connections" is selected, use the main focus connection as default
                    if (mainFocusConnection) {
                      console.log("Opening plan modal with main focus connection:", mainFocusConnection);
                      setModalConnection(mainFocusConnection.id, mainFocusConnection);
                      openPlanModal(mainFocusConnection);
                    } else {
                      console.log("Opening plan modal without specific connection");
                      setModalConnection(null, null);
                      openPlanModal();
                    }
                  }
                } else {
                  // Set the connection in modal context before opening
                  if (selectedConnections.length > 0) {
                    // Use the first selected connection when multiple are selected
                    const firstSelectedId = selectedConnections[0];
                    const connection = connections.find(c => c.id === firstSelectedId);
                    console.log("Opening moment modal with connection:", connection);
                    if (connection) {
                      setModalConnection(firstSelectedId, connection);
                    }
                  } else {
                    // If "All Connections" is selected, use the main focus connection as default
                    if (mainFocusConnection) {
                      console.log("Opening moment modal with main focus connection:", mainFocusConnection);
                      setModalConnection(mainFocusConnection.id, mainFocusConnection);
                    } else {
                      console.log("Opening moment modal without specific connection");
                      setModalConnection(null, null);
                    }
                  }
                  const activityType = activeTab === 'moments' ? 'moment' : activeTab === 'conflicts' ? 'conflict' : 'intimacy';
                  console.log("Opening moment modal with activity type:", activityType);
                  openMomentModal(activityType);
                }
              }} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab === 'moments' ? 'Moment' : 
                     activeTab === 'conflicts' ? 'Conflict' : 
                     activeTab === 'intimacy' ? 'Intimacy' : 
                     activeTab === 'plans' ? 'Plan' : ''}
              </Button>
            </div>
          )}
        </div>

        {/* Activities Filter Section - Only show in Timeline mode */}
        {activeTab === 'timeline' && (
          <section className="px-3 pb-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Filter:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between min-w-[120px]">
                    <span className="capitalize">
                      {timelineFilter === 'all' ? 'All Activities' : timelineFilter}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" sideOffset={4}>
                  <DropdownMenuItem 
                    onClick={() => setTimelineFilter('all')}
                    className="py-2 px-3"
                  >
                    All Activities
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTimelineFilter('moments')}
                    className="py-2 px-3"
                  >
                    Moments
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTimelineFilter('conflicts')}
                    className="py-2 px-3"
                  >
                    Conflicts
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTimelineFilter('intimacy')}
                    className="py-2 px-3"
                  >
                    Intimacy
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTimelineFilter('plans')}
                    className="py-2 px-3"
                  >
                    Plans
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTimelineFilter('milestones')}
                    className="py-2 px-3"
                  >
                    Milestones
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </section>
        )}

        {/* Search Section - Show for other tabs */}
        {activeTab !== 'timeline' && (
          <section className="px-4 pb-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Search activities..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {/* Content Area */}
        <section className="px-4 py-3">
          {isLoading ? (
            <div className="text-center py-10">
              <p>Loading moments...</p>
            </div>
          ) : activeTab === 'timeline' ? (
            // Timeline View - All activities in chronological order grouped by date
            filteredMoments.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800"></div>
                
                <div className="space-y-8" key={`timeline-${forceRefreshKey}-${filteredMoments.length}`}>
                  {(() => {
                    // Group timeline entries by date
                    const timelineGrouped = filteredMoments
                      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
                      .reduce((groups: Record<string, Moment[]>, moment) => {
                        const date = format(new Date(moment.createdAt || new Date()), 'yyyy-MM-dd');
                        if (!groups[date]) groups[date] = [];
                        groups[date].push(moment);
                        return groups;
                      }, {});

                    const sortedTimelineDates = Object.keys(timelineGrouped).sort((a, b) => 
                      new Date(b).getTime() - new Date(a).getTime()
                    );

                    return sortedTimelineDates.map((date) => (
                      <div key={date} className="relative">
                        {/* Date separator */}
                        <div className="relative mb-6">
                          <div className="absolute left-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center -translate-x-1/2 z-10 border-2 border-background">
                            <Calendar className="h-3 w-3 text-primary-foreground" />
                          </div>
                          <div className="pl-12">
                            <div className="bg-muted/50 rounded-lg px-4 py-2 inline-block">
                              <span className="text-sm font-semibold text-foreground">
                                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Activities for this date */}
                        <div className="space-y-6">
                          {timelineGrouped[date].map((moment) => {
                            const connection = connections.find(c => c.id === moment.connectionId);
                            if (!connection) return null;

                            const getActivityType = (moment: Moment) => {
                              // Priority 1: Check if it's intimacy (isIntimate flag or intimacy tags)
                              if (moment.isIntimate === true || moment.tags?.includes('Intimacy')) return 'intimacy';
                              
                              // Priority 2: Check if it's a conflict (has conflict indicators)
                              if (moment.tags?.includes('Conflict') || 
                                  moment.isResolved === true || 
                                  (moment.resolutionNotes && moment.resolutionNotes.trim() !== '')) return 'conflict';
                              
                              // Priority 3: Check if it's a plan (has Plan tag)
                              if (moment.tags?.includes('Plan')) return 'plan';
                              
                              // Priority 3: Check what tab it would appear in based on the filtering logic
                              const tags = moment.tags || [];
                              
                              // If it appears in conflicts tab (has conflict emoji but no conflict resolution)
                              if (moment.emoji === '😠' && !tags.includes('Conflict') && moment.isResolved !== true) return 'conflict';
                              
                              // Check moment type based on emoji (standardized emojis from the form)
                              if (moment.emoji === '😕') return 'negative';  // Negative moment
                              if (moment.emoji === '🌱') return 'neutral';   // Growth moment
                              
                              // Check if it's a negative moment (other sad emojis or red flags, but not conflicts)
                              if (moment.emoji === '😔' || moment.emoji === '😞' || moment.emoji === '😟' || 
                                  moment.emoji === '🙁' || moment.tags?.includes('Red Flag')) return 'negative';
                              
                              // Everything else is positive
                              return 'positive';
                            };

                            const activityType = getActivityType(moment);
                            const typeColors = {
                              positive: 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300',
                              negative: 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300',
                              neutral: 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300',
                              conflict: 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300',
                              intimacy: 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-900/20 dark:border-pink-700 dark:text-pink-300',
                              plan: 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300'
                            };

                            return (
                              <div key={moment.id} className="relative pl-12">
                                {/* Timeline dot */}
                                <div className={`absolute left-4 w-4 h-4 rounded-full border-2 ${typeColors[activityType]} flex items-center justify-center -translate-x-1/2`}>
                                  <div className="w-2 h-2 rounded-full bg-current"></div>
                                </div>
                                
                                {/* Timeline content */}
                                <Card className="p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewEntryDetail(moment.id)}>
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-1 -ml-1 transition-colors"
                                        onClick={(e) => handleViewConnectionDetail(connection, e)}
                                        title={`View ${connection.name}'s profile`}
                                      >
                                        {connection.profileImage ? (
                                          <img 
                                            src={connection.profileImage} 
                                            alt={connection.name}
                                            className="w-6 h-6 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-xs font-medium text-primary">
                                              {connection.name.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                        )}
                                        <span className="font-medium text-sm hover:text-primary transition-colors">
                                          {connection.name}
                                        </span>
                                      </div>
                                      <span className="text-lg">{moment.emoji}</span>
                                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${typeColors[activityType]}`}>
                                        {activityType}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-muted-foreground">
                                        {moment.createdAt ? format(new Date(moment.createdAt), 'h:mm a') : ''}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {moment.content && (
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                      {moment.content}
                                    </p>
                                  )}
                                  
                                  {moment.tags && moment.tags.filter(tag => !['Positive', 'Negative', 'Neutral', 'Conflict', 'Intimacy'].includes(tag)).length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {moment.tags.filter(tag => !['Positive', 'Negative', 'Neutral', 'Conflict', 'Intimacy'].includes(tag)).slice(0, 2).map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-muted rounded-full text-xs">
                                          {tag}
                                        </span>
                                      ))}
                                      {moment.tags.filter(tag => !['Positive', 'Negative', 'Neutral', 'Conflict', 'Intimacy'].includes(tag)).length > 2 && (
                                        <span className="px-2 py-1 bg-muted rounded-full text-xs">
                                          +{moment.tags.filter(tag => !['Positive', 'Negative', 'Neutral', 'Conflict', 'Intimacy'].includes(tag)).length - 2} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold mb-1">No Activities Yet</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                  Start logging your relationship journey to see your timeline
                </p>
              </Card>
            )
          ) : activeTab === 'plans' ? (
            // Plans view
            filteredPlans.length > 0 ? (
              <div className="space-y-4">
                {filteredPlans.map(plan => {
                  const connection = connections.find(c => c.id === plan.connectionId);
                  if (!connection) return null;

                  // Extract category from tags (second tag after "Plan")
                  const category = plan.tags?.find(tag => tag !== 'Plan') || 'other';
                  const planDate = new Date(plan.createdAt || new Date());

                  return (
                    <Card 
                      key={plan.id} 
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewEntryDetail(plan.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-1 -ml-1 transition-colors"
                            onClick={(e) => handleViewConnectionDetail(connection, e)}
                            title={`View ${connection.name}'s profile`}
                          >
                            {connection.profileImage ? (
                              <img 
                                src={connection.profileImage} 
                                alt={connection.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {connection.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-sm hover:text-primary transition-colors">
                              {connection.name}
                            </span>
                          </div>
                          <span className="text-lg">{plan.emoji}</span>
                          <div>
                            <h3 className="font-medium">{plan.title || 'Untitled Plan'}</h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(planDate, 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(planDate, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      
                      {plan.content && (
                        <p className="text-sm text-muted-foreground mb-2">{plan.content}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            Plan
                          </span>
                          {plan.notes && plan.notes.trim() !== '' ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              ✓ Completed
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold mb-1">No Plans Yet</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                  Create your first plan to start organizing activities with your connections
                </p>
              </Card>
            )
          ) : filteredMoments.length > 0 ? (
            // Regular tabbed view
            <div key={`entries-${forceRefreshKey}-${filteredMoments.length}`}>
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
                          onViewDetail={handleViewEntryDetail}
                          onResolveConflict={handleResolveConflict}
                          onViewConnection={handleViewConnectionDetail}
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

            </Card>
          )}
        </section>
      </main>

      <BottomNavigation />
      
      {/* Reflection Modal */}
      <ReflectionModal
        isOpen={reflectionModalOpen}
        onClose={() => {
          setReflectionModalOpen(false);
          setSelectedMomentForReflection(null);
        }}
        moment={selectedMomentForReflection}
      />
      
      {/* Entry Detail Modal */}
      <EntryDetailModal
        isOpen={entryDetailModalOpen}
        onClose={() => {
          setEntryDetailModalOpen(false);
          setSelectedMomentForDetail(null);
          setSelectedConnectionForDetail(null);
        }}
        moment={selectedMomentForDetail}
        connection={selectedConnectionForDetail}
      />
      
      {/* Milestone Modal */}
      <MilestoneModal
        isOpen={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        selectedConnection={selectedConnection ? 
          connections.find(c => c.id === selectedConnection) || null : null}
      />
      
      {/* Plan Modal */}
      <PlanModal
        isOpen={planModalOpen}
        onClose={closePlanModal}
        selectedConnection={selectedConnection ? 
          connections?.find(c => c.id === selectedConnection) || null : null}
        selectedDate={null}
        showConnectionPicker={true}
        editingMoment={editingMoment}
      />
      
      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={conflictResolutionModalOpen}
        onClose={() => {
          setConflictResolutionModalOpen(false);
          setSelectedMomentForResolution(null);
        }}
        moment={selectedMomentForResolution}
      />
      
      {/* Connection Detail Modal */}
      <ConnectionDetailedModal
        isOpen={connectionDetailModalOpen}
        onClose={() => {
          setConnectionDetailModalOpen(false);
          setSelectedConnectionForModal(null);
        }}
        connection={selectedConnectionForModal}
      />

      {/* Connection Modal */}
      <Dialog open={connectionModalOpen} onOpenChange={setConnectionModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Connection</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createConnectionMutation.mutate(formData);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={uploadedImage || undefined} />
                    <AvatarFallback className="text-lg">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Photo from Device
                  </label>
                  {uploadedImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedImage(null)}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input
                  name="name"
                  required
                  placeholder="Enter name"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Relationship Stage
                </label>
                <select
                  name="relationshipStage"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
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
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  name="startDate"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Birthday
                </label>
                <Input
                  type="date"
                  name="birthday"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Zodiac Sign
                </label>
                <select
                  name="zodiacSign"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                >
                  <option value="">Select zodiac sign</option>
                  <option value="Aries">Aries</option>
                  <option value="Taurus">Taurus</option>
                  <option value="Gemini">Gemini</option>
                  <option value="Cancer">Cancer</option>
                  <option value="Leo">Leo</option>
                  <option value="Virgo">Virgo</option>
                  <option value="Libra">Libra</option>
                  <option value="Scorpio">Scorpio</option>
                  <option value="Sagittarius">Sagittarius</option>
                  <option value="Capricorn">Capricorn</option>
                  <option value="Aquarius">Aquarius</option>
                  <option value="Pisces">Pisces</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Love Languages
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="wordsOfAffirmation"
                      name="loveLanguages"
                      value="Words of Affirmation"
                      className="rounded"
                    />
                    <label htmlFor="wordsOfAffirmation" className="text-sm">
                      Words of Affirmation
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="qualityTime"
                      name="loveLanguages"
                      value="Quality Time"
                      className="rounded"
                    />
                    <label htmlFor="qualityTime" className="text-sm">
                      Quality Time
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="physicalTouch"
                      name="loveLanguages"
                      value="Physical Touch"
                      className="rounded"
                    />
                    <label htmlFor="physicalTouch" className="text-sm">
                      Physical Touch
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="actsOfService"
                      name="loveLanguages"
                      value="Acts of Service"
                      className="rounded"
                    />
                    <label htmlFor="actsOfService" className="text-sm">
                      Acts of Service
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="receivingGifts"
                      name="loveLanguages"
                      value="Receiving Gifts"
                      className="rounded"
                    />
                    <label htmlFor="receivingGifts" className="text-sm">
                      Receiving Gifts
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  className="rounded"
                />
                <label htmlFor="isPrivate" className="text-sm">
                  Keep this connection private
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeConnectionModal} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={createConnectionMutation.isPending} className="flex-1">
                {createConnectionMutation.isPending ? "Adding..." : "Add Connection"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
