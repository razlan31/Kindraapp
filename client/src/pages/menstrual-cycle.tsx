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

// Removed prediction feature - cycles are now automatically generated when previous cycle ends

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
  const { data: cycles = [], isLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
  });

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });

  // Filter cycles by selected connections
  const filteredCycles = useMemo(() => {
    if (selectedConnectionIds.length === 0) return cycles;
    return cycles.filter(cycle => 
      cycle.connectionId && selectedConnectionIds.includes(cycle.connectionId)
    );
  }, [cycles, selectedConnectionIds]);

  // Calculate cycle phase for a given day
  const getCyclePhaseForDay = (day: Date, connectionId: number) => {
    const cycle = filteredCycles.find(cycle => {
      if (cycle.connectionId !== connectionId) return false;
      
      const start = startOfDay(new Date(cycle.periodStartDate));
      const end = cycle.cycleEndDate ? startOfDay(new Date(cycle.cycleEndDate)) : new Date();
      const checkDay = startOfDay(day);
      return checkDay >= start && checkDay <= end;
    });

    if (!cycle) return null;

    const checkDay = startOfDay(day);
    const cycleStart = startOfDay(new Date(cycle.periodStartDate));
    const daysSinceStart = differenceInDays(checkDay, cycleStart) + 1;
    
    // Use actual cycle data for phase calculation
    const cycleLength = cycle.cycleEndDate ? 
      differenceInDays(new Date(cycle.cycleEndDate), cycleStart) + 1 : 30;
    const periodLength = cycle.periodEndDate ? 
      differenceInDays(new Date(cycle.periodEndDate), cycleStart) + 1 : 5;

    // Calculate phases
    if (daysSinceStart <= periodLength) {
      return 'menstrual';
    } else if (daysSinceStart <= 13) {
      return 'follicular';
    } else if (daysSinceStart >= 14 && daysSinceStart <= 16) {
      return 'ovulation';
    } else if (daysSinceStart <= (cycleLength - 14)) {
      return 'luteal';
    } else {
      return 'premenstrual';
    }
  };

  // Calculate cycle info for display
  const getCycleInfoForDay = (day: Date) => {
    const cycleData = [];
    const processedConnections = new Set();

    for (const cycle of filteredCycles) {
      if (!cycle.connectionId || processedConnections.has(cycle.connectionId)) continue;
      
      const phase = getCyclePhaseForDay(day, cycle.connectionId);
      if (phase) {
        const connection = connections.find(c => c.id === cycle.connectionId);
        if (connection) {
          cycleData.push({
            connectionId: cycle.connectionId,
            connectionName: connection.name,
            phase,
            initial: connection.name.charAt(0).toUpperCase()
          });
          processedConnections.add(cycle.connectionId);
        }
      }
    }
    return cycleData;
  };

  // Calendar navigation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCycleForDay = (day: Date) => {
    return filteredCycles.find(cycle => {
      const start = startOfDay(new Date(cycle.periodStartDate));
      const end = cycle.cycleEndDate ? startOfDay(new Date(cycle.cycleEndDate)) : new Date();
      const checkDay = startOfDay(day);
      return checkDay >= start && checkDay <= end;
    });
  };

  const getCycleStage = (day: Date, cycle: MenstrualCycle) => {
    const checkDay = startOfDay(day);
    const cycleStart = startOfDay(new Date(cycle.periodStartDate));
    
    const daysSinceStart = differenceInDays(day, cycleStart) + 1;
    const cycleLength = getCycleLength(cycle) || 28;
    const periodLength = cycle.periodEndDate ? 
      differenceInDays(new Date(cycle.periodEndDate), cycleStart) + 1 : 5;

    if (daysSinceStart <= periodLength) {
      return 'menstrual';
    } else if (daysSinceStart <= 13) {
      return 'follicular';
    } else if (daysSinceStart >= 14 && daysSinceStart <= 16) {
      return 'ovulation';
    } else if (daysSinceStart <= (cycleLength - 14)) {
      return 'luteal';
    } else {
      return 'premenstrual';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'menstrual': return 'bg-red-100 text-red-800';
      case 'follicular': return 'bg-green-100 text-green-800';
      case 'ovulation': return 'bg-pink-100 text-pink-800';
      case 'luteal': return 'bg-yellow-100 text-yellow-800';
      case 'premenstrual': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageEmoji = (stage: string) => {
    switch (stage) {
      case 'menstrual': return '🩸';
      case 'follicular': return '🌱';
      case 'ovulation': return '🥚';
      case 'luteal': return '💛';
      case 'premenstrual': return '🌙';
      default: return '⭕';
    }
  };

  // Create cycle mutation
  const createCycleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/menstrual-cycles', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Cycle Added",
        description: "Your menstrual cycle has been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add cycle. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update cycle mutation
  const updateCycleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/menstrual-cycles/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      setIsDialogOpen(false);
      setEditingCycle(null);
      resetForm();
      toast({
        title: "Cycle Updated",
        description: "Your menstrual cycle has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cycle. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete cycle mutation
  const deleteCycleMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/menstrual-cycles/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      setIsDialogOpen(false);
      setEditingCycle(null);
      resetForm();
      toast({
        title: "Cycle Deleted",
        description: "The menstrual cycle has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete cycle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cycleData = {
      periodStartDate: new Date(formData.startDate),
      periodEndDate: formData.periodEndDate ? new Date(formData.periodEndDate) : null,
      cycleEndDate: formData.endDate ? new Date(formData.endDate) : null,
      connectionId: formData.connectionId,
      flowIntensity: formData.flowIntensity || null,
      mood: formData.mood || null,
      symptoms: formData.symptoms.length > 0 ? formData.symptoms : null,
      notes: formData.notes || null,
    };

    if (editingCycle) {
      updateCycleMutation.mutate({ id: editingCycle.id, data: cycleData });
    } else {
      createCycleMutation.mutate(cycleData);
    }
  };

  const handleEdit = (cycle: MenstrualCycle) => {
    setEditingCycle(cycle);
    setFormData({
      startDate: format(new Date(cycle.periodStartDate), 'yyyy-MM-dd'),
      periodEndDate: cycle.periodEndDate ? format(new Date(cycle.periodEndDate), 'yyyy-MM-dd') : '',
      endDate: cycle.cycleEndDate ? format(new Date(cycle.cycleEndDate), 'yyyy-MM-dd') : '',
      flowIntensity: cycle.flowIntensity || '',
      mood: cycle.mood || '',
      symptoms: cycle.symptoms || [],
      notes: cycle.notes || '',
      connectionId: cycle.connectionId
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (cycle: MenstrualCycle) => {
    if (confirm('Are you sure you want to delete this cycle?')) {
      deleteCycleMutation.mutate(cycle.id);
    }
  };

  const resetForm = () => {
    setFormData({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      periodEndDate: '',
      endDate: '',
      flowIntensity: '',
      mood: '',
      symptoms: [],
      notes: '',
      connectionId: null
    });
  };

  const handleDayClick = (day: Date) => {
    setFormData(prev => ({
      ...prev,
      startDate: format(day, 'yyyy-MM-dd')
    }));
    setIsDialogOpen(true);
  };

  const getCycleLength = (cycle: MenstrualCycle) => {
    if (cycle.cycleLength) return cycle.cycleLength;
    if (cycle.cycleEndDate) {
      return differenceInDays(new Date(cycle.cycleEndDate), new Date(cycle.periodStartDate)) + 1;
    }
    return 28; // Default
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Menstrual Cycle Tracker</h1>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Filter ({selectedConnectionIds.length})
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {connections.map((connection) => (
                    <DropdownMenuCheckboxItem
                      key={connection.id}
                      checked={selectedConnectionIds.includes(connection.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedConnectionIds(prev => [...prev, connection.id]);
                        } else {
                          setSelectedConnectionIds(prev => prev.filter(id => id !== connection.id));
                        }
                      }}
                    >
                      {connection.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cycle
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
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
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day) => {
                  const cycleInfo = getCycleInfoForDay(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        p-2 min-h-[60px] border rounded cursor-pointer transition-colors
                        ${isToday ? 'bg-blue-100 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}
                        ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
                      `}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="text-sm font-medium mb-1">
                        {format(day, 'd')}
                      </div>
                      {cycleInfo.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {cycleInfo.map((info, index) => (
                            <div
                              key={`${info.connectionId}-${index}`}
                              className={`text-xs px-1 py-0.5 rounded ${getStageColor(info.phase)}`}
                              title={`${info.connectionName} - ${info.phase}`}
                            >
                              {getStageEmoji(info.phase)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Cycle Phases</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">🩸</span>
                    Menstrual
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🌱</span>
                    Follicular
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🥚</span>
                    Ovulation
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">💛</span>
                    Luteal
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🌙</span>
                    Premenstrual
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Cycles */}
          {filteredCycles.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Cycles</h2>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {filteredCycles.slice(0, 5).map((cycle) => {
                      const connection = connections.find(c => c.id === cycle.connectionId);
                      return (
                        <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={connection?.profileImage || undefined} />
                              <AvatarFallback>
                                {connection?.name.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{connection?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(cycle.periodStartDate), 'MMM dd, yyyy')} - 
                                {cycle.cycleEndDate ? format(new Date(cycle.cycleEndDate), 'MMM dd, yyyy') : 'Ongoing'}
                              </p>
                              {cycle.mood && <Badge variant="secondary" className="mt-1">{cycle.mood}</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cycle)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(cycle)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Cycle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCycle ? 'Edit Cycle' : 'Add New Cycle'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="connection">Connection</Label>
              <Select
                value={formData.connectionId?.toString() || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, connectionId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id.toString()}>
                      {connection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Period Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="periodEndDate">Period End Date</Label>
              <Input
                id="periodEndDate"
                type="date"
                value={formData.periodEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, periodEndDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Cycle End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="flowIntensity">Flow Intensity</Label>
              <Select value={formData.flowIntensity} onValueChange={(value) => setFormData(prev => ({ ...prev, flowIntensity: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mood">Mood</Label>
              <Input
                id="mood"
                value={formData.mood}
                onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                placeholder="How are you feeling?"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingCycle(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCycleMutation.isPending || updateCycleMutation.isPending}>
                {editingCycle ? 'Update' : 'Create'} Cycle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}