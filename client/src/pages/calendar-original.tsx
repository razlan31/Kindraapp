import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Heart, Calendar as CalendarIcon, Plus, Eye, ChevronDown, ChevronUp, Circle, Camera, X, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useModal } from "@/contexts/modal-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay, differenceInDays } from "date-fns";
import type { Moment, Connection, MenstrualCycle } from "@shared/schema";
import { EntryDetailModal } from "@/components/modals/entry-detail-modal";
import { PlanModal } from "@/components/modals/plan-modal";
import { MomentModal } from "@/components/modals/moment-modal";
import { apiRequest } from "@/lib/queryClient";
import { getCyclePhaseForDay, getCycleDisplayInfo, calculateCycleLength, getDetailedCyclePhase, calculateOvulationDay } from "@/lib/cycle-utils";

function MenstrualCycleTracker({ selectedConnectionIds }: { selectedConnectionIds: number[] }) {
  const { data: cycles = [], isLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
  });

  const getCurrentCycle = () => {
    // Filter cycles based on selected connections (using calendar's variable)
    const filteredCycles = selectedConnectionIds.length === 0 ? cycles : cycles.filter(cycle => {
      return selectedConnectionIds.some(selectedId => {
        if (selectedId === 0) {
          return cycle.connectionId === null; // User's cycles
        } else {
          return cycle.connectionId === selectedId; // Connection's cycles
        }
      });
    });
    
    // Find the current cycle (one without end date) - same logic as cycle tracker
    return filteredCycles.find(cycle => !cycle.cycleEndDate);
  };

  const getDaysSinceStart = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const currentCycle = getCurrentCycle();

  if (isLoading) {
    return <div className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>;
  }

  if (!currentCycle) {
    return null;
  }

  const daysSinceStart = getDaysSinceStart(currentCycle.periodStartDate);
  const cycleLength = calculateCycleLength(currentCycle);
  const phase = getCyclePhaseForDay(new Date(), cycles.filter(c => c.connectionId === currentCycle.connectionId));

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">Cycle Day {daysSinceStart}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {phase?.detailedInfo?.description || 'Tracking active'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl mb-1">{phase?.detailedInfo?.emoji || '🩸'}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {cycleLength}-day cycle
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  const { user, loading } = useAuth();
  const { openMomentModal, openPlanModal } = useModal();
  const [location] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDetailModalOpen, setDayDetailModalOpen] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<number[]>([]);
  const [showConnectionFilter, setShowConnectionFilter] = useState(false);
  const [momentDetailModalOpen, setMomentDetailModalOpen] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [momentModalOpen, setMomentModalOpen] = useState(false);
  const [showCycleFilter, setShowCycleFilter] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the view start and end dates
  const getViewDates = () => {
    switch (viewMode) {
      case 'weekly':
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        };
      case 'daily':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        };
      case 'monthly':
      default:
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return {
          start: startOfWeek(monthStart),
          end: endOfWeek(monthEnd)
        };
    }
  };

  const { start: viewStart, end: viewEnd } = getViewDates();

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

  const { data: cycles = [], isLoading: cyclesLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  console.log("Calendar Debug - Total moments:", moments.length, moments);
  console.log("Calendar State:", {
    currentDate: currentDate.toISOString().split('T')[0],
    viewMode,
    viewStart: viewStart.toISOString().split('T')[0],
    viewEnd: viewEnd.toISOString().split('T')[0],
    selectedConnections,
    showCycleFilter
  });

  // Filter moments by selected connections
  const filteredMoments = selectedConnections.length === 0 
    ? moments 
    : moments.filter(moment => selectedConnections.includes(moment.connectionId));

  // Filter cycles by selected connections  
  const filteredCycles = selectedConnections.length === 0 
    ? cycles 
    : cycles.filter(cycle => 
        cycle.connectionId === null || selectedConnections.includes(cycle.connectionId)
      );

  // Get all days in the view
  const viewDays = eachDayOfInterval({ start: viewStart, end: viewEnd });

  const getMomentsForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    return filteredMoments.filter(moment => {
      const momentDate = new Date(moment.createdAt);
      return momentDate >= dayStart && momentDate <= dayEnd;
    });
  };

  const getCycleInfoForDay = (date: Date) => {
    if (!showCycleFilter) return null;
    
    console.log(`🔍 ${format(date, 'MMM d')}: CALENDAR DAY PROCESSING START`);
    console.log(`🔍 ${format(date, 'MMM d')}: PROCESSING - cycles loaded (cyclesLoading: ${cyclesLoading}, cycles.length: ${cycles.length})`);
    
    if (cyclesLoading || cycles.length === 0) {
      console.log(`🔍 ${format(date, 'MMM d')}: No cycles available yet`);
      return null;
    }

    const cycleInfos = [];
    
    // Process cycles for each selected connection
    const connectionsToCheck = selectedConnections.length === 0 
      ? [...new Set([...cycles.map(c => c.connectionId).filter(Boolean), null])] 
      : selectedConnections;

    for (const connectionId of connectionsToCheck) {
      if (connectionId === null || connectionId === 0) continue; // Skip user cycles for now
      
      console.log(`🔍 ${format(date, 'MMM d')}: About to call getCyclePhaseForDay with connectionId ${connectionId}`);
      
      const cyclePhase = getCyclePhaseForDay(date, cycles, connectionId);
      
      console.log(`🔍 ${format(date, 'MMM d')}: getCyclePhaseForDay returned:`, cyclePhase);
      
      if (cyclePhase) {
        const connection = connections.find(c => c.id === connectionId);
        cycleInfos.push({
          ...cyclePhase,
          connectionName: connection?.name || 'Unknown',
          connectionId
        });
      }
    }

    return cycleInfos.length > 0 ? cycleInfos : null;
  };

  const getConnectionsForDay = (date: Date) => {
    const dayMoments = getMomentsForDay(date);
    const connectionIds = [...new Set(dayMoments.map(m => m.connectionId))];
    return connections.filter(c => connectionIds.includes(c.id));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDayDetailModalOpen(true);
  };

  const handleMomentClick = (moment: Moment) => {
    setSelectedMoment(moment);
    setMomentDetailModalOpen(true);
  };

  const toggleConnectionSelection = (connectionId: number) => {
    setSelectedConnections(prev => {
      if (prev.includes(connectionId)) {
        return prev.filter(id => id !== connectionId);
      } else {
        return [...prev, connectionId];
      }
    });
  };

  const isConnectionSelected = (connectionId: number) => {
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

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
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
      setIsCreatingConnection(false);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConnectionSubmit = async (formData: FormData) => {
    await createConnectionMutation.mutateAsync(formData);
  };

  const renderCalendarGrid = () => {
    const weeks = [];
    let currentWeek = [];

    viewDays.forEach((day, index) => {
      const dayMoments = getMomentsForDay(day);
      const cycleInfo = getCycleInfoForDay(day);
      const dayConnections = getConnectionsForDay(day);
      const isToday = isSameDay(day, new Date());
      const isCurrentMonth = isSameMonth(day, currentDate);

      // Priority-based display system
      const displayItems = [];

      // Priority 1: Activity emojis (highest priority)
      const activityEmojis = dayMoments.map(m => m.emoji).filter(Boolean).slice(0, viewMode === 'daily' ? 6 : viewMode === 'weekly' ? 4 : 3);
      displayItems.push(...activityEmojis);

      // Priority 2: Connection letters (medium priority - only if space available)
      const maxConnectionLetters = Math.max(0, (viewMode === 'daily' ? 3 : viewMode === 'weekly' ? 2 : 1) - displayItems.length);
      if (maxConnectionLetters > 0) {
        const connectionLetters = dayConnections.slice(0, maxConnectionLetters).map(conn => {
          const phase = cycleInfo?.find(info => info.connectionId === conn.id);
          return {
            letter: conn.name.charAt(0).toUpperCase(),
            color: phase?.detailedInfo?.color || 'bg-blue-500'
          };
        });
        displayItems.push(...connectionLetters);
      }

      // Priority 3: Cycle emojis (lowest priority - only prominent phases, only if plenty of space)
      const maxCycleEmojis = Math.max(0, (viewMode === 'daily' ? 2 : viewMode === 'weekly' ? 1 : 1) - displayItems.length);
      if (maxCycleEmojis > 0 && showCycleFilter && cycleInfo) {
        const prominentCycleEmojis = cycleInfo
          .filter(info => ['menstrual', 'fertile', 'ovulation'].includes(info.phase))
          .slice(0, maxCycleEmojis)
          .map(info => info.detailedInfo?.emoji)
          .filter(Boolean);
        displayItems.push(...prominentCycleEmojis);
      }

      const dayElement = (
        <div
          key={day.toISOString()}
          onClick={() => handleDayClick(day)}
          className={`
            aspect-square p-1 border border-gray-200 dark:border-gray-700 cursor-pointer 
            hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative
            ${isToday ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''}
            ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
            ${cycleInfo && showCycleFilter ? cycleInfo[0]?.detailedInfo?.color?.split(' ').slice(0, 2).join(' ') || '' : ''}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="text-xs font-medium mb-1">{format(day, 'd')}</div>
            <div className="flex-1 flex flex-wrap items-start gap-0.5 overflow-hidden">
              {displayItems.map((item, idx) => (
                <div key={idx} className="flex-shrink-0">
                  {typeof item === 'string' ? (
                    <span className="text-xs">{item}</span>
                  ) : (
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${item.color?.split(' ').slice(0, 2).join(' ') || 'bg-blue-500'}`}>
                      {item.letter}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      currentWeek.push(dayElement);

      if (currentWeek.length === 7 || index === viewDays.length - 1) {
        weeks.push(
          <div key={weeks.length} className="grid grid-cols-7 gap-0">
            {currentWeek}
          </div>
        );
        currentWeek = [];
      }
    });

    return weeks;
  };

  const renderDayView = () => {
    const dayMoments = getMomentsForDay(currentDate);
    const cycleInfo = getCycleInfoForDay(currentDate);

    return (
      <div className="space-y-4">
        {/* Day Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM d, yyyy')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {format(currentDate, 'EEEE')}
          </p>
        </div>

        {/* Cycle Information */}
        {cycleInfo && showCycleFilter && (
          <div className="space-y-3">
            {cycleInfo.map((info, index) => (
              <Card key={index} className={`p-4 ${info.detailedInfo?.color || 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {info.connectionName} - {info.detailedInfo?.description}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cycle Day {info.day} • {info.detailedInfo?.dayRange}
                    </p>
                  </div>
                  <div className="text-2xl">{info.detailedInfo?.emoji}</div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {info.detailedInfo?.hormonalProfile}
                  </p>
                  {info.detailedInfo?.recommendations && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Recommendations:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                        {info.detailedInfo.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Activities */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Activities</h3>
          {dayMoments.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activities on this day</p>
                <Button 
                  onClick={() => openMomentModal('moment', undefined, currentDate)}
                  size="sm"
                  className="mt-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </div>
            </Card>
          ) : (
            dayMoments.map((moment) => {
              const connection = connections.find(c => c.id === moment.connectionId);
              return (
                <Card 
                  key={moment.id} 
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleMomentClick(moment)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{moment.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {moment.title || 'Untitled'}
                        </h4>
                        {moment.isPrivate && (
                          <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded-full">
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {moment.content}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        {connection && (
                          <span className="flex items-center">
                            <Avatar className="h-4 w-4 mr-1">
                              <AvatarImage src={connection.profileImage || undefined} />
                              <AvatarFallback className="text-xs">
                                {connection.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {connection.name}
                          </span>
                        )}
                        <span>{format(new Date(moment.createdAt), 'h:mm a')}</span>
                        {moment.tags && moment.tags.length > 0 && (
                          <span>#{moment.tags.join(' #')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
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
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          </div>
          <Button 
            onClick={() => openMomentModal('moment', undefined, currentDate)}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>

        {/* Cycle Tracker */}
        <MenstrualCycleTracker selectedConnectionIds={selectedConnections} />

        {/* View Controls */}
        <div className="flex items-center justify-between mb-4">
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'daily') {
                  newDate.setDate(newDate.getDate() - 1);
                } else if (viewMode === 'weekly') {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setMonth(newDate.getMonth() - 1);
                }
                setCurrentDate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[140px] text-center">
              {viewMode === 'daily' 
                ? format(currentDate, 'MMM d, yyyy')
                : viewMode === 'weekly'
                ? `${format(viewStart, 'MMM d')} - ${format(viewEnd, 'MMM d')}`
                : format(currentDate, 'MMMM yyyy')
              }
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'daily') {
                  newDate.setDate(newDate.getDate() + 1);
                } else if (viewMode === 'weekly') {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setMonth(newDate.getMonth() + 1);
                }
                setCurrentDate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View Mode Selector */}
          <Select value={viewMode} onValueChange={(value: 'monthly' | 'weekly' | 'daily') => setViewMode(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Month</SelectItem>
              <SelectItem value="weekly">Week</SelectItem>
              <SelectItem value="daily">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mb-4">
          {/* Connection Filter */}
          <DropdownMenu open={showConnectionFilter} onOpenChange={setShowConnectionFilter}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                {getSelectedConnectionsText()}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuCheckboxItem
                checked={selectedConnections.length === 0}
                onCheckedChange={() => setSelectedConnections([])}
              >
                All Connections
              </DropdownMenuCheckboxItem>
              {connections.map((connection) => (
                <DropdownMenuCheckboxItem
                  key={connection.id}
                  checked={isConnectionSelected(connection.id)}
                  onCheckedChange={() => toggleConnectionSelection(connection.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={connection.profileImage || undefined} />
                      <AvatarFallback className="text-xs">
                        {connection.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{connection.name}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cycle Filter Toggle */}
          <Button
            variant={showCycleFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCycleFilter(!showCycleFilter)}
            className="flex-shrink-0"
          >
            <Circle className="h-4 w-4 mr-2" />
            Cycles
          </Button>
        </div>

        {/* Legend (only show when cycle filter is active) */}
        {showCycleFilter && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Cycle Legend</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span>🩸</span>
                <span className="text-gray-600 dark:text-gray-400">Menstrual</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🌱</span>
                <span className="text-gray-600 dark:text-gray-400">Follicular</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🌸</span>
                <span className="text-gray-600 dark:text-gray-400">Fertile</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🥚</span>
                <span className="text-gray-600 dark:text-gray-400">Ovulation</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🌙</span>
                <span className="text-gray-600 dark:text-gray-400">Luteal</span>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Content */}
        {viewMode === 'daily' ? (
          renderDayView()
        ) : (
          <div className="space-y-0">
            {/* Week Days Header */}
            {viewMode === 'monthly' && (
              <div className="grid grid-cols-7 gap-0 mb-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>
            )}
            
            {/* Calendar Grid */}
            <div className="space-y-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {renderCalendarGrid()}
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />

      {/* Day Detail Modal */}
      <Dialog open={dayDetailModalOpen} onOpenChange={setDayDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDate && (
            <div className="space-y-4">
              {/* Cycle Information Cards */}
              {(() => {
                const cycleInfo = getCycleInfoForDay(selectedDate);
                if (cycleInfo && showCycleFilter) {
                  return (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">Cycle Information</h4>
                      {cycleInfo.map((info, index) => (
                        <Card key={index} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {info.connectionName}
                            </h5>
                            <div className="text-2xl">{info.detailedInfo?.emoji}</div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Phase:</span> {info.detailedInfo?.description}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Day:</span> {info.day} ({info.detailedInfo?.dayRange})
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {info.detailedInfo?.hormonalProfile}
                            </p>
                            {info.detailedInfo?.recommendations && (
                              <div className="mt-2">
                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Recommendations:</p>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                                  {info.detailedInfo.recommendations.map((rec, idx) => (
                                    <li key={idx}>• {rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Activity Cards */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Activities</h4>
                {(() => {
                  const dayMoments = getMomentsForDay(selectedDate);
                  
                  if (dayMoments.length === 0) {
                    return (
                      <div className="text-center py-6">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          No activities on this day
                        </p>
                        <Button 
                          onClick={() => {
                            setDayDetailModalOpen(false);
                            openMomentModal('moment', undefined, selectedDate);
                          }}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Activity
                        </Button>
                      </div>
                    );
                  }

                  return dayMoments.map((moment) => {
                    const connection = connections.find(c => c.id === moment.connectionId);
                    return (
                      <Card 
                        key={moment.id} 
                        className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setDayDetailModalOpen(false);
                          handleMomentClick(moment);
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-xl">{moment.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                {moment.title || 'Untitled'}
                              </h5>
                              {moment.isPrivate && (
                                <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                  Private
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {moment.content}
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                              {connection && (
                                <span className="flex items-center">
                                  <Avatar className="h-3 w-3 mr-1">
                                    <AvatarImage src={connection.profileImage || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {connection.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {connection.name}
                                </span>
                              )}
                              <span>{format(new Date(moment.createdAt), 'h:mm a')}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  });
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  onClick={() => {
                    setDayDetailModalOpen(false);
                    openMomentModal('moment', undefined, selectedDate);
                  }}
                  className="flex-1"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
                <Button 
                  onClick={() => {
                    setDayDetailModalOpen(false);
                    openPlanModal(undefined, selectedDate);
                  }}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Moment Detail Modal */}
      <EntryDetailModal
        isOpen={momentDetailModalOpen}
        onClose={() => setMomentDetailModalOpen(false)}
        moment={selectedMoment}
        connection={selectedMoment ? connections.find(c => c.id === selectedMoment.connectionId) || null : null}
      />
    </div>
  );
}