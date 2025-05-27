import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { MomentCard } from "@/components/dashboard/moment-card";
import { ReflectionModal } from "@/components/modals/reflection-modal";
import { EntryDetailModal } from "@/components/modals/entry-detail-modal";
import { MilestoneModal } from "@/components/modals/milestone-modal";
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

export default function Activities() {
  const { user, isAuthenticated, loading } = useAuth();
  const { openMomentModal, setSelectedConnection: setModalConnection } = useModal();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'moments' | 'conflicts' | 'intimacy' | 'timeline' | 'milestones'>('moments');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle navigation connection filtering
  useEffect(() => {
    const navigationConnectionId = localStorage.getItem('navigationConnectionId');
    console.log("Activities navigation check:", { navigationConnectionId });
    if (navigationConnectionId) {
      const connectionId = parseInt(navigationConnectionId);
      console.log("Setting activities connection from navigation:", connectionId);
      setSelectedConnection(connectionId);
      // Clear the navigation state after using it
      localStorage.removeItem('navigationConnectionId');
    }
  }, []);

  // Fetch moments - use simple approach like Dashboard
  const { data: moments = [], isLoading, refetch: refetchMoments } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    staleTime: 0,
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

  const handleAddReflection = (momentId: number) => {
    console.log("Add reflection for moment:", momentId);
    const moment = moments.find(m => m.id === momentId);
    console.log("Found moment for reflection:", moment);
    if (moment) {
      setSelectedMomentForReflection(moment);
      setReflectionModalOpen(true);
    }
  };

  const handleViewEntryDetail = (momentId: number) => {
    const moment = moments.find(m => m.id === momentId);
    const connection = connections.find(c => c.id === moment?.connectionId);
    if (moment && connection) {
      setSelectedMomentForDetail(moment);
      setSelectedConnectionForDetail(connection);
      setEntryDetailModalOpen(true);
    }
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

  // Filter moments based on tab, search and selected connection
  const filteredMoments = moments.filter(moment => {
    const connection = connections.find(c => c.id === moment.connectionId);
    if (!connection) return false;
    
    const tags = moment.tags || [];
    
    // Filter by tab type
    let matchesTab = false;
    if (activeTab === 'timeline') {
      // Timeline shows ALL entries regardless of type
      matchesTab = true;
    } else if (activeTab === 'moments') {
      // Show regular moments (positive, negative, neutral) - exclude conflicts and intimacy
      const isConflict = tags.includes('Conflict') || moment.emoji === '⚡';
      const isIntimacy = moment.isIntimate === true || tags.includes('Intimacy') || moment.emoji === '💕';
      matchesTab = !isConflict && !isIntimacy;
    } else if (activeTab === 'conflicts') {
      // Show conflicts - check for conflict indicators
      matchesTab = tags.includes('Conflict') || moment.emoji === '⚡' || 
                   (moment.isResolved !== undefined) || 
                   (moment.resolutionNotes && moment.resolutionNotes.trim() !== '');
    } else if (activeTab === 'intimacy') {
      // Show intimacy entries
      matchesTab = moment.isIntimate === true || tags.includes('Intimacy') || moment.emoji === '💕';
    }
    
    const matchesSearch = moment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           connection.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConnection = selectedConnection ? moment.connectionId === selectedConnection : true;
    

    
    return matchesTab && matchesSearch && matchesConnection;
  });

  const groupedMoments = groupMomentsByDate(filteredMoments);
  const sortedDates = Object.keys(groupedMoments).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Page Title and Connection Picker */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold mb-4">Activities</h1>
          
          {/* Connection Picker - Primary Selection */}
          <Card className="p-4 bg-card/50 backdrop-blur-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Viewing activities for</h3>
              <span className="text-xs text-muted-foreground">
                {selectedConnection ? 
                  connections.find(c => c.id === selectedConnection)?.name || 'Unknown' : 
                  'All Connections'
                }
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {selectedConnection ? 
                      connections.find(c => c.id === selectedConnection)?.name || 'Select Connection' : 
                      'All Connections'
                    }
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" sideOffset={4}>
                <DropdownMenuItem 
                  onClick={() => setSelectedConnection(null)}
                  className="py-3 px-4 text-base"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">All</span>
                    </div>
                    <span>All Connections</span>
                  </div>
                </DropdownMenuItem>
                {connections.map((connection) => (
                  <DropdownMenuItem 
                    key={connection.id}
                    onClick={() => setSelectedConnection(connection.id)}
                    className="py-3 px-4 text-base"
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
                      <span>{connection.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
          
          {/* Main Activity Types - Single Row */}
          <div className="grid grid-cols-4 gap-1 bg-muted rounded-lg p-1 mb-3">
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
              onClick={() => setActiveTab('milestones')}
              className={`py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'milestones' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Milestones
            </button>
          </div>
          
          {/* Timeline Overview - Below main tabs */}
          <div className="mb-4">
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors border ${
                activeTab === 'timeline' 
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm' 
                  : 'border-muted bg-background text-foreground hover:border-primary/50'
              }`}
            >
              📅 Timeline
            </button>
          </div>

          {/* Add Button for Active Tab - Hide for Timeline */}
          {activeTab !== 'timeline' && (
            <div className="mb-4">
              <Button onClick={() => {
                if (activeTab === 'milestones') {
                  setMilestoneModalOpen(true);
                } else {
                  // Set the connection in modal context before opening
                  if (selectedConnection && connections.length > 0) {
                    const connection = connections.find(c => c.id === selectedConnection);
                    if (connection) {
                      setModalConnection(selectedConnection, connection);
                    }
                  } else {
                    // If "All Connections" is selected, clear the modal connection so user can choose
                    setModalConnection(null, null);
                  }
                  openMomentModal(activeTab === 'moments' ? 'moment' : activeTab === 'conflicts' ? 'conflict' : 'intimacy');
                }
              }} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab === 'moments' ? 'Moment' : 
                     activeTab === 'conflicts' ? 'Conflict' : 
                     activeTab === 'intimacy' ? 'Intimacy' : 
                     activeTab === 'milestones' ? 'Milestone' : ''}
              </Button>
            </div>
          )}
        </div>

        {/* Search Section */}
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
                
                <div className="space-y-8">
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
                              intimacy: 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-900/20 dark:border-pink-700 dark:text-pink-300'
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
                                      <span className="text-lg">{moment.emoji}</span>
                                      <span className="font-medium text-sm">{connection.name}</span>
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
          ) : activeTab === 'milestones' ? (
            // Milestones tab - display milestones
            (() => {
              const filteredMilestones = (milestones as any[]).filter((milestone: any) => {
                if (selectedConnection && milestone.connectionId !== selectedConnection) return false;
                if (searchTerm) {
                  return milestone.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         milestone.description?.toLowerCase().includes(searchTerm.toLowerCase());
                }
                return true;
              });

              return filteredMilestones.length > 0 ? (
                <div className="space-y-4">
                  {filteredMilestones.map((milestone: any) => {
                    const connection = connections.find(c => c.id === milestone.connectionId);
                    const getIcon = () => {
                      switch (milestone.icon) {
                        case 'heart': return '💖';
                        case 'star': return '⭐';
                        case 'gift': return '🎁';
                        case 'trophy': return '🏆';
                        case 'home': return '🏠';
                        case 'plane': return '✈️';
                        case 'ring': return '💍';
                        default: return '🎂';
                      }
                    };

                    return (
                      <Card key={milestone.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                            style={{ backgroundColor: milestone.color + '20', color: milestone.color }}
                          >
                            {getIcon()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold">{milestone.title}</h3>
                              {milestone.isAnniversary && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                  Anniversary
                                </span>
                              )}
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{format(new Date(milestone.date), 'MMM d, yyyy')}</span>
                              {connection && <span>with {connection.name}</span>}
                            </div>
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
                  <h3 className="font-semibold mb-1">No Milestones Yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create your first milestone to celebrate important moments
                  </p>
                </Card>
              );
            })()
          ) : filteredMoments.length > 0 ? (
            // Regular tabbed view
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
                          onViewDetail={handleViewEntryDetail}
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
    </div>
  );
}
