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
  const { openMomentModal, openPlanModal, closePlanModal, planModalOpen, setSelectedConnection: setModalConnection, editingMoment } = useModal();
  const { mainFocusConnection, loading: focusLoading } = useRelationshipFocus();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [selectedConnections, setSelectedConnections] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'moments' | 'conflicts' | 'intimacy' | 'plans' | 'timeline'>(() => {
    const savedTab = localStorage.getItem('activitiesTab');
    return (savedTab as any) || 'moments';
  });

  // Connection modal state
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [customStageValue, setCustomStageValue] = useState("");

  // Modal states
  const [reflectionModalOpen, setReflectionModalOpen] = useState(false);
  const [selectedMomentForReflection, setSelectedMomentForReflection] = useState<number | null>(null);
  const [entryDetailModalOpen, setEntryDetailModalOpen] = useState(false);
  const [selectedMomentForDetail, setSelectedMomentForDetail] = useState<Moment | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [selectedMomentForResolution, setSelectedMomentForResolution] = useState<Moment | null>(null);
  const [connectionDetailModalOpen, setConnectionDetailModalOpen] = useState(false);
  const [selectedConnectionForModal, setSelectedConnectionForModal] = useState<Connection | null>(null);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [hasUserSelectedConnection, setHasUserSelectedConnection] = useState(false);

  const { toast } = useToast();

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBlob = await compressImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(compressedBlob);
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle connection creation
  const handleAddConnection = async (formData: FormData) => {
    try {
      const name = formData.get('name') as string;
      const relationshipStage = formData.get('relationshipStage') as string;
      const customStage = formData.get('customStage') as string;
      const startDate = formData.get('startDate') as string;
      
      // Handle love languages
      const loveLanguageInputs = formData.getAll('loveLanguages') as string[];
      const loveLanguage = loveLanguageInputs.length > 0 ? loveLanguageInputs.join(', ') : null;

      const finalStage = relationshipStage === 'Custom' && customStage ? customStage : relationshipStage;

      const connectionData = {
        name,
        relationshipStage: finalStage,
        profileImage: uploadedImage,
        loveLanguage,
        startDate: startDate ? new Date(startDate) : null,
      };

      const response = await apiRequest('/api/connections', {
        method: 'POST',
        body: JSON.stringify(connectionData),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
        setConnectionModalOpen(false);
        setUploadedImage(null);
        setCustomStageValue("");
        toast({
          title: "Success",
          description: "Connection added successfully!",
        });
      }
    } catch (error) {
      console.error('Error adding connection:', error);
      toast({
        title: "Error",
        description: "Failed to add connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch data
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });

  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ['/api/moments'],
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
  });

  // Save tab selection
  useEffect(() => {
    localStorage.setItem('activitiesTab', activeTab);
  }, [activeTab]);

  // Auto-select main focus connection
  useEffect(() => {
    if (!hasUserSelectedConnection && mainFocusConnection && !focusLoading) {
      setSelectedConnections([mainFocusConnection.id]);
    }
  }, [mainFocusConnection, focusLoading, hasUserSelectedConnection]);

  // Event handlers
  const handleAddReflection = (momentId: number) => {
    setSelectedMomentForReflection(momentId);
    setReflectionModalOpen(true);
  };

  const handleViewEntryDetail = (moment: Moment) => {
    setSelectedMomentForDetail(moment);
    setEntryDetailModalOpen(true);
  };

  const handleResolveConflict = (moment: Moment) => {
    setSelectedMomentForResolution(moment);
    setConflictModalOpen(true);
  };

  const handleViewConnectionDetail = (connection: Connection, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedConnectionForModal(connection);
    setConnectionDetailModalOpen(true);
  };

  // Filter moments based on selected connections and active tab
  const filteredMoments = moments.filter(moment => {
    if (selectedConnections.length > 0 && !selectedConnections.includes(moment.connectionId)) {
      return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        moment.content.toLowerCase().includes(searchLower) ||
        moment.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Tab filtering
    switch (activeTab) {
      case 'conflicts':
        return moment.tags?.includes('Conflict') || moment.emoji === '😠';
      case 'intimacy':
        return moment.isIntimate === true || moment.tags?.includes('Sex');
      case 'plans':
        return moment.tags?.includes('Plan');
      case 'timeline':
      case 'moments':
      default:
        return true;
    }
  });

  // Group moments by date
  const groupMomentsByDate = (moments: Moment[]) => {
    return moments.reduce((groups, moment) => {
      const date = moment.createdAt ? format(new Date(moment.createdAt), 'yyyy-MM-dd') : 'unknown';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(moment);
      return groups;
    }, {} as Record<string, Moment[]>);
  };

  const groupedMoments = groupMomentsByDate(filteredMoments);
  const sortedDates = Object.keys(groupedMoments).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 h-0">
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
        </div>

        {/* Connection Picker */}
        <div className="px-3">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Select Connections</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[280px]" align="start">
                <div className="p-2">
                  <div 
                    className="flex items-center gap-3 py-3 px-4 text-base cursor-pointer hover:bg-accent rounded-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedConnections([]);
                      setHasUserSelectedConnection(true);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <span>All Connections</span>
                  </div>
                  
                  <div className="border-t border-border my-1" />
                  
                  {connections.map((connection) => (
                    <DropdownMenuCheckboxItem
                      key={connection.id}
                      checked={selectedConnections.includes(connection.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedConnections(prev => [...prev, connection.id]);
                        } else {
                          setSelectedConnections(prev => prev.filter(id => id !== connection.id));
                        }
                        setHasUserSelectedConnection(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
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
                        <span>{connection.relationshipStage === 'Self' ? `${connection.name} (ME)` : connection.name}</span>
                        {mainFocusConnection?.id === connection.id && (
                          <Heart className="h-3 w-3 text-red-500 fill-current ml-1" />
                        )}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                  
                  <div className="border-t border-border my-1" />
                  
                  <div 
                    className="flex items-center gap-3 py-3 px-4 text-base cursor-pointer hover:bg-accent rounded-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConnectionModalOpen(true);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-primary">Add Connection</span>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="px-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-3">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {sortedDates.length > 0 ? (
                sortedDates.map(date => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="space-y-2">
                      {groupedMoments[date].map((moment) => {
                        const connection = connections.find(c => c.id === moment.connectionId);
                        if (!connection) return null;

                        return (
                          <MomentCard 
                            key={moment.id} 
                            moment={moment} 
                            connection={{
                              id: connection.id,
                              name: connection.name,
                              profileImage: connection.profileImage || undefined
                            }}
                            onAddReflection={handleAddReflection}
                            onViewDetail={handleViewEntryDetail}
                            onResolveConflict={handleResolveConflict}
                            onViewConnection={handleViewConnectionDetail}
                            hasAiReflection={moment.id % 3 === 0}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No activities found</p>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'timeline' && (
            <div className="space-y-3">
              {filteredMoments.length > 0 ? (
                filteredMoments.map((moment) => {
                  const connection = connections.find(c => c.id === moment.connectionId);
                  if (!connection) return null;

                  return (
                    <MomentCard 
                      key={moment.id} 
                      moment={moment} 
                      connection={{
                        id: connection.id,
                        name: connection.name,
                        profileImage: connection.profileImage || undefined
                      }}
                      onAddReflection={handleAddReflection}
                      onViewDetail={handleViewEntryDetail}
                      onResolveConflict={handleResolveConflict}
                      onViewConnection={handleViewConnectionDetail}
                      hasAiReflection={moment.id % 3 === 0}
                    />
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No {activeTab} found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <BottomNavigation />

      {/* Modals */}
      <ReflectionModal
        isOpen={reflectionModalOpen}
        onClose={() => setReflectionModalOpen(false)}
        momentId={selectedMomentForReflection}
      />

      <EntryDetailModal
        isOpen={entryDetailModalOpen}
        onClose={() => setEntryDetailModalOpen(false)}
        moment={selectedMomentForDetail}
      />

      <ConflictResolutionModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        moment={selectedMomentForResolution}
      />
      
      <ConnectionDetailedModal
        isOpen={connectionDetailModalOpen}
        onClose={() => {
          setConnectionDetailModalOpen(false);
          setSelectedConnectionForModal(null);
        }}
        connection={selectedConnectionForModal}
      />

      {/* Simple Connection Form - Addresses refresh issue */}
      <SimpleConnectionForm
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        onSubmit={handleAddConnection}
        uploadedImage={uploadedImage}
        onImageUpload={handleImageUpload}
        customStageValue={customStageValue}
        setCustomStageValue={setCustomStageValue}
      />
    </div>
  );
}