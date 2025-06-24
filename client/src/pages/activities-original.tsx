import { useState, useEffect, useRef } from "react";
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
import { SimpleConnectionForm } from "@/components/modals/simple-connection-form";
import { Moment, Connection, Plan, relationshipStages } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { useSync } from "@/contexts/sync-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar, ChevronDown, Activity, Users, Camera, X, UserPlus, Heart, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { compressImage } from "@/lib/image-utils";
import { MiniInsight } from "@/components/insights/mini-insight";
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
  const { openMomentModal, openPlanModal, closePlanModal, planModalOpen, setSelectedConnection: setModalConnection, editingMoment, registerConnectionChangeListener } = useModal();
  const { mainFocusConnection, loading: focusLoading } = useRelationshipFocus();
  const { registerSyncHandler } = useSync();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [selectedConnections, setSelectedConnections] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'moments' | 'conflicts' | 'intimacy' | 'plans' | 'timeline'>(() => {
    const savedTab = localStorage.getItem('activitiesTab');
    return (savedTab as any) || 'moments';
  });

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activitiesTab', activeTab);
  }, [activeTab]);

  // Debug activities navigation
  console.log("Activities: navigation check, navigationConnectionId:", null);

  // Register for bidirectional sync - activities page -> modals
  useEffect(() => {
    console.log("🔗 ACTIVITIES - Registering sync handler");
    registerSyncHandler(() => {
      console.log("🔗 ACTIVITIES - Sync triggered, refreshing connections");
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    });
  }, [registerSyncHandler, queryClient]);

  // Register connection change listener
  useEffect(() => {
    const handleConnectionChange = (connectionId: number | null) => {
      console.log("Activities: Connection changed to:", connectionId);
      setSelectedConnection(connectionId);
    };
    
    registerConnectionChangeListener(handleConnectionChange);
  }, [registerConnectionChangeListener]);

  // State for modals
  const [reflectionModalOpen, setReflectionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionFormModalOpen, setConnectionFormModalOpen] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [selectedMomentForDetail, setSelectedMomentForDetail] = useState<Moment | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const { toast } = useToast();

  // Queries
  const { data: connections = [], isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const { data: moments = [], isLoading: momentsLoading } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    staleTime: 10 * 60 * 1000, // 10 minutes  
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await compressImage(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadedImage(event.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        toast({
          title: "Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Convert FormData to object for JSON request
      const connectionData: any = {};
      const entries = Array.from(formData.entries());
      for (const [key, value] of entries) {
        connectionData[key] = value;
      }
      return await apiRequest("/api/connections", "POST", connectionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Success",
        description: "Connection created successfully!",
      });
      setConnectionFormModalOpen(false);
      setUploadedImage(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create connection. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleConnectionSubmit = async (formData: FormData) => {
    await createConnectionMutation.mutateAsync(formData);
  };

  // Filter logic
  const getFilteredMoments = () => {
    let filtered = moments;

    // Connection filter
    if (selectedConnections.length > 0) {
      filtered = filtered.filter(moment => 
        selectedConnections.includes(moment.connectionId)
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(moment => 
        moment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        moment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        moment.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Time filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (timeFilter) {
      case 'today':
        filtered = filtered.filter(moment => new Date(moment.createdAt) >= today);
        break;
      case 'week':
        filtered = filtered.filter(moment => new Date(moment.createdAt) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(moment => new Date(moment.createdAt) >= monthAgo);
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getFilteredByType = (type: string) => {
    return getFilteredMoments().filter(moment => {
      switch (type) {
        case 'moments':
          return !moment.tags?.includes('Conflict') && !moment.isIntimate;
        case 'conflicts':
          return moment.tags?.includes('Conflict');
        case 'intimacy':
          return moment.isIntimate;
        case 'plans':
          return moment.tags?.includes('Plan');
        case 'timeline':
          // For timeline, show all moments within 1 month range
          const oneMonthFromNow = new Date();
          oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
          const momentDate = new Date(moment.createdAt);
          return momentDate <= oneMonthFromNow;
        default:
          return true;
      }
    });
  };

  // Get data based on active tab
  const getTabData = () => {
    switch (activeTab) {
      case 'plans':
        return plans.filter(plan => {
          if (selectedConnections.length > 0) {
            return selectedConnections.includes(plan.connectionId);
          }
          return true;
        });
      default:
        return getFilteredByType(activeTab);
    }
  };

  const tabData = getTabData();

  const handleMomentClick = (moment: Moment) => {
    setSelectedMomentForDetail(moment);
    setDetailModalOpen(true);
  };

  const handleOpenReflection = (moment: Moment) => {
    setSelectedMoment(moment);
    setReflectionModalOpen(true);
  };

  const connectionOptions = [
    { id: 0, name: "All Connections", count: moments.length },
    ...connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      count: moments.filter(m => m.connectionId === conn.id).length
    }))
  ];

  const toggleConnectionSelection = (connectionId: number) => {
    if (connectionId === 0) {
      // "All Connections" selected
      setSelectedConnections([]);
    } else {
      setSelectedConnections(prev => {
        if (prev.includes(connectionId)) {
          return prev.filter(id => id !== connectionId);
        } else {
          return [...prev, connectionId];
        }
      });
    }
  };

  const isConnectionSelected = (connectionId: number) => {
    if (connectionId === 0) {
      return selectedConnections.length === 0;
    }
    return selectedConnections.includes(connectionId);
  };

  const getSelectedConnectionsText = () => {
    if (selectedConnections.length === 0) {
      return "All Connections";
    }
    if (selectedConnections.length === 1) {
      const conn = connections.find(c => c.id === selectedConnections[0]);
      return conn?.name || "Unknown";
    }
    return `${selectedConnections.length} Selected`;
  };

  if (loading || connectionsLoading) {
    return (
      <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activities</h1>
          </div>
          <Button
            onClick={() => setConnectionFormModalOpen(true)}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center space-x-3">
            {/* Connection Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  {getSelectedConnectionsText()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {connectionOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.id}
                    checked={isConnectionSelected(option.id)}
                    onCheckedChange={() => toggleConnectionSelection(option.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{option.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {option.count}
                      </span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Time Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {timeFilter === 'all' ? 'All Time' : 
                   timeFilter === 'today' ? 'Today' :
                   timeFilter === 'week' ? 'This Week' : 'This Month'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTimeFilter('all')}>
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('today')}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('week')}>
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('month')}>
                  This Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'moments', label: 'Moments', icon: Heart },
            { key: 'conflicts', label: 'Conflicts', icon: Activity },
            { key: 'intimacy', label: 'Intimacy', icon: Heart },
            { key: 'plans', label: 'Plans', icon: CalendarIcon },
            { key: 'timeline', label: 'Timeline', icon: Calendar }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </button>
          ))}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={() => openMomentModal('moment')}
            variant="outline"
            className="flex items-center justify-center py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Moment
          </Button>
          <Button
            onClick={() => {
              console.log("🔥 ACTIVITIES PLAN BUTTON - Clicked, opening plan modal");
              openPlanModal();
            }}
            variant="outline"
            className="flex items-center justify-center py-3"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>

        {/* AI Insight */}
        <div className="mb-6">
          <MiniInsight />
        </div>

        {/* Content */}
        <div className="space-y-4">
          {tabData.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No {activeTab} found</h3>
                <p className="text-sm">
                  {selectedConnections.length > 0 
                    ? `No ${activeTab} found for the selected connections.`
                    : `Start by adding your first ${activeTab.slice(0, -1)}.`
                  }
                </p>
                <div className="mt-4 space-x-2">
                  <Button 
                    onClick={() => openMomentModal('moment')}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Moment
                  </Button>
                  {activeTab === 'plans' && (
                    <Button 
                      onClick={() => openPlanModal()}
                      size="sm"
                      variant="outline"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Add Plan
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <>
              {activeTab === 'plans' ? (
                // Plans rendering
                plans.filter(plan => {
                  if (selectedConnections.length > 0) {
                    return selectedConnections.includes(plan.connectionId);
                  }
                  return true;
                }).map((plan) => {
                  const connection = connections.find(c => c.id === plan.connectionId);
                  
                  return (
                    <Card key={plan.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {plan.title}
                            </h3>
                            {plan.isCompleted && (
                              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {plan.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(plan.scheduledDate), 'MMM d, yyyy')}
                            </span>
                            {connection && (
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {connection.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                // Moments rendering
                tabData.map((moment) => (
                  <MomentCard
                    key={moment.id}
                    moment={moment}
                    connections={connections}
                    onMomentClick={handleMomentClick}
                    onReflectionClick={handleOpenReflection}
                  />
                ))
              )}
            </>
          )}
        </div>
      </main>

      <BottomNavigation />

      {/* Modals */}
      <ReflectionModal
        isOpen={reflectionModalOpen}
        onClose={() => setReflectionModalOpen(false)}
        moment={selectedMoment}
      />

      <EntryDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        moment={selectedMomentForDetail}
        connection={selectedMomentForDetail ? connections.find(c => c.id === selectedMomentForDetail.connectionId) || null : null}
      />

      <SimpleConnectionForm
        isOpen={connectionFormModalOpen}
        onClose={() => setConnectionFormModalOpen(false)}
        onSubmit={handleConnectionSubmit}
        uploadedImage={uploadedImage}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
}