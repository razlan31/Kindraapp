import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { Calendar, Plus, Edit3, Trash2, Circle, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MenstrualCycle, Connection } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";

const symptomsList = [
  "Cramps", "Bloating", "Headache", "Mood swings", "Fatigue", 
  "Breast tenderness", "Acne", "Food cravings", "Back pain", "Nausea"
];

const flowIntensityOptions = [
  { value: "light", label: "Light", color: "bg-pink-200" },
  { value: "medium", label: "Medium", color: "bg-pink-400" },
  { value: "heavy", label: "Heavy", color: "bg-pink-600" }
];

const moodOptions = [
  "Happy", "Sad", "Anxious", "Irritable", "Energetic", "Tired", "Emotional", "Calm"
];

export default function MenstrualCyclePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<MenstrualCycle | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Form state
  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    flowIntensity: '',
    mood: '',
    symptoms: [] as string[],
    notes: '',
    connectionId: null as number | null
  });

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });

  // Fetch cycles
  const { data: cycles = [], isLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
  });

  // Create list of people who can have cycles (user + female connections)
  const trackablePersons = useMemo(() => {
    const persons = [];
    
    // Add user if they exist
    if (user) {
      persons.push({
        id: 0, // Special ID for user
        name: user.displayName || user.username || 'Me',
        isUser: true
      });
    }
    
    // Add all connections (assuming they could have cycles)
    connections.forEach(connection => {
      persons.push({
        id: connection.id,
        name: connection.name,
        isUser: false
      });
    });
    
    return persons;
  }, [user, connections]);

  // Create cycle mutation
  const createCycleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/menstrual-cycles', data),
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
    }
  });

  // Update cycle mutation
  const updateCycleMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) => 
      apiRequest('PATCH', `/api/menstrual-cycles/${id}`, data),
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
    }
  });

  const resetForm = () => {
    setFormData({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      flowIntensity: '',
      mood: '',
      symptoms: [],
      notes: '',
      connectionId: selectedPersonId
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      flowIntensity: formData.flowIntensity || null,
      mood: formData.mood || null,
      symptoms: formData.symptoms.length > 0 ? formData.symptoms : null,
      notes: formData.notes || null,
      connectionId: selectedPersonId === 0 ? null : selectedPersonId // 0 means user, null in DB
    };

    if (editingCycle) {
      updateCycleMutation.mutate({ id: editingCycle.id, ...submitData });
    } else {
      createCycleMutation.mutate(submitData);
    }
  };

  const handleEdit = (cycle: MenstrualCycle) => {
    setEditingCycle(cycle);
    setFormData({
      startDate: format(new Date(cycle.startDate), 'yyyy-MM-dd'),
      endDate: cycle.endDate ? format(new Date(cycle.endDate), 'yyyy-MM-dd') : '',
      flowIntensity: cycle.flowIntensity || '',
      mood: cycle.mood || '',
      symptoms: Array.isArray(cycle.symptoms) ? cycle.symptoms : [],
      notes: cycle.notes || '',
      connectionId: cycle.connectionId || null
    });
    setIsDialogOpen(true);
  };

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const getCurrentCycle = () => cycles.find(cycle => !cycle.endDate);
  const getPastCycles = () => cycles
    .filter(cycle => cycle.endDate)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const getCycleLength = (cycle: MenstrualCycle) => {
    if (!cycle.endDate) return null;
    return differenceInDays(new Date(cycle.endDate), new Date(cycle.startDate)) + 1;
  };

  const getAverageCycleLength = () => {
    const completedCycles = getPastCycles().slice(0, 6); // Last 6 cycles
    if (completedCycles.length === 0) return null;
    
    const totalDays = completedCycles.reduce((sum, cycle) => {
      const length = getCycleLength(cycle);
      return sum + (length || 0);
    }, 0);
    
    return Math.round(totalDays / completedCycles.length);
  };

  const getNextPredictedDate = () => {
    const avgLength = getAverageCycleLength();
    const lastCycle = getPastCycles()[0];
    
    if (!avgLength || !lastCycle?.endDate) return null;
    
    // Predict next cycle start (average cycle is ~28 days from start to start)
    const avgCycleLength = avgLength + 21; // Assuming ~21 day luteal phase
    return addDays(new Date(lastCycle.startDate), avgCycleLength);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
      </div>
    );
  }

  const currentCycle = getCurrentCycle();
  const pastCycles = getPastCycles();
  const avgLength = getAverageCycleLength();
  const nextPredicted = getNextPredictedDate();

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <section className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/calendar')}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Cycle Tracker</h1>
                <p className="text-sm text-muted-foreground">
                  Track your menstrual cycle and symptoms
                </p>
              </div>
            </div>
            <Circle className="h-6 w-6 text-pink-500" />
          </div>
        </section>

        {/* Current Cycle Status */}
        <section className="px-4 py-2">
          <Card className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border-pink-200 dark:border-pink-800">
            {currentCycle ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-pink-800 dark:text-pink-200">Current Cycle</h3>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                    Day {differenceInDays(new Date(), new Date(currentCycle.startDate)) + 1}
                  </Badge>
                </div>
                <p className="text-sm text-pink-600 dark:text-pink-300">
                  Started {format(new Date(currentCycle.startDate), 'MMMM d, yyyy')}
                </p>
                <Button 
                  onClick={() => handleEdit(currentCycle)}
                  size="sm"
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Update Current Cycle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-pink-800 dark:text-pink-200">Ready to Track</h3>
                {nextPredicted && (
                  <p className="text-sm text-pink-600 dark:text-pink-300">
                    Next cycle predicted: {format(nextPredicted, 'MMMM d')}
                  </p>
                )}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                      onClick={() => {
                        setEditingCycle(null);
                        resetForm();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Cycle
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
          </Card>
        </section>

        {/* Stats */}
        {avgLength && (
          <section className="px-4 py-2">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Cycle Insights</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{avgLength}</div>
                  <div className="text-xs text-muted-foreground">Avg Flow Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{pastCycles.length}</div>
                  <div className="text-xs text-muted-foreground">Cycles Tracked</div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Past Cycles */}
        <section className="px-4 py-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Cycle History</h3>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingCycle(null);
                      resetForm();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cycle
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
            
            {pastCycles.length > 0 ? (
              <div className="space-y-3">
                {pastCycles.map((cycle) => (
                  <div key={cycle.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {format(new Date(cycle.startDate), 'MMM d')} - {cycle.endDate ? format(new Date(cycle.endDate), 'MMM d') : 'Ongoing'}
                        </span>
                        {cycle.flowIntensity && (
                          <Badge variant="outline" className="text-xs">
                            {cycle.flowIntensity}
                          </Badge>
                        )}
                      </div>
                      {cycle.symptoms && Array.isArray(cycle.symptoms) && cycle.symptoms.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {cycle.symptoms.slice(0, 3).join(', ')}
                          {cycle.symptoms.length > 3 && ` +${cycle.symptoms.length - 3} more`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-pink-600">
                        {getCycleLength(cycle)} days
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(cycle)}
                        className="h-8 w-8"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Circle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No cycles recorded yet</p>
                <p className="text-sm">Start tracking to see your history</p>
              </div>
            )}
          </Card>
        </section>

        {/* Add/Edit Cycle Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCycle ? 'Update Cycle' : 'Add New Cycle'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="flowIntensity">Flow Intensity</Label>
                  <Select value={formData.flowIntensity} onValueChange={(value) => setFormData(prev => ({ ...prev, flowIntensity: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      {flowIntensityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${option.color}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mood">Mood</Label>
                  <Select value={formData.mood} onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map((mood) => (
                        <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Symptoms</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {symptomsList.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={formData.symptoms.includes(symptom)}
                        onCheckedChange={() => handleSymptomToggle(symptom)}
                      />
                      <Label htmlFor={symptom} className="text-sm">{symptom}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes about this cycle..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCycleMutation.isPending || updateCycleMutation.isPending}
                  className="flex-1"
                >
                  {createCycleMutation.isPending || updateCycleMutation.isPending 
                    ? 'Saving...' 
                    : editingCycle ? 'Update' : 'Add'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}