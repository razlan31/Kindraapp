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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from "date-fns";
import type { Moment, Connection, MenstrualCycle } from "@shared/schema";
import { EntryDetailModal } from "@/components/modals/entry-detail-modal";
import { PlanModal } from "@/components/modals/plan-modal";
import { MomentModal } from "@/components/modals/moment-modal";
import { apiRequest } from "@/lib/queryClient";

function MenstrualCycleTracker() {
  const { data: cycles = [], isLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
  });

  const getCurrentCycle = () => {
    return cycles.find(cycle => !cycle.cycleEndDate);
  };

  const getDaysSinceStart = (startDate: string) => {
    return Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const [, setLocation] = useLocation();

  if (isLoading) {
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

  const currentCycle = getCurrentCycle();

  return (
    <div className="px-4 py-3">
      <Card className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border-pink-200 dark:border-pink-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-pink-800 dark:text-pink-200">Cycle Tracker</h3>
          <Circle className="h-4 w-4 text-pink-500" />
        </div>
        
        {currentCycle ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-pink-600 dark:text-pink-300">
                Day {getDaysSinceStart(currentCycle.periodStartDate.toString()) + 1} of current cycle
              </p>
              <p className="text-xs text-pink-500 dark:text-pink-400">
                Started {format(currentCycle.periodStartDate, 'MMM d')}
              </p>
            </div>
            <Button 
              onClick={() => setLocation('/menstrual-cycle')}
              size="sm"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            >
              View Full Tracker
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-pink-600 dark:text-pink-300">
              Track your menstrual cycle and symptoms
            </p>
            <Button 
              onClick={() => setLocation('/menstrual-cycle')}
              size="sm"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            >
              Open Cycle Tracker
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function Calendar() {
  const { user } = useAuth();
  const { openMomentModal, setSelectedConnection, momentModalOpen, closeMomentModal, planModalOpen, closePlanModal } = useModal();
  const { mainFocusConnection, loading: focusLoading } = useRelationshipFocus();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 16)); // Force May 16, 2025 to test ovulation
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
    neutral: true,
    negative: true,
    conflicts: true,
    intimacy: true,
    plans: true,
    milestones: true,
    menstrualCycle: true,
  });
  
  // Connection filter state
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<number[]>([]);
  const [hasUserSelectedConnection, setHasUserSelectedConnection] = useState(false);

  // Connection modal state
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle navigation connection filtering and focus connection
  useEffect(() => {
    // First check for navigation connection (highest priority)
    const navigationConnectionId = localStorage.getItem('navigationConnectionId');
    console.log("Calendar navigation check:", { navigationConnectionId });
    if (navigationConnectionId) {
      const connectionId = parseInt(navigationConnectionId);
      console.log("Setting calendar connection from navigation:", connectionId);
      setSelectedConnectionId(connectionId);
      setSelectedConnectionIds([connectionId]); // CRITICAL FIX: Sync both state variables
      setHasUserSelectedConnection(true);
      // Clear the navigation state after using it
      localStorage.removeItem('navigationConnectionId');
      return;
    }

    // If no navigation connection and user hasn't manually selected, use focus connection
    if (!hasUserSelectedConnection && mainFocusConnection && !focusLoading) {
      console.log("Setting calendar to focus connection:", mainFocusConnection.name);
      setSelectedConnectionId(mainFocusConnection.id);
      setSelectedConnectionIds([mainFocusConnection.id]);
    }
  }, [mainFocusConnection, focusLoading, hasUserSelectedConnection]);
  
  // Legend collapse state - start collapsed by default
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(true);

  // Fetch moments with same settings as other pages
  const { data: allMoments = [], isLoading: momentsLoading, refetch: refetchMoments } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    staleTime: 0,
  });

  // Fetch connections for the picker
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    staleTime: 0,
  });

  // Fetch milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ["/api/milestones", selectedConnectionId],
    staleTime: 0,
  });

  // Fetch menstrual cycles with aggressive cache invalidation
  const { data: cycles = [], refetch: refetchCycles, isLoading: cyclesLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // DEBUG: Comprehensive cycle debugging
  console.log('🔍 Calendar cycles data loaded:', {
    cyclesLength: cycles.length,
    cycles: cycles,
    timestamp: new Date().toISOString()
  });

  // FORCE CLEAR ANY CACHED CYCLES - ensure empty state
  useEffect(() => {
    // Clear any potential localStorage cycle data regardless of cycles.length
    localStorage.removeItem('menstrual-cycles');
    localStorage.removeItem('cycle-cache');
    localStorage.removeItem('cycles');
    localStorage.removeItem('cyclePhases');
    localStorage.removeItem('cycleDisplay');
    
    // Also clear any potential session storage
    sessionStorage.removeItem('menstrual-cycles');
    sessionStorage.removeItem('cycle-cache');
    sessionStorage.removeItem('cycles');
    
    // Force invalidate React Query cache for cycles
    queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
    queryClient.removeQueries({ queryKey: ['/api/menstrual-cycles'] });
    
    console.log('🔍 AGGRESSIVE CACHE CLEAR: Cleared all cycle-related storage');
  }, []); // Run only once on mount

  // Additional debug for June 16th specifically
  const today = new Date();
  const june16 = new Date('2025-06-16');
  if (format(today, 'yyyy-MM-dd') === '2025-06-16') {
    console.log('🔍 Today is June 16th - cycle data check:', {
      cyclesLength: cycles.length,
      hasAnyDatabaseCycles: cycles.length > 0,
      allCycleIds: cycles.map(c => c.id),
      allConnectionIds: cycles.map(c => c.connectionId)
    });
  }



  // Menstrual cycle calculation functions
  const getCyclePhaseForDay = (day: Date, connectionId: number | null) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    // CRITICAL FIX: If no cycles exist at all, return null immediately
    if (!cycles || cycles.length === 0) {
      if (dayStr === '2025-06-16') {
        console.log(`🔍 June 16th returning null - no cycles exist (cycles.length: ${cycles.length})`);
      }
      return null;
    }
    
    // Debug logging for May 16th specifically
    if (dayStr === '2025-05-16') {
      console.log(`🔍 MAY 16th getCyclePhaseForDay called with connectionId: ${connectionId}, cycles.length: ${cycles.length}`);
      console.log(`🔍 MAY 16th cycles data:`, cycles.map(c => ({
        id: c.id,
        connectionId: c.connectionId, 
        start: format(new Date(c.periodStartDate), 'yyyy-MM-dd'),
        end: c.cycleEndDate ? format(new Date(c.cycleEndDate), 'yyyy-MM-dd') : 'null'
      })));
      console.log(`🔍 MAY 16th relevantCycles for connection ${connectionId}:`, cycles.filter(c => c.connectionId === connectionId));
    }
    
    if (!connectionId) {
      if (dayStr === '2025-06-16') {
        console.log(`🔍 June 16th returning null - no connectionId`);
      }
      return null;
    }
    

    

    
    // SIMPLIFIED FILTERING: Always show cycles for all connections, filtering happens at display level
    // This ensures cycle calculations work properly
    
    const relevantCycles = cycles.filter(cycle => cycle.connectionId === connectionId);
    
    // If no cycles exist for this connection, return null
    if (relevantCycles.length === 0) {
      return null;
    }
    
    // Find the cycle that contains this day
    for (const cycle of relevantCycles) {
      const cycleStart = new Date(cycle.periodStartDate);
      const cycleEnd = cycle.cycleEndDate ? new Date(cycle.cycleEndDate) : null;
      
      // Only process cycles with complete data
      if (!cycleEnd || day < cycleStart || day > cycleEnd) {
        continue;
      }
      
      // Calculate day of cycle (1-based)
      const dayOfCycle = Math.floor((day.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate cycle length
      const cycleLength = Math.floor((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate period length 
      const periodEnd = cycle.periodEndDate ? new Date(cycle.periodEndDate) : null;
      const periodLength = periodEnd ? Math.floor((periodEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 5;
      
      // Ovulation is 14 days before cycle end
      // For May 1-30 cycle (30 days), ovulation should be day 16
      const ovulationDay = cycleLength - 14;
      
      // Debug for May 16th specifically 
      if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
        console.log(`🔍 MAY 16th DETAILED CALCULATION:`, {
          dayOfCycle,
          ovulationDay,
          cycleLength,
          periodLength,
          'dayOfCycle === ovulationDay': dayOfCycle === ovulationDay,
          'dayOfCycle <= periodLength': dayOfCycle <= periodLength,
          'fertile window check': `${ovulationDay - 2} <= ${dayOfCycle} <= ${ovulationDay + 2}`,
          'is in fertile window': dayOfCycle >= ovulationDay - 2 && dayOfCycle <= ovulationDay + 2,
          cycleStart: format(cycleStart, 'yyyy-MM-dd'),
          cycleEnd: cycleEnd ? format(cycleEnd, 'yyyy-MM-dd') : 'null',
          periodStart: format(new Date(cycle.periodStartDate), 'yyyy-MM-dd'),
          periodEnd: cycle.periodEndDate ? format(new Date(cycle.periodEndDate), 'yyyy-MM-dd') : 'null'
        });
      }
      
      // Simple phase calculation with ovulation priority
      if (dayOfCycle <= periodLength) {
        if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
          console.log(`🩸 MAY 16th: MENSTRUAL phase (dayOfCycle ${dayOfCycle} <= periodLength ${periodLength})`);
        }
        return { phase: 'menstrual', day: dayOfCycle, cycle };
      } else if (dayOfCycle === ovulationDay) {
        if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
          console.log(`🔵 MAY 16th: OVULATION phase (dayOfCycle ${dayOfCycle} === ovulationDay ${ovulationDay})`);
        }
        return { phase: 'ovulation', day: dayOfCycle, cycle };
      } else if (dayOfCycle >= ovulationDay - 2 && dayOfCycle <= ovulationDay + 2) {
        if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
          console.log(`💜 MAY 16th: FERTILE phase (${ovulationDay - 2} <= ${dayOfCycle} <= ${ovulationDay + 2})`);
        }
        return { phase: 'fertile', day: dayOfCycle, cycle, isOvulation: false };
      } else if (dayOfCycle < ovulationDay) {
        if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
          console.log(`🌱 MAY 16th: FOLLICULAR phase (dayOfCycle ${dayOfCycle} < ovulationDay ${ovulationDay})`);
        }
        return { phase: 'follicular', day: dayOfCycle, cycle };
      } else {
        if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
          console.log(`🌙 MAY 16th: LUTEAL phase (dayOfCycle ${dayOfCycle} > ovulationDay ${ovulationDay})`);
        }
        return { phase: 'luteal', day: dayOfCycle, cycle };
      }
    }
    
    return null;
  };

  const getCycleDisplayInfo = (phaseInfo: any) => {
    if (!phaseInfo) return null;
    
    // Use detailed phase info if available
    const detailedInfo = phaseInfo.detailedInfo;
    if (detailedInfo) {
      return {
        color: detailedInfo.color,
        indicator: detailedInfo.emoji,
        title: `${detailedInfo.description} - Day ${phaseInfo.day}`,
        description: `${detailedInfo.subPhase.replace('_', ' ')} (${detailedInfo.dayRange})`,
        hormonalProfile: detailedInfo.hormonalProfile,
        recommendations: detailedInfo.recommendations
      };
    }
    
    // Fallback to basic phase display
    switch (phaseInfo.phase) {
      case 'menstrual':
        return {
          color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
          indicator: '🩸',
          title: `Period Day ${phaseInfo.day}`,
          description: 'Menstrual phase'
        };
      case 'follicular':
        return {
          color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
          indicator: '🌱',
          title: `Cycle Day ${phaseInfo.day}`,
          description: 'Follicular phase'
        };
      case 'ovulation':
        return {
          color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
          indicator: '🔵',
          title: `Ovulation Day ${phaseInfo.day}`,
          description: 'Ovulation'
        };
      case 'fertile':
        return {
          color: phaseInfo.isOvulation 
            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
            : 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
          indicator: phaseInfo.isOvulation ? '🔵' : '💜',
          title: phaseInfo.isOvulation ? `Ovulation Day ${phaseInfo.day}` : `Fertile Day ${phaseInfo.day}`,
          description: phaseInfo.isOvulation ? 'Ovulation' : 'Fertile window'
        };
      case 'luteal':
        return {
          color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
          indicator: '🌙',
          title: `Cycle Day ${phaseInfo.day}`,
          description: 'Luteal phase'
        };
      default:
        return null;
    }
  };

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



  // Use only real moments from the database
  const allCalendarEntries = allMoments;

  // Filter moments based on selected filters and connection
  const moments = allCalendarEntries.filter(moment => {
    // Connection filter - use array-based filtering
    if (selectedConnectionIds.length > 0 && !selectedConnectionIds.includes(moment.connectionId)) {
      console.log(`Filtered out moment ${moment.id} - connection not selected`, moment.connectionId, selectedConnectionIds);
      return false;
    }
    
    // Check different moment types
    const isConflict = moment.tags?.includes('Conflict') || moment.emoji === '⚡';
    const isIntimacy = moment.tags?.includes('Sex') || moment.isIntimate || moment.emoji === '💕';
    const isPlan = moment.tags?.includes('Plan') || moment.emoji === '📅';
    const isMilestone = moment.isMilestone || moment.tags?.includes('Milestone') || moment.emoji === '🏆' || (moment as any).isBirthday;
    
    // Type filters
    if (isConflict && !filters.conflicts) {
      console.log(`Filtered out moment ${moment.id} - conflict filter off`);
      return false;
    }
    if (isIntimacy && !filters.intimacy) {
      console.log(`Filtered out moment ${moment.id} - intimacy filter off`);
      return false;
    }
    if (isPlan && !filters.plans) {
      console.log(`Filtered out moment ${moment.id} - plan filter off`);
      return false;
    }
    if (isMilestone && !filters.milestones) {
      console.log(`Filtered out moment ${moment.id} - milestone filter off`);
      return false;
    }
    
    // For regular moments, check emoji to determine type
    if (!isConflict && !isIntimacy && !isPlan && !isMilestone) {
      const isPositive = ['😊', '😍', '❤️', '🥰', '💖', '✨', '🔥'].includes(moment.emoji);
      const isNegative = ['😕', '😔', '😢', '😠', '😞', '😤'].includes(moment.emoji);
      const isNeutral = ['🌱', '🗣️'].includes(moment.emoji);
      
      if (isPositive && !filters.positive) {
        console.log(`Filtered out moment ${moment.id} - positive filter off`);
        return false;
      }
      if (isNegative && !filters.negative) {
        console.log(`Filtered out moment ${moment.id} - negative filter off`);
        return false;
      }
      if (isNeutral && !filters.neutral) {
        console.log(`Filtered out moment ${moment.id} - neutral filter off`);
        return false;
      }
      
      // If none of the above, treat as positive (default for unknown emojis)
      if (!isPositive && !isNegative && !isNeutral && !filters.positive) {
        console.log(`Filtered out moment ${moment.id} - unknown emoji treated as positive but filter off`);
        return false;
      }
    }
    
    return true;
  });



  // Simple event listeners for cache invalidation only
  useEffect(() => {
    const handleMomentCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
    };
    const handleMomentUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
    };
    
    window.addEventListener('momentCreated', handleMomentCreated);
    window.addEventListener('momentUpdated', handleMomentUpdated);
    
    return () => {
      window.removeEventListener('momentCreated', handleMomentCreated);
      window.removeEventListener('momentUpdated', handleMomentUpdated);
    };
  }, [queryClient]);



  // Get date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case 'daily':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
          days: [currentDate]
        };
      case 'weekly':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return {
          start: weekStart,
          end: weekEnd,
          days: eachDayOfInterval({ start: weekStart, end: weekEnd })
        };
      case 'monthly':
      default:
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const firstDayOfWeek = startOfWeek(monthStart);
        const lastDayOfWeek = endOfWeek(monthEnd);
        return {
          start: monthStart,
          end: monthEnd,
          days: eachDayOfInterval({ start: firstDayOfWeek, end: lastDayOfWeek })
        };
    }
  };

  // Navigate based on view mode
  const navigatePrevious = () => {
    let newDate;
    switch (viewMode) {
      case 'daily':
        newDate = addDays(currentDate, -1);
        break;
      case 'weekly':
        newDate = addDays(currentDate, -7);
        break;
      case 'monthly':
      default:
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        break;
    }
    console.log(`📅 NAVIGATION: Moving from ${format(currentDate, 'yyyy-MM-dd')} to ${format(newDate, 'yyyy-MM-dd')}`);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    let newDate;
    switch (viewMode) {
      case 'daily':
        newDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        newDate = addDays(currentDate, 7);
        break;
      case 'monthly':
      default:
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
        break;
    }
    console.log(`📅 NAVIGATION: Moving from ${format(currentDate, 'yyyy-MM-dd')} to ${format(newDate, 'yyyy-MM-dd')}`);
    setCurrentDate(newDate);
  };

  // Get title based on view mode
  const getViewTitle = () => {
    switch (viewMode) {
      case 'daily':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'weekly':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'monthly':
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  // Generate calendar days based on view mode
  const { days: calendarDays, start: viewStart, end: viewEnd } = getDateRange();
  
  // Debug current calendar state
  console.log('🗓️ Calendar State:', {
    currentDate: format(currentDate, 'yyyy-MM-dd'),
    viewMode,
    viewStart: format(viewStart, 'yyyy-MM-dd'),
    viewEnd: format(viewEnd, 'yyyy-MM-dd'),
    calendarDaysCount: calendarDays.length,
    firstDay: calendarDays[0] ? format(calendarDays[0], 'yyyy-MM-dd') : 'none',
    lastDay: calendarDays[calendarDays.length - 1] ? format(calendarDays[calendarDays.length - 1], 'yyyy-MM-dd') : 'none'
  });

  // Get moments for a specific day
  const getMomentsForDay = (day: Date) => {
    const dayMoments = moments.filter(moment => {
      const momentDate = new Date(moment.createdAt || new Date());
      const same = isSameDay(momentDate, day);
      // Debug for today's date
      if (format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
        console.log(`Today ${format(day, 'yyyy-MM-dd')} - Moment ${moment.id}: ${format(momentDate, 'yyyy-MM-dd')} - Match: ${same}`, moment);
      }
      return same;
    });
    return dayMoments;
  };

  // Debug moments loading
  console.log('Calendar Debug - Total moments:', moments.length, moments);



  // Get moment type and display info
  const getMomentDisplayInfo = (moment: Moment) => {
    const tags = moment.tags || [];
    
    // Check if it's a milestone (including birthdays)
    if (tags.includes("Milestone")) {
      return { type: 'emoji', value: moment.emoji, color: 'text-amber-500' };
    }
    
    // Check if it's a plan
    if (tags.includes("Plan")) {
      return { type: 'emoji', value: '📅', color: 'text-purple-500' };
    }
    
    // Check if it's a conflict
    if (tags.includes("Conflict")) {
      return { type: 'emoji', value: '⚡', color: 'text-red-500' };
    }
    
    // Check if it's intimacy
    if (moment.isIntimate || tags.includes("Intimacy")) {
      return { type: 'emoji', value: '💕', color: 'text-pink-500' };
    }
    
    // For regular moments, show colored circles based on type
    if (['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(moment.emoji)) {
      return { type: 'circle', value: '', color: 'bg-green-500' };
    } else if (['😕', '😢', '😠', '😞', '😤'].includes(moment.emoji)) {
      return { type: 'circle', value: '', color: 'bg-orange-500' };
    } else {
      return { type: 'circle', value: '', color: 'bg-blue-500' };
    }
  };



  // Handle day click
  const handleDayClick = (day: Date) => {
    // Always set the selected day first
    setSelectedDay(day);
    setDayDetailOpen(true);
  };

  // Helper function to set connection before opening modal
  const setConnectionForModal = () => {
    if (selectedConnectionIds.length > 0) {
      // Use the first selected connection when multiple are selected
      const firstSelectedId = selectedConnectionIds[0];
      const connection = connections.find(c => c.id === firstSelectedId);
      if (connection) {
        setSelectedConnection(firstSelectedId, connection);
      }
    } else {
      // If "All Connections" is selected, use the main focus connection as default
      if (mainFocusConnection) {
        setSelectedConnection(mainFocusConnection.id, mainFocusConnection);
      } else if (connections.length > 0) {
        setSelectedConnection(connections[0].id, connections[0]);
      }
    }
  };

  // Handle adding new moment from day detail
  const handleAddMomentFromDay = () => {
    console.log("Calendar button clicked - selectedDay:", selectedDay);
    setDayDetailOpen(false);
    setConnectionForModal();
    openMomentModal('moment', undefined, selectedDay || new Date());
  };

  // Handle clicking on calendar entries to open details
  const handleEntryClick = (moment: Moment, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent day click
    setSelectedEntry(moment);
    setEntryDetailOpen(true);
  };

  // Get weekday names
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <section className="px-4 pt-5 pb-3 border-b border-border/40 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
              <p className="text-sm text-muted-foreground">
                Track your relationship moments over time
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-primary" />
          </div>


        </section>

        {/* Connection Filter */}
        <section className="px-4 py-2">
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">View Calendar For</h3>
              <span className="text-xs text-muted-foreground">
                {selectedConnectionIds.length === 0 ? 'All Connections' : 
                 selectedConnectionIds.length === 1 ? 
                   connections.find(c => c.id === selectedConnectionIds[0])?.name || 'Unknown' :
                 `${selectedConnectionIds.length} connections selected`}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {selectedConnectionIds.length === 0 ? 'All Connections' : 
                     selectedConnectionIds.length === 1 ? 
                       connections.find(c => c.id === selectedConnectionIds[0])?.name || 'Unknown' :
                     `${selectedConnectionIds.length} connections selected`}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" sideOffset={4}>
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedConnectionIds([]);
                    setHasUserSelectedConnection(true);
                  }}
                  className="py-3 px-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">All</span>
                    </div>
                    <span>All Connections</span>
                  </div>
                </DropdownMenuItem>
                <div className="border-t border-border my-1" />
                {[...connections].sort((a, b) => {
                  if (a.relationshipStage === 'Self') return 1;
                  if (b.relationshipStage === 'Self') return -1;
                  return 0;
                }).map((connection) => (
                  <DropdownMenuCheckboxItem
                    key={connection.id}
                    checked={selectedConnectionIds.includes(connection.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedConnectionIds([...selectedConnectionIds, connection.id]);
                      } else {
                        setSelectedConnectionIds(selectedConnectionIds.filter(id => id !== connection.id));
                      }
                      setHasUserSelectedConnection(true);
                    }}
                    onSelect={(e) => e.preventDefault()}
                    className="py-3 px-4 data-[checked]:bg-primary/10 data-[checked]:text-primary-foreground"
                  >
                    <div className="flex items-center gap-2">
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
                      <span>{connection.relationshipStage === 'Self' ? `${connection.name} (ME)` : connection.name}</span>
                      {mainFocusConnection?.id === connection.id && (
                        <Heart className="h-3 w-3 text-red-500 fill-current ml-1" />
                      )}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <div className="border-t border-border my-1" />
                <DropdownMenuItem 
                  onClick={() => openConnectionModal()}
                  className="py-3 px-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-primary">Add Connection</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        </section>

        {/* Legend */}
        <section className="px-4 py-4">
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
                <div className="space-y-4">
                  {/* Moments Section - Combined Legend and Filter */}
                  <div>
                    <h4 className="text-xs font-medium mb-2 text-muted-foreground">Moments</h4>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Positive</span>
                        </div>
                        <Checkbox
                          id="positive"
                          checked={filters.positive}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, positive: !!checked }))
                          }
                          className="h-3 w-3"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>Neutral</span>
                        </div>
                        <Checkbox
                          id="neutral"
                          checked={filters.neutral}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, neutral: !!checked }))
                          }
                          className="h-3 w-3"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span>Negative</span>
                        </div>
                        <Checkbox
                          id="negative"
                          checked={filters.negative}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, negative: !!checked }))
                          }
                          className="h-3 w-3"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">⚡</span>
                          <span>Conflicts</span>
                        </div>
                        <Checkbox
                          id="conflicts"
                          checked={filters.conflicts}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, conflicts: !!checked }))
                          }
                          className="h-3 w-3"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">💕</span>
                          <span>Intimacy</span>
                        </div>
                        <Checkbox
                          id="intimacy"
                          checked={filters.intimacy}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, intimacy: !!checked }))
                          }
                          className="h-3 w-3"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-purple-500">📅</span>
                          <span>Plans</span>
                        </div>
                        <Checkbox
                          id="plans"
                          checked={filters.plans}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, plans: !!checked }))
                          }
                          className="h-3 w-3"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🏆</span>
                          <span>Milestones</span>
                        </div>
                        <Checkbox
                          id="milestones"
                          checked={filters.milestones}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, milestones: !!checked }))
                          }
                          className="h-3 w-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Menstrual Cycle Section - Combined Legend and Filter */}
                  <div className="border-t border-border/20 pt-3">
                    <h4 className="text-xs font-medium mb-2 text-muted-foreground">Menstrual Cycle</h4>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🌸</span>
                          <span>Show All Cycle Info</span>
                        </div>
                        <Checkbox
                          id="menstrualCycle"
                          checked={filters.menstrualCycle}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, menstrualCycle: !!checked }))
                          }
                          className="h-3 w-3"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground opacity-75 ml-6 space-y-1">
                        <div>Includes period, fertile window, ovulation & phases</div>
                        <div className="grid grid-cols-2 gap-1 mt-2">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">🩸</span>
                            <span>Period</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">🌱</span>
                            <span>Follicular</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">💛</span>
                            <span>Fertile</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">🥚</span>
                            <span>Ovulation</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">🌙</span>
                            <span>Luteal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </section>

        {/* Date Navigation */}
        <section className="px-4 py-2">
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="icon" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {getViewTitle()}
                </h2>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <div className="p-3">
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
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDatePickerOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setCurrentDate(new Date());
                            setDatePickerOpen(false);
                          }}
                          className="flex-1"
                        >
                          Today
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* View Mode Selector */}
            <div className="flex items-center justify-center">
              <div className="flex bg-muted/50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'daily' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('daily')}
                  className="text-xs px-3"
                >
                  Daily
                </Button>
                <Button
                  variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('weekly')}
                  className="text-xs px-3"
                >
                  Weekly
                </Button>
                <Button
                  variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('monthly')}
                  className="text-xs px-3"
                >
                  Monthly
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Calendar Grid */}
        <section className="px-4">
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
              {calendarDays.map(day => {
                const dayMoments = getMomentsForDay(day);
                
                // CRITICAL DEBUG: Track May 16th processing
                if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
                  console.log(`🔍 MAY 16th: CALENDAR DAY PROCESSING START`);
                }
                
                // Get milestones for this day
                const dayMilestones = (milestones as any[])?.filter((milestone: any) => {
                  const milestoneDate = new Date(milestone.date);
                  const isSameDayMatch = isSameDay(milestoneDate, day);
                  const isAnniversaryMatch = milestone.isAnniversary && 
                    milestoneDate.getDate() === day.getDate() &&
                    milestoneDate.getMonth() === day.getMonth();
                  
                  return isSameDayMatch || isAnniversaryMatch;
                }) || [];

                // Get menstrual cycle info for this day - support multiple connections
                let cyclePhases = [];
                let cycleDisplay = null;
                
                // Determine which connections to check for cycles based on selection
                let connectionsToCheck = [];

                // FIXED: Check cycles for selected connections, or all if none selected
                if (selectedConnectionIds.length === 0) {
                  // No specific selection - check all connections with cycles
                  connectionsToCheck = [...new Set(cycles.map(c => c.connectionId).filter(id => id !== null))];
                } else {
                  // Specific connections selected - only check those that have cycles
                  connectionsToCheck = selectedConnectionIds.filter(id => 
                    cycles.some(c => c.connectionId === id)
                  );
                }
                
                const dayStr = format(day, 'yyyy-MM-dd');
                
                // Debug for ANY day in May 2025
                if (format(day, 'yyyy-MM') === '2025-05') {
                  console.log(`🔍 MAY ${format(day, 'dd')}: Connection check:`, {
                    date: format(day, 'yyyy-MM-dd'),
                    cyclesLength: cycles.length,
                    selectedConnectionIds,
                    connectionsToCheck,
                    allCycles: cycles.map(c => ({ id: c.id, connectionId: c.connectionId, start: c.periodStartDate, end: c.cycleEndDate }))
                  });
                  // Force check connection 6 for May debugging
                  if (!connectionsToCheck.includes(6)) {
                    console.log(`🔍 MAY ${format(day, 'dd')}: FORCING connection 6 check for debugging`);
                    connectionsToCheck.push(6);
                  }
                }
                
                // Special debug for May 16th processing
                if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
                  console.log(`🔍 MAY 16th PROCESSING START:`, {
                    connectionsToCheck,
                    cyclesLength: cycles.length,
                    willSkipNormalProcessing: dayStr === '2025-05-16',
                    availableCycles: cycles.map(c => ({ id: c.id, connectionId: c.connectionId }))
                  });
                }
                

                
                // CRITICAL FIX: Don't process cycles while still loading
                if (cyclesLoading) {
                  if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
                    console.log(`🔍 MAY 16th: SKIPPING - cycles still loading`);
                  }
                  // Skip all cycle processing while loading
                } else if (!cycles || cycles.length === 0) {
                  if (format(day, 'yyyy-MM-dd') === '2025-06-16') {
                    console.log('🔍 June 16th: NUCLEAR OPTION - No cycles exist, skipping all cycle processing');
                  }
                  // Don't process any cycle phases at all
                } else {
                  // Process each connection that has cycles
                  for (const connectionId of connectionsToCheck) {
                    if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
                      console.log(`🔍 MAY 16th: About to call getCyclePhaseForDay with connectionId ${connectionId}`);
                    }
                    
                    // Check if this connection has a cycle phase for this day
                    const phaseInfo = getCyclePhaseForDay(day, connectionId);
                    
                    if (format(day, 'yyyy-MM-dd') === '2025-05-16') {
                      console.log(`🔍 MAY 16th: getCyclePhaseForDay returned:`, phaseInfo);
                    }
                    
                    if (phaseInfo) {
                      const connection = connections.find(c => c.id === connectionId);
                      if (connection) {
                        cyclePhases.push({ ...phaseInfo, connection });
                      }
                    }
                  }
                }
                

                

                
                // CRITICAL SAFETY CHECK: Ensure no cycle display when cycles are empty
                if (!cycles || cycles.length === 0) {
                  cycleDisplay = null;
                  if (format(day, 'yyyy-MM-dd') === '2025-06-16') {
                    console.log(`🔍 June 16th: SAFETY CHECK - forced cycleDisplay to null because no cycles exist`);
                  }
                } else if (cyclePhases.length === 1) {
                  cycleDisplay = getCycleDisplayInfo(cyclePhases[0]);
                  if (format(day, 'yyyy-MM-dd') === '2025-06-16') {
                    console.log(`🔍 June 16th: single cycle display set:`, cycleDisplay);
                  }

                } else if (cyclePhases.length > 1) {
                  // Multiple connections have cycles on this day - show combined info with colored initials
                  const getConnectionColor = (connectionId: number) => {
                    const colors = [
                      'text-red-600', 'text-blue-600', 'text-green-600', 'text-purple-600',
                      'text-orange-600', 'text-pink-600', 'text-indigo-600', 'text-teal-600'
                    ];
                    return colors[connectionId % colors.length];
                  };
                  
                  cycleDisplay = {
                    color: 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-700',
                    indicator: '', // We'll handle this specially in the render
                    title: `Multiple cycles: ${cyclePhases.map(p => `${p.connection?.name || 'Unknown'} (${p.phase})`).join(', ')}`,
                    description: 'Multiple cycle phases',
                    isMultiple: true,
                    phases: cyclePhases,
                    coloredInitials: cyclePhases.map(phase => ({
                      initial: phase.connection?.name?.[0]?.toUpperCase() || '?',
                      color: getConnectionColor(phase.connection?.id || 0),
                      connectionName: phase.connection?.name || 'Unknown',
                      phase: phase.phase
                    }))
                  };
                }
                
                const isToday = isSameDay(day, new Date());
                
                // Debug June 16th styling
                if (format(day, 'yyyy-MM-dd') === '2025-06-16') {
                  console.log(`🔍 June 16th final styling:`, {
                    isToday,
                    cycleDisplay: cycleDisplay,
                    cycleDisplayColor: cycleDisplay?.color,
                    cyclesLength: cycles.length,
                    finalClassName: `${viewMode === 'daily' ? 'min-h-20 p-4 flex-col items-start justify-start text-left' : viewMode === 'weekly' ? 'h-24 p-2' : 'h-16 p-1'} border rounded-lg transition-colors hover:bg-accent/50 ${isToday ? 'border-primary/30' : 'border-border/20'} ${(!cycles || cycles.length === 0) ? (isToday ? '!bg-primary/10' : '!bg-background/50') : (cycleDisplay ? `${cycleDisplay.color} border-2` : (isToday ? 'bg-primary/10' : 'bg-background/50'))} ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''} ${viewMode === 'daily' ? 'flex' : 'block'}`,
                    inlineStyle: (!cycles || cycles.length === 0) ? {
                      backgroundColor: isToday ? 'rgb(var(--primary) / 0.1)' : 'rgb(var(--background) / 0.5)',
                      borderColor: isToday ? 'rgb(var(--primary) / 0.3)' : 'rgb(var(--border) / 0.2)'
                    } : undefined
                  });
                }
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`
                      ${viewMode === 'daily' ? 'min-h-20 p-4 flex-col items-start justify-start text-left' : viewMode === 'weekly' ? 'h-24 p-2' : 'h-16 p-1'} 
                      border rounded-lg transition-colors hover:bg-accent/50
                      ${isToday ? 'border-primary/30' : 'border-border/20'}
                      ${cycleDisplay ? `${cycleDisplay.color} border-2` : (isToday ? 'bg-primary/10' : 'bg-background/50')}
                      ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''}
                      ${viewMode === 'daily' ? 'flex' : 'block'}
                    `}

                    title={cycleDisplay ? cycleDisplay.title : undefined}
                  >
                    <div className={`${viewMode === 'daily' ? 'text-lg' : viewMode === 'weekly' ? 'text-sm' : 'text-xs'} font-medium mb-1`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Moment, Milestone, and Cycle indicators */}
                    <div className={`flex flex-wrap ${viewMode === 'daily' ? 'gap-2' : viewMode === 'weekly' ? 'gap-1' : 'gap-0.5'} items-center`}>
                      {/* Show cycle phase indicator first */}
                      {cycleDisplay && filters.menstrualCycle && (
                        <div className="flex gap-0.5">
                          {cycleDisplay.isMultiple && cycleDisplay.coloredInitials ? (
                            // Show colored initials for multiple connections
                            cycleDisplay.coloredInitials.map((item, index) => (
                              <span
                                key={index}
                                className={`${item.color} ${viewMode === 'daily' ? 'text-lg font-bold' : viewMode === 'weekly' ? 'text-sm font-semibold' : 'text-xs font-medium'}`}
                                title={`${item.connectionName}: ${item.phase} phase`}
                              >
                                {item.initial}
                              </span>
                            ))
                          ) : (
                            // Show regular cycle indicator for single connection
                            <span
                              className={`${viewMode === 'daily' ? 'text-2xl' : viewMode === 'weekly' ? 'text-base' : 'text-xs'} opacity-70`}
                              title={cycleDisplay.description}
                            >
                              {cycleDisplay.indicator}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Show milestones */}
                      {dayMilestones.map((milestone) => {
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
                          <span
                            key={`milestone-${milestone.id}`}
                            className={`${viewMode === 'daily' ? 'text-4xl' : viewMode === 'weekly' ? 'text-lg' : 'text-[10px]'} cursor-pointer hover:scale-110 transition-transform`}
                            title={`${milestone.title}: ${milestone.description || ''}`}
                            style={{ color: milestone.color }}
                          >
                            {getIcon()}
                          </span>
                        );
                      })}
                      
                      {/* Show moments */}
                      {dayMoments.slice(0, viewMode === 'daily' ? 6 : viewMode === 'weekly' ? 4 : (dayMilestones.length > 0 ? 2 : 3)).map((moment, index) => {
                        const displayInfo = getMomentDisplayInfo(moment);
                        return displayInfo.type === 'emoji' ? (
                          <span
                            key={moment.id}
                            className={`${viewMode === 'daily' ? 'text-3xl' : viewMode === 'weekly' ? 'text-sm' : 'text-[8px]'} ${displayInfo.color} cursor-pointer hover:scale-110 transition-transform`}
                            title={moment.content || moment.emoji}
                            onClick={(e) => handleEntryClick(moment, e)}
                          >
                            {displayInfo.value}
                          </span>
                        ) : (
                          <div
                            key={moment.id}
                            className={`${viewMode === 'daily' ? 'w-8 h-8' : viewMode === 'weekly' ? 'w-4 h-4' : 'w-2 h-2'} rounded-full ${displayInfo.color} cursor-pointer hover:scale-110 transition-transform`}
                            title={moment.content || moment.emoji}
                            onClick={(e) => handleEntryClick(moment, e)}
                          />
                        );
                      })}
                      
                      {(dayMoments.length + dayMilestones.length) > 3 && (
                        <div className="w-2 h-2 rounded-full bg-gray-300 text-[6px] flex items-center justify-center font-bold">
                          +
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        {/* This Month Statistics */}
        <section className="px-3 py-2">
          <Card className="p-3 bg-card/50 backdrop-blur-sm">
            <h3 className="text-sm font-medium mb-3">This Month</h3>
            <div className="grid grid-cols-7 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           !m.tags?.includes("Conflict") && !m.isIntimate &&
                           ['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(m.emoji);
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Positive</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           !m.tags?.includes("Conflict") && !m.isIntimate &&
                           ['😕', '😢', '😠', '😞', '😤'].includes(m.emoji);
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Negative</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           !m.tags?.includes("Conflict") && !m.isIntimate &&
                           !['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥', '😕', '😢', '😠', '😞', '😤'].includes(m.emoji);
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
                           (m.tags?.includes("milestone") || m.milestoneTitle);
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Milestones</div>
              </div>
            </div>
          </Card>
        </section>

        {/* Menstrual Cycle Tracker */}
        <section className="px-3 mb-2">
          <MenstrualCycleTracker />
        </section>
      </main>

      {/* Day Detail Modal */}
      <Dialog open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay, 'EEEE, MMMM d')}
            </DialogTitle>
          </DialogHeader>
          
          {/* Add Entry Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <Button 
              size="sm" 
              onClick={handleAddMomentFromDay}
              className="flex flex-col h-16 text-xs"
              variant="outline"
            >
              <div className="text-lg mb-1">😊</div>
              <span>Moment</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                console.log("Conflict button clicked - selectedDay:", selectedDay);
                setDayDetailOpen(false);
                setConnectionForModal();
                openMomentModal('conflict', undefined, selectedDay || new Date());
              }}
              className="flex flex-col h-16 text-xs"
              variant="outline"
            >
              <div className="text-lg mb-1">⚡</div>
              <span>Conflict</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                console.log("Intimacy button clicked - selectedDay:", selectedDay);
                setDayDetailOpen(false);
                setConnectionForModal();
                openMomentModal('intimacy', undefined, selectedDay || new Date());
              }}
              className="flex flex-col h-16 text-xs"
              variant="outline"
            >
              <div className="text-lg mb-1">💕</div>
              <span>Sex</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                console.log("Plan button clicked - selectedDay:", selectedDay);
                setDayDetailOpen(false);
                setConnectionForModal();
                openMomentModal('plan', undefined, selectedDay || new Date());
              }}
              className="flex flex-col h-16 text-xs"
              variant="outline"
            >
              <div className="text-lg mb-1">📅</div>
              <span>Plan</span>
            </Button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedDay && getMomentsForDay(selectedDay).map((moment) => {
              const connection = connections.find(c => c.id === moment.connectionId);
              return (
                <Card 
                  key={moment.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedEntry(moment);
                    setEntryDetailOpen(true);
                    setDayDetailOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{moment.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {connection?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(moment.createdAt || new Date()), 'h:mm a')}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-3">{moment.content}</p>
                      
                      {moment.tags && moment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {moment.tags.map((tag, index) => (
                            <span
                              key={index}
                              className={`text-xs px-2 py-1 rounded-full ${
                                tag.includes('Green') || tag === 'Quality Time' || tag === 'Support'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : tag.includes('Red') || tag === 'Conflict'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : tag === 'Intimacy' || tag === 'Physical Touch'
                                  ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
                                : tag.includes('Blue') || tag === 'Communication' || tag === 'Growth'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          isOpen={entryDetailOpen}
          onClose={() => {
            setEntryDetailOpen(false);
            setSelectedEntry(null);
          }}
          onUpdate={() => {
            // Invalidate all moments queries
            queryClient.invalidateQueries({ queryKey: ["/api/moments"] });
            // Force immediate refetch
            refetchMoments();
          }}
          moment={selectedEntry}
          connection={connections.find(c => c.id === selectedEntry.connectionId) || null}
        />
      )}

      <BottomNavigation />
      
      {/* Moment Modal */}
      <MomentModal
        isOpen={momentModalOpen}
        onClose={closeMomentModal}
        selectedConnection={connections.find(c => c.id === selectedConnectionId) || mainFocusConnection}
      />
      
      {/* Plan Modal */}
      <PlanModal
        isOpen={planModalOpen}
        onClose={closePlanModal}
        selectedConnection={connections.find(c => c.id === selectedConnectionId) || mainFocusConnection}
        selectedDate={null}
        showConnectionPicker={true}
      />

      {/* Connection Modal */}
      <Dialog open={connectionModalOpen} onOpenChange={setConnectionModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto mb-20">
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