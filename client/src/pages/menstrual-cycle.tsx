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

  // Show all connections, not just "Self" - users want to track cycles for all their connections
  const trackableConnections = connections;
  
  // Add view mode state
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Set default selection to main focus connection if it's trackable
  useState(() => {
    if (mainFocusConnection && trackableConnections.some(c => c.id === mainFocusConnection.id)) {
      setSelectedConnectionIds([mainFocusConnection.id]);
    }
  });

  // Calculate cycle phases for a specific day and connection
  const getCyclePhaseForDay = (day: Date, connectionId: number) => {
    const connectionCycles = cycles.filter(c => c.connectionId === connectionId);
    if (connectionCycles.length === 0) return null;

    // Sort cycles by start date
    const sortedCycles = [...connectionCycles].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Calculate actual cycle lengths for this connection
    const cycleLengths: number[] = [];
    for (let i = 1; i < sortedCycles.length; i++) {
      const prevCycle = sortedCycles[i - 1];
      const currentCycle = sortedCycles[i];
      if (prevCycle.endDate) {
        const length = differenceInDays(new Date(currentCycle.startDate), new Date(prevCycle.startDate));
        if (length > 0 && length <= 60) { // Reasonable cycle length
          cycleLengths.push(length);
        }
      }
    }

    // Use actual average or fallback to 28 days
    const avgCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length)
      : 28;

    // Find the cycle this day belongs to
    for (const cycle of sortedCycles) {
      const cycleStart = new Date(cycle.startDate);
      const cycleEnd = cycle.endDate ? new Date(cycle.endDate) : addDays(cycleStart, avgCycleLength);
      
      if (day >= cycleStart && day <= cycleEnd) {
        const dayOfCycle = differenceInDays(day, cycleStart) + 1;
        const periodEndDate = cycle.periodEndDate ? new Date(cycle.periodEndDate) : addDays(cycleStart, 5);
        const isPeriod = day >= cycleStart && day <= periodEndDate;
        
        // Calculate ovulation day based on actual cycle length
        const ovulationDay = Math.max(1, avgCycleLength - 14);
        const isOvulation = dayOfCycle === ovulationDay;
        
        // Fertile window (5 days before ovulation + ovulation day)
        const isFertile = dayOfCycle >= (ovulationDay - 5) && dayOfCycle <= ovulationDay;

        if (isPeriod) {
          return { phase: 'period', day: dayOfCycle, cycle, isOvulation: false };
        } else if (isOvulation) {
          return { phase: 'ovulation', day: dayOfCycle, cycle, isOvulation: true };
        } else if (isFertile) {
          return { phase: 'fertile', day: dayOfCycle, cycle, isOvulation: false };
        } else if (dayOfCycle > ovulationDay) {
          return { phase: 'luteal', day: dayOfCycle, cycle, isOvulation: false };
        } else {
          return { phase: 'follicular', day: dayOfCycle, cycle, isOvulation: false };
        }
      }
    }

    return null;
  };

  const getCycleDisplayInfo = (phaseInfo: any) => {
    if (!phaseInfo) return null;
    
    switch (phaseInfo.phase) {
      case 'period':
        return {
          color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
          indicator: '🩸',
          title: `Period Day ${phaseInfo.day}`,
          description: 'Menstruation'
        };
      case 'ovulation':
        return {
          color: 'bg-blue-200 dark:bg-blue-800/40 border-blue-400 dark:border-blue-600',
          indicator: '🥚',
          title: `Ovulation Day ${phaseInfo.day}`,
          description: 'Peak fertility'
        };
      case 'fertile':
        return {
          color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
          indicator: '🌱',
          title: `Fertile Window Day ${phaseInfo.day}`,
          description: 'High fertility'
        };
      case 'luteal':
        return {
          color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
          indicator: '🌙',
          title: `Luteal Phase Day ${phaseInfo.day}`,
          description: 'Pre-menstrual'
        };
      case 'follicular':
        return {
          color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
          indicator: '🌸',
          title: `Follicular Phase Day ${phaseInfo.day}`,
          description: 'Post-menstrual'
        };
      default:
        return null;
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = startOfWeek(endOfMonth(currentDate));
    const endWeek = addDays(end, 6);
    return eachDayOfInterval({ start, end: endWeek });
  }, [currentDate]);

  const handleDayClick = (day: Date) => {
    // Set form data for new cycle
    setFormData(prev => ({
      ...prev,
      startDate: format(day, 'yyyy-MM-dd'),
      connectionId: selectedConnectionIds.length === 1 ? selectedConnectionIds[0] : null
    }));
    setEditingCycle(null);
    setIsDialogOpen(true);
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  // Mutations for CRUD operations
  const createCycleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/menstrual-cycles', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      setIsDialogOpen(false);
      toast({ title: "Cycle Added", description: "Your menstrual cycle has been recorded." });
    },
  });

  const updateCycleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/menstrual-cycles/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      setIsDialogOpen(false);
      toast({ title: "Cycle Updated", description: "Your menstrual cycle has been updated." });
    },
  });

  const deleteCycleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/menstrual-cycles/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      toast({ title: "Cycle Deleted", description: "The menstrual cycle has been removed." });
    },
  });

  const handleSubmit = () => {
    if (!formData.connectionId) {
      toast({ title: "Error", description: "Please select a connection.", variant: "destructive" });
      return;
    }

    const data = {
      ...formData,
      symptoms: formData.symptoms.length > 0 ? formData.symptoms : null,
    };

    if (editingCycle) {
      updateCycleMutation.mutate({ id: editingCycle.id, data });
    } else {
      createCycleMutation.mutate(data);
    }
  };

  if (cyclesLoading || connectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading cycle data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20">
        {/* Header Section */}
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Menstrual Cycle Tracker</h1>
              <p className="text-muted-foreground">Track cycles, phases, and patterns</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="h-8 px-3"
                >
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  List
                </Button>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Cycle
              </Button>
            </div>
          </div>

          {/* Connection Filter */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Track cycles for:</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {selectedConnectionIds.length === 0 
                        ? "All connections" 
                        : selectedConnectionIds.length === 1 
                        ? trackableConnections.find(c => c.id === selectedConnectionIds[0])?.name 
                        : `${selectedConnectionIds.length} connections`
                      }
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    {trackableConnections.map((connection) => (
                      <DropdownMenuCheckboxItem
                        key={connection.id}
                        checked={selectedConnectionIds.includes(connection.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedConnectionIds([...selectedConnectionIds, connection.id]);
                          } else {
                            setSelectedConnectionIds(selectedConnectionIds.filter(id => id !== connection.id));
                          }
                        }}
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
                          <span>{connection.name} (ME)</span>
                          {mainFocusConnection?.id === connection.id && (
                            <Heart className="h-3 w-3 text-red-500 fill-current ml-1" />
                          )}
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Calendar Navigation */}
        <section className="px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  <Button variant="outline" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  // Get cycle info for this day
                  let cyclePhases = [];
                  let cycleDisplay = null;
                  
                  if (selectedConnectionIds.length === 0) {
                    // Show cycles from all trackable connections
                    for (const connection of trackableConnections) {
                      const phaseInfo = getCyclePhaseForDay(day, connection.id);
                      if (phaseInfo) {
                        cyclePhases.push({ ...phaseInfo, connection });
                      }
                    }
                  } else if (selectedConnectionIds.length === 1) {
                    // Single connection selected
                    const phaseInfo = getCyclePhaseForDay(day, selectedConnectionIds[0]);
                    if (phaseInfo) {
                      const connection = trackableConnections.find(c => c.id === selectedConnectionIds[0]);
                      cyclePhases.push({ ...phaseInfo, connection });
                    }
                  } else {
                    // Multiple connections selected
                    for (const connectionId of selectedConnectionIds) {
                      const phaseInfo = getCyclePhaseForDay(day, connectionId);
                      if (phaseInfo) {
                        const connection = trackableConnections.find(c => c.id === connectionId);
                        cyclePhases.push({ ...phaseInfo, connection });
                      }
                    }
                  }
                  
                  // Use the first cycle phase for display
                  if (cyclePhases.length > 0) {
                    cycleDisplay = getCycleDisplayInfo(cyclePhases[0]);
                  }
                  
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`
                        h-12 p-1 border rounded-lg transition-colors hover:bg-accent/50 text-sm
                        ${isToday ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/20'}
                        ${cycleDisplay ? `${cycleDisplay.color} border-2` : (isToday ? 'bg-primary/5' : 'bg-background/50')}
                        ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''}
                      `}
                      title={cycleDisplay ? cycleDisplay.title : undefined}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={`text-xs ${isToday ? 'font-bold text-primary' : ''}`}>
                          {format(day, 'd')}
                        </span>
                        {cycleDisplay && (
                          <span className="text-xs mt-0.5">{cycleDisplay.indicator}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Legend */}
        <section className="px-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cycle Phase Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-200 border border-red-300"></div>
                  <span>🩸 Period</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300"></div>
                  <span>🌸 Follicular</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-200 border border-green-300"></div>
                  <span>🌱 Fertile Window</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300"></div>
                  <span>🥚 Ovulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-200 border border-purple-300"></div>
                  <span>🌙 Luteal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Add/Edit Cycle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCycle ? 'Edit Cycle' : 'Add New Cycle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Connection</Label>
              <Select 
                value={formData.connectionId?.toString() || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, connectionId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select connection" />
                </SelectTrigger>
                <SelectContent>
                  {trackableConnections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id.toString()}>
                      {connection.name} (ME)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label>Period End Date (Optional)</Label>
              <Input
                type="date"
                value={formData.periodEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, periodEndDate: e.target.value }))}
              />
            </div>

            <div>
              <Label>Flow Intensity</Label>
              <Select 
                value={formData.flowIntensity} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, flowIntensity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Light">Light</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mood</Label>
              <Select 
                value={formData.mood} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Happy">Happy</SelectItem>
                  <SelectItem value="Sad">Sad</SelectItem>
                  <SelectItem value="Anxious">Anxious</SelectItem>
                  <SelectItem value="Irritable">Irritable</SelectItem>
                  <SelectItem value="Energetic">Energetic</SelectItem>
                  <SelectItem value="Tired">Tired</SelectItem>
                  <SelectItem value="Emotional">Emotional</SelectItem>
                  <SelectItem value="Calm">Calm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={createCycleMutation.isPending || updateCycleMutation.isPending}
              >
                {createCycleMutation.isPending || updateCycleMutation.isPending ? 'Saving...' : 'Save Cycle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation />
    </div>
  );
}