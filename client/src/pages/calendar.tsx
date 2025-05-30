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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Heart, Calendar as CalendarIcon, Plus, Eye, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useModal } from "@/contexts/modal-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from "date-fns";
import type { Moment, Connection, MenstrualCycle } from "@shared/schema";
import { EntryDetailModal } from "@/components/modals/entry-detail-modal";
import { PlanModal } from "@/components/modals/plan-modal";
import { MomentModal } from "@/components/modals/moment-modal";
import { apiRequest } from "@/lib/queryClient";

// Menstrual Cycle Tracker Component
function MenstrualCycleTracker() {
  const queryClient = useQueryClient();
  
  const { data: cycles = [] } = useQuery<MenstrualCycle[]>({
    queryKey: ["/api/menstrual-cycles"],
  });
  
  const createCycleMutation = useMutation({
    mutationFn: async (data: { startDate: string }) => {
      const response = await apiRequest("POST", "/api/menstrual-cycles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menstrual-cycles"] });
    },
  });
  
  const updateCycleMutation = useMutation({
    mutationFn: async ({ id, endDate }: { id: number; endDate: string }) => {
      const response = await apiRequest("PATCH", `/api/menstrual-cycles/${id}`, { endDate });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menstrual-cycles"] });
    },
  });

  const getCurrentCycle = () => {
    return cycles.find(cycle => cycle.startDate && !cycle.endDate);
  };

  const getLastCycle = () => {
    return cycles
      .filter(cycle => cycle.endDate)
      .sort((a, b) => new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime())[0];
  };

  const currentCycle = getCurrentCycle();
  const lastCycle = getLastCycle();

  const getDaysSinceStart = (startDate: string) => {
    return Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysSinceEnd = (endDate: string) => {
    return Math.floor((Date.now() - new Date(endDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleLogStart = () => {
    createCycleMutation.mutate({
      startDate: new Date().toISOString(),
    });
  };

  const handleLogEnd = () => {
    const currentCycle = getCurrentCycle();
    if (currentCycle) {
      updateCycleMutation.mutate({
        id: currentCycle.id,
        endDate: new Date().toISOString(),
      });
    }
  };

  if (cycles.length === 0 && !createCycleMutation.isPending) {
    return (
      <div className="px-4 py-3">
        <Card className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <section className="px-4 pb-3">
      <Card className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-pink-800 dark:text-pink-200">Cycle Tracker</h3>
          <Circle className="h-4 w-4 text-pink-500" />
        </div>
        
        {currentCycle ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-pink-600 dark:text-pink-300">
                Day {getDaysSinceStart(currentCycle.startDate!) + 1} of current cycle
              </p>
              <p className="text-xs text-pink-500 dark:text-pink-400">
                Started {format(new Date(currentCycle.startDate!), 'MMM d')}
              </p>
            </div>
            <Button 
              onClick={handleLogEnd}
              disabled={updateCycleMutation.isPending}
              size="sm"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            >
              {updateCycleMutation.isPending ? 'Ending...' : 'Log End'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lastCycle && (
              <p className="text-sm text-pink-600 dark:text-pink-300">
                {getDaysSinceEnd(lastCycle.endDate!)} days since last cycle ended
              </p>
            )}
            <Button 
              onClick={handleLogStart}
              disabled={createCycleMutation.isPending}
              size="sm"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            >
              {createCycleMutation.isPending ? 'Starting...' : 'Log Start'}
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}

export default function Calendar() {
  const { user } = useAuth();
  const { openMomentModal, setSelectedConnection, momentModalOpen, closeMomentModal, planModalOpen, closePlanModal } = useModal();
  const { mainFocusConnection, loading: focusLoading } = useRelationshipFocus();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Entry detail modal state
  const [selectedEntry, setSelectedEntry] = useState<Moment | null>(null);
  const [entryDetailOpen, setEntryDetailOpen] = useState(false);

  // Filter states for different entry types
  const [filters, setFilters] = useState({
    positive: true,
    intimacy: true,
    neutral: true,
    negative: true,
    conflict: true,
    plan: true,
    milestone: true,
  });
  
  // Connection filter state
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [hasUserSelectedConnection, setHasUserSelectedConnection] = useState(false);

  // Handle navigation connection filtering and focus connection
  useEffect(() => {
    // First check for navigation connection (highest priority)
    const navigationConnectionId = localStorage.getItem('navigationConnectionId');
    console.log("Calendar navigation check:", { navigationConnectionId });
    if (navigationConnectionId) {
      const connectionId = parseInt(navigationConnectionId);
      console.log("Setting calendar connection from navigation:", connectionId);
      setSelectedConnectionId(connectionId);
      setHasUserSelectedConnection(true);
      // Clear the navigation state after using it
      localStorage.removeItem('navigationConnectionId');
      return;
    }

    // Only use focus connection if user hasn't explicitly selected a connection
    if (!focusLoading && mainFocusConnection && !hasUserSelectedConnection) {
      console.log("Setting calendar connection from main focus:", mainFocusConnection.id);
      setSelectedConnectionId(mainFocusConnection.id);
    }
  }, [mainFocusConnection, focusLoading, hasUserSelectedConnection]);
  
  // Legend collapse state - start collapsed by default
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(true);

  // Fetch data
  const { data: allMoments = [], isLoading: momentsLoading } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    staleTime: 0,
  });

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["/api/milestones"],
  });

  // Filter moments based on selected connection
  const moments = selectedConnectionId
    ? allMoments.filter(moment => moment.connectionId === selectedConnectionId)
    : allMoments;

  console.log("All moments from query:", allMoments);
  console.log("Calendar Debug - Total moments:", moments.length, moments);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate view range based on view mode
  const getViewRange = () => {
    switch (viewMode) {
      case 'daily':
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case 'weekly':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return { start: weekStart, end: weekEnd };
      case 'monthly':
      default:
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        // Include days from previous/next month to fill the grid
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);
        return { start: calendarStart, end: calendarEnd };
    }
  };

  const { start: viewStart, end: viewEnd } = getViewRange();
  const calendarDays = eachDayOfInterval({ start: viewStart, end: viewEnd });

  const getMomentsForDay = (day: Date) => {
    return moments.filter(moment => {
      const momentDate = new Date(moment.createdAt || new Date());
      const match = isSameDay(momentDate, day);
      return match;
    });
  };

  const getMomentDisplayInfo = (moment: Moment) => {
    const connection = connections.find(c => c.id === moment.connectionId);
    
    // Determine color based on tags or type
    let color = 'bg-blue-500'; // default
    if (moment.tags?.includes('Green Flag') || moment.tags?.includes('Positive')) {
      color = 'bg-green-500';
    } else if (moment.tags?.includes('Red Flag') || moment.tags?.includes('Negative')) {
      color = 'bg-orange-500';
    } else if (moment.tags?.includes('Conflict')) {
      color = 'bg-red-500';
    } else if (moment.isIntimate || moment.tags?.includes('Intimacy')) {
      color = 'bg-pink-500';
    } else if (moment.tags?.includes('Plan')) {
      color = 'bg-purple-500';
    } else if (moment.tags?.includes('milestone')) {
      color = 'bg-amber-500';
    }

    return {
      type: moment.isIntimate ? 'intimacy' : 'moment',
      value: moment.emoji || '💭',
      color: color
    };
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setDayDetailOpen(true);
  };

  const handleEntryClick = (moment: Moment, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedEntry(moment);
    setEntryDetailOpen(true);
  };

  const renderCalendarView = () => {
    if (viewMode === 'daily') {
      const dayMoments = getMomentsForDay(currentDate);
      const dayMilestones = milestones.filter((milestone: any) => 
        isSameDay(new Date(milestone.date || milestone.createdAt), currentDate)
      );

      return (
        <Card className="p-4 bg-card/50 backdrop-blur-sm">
          <div 
            className={`min-h-32 p-3 rounded border-2 border-dashed cursor-pointer transition-colors ${
              isSameDay(currentDate, new Date()) ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40'
            }`}
            onClick={() => handleDayClick(currentDate)}
          >
            <div className="text-sm font-medium mb-2">
              {format(currentDate, 'EEEE, MMMM d')}
              {isSameDay(currentDate, new Date()) && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Today</span>
              )}
            </div>

            <div className="space-y-1">
              {viewMode === 'daily' ? (
                dayMoments.map((moment, index) => (
                  <div 
                    key={moment.id} 
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={(e) => handleEntryClick(moment, e)}
                  >
                    <span className="text-lg">{getMomentDisplayInfo(moment).value}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{moment.content}</div>
                      <div className="text-xs text-muted-foreground">
                        {connections.find(c => c.id === moment.connectionId)?.name}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-wrap gap-1">
                  {dayMoments.map((moment, index) => (
                    <div
                      key={moment.id}
                      className={`w-2 h-2 rounded-full ${getMomentDisplayInfo(moment).color} cursor-pointer`}
                      onClick={(e) => handleEntryClick(moment, e)}
                      title={moment.content}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-4 bg-card/50 backdrop-blur-sm">
        {/* Weekday Headers - only show for weekly and monthly views */}
        {viewMode !== 'daily' && (
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
        )}

        {/* Calendar Days */}
        <div className={`grid gap-1 ${
          viewMode === 'daily' ? 'grid-cols-1 gap-4' : 
          viewMode === 'weekly' ? 'grid-cols-7' : 
          'grid-cols-7'
        }`}>
          {/* Empty cells for days before month start (monthly view only) */}
          {viewMode === 'monthly' && Array.from({ length: getDay(viewStart) }).map((_, index) => (
            <div key={`empty-${index}`} className="h-16"></div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dayMoments = getMomentsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayMilestones = milestones.filter((milestone: any) => 
              isSameDay(new Date(milestone.date || milestone.createdAt), day)
            );

            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-16 p-1 border rounded cursor-pointer transition-all duration-200
                  ${isCurrentMonth ? 'border-border' : 'border-transparent'}
                  ${isToday ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}
                  ${!isCurrentMonth && viewMode === 'monthly' ? 'opacity-40' : ''}
                `}
                onClick={() => handleDayClick(day)}
              >
                <div className={`text-xs font-medium mb-1 ${
                  isToday ? 'text-primary font-bold' : 
                  isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {viewMode === 'daily' ? (
                    dayMoments.map((moment, index) => (
                      <div 
                        key={moment.id} 
                        className="flex items-center gap-1 p-1 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={(e) => handleEntryClick(moment, e)}
                      >
                        <span className="text-sm">{getMomentDisplayInfo(moment).value}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs truncate">{moment.content}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-wrap gap-0.5">
                      {dayMoments.map((moment, index) => (
                        <div
                          key={moment.id}
                          className={`w-1.5 h-1.5 rounded-full ${getMomentDisplayInfo(moment).color} cursor-pointer`}
                          onClick={(e) => handleEntryClick(moment, e)}
                          title={moment.content}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  if (momentsLoading) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
            <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <section className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
              <p className="text-sm text-muted-foreground">
                Track your relationship moments over time
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-primary" />
          </div>
        </section>

        {/* 1. Connection Picker (Card Style) */}
        <section className="px-4 pb-3">
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Viewing activities for</h3>
            </div>
            <Select
              value={selectedConnectionId ? selectedConnectionId.toString() : "all"}
              onValueChange={(value) => {
                setSelectedConnectionId(value === "all" ? null : parseInt(value));
                setHasUserSelectedConnection(true);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Connections">
                  {selectedConnectionId ? 
                    connections.find(c => c.id === selectedConnectionId)?.name || 'All Connections'
                    : 'All Connections'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Connections</SelectItem>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id.toString()}>
                    {connection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </section>

        {/* 2. Legend & Filters */}
        <section className="px-4 pb-3">
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Legend & Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
                className="h-6 w-6 p-0"
              >
                {isLegendCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {!isLegendCollapsed && (
              <>
                {/* Legend */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Positive</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Neutral</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span>Negative</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Conflict</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    <span>Intimacy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Plan</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>Milestone</span>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="positive"
                      checked={filters.positive}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, positive: !!checked }))
                      }
                    />
                    <label htmlFor="positive" className="text-xs">Positive</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="neutral"
                      checked={filters.neutral}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, neutral: !!checked }))
                      }
                    />
                    <label htmlFor="neutral" className="text-xs">Neutral</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="negative"
                      checked={filters.negative}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, negative: !!checked }))
                      }
                    />
                    <label htmlFor="negative" className="text-xs">Negative</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="conflict"
                      checked={filters.conflict}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, conflict: !!checked }))
                      }
                    />
                    <label htmlFor="conflict" className="text-xs">Conflict</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="intimacy"
                      checked={filters.intimacy}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, intimacy: !!checked }))
                      }
                    />
                    <label htmlFor="intimacy" className="text-xs">Intimacy</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="plan"
                      checked={filters.plan}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, plan: !!checked }))
                      }
                    />
                    <label htmlFor="plan" className="text-xs">Plan</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="milestone"
                      checked={filters.milestone}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, milestone: !!checked }))
                      }
                    />
                    <label htmlFor="milestone" className="text-xs">Milestone</label>
                  </div>
                </div>
              </>
            )}
          </Card>
        </section>

        {/* 3. View Picker and Navigation */}
        <section className="px-4 pb-3">
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            {/* View Mode Selector */}
            <div className="flex gap-1 justify-center mb-3">
              <Button
                variant={viewMode === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("monthly")}
                className="text-xs px-2 h-7"
              >
                Month
              </Button>
              <Button
                variant={viewMode === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("weekly")}
                className="text-xs px-2 h-7"
              >
                Week
              </Button>
              <Button
                variant={viewMode === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("daily")}
                className="text-xs px-2 h-7"
              >
                Day
              </Button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentDate(newDate);
                }}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 text-sm font-medium"
                  >
                    {format(currentDate, 'MMMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <DatePicker
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentDate(date);
                        setDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentDate(newDate);
                }}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </section>

        {/* Calendar Grid */}
        <section className="px-4 pb-3">{renderCalendarView()}</section>

        {/* 4. Monthly Metrics */}
        <section className="px-4 pb-3">
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            <h3 className="text-sm font-medium mb-3">This Month</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           m.tags?.some(tag => ["Green Flag", "Positive"].includes(tag));
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Positive</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           m.tags?.some(tag => ["Blue Flag", "Neutral", "Communication"].includes(tag));
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Neutral</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           m.tags?.includes("Conflict");
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Conflicts</div>
              </div>
              <div>
                <div className="text-lg font-bold text-pink-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           (m.isIntimate || m.tags?.includes("Intimacy"));
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Intimacy</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           m.tags?.includes("Plan");
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Plans</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           m.tags?.includes("milestone");
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Milestones</div>
              </div>
            </div>
          </Card>
        </section>

        {/* 5. Cycle Tracker */}
        <MenstrualCycleTracker />
      </main>
      <BottomNavigation />

      {/* Modals */}
      <Dialog open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay, 'EEEE, MMMM d')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedDay && getMomentsForDay(selectedDay).map((moment) => (
              <div 
                key={moment.id} 
                className="p-2 rounded border cursor-pointer hover:bg-muted/50"
                onClick={() => handleEntryClick(moment)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{moment.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{moment.content}</div>
                    <div className="text-xs text-muted-foreground">
                      {connections.find(c => c.id === moment.connectionId)?.name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <EntryDetailModal
        isOpen={entryDetailOpen}
        onClose={() => setEntryDetailOpen(false)}
        moment={selectedEntry}
      />

      <MomentModal />
      <PlanModal />
    </div>
  );
}