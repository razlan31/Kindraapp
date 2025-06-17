// Clean June 1st baseline - minimal cycle tracker with only your requested features
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, subMonths, addMonths, startOfWeek, getDay, startOfDay } from "date-fns";
import { Calendar, Plus, Edit3, Trash2, Circle, ChevronLeft, ChevronRight, User, UserPlus, Camera, X, ChevronDown, Heart, Droplets } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MenstrualCycle, Connection } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";

export default function MenstrualCyclePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<MenstrualCycle | null>(null);
  const { mainFocusConnection } = useRelationshipFocus();

  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    periodEndDate: '',
    endDate: '',
    flowIntensity: '',
    mood: '',
    symptoms: [] as string[],
    notes: '',
    connectionId: null as number | null
  });

  // Fetch data
  const { data: cycles = [], isLoading: cyclesLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ["/api/menstrual-cycles"],
    enabled: !!user,
  });

  const { data: connections = [], isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  const trackableConnections = connections;
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Filter cycles based on selected connections
  const filteredCycles = useMemo(() => {
    if (!cycles) return [];
    if (selectedConnectionIds.length === 0) return cycles;
    return cycles.filter(cycle => cycle.connectionId && selectedConnectionIds.includes(cycle.connectionId));
  }, [cycles, selectedConnectionIds]);

  // Calculate cycle phases for a specific day and connection
  const getCyclePhaseForDay = (day: Date, connectionId: number) => {
    const connectionCycles = cycles.filter(c => c.connectionId === connectionId);
    if (connectionCycles.length === 0) return null;

    const sortedCycles = [...connectionCycles].sort((a, b) => 
      new Date(a.periodStartDate).getTime() - new Date(b.periodStartDate).getTime()
    );

    // Calculate actual cycle lengths for this connection
    const cycleLengths: number[] = [];
    for (let i = 1; i < sortedCycles.length; i++) {
      const prevCycle = sortedCycles[i - 1];
      const currentCycle = sortedCycles[i];
      const length = differenceInDays(new Date(currentCycle.periodStartDate), new Date(prevCycle.periodStartDate));
      if (length > 0 && length <= 60) {
        cycleLengths.push(length);
      }
    }

    const avgCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 30; // Use 30-day default to match our test cycle

    // Find the cycle that this day belongs to
    for (const cycle of sortedCycles) {
      const cycleStart = new Date(cycle.periodStartDate);
      const cycleEnd = cycle.cycleEndDate ? new Date(cycle.cycleEndDate) : addDays(cycleStart, avgCycleLength - 1);
      
      if (day >= cycleStart && day <= cycleEnd) {
        const dayInCycle = differenceInDays(day, cycleStart) + 1;
        const periodEnd = cycle.periodEndDate ? new Date(cycle.periodEndDate) : addDays(cycleStart, 5);
        
        if (day <= periodEnd) {
          return { phase: 'menstrual', day: dayInCycle, cycle, isOvulation: false };
        } else {
          const ovulationDay = avgCycleLength - 14; // Standard ovulation calculation: 14 days before cycle end
          const isOvulation = dayInCycle === ovulationDay;
          
          if (dayInCycle <= ovulationDay + 2) {
            return { phase: 'follicular', day: dayInCycle, cycle, isOvulation };
          } else {
            return { phase: 'luteal', day: dayInCycle, cycle, isOvulation };
          }
        }
      }
    }

    return null;
  };

  // Get cycle information for a specific day - support multiple connections
  const getCycleInfoForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const activeCycles = filteredCycles.filter(cycle => {
      const cycleStart = new Date(cycle.startDate);
      const connection = trackableConnections.find(c => c.id === cycle.connectionId);
      if (!connection) return false;

      const avgCycleLength = 28; // Default
      const cycleEnd = cycle.endDate ? new Date(cycle.endDate) : addDays(cycleStart, avgCycleLength);
      
      return day >= cycleStart && day <= cycleEnd;
    });

    if (activeCycles.length === 0) {
      return { color: '', indicator: '', title: '', description: '' };
    }

    if (activeCycles.length === 1) {
      const cycle = activeCycles[0];
      const phaseInfo = getCyclePhaseForDay(day, cycle.connectionId!);
      const connection = trackableConnections.find(c => c.id === cycle.connectionId);
      
      if (!phaseInfo || !connection) {
        return { color: '', indicator: '', title: '', description: '' };
      }

      const phaseColors = {
        menstrual: 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700',
        follicular: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700',
        luteal: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700'
      };

      return {
        color: phaseColors[phaseInfo.phase as keyof typeof phaseColors] || '',
        indicator: phaseInfo.isOvulation ? '🥚' : (phaseInfo.phase === 'menstrual' ? '🔴' : ''),
        title: `${connection.name}`,
        description: `${phaseInfo.phase} (Day ${phaseInfo.day})`
      };
    }

    // Multiple connections - create colored initials display
    const phases = activeCycles.map(cycle => {
      const phaseInfo = getCyclePhaseForDay(day, cycle.connectionId!);
      const connection = trackableConnections.find(c => c.id === cycle.connectionId);
      return { connection, phase: phaseInfo?.phase || 'unknown', day: phaseInfo?.day || 0, cycle, isOvulation: phaseInfo?.isOvulation };
    }).filter(p => p.connection);

    // Generate colored initials for each connection
    const colors = ['bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-indigo-500'];
    const coloredInitials = phases.map((phase, index) => ({
      initial: phase.connection!.name.charAt(0).toUpperCase(),
      color: colors[index % colors.length],
      connection: phase.connection!.name,
      phase: phase.phase,
      day: phase.day
    }));

    return {
      color: 'bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 border-pink-300 dark:border-pink-700',
      indicator: '',
      title: `${activeCycles.length} Connections`,
      description: `Multiple active cycles`,
      isMultiple: true,
      phases,
      coloredInitials
    };
  };

  const handleDayClick = (day: Date) => {
    setFormData(prev => ({
      ...prev,
      startDate: format(day, 'yyyy-MM-dd')
    }));
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="lg:flex-1">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      Cycle Calendar
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-semibold min-w-[120px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        {day}
                      </div>
                    ))}
                    
                    {eachDayOfInterval({
                      start: startOfWeek(startOfMonth(currentDate)),
                      end: addDays(startOfWeek(endOfMonth(currentDate)), 41)
                    }).map(day => {
                      const cycleInfo = getCycleInfoForDay(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <div
                          key={day.toISOString()}
                          className={`
                            relative p-1 h-16 cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md
                            ${isCurrentMonth ? 'opacity-100' : 'opacity-40'}
                            ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                            ${cycleInfo.color || 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}
                          `}
                          onClick={() => handleDayClick(day)}
                        >
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {format(day, 'd')}
                          </div>
                          
                          {cycleInfo.indicator && (
                            <div className="absolute top-1 right-1 text-xs">
                              {cycleInfo.indicator}
                            </div>
                          )}
                          
                          {cycleInfo.isMultiple && cycleInfo.coloredInitials && (
                            <div className="absolute bottom-1 left-1 flex gap-0.5">
                              {cycleInfo.coloredInitials.map((item: any, index: number) => (
                                <div
                                  key={index}
                                  className={`w-4 h-4 rounded-full text-[8px] text-white flex items-center justify-center font-bold ${item.color}`}
                                  title={`${item.connection} - ${item.phase} (Day ${item.day})`}
                                >
                                  {item.initial}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {cycleInfo.title && !cycleInfo.isMultiple && (
                            <div className="absolute bottom-1 left-1 text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate max-w-full">
                              {cycleInfo.title}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* List View */}
          {viewMode === 'list' && (
            <div className="lg:flex-1">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Menstrual Cycles - List View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredCycles.map((cycle: any) => {
                      const connection = trackableConnections.find(c => c.id === cycle.connectionId);
                      return (
                        <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{connection?.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{connection?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(cycle.startDate), 'MMM d, yyyy')}
                                {cycle.endDate && ` - ${format(new Date(cycle.endDate), 'MMM d, yyyy')}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCycle(cycle);
                                setFormData({
                                  startDate: format(new Date(cycle.startDate), 'yyyy-MM-dd'),
                                  periodEndDate: cycle.periodEndDate ? format(new Date(cycle.periodEndDate), 'yyyy-MM-dd') : '',
                                  endDate: cycle.endDate ? format(new Date(cycle.endDate), 'yyyy-MM-dd') : '',
                                  flowIntensity: cycle.flowIntensity || '',
                                  mood: cycle.mood || '',
                                  symptoms: cycle.symptoms || [],
                                  notes: cycle.notes || '',
                                  connectionId: cycle.connectionId
                                });
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}