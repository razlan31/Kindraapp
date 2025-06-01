import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, subMonths, addMonths, startOfWeek, getDay } from "date-fns";
import { Calendar, Plus, Edit3, Trash2, Circle, ChevronLeft, ChevronRight, User, UserPlus, Camera, X } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MenstrualCycle, Connection } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useModal } from "@/contexts/modal-context";
import { AddConnectionModal } from "@/components/modals/add-connection-modal";

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

// Cycle prediction utilities
const calculateCycleLength = (cycles: MenstrualCycle[]): number => {
  if (cycles.length < 2) return 28; // Default cycle length
  
  const sortedCycles = cycles
    .filter(cycle => cycle.startDate)
    .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
  
  if (sortedCycles.length < 2) return 28;
  
  const cycleLengths = [];
  for (let i = 1; i < sortedCycles.length; i++) {
    const previousStart = new Date(sortedCycles[i - 1].startDate!);
    const currentStart = new Date(sortedCycles[i].startDate!);
    const length = differenceInDays(currentStart, previousStart);
    if (length > 0 && length <= 45) { // Valid cycle length range
      cycleLengths.push(length);
    }
  }
  
  if (cycleLengths.length === 0) return 28;
  
  // Return average cycle length
  return Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
};

const calculateOvulationDay = (cycleLength: number): number => {
  // Ovulation occurs 14 days before next period (luteal phase length)
  const lutealPhaseLength = 14;
  return cycleLength - lutealPhaseLength + 1; // +1 because we count from day 1
};

const getCyclePhase = (dayInCycle: number, cycleLength: number): { phase: string; color: string; description: string } => {
  const ovulationDay = calculateOvulationDay(cycleLength);
  const fertileWindowStart = ovulationDay - 5; // 5 days before ovulation
  
  if (dayInCycle <= 5) {
    return {
      phase: "Menstrual",
      color: "bg-pink-500",
      description: "Period days"
    };
  } else if (dayInCycle === ovulationDay) {
    return {
      phase: "Ovulation",
      color: "bg-blue-600",
      description: "Ovulation day"
    };
  } else if (dayInCycle >= fertileWindowStart && dayInCycle < ovulationDay) {
    return {
      phase: "Fertile",
      color: "bg-green-500",
      description: "Fertile window"
    };
  } else if (dayInCycle > ovulationDay) {
    return {
      phase: "Luteal",
      color: "bg-purple-500",
      description: "Luteal phase"
    };
  } else {
    return {
      phase: "Follicular",
      color: "bg-gray-300",
      description: "Follicular phase"
    };
  }
};

const predictNextCycles = (lastCycle: MenstrualCycle, avgCycleLength: number, numberOfCycles: number = 3): Array<{
  startDate: Date;
  ovulationDate: Date;
  phase: string;
  isNext: boolean;
}> => {
  const predictions = [];
  const lastStartDate = new Date(lastCycle.startDate!);
  
  for (let i = 1; i <= numberOfCycles; i++) {
    const nextStartDate = addDays(lastStartDate, avgCycleLength * i);
    const ovulationDate = addDays(nextStartDate, calculateOvulationDay(avgCycleLength) - 1);
    
    predictions.push({
      startDate: nextStartDate,
      ovulationDate,
      phase: i === 1 ? "Next Period" : `Period in ${i} cycles`,
      isNext: i === 1
    });
  }
  
  return predictions;
};

// Image compression utility
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      let { width, height } = img;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = width * (MAX_HEIGHT / height);
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export default function MenstrualCyclePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { openConnectionModal, closeConnectionModal, connectionModalOpen } = useModal();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<MenstrualCycle | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

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
    const persons: Array<{ id: number; name: string; isUser: boolean; profileImage?: string | null }> = [];
    
    // Add user if they exist
    if (user) {
      persons.push({
        id: 0, // Special ID for user
        name: user.displayName || user.username || 'Me',
        isUser: true,
        profileImage: user.profileImage
      });
    }
    
    // Add all connections (assuming they could have cycles)
    connections.forEach(connection => {
      persons.push({
        id: connection.id,
        name: connection.name,
        isUser: false,
        profileImage: connection.profileImage
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
        description: "Your new connection has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add connection. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddConnection = (formData: FormData) => {
    createConnectionMutation.mutate(formData);
  };

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

  // Filter cycles based on selected person
  const filteredCycles = useMemo(() => {
    if (selectedPersonId === null) return cycles;
    return cycles.filter(cycle => {
      if (selectedPersonId === 0) {
        // User's cycles (connectionId is null)
        return cycle.connectionId === null;
      } else {
        // Connection's cycles
        return cycle.connectionId === selectedPersonId;
      }
    });
  }, [cycles, selectedPersonId]);

  const getCurrentCycle = () => filteredCycles.find(cycle => !cycle.endDate);
  const getPastCycles = () => filteredCycles
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

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCycleForDay = (day: Date) => {
    return filteredCycles.find(cycle => {
      const start = new Date(cycle.startDate);
      const end = cycle.endDate ? new Date(cycle.endDate) : new Date();
      return day >= start && day <= end;
    });
  };

  const getCycleStage = (day: Date, cycle: MenstrualCycle) => {
    const daysSinceStart = differenceInDays(day, new Date(cycle.startDate)) + 1; // +1 to match cycle day counting
    const cycleLength = getCycleLength(cycle) || 28; // Default to 28 if null
    const phase = getCyclePhase(daysSinceStart, cycleLength);
    
    return phase.phase.toLowerCase();
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'menstrual': return 'bg-red-500';
      case 'follicular': return 'bg-green-500';
      case 'ovulation': return 'bg-yellow-500';
      case 'luteal': return 'bg-purple-500';
      default: return 'bg-gray-300';
    }
  };

  const getSelectedPersonName = () => {
    if (selectedPersonId === null) return 'All People';
    if (selectedPersonId === 0) return user?.displayName || user?.username || 'Me';
    const connection = connections.find(c => c.id === selectedPersonId);
    return connection?.name || 'Unknown';
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
          <div className="flex items-center justify-between mb-4">
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
                  Track menstrual cycles and symptoms
                </p>
              </div>
            </div>
            <Circle className="h-6 w-6 text-pink-500" />
          </div>

          {/* Person Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tracking For:</Label>
            <Select 
              value={selectedPersonId?.toString() || "-1"} 
              onValueChange={(value) => {
                if (value === "add_connection") {
                  openConnectionModal();
                } else {
                  setSelectedPersonId(value === "-1" ? null : parseInt(value));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select person to track">
                  <div className="flex items-center gap-2">
                    {selectedPersonId === 0 ? <User className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    {getSelectedPersonName()}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4" />
                    All People
                  </div>
                </SelectItem>
                {trackablePersons.map((person) => (
                  <SelectItem key={person.id} value={person.id.toString()}>
                    <div className="flex items-center gap-2">
                      {person.isUser ? (
                        <User className="h-4 w-4" />
                      ) : person.profileImage ? (
                        <img 
                          src={person.profileImage} 
                          alt={person.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {person.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {person.name}
                    </div>
                  </SelectItem>
                ))}
                <Separator className="my-1" />
                <SelectItem value="add_connection">
                  <div className="flex items-center gap-2 text-blue-600">
                    <UserPlus className="h-4 w-4" />
                    Add New Connection
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex-1"
            >
              List View
            </Button>
          </div>
        </section>

        {/* Current Cycle Status and Predictions */}
        {selectedPersonId !== null && (
          <section className="px-4 py-2 space-y-4">
            {/* Current Cycle Status */}
            <Card className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border-pink-200 dark:border-pink-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-pink-900 dark:text-pink-100">Current Status</h3>
                <Circle className="h-5 w-5 text-pink-600" />
              </div>
              
              {(() => {
                const currentCycle = getCurrentCycle();
                const avgCycleLength = calculateCycleLength(filteredCycles);
                const currentDay = currentCycle ? differenceInDays(new Date(), new Date(currentCycle.startDate)) + 1 : 0;
                const currentPhase = currentCycle ? getCyclePhase(currentDay, avgCycleLength) : null;
                
                return currentCycle ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-pink-700 dark:text-pink-300">
                        Day {currentDay} of cycle
                      </p>
                      {currentPhase && (
                        <Badge className={`${currentPhase.color} text-white text-xs`}>
                          {currentPhase.phase}
                        </Badge>
                      )}
                    </div>
                    
                    {currentPhase && (
                      <p className="text-xs text-pink-600 dark:text-pink-400">
                        {currentPhase.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-pink-600 dark:text-pink-400">
                      Started {format(new Date(currentCycle.startDate), 'MMM d, yyyy')}
                    </p>
                    
                    {/* Ovulation prediction for current cycle */}
                    {currentDay < calculateOvulationDay(avgCycleLength) && (
                      <div className="bg-green-50 dark:bg-green-950 p-2 rounded-md">
                        <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                          Ovulation predicted: Day {calculateOvulationDay(avgCycleLength)} 
                          ({format(addDays(new Date(currentCycle.startDate), calculateOvulationDay(avgCycleLength) - 1), 'MMM d')})
                        </p>
                      </div>
                    )}
                    
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
                  <div className="space-y-2">
                    <p className="text-sm text-pink-700 dark:text-pink-300">No active cycle</p>
                    {getNextPredictedDate() && (
                      <p className="text-xs text-pink-600 dark:text-pink-400">
                        Next predicted: {format(getNextPredictedDate()!, 'MMM d, yyyy')}
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
                );
              })()}
            </Card>

            {/* Cycle Predictions - Only in List View */}
            {viewMode === 'list' && (() => {
              const currentCycle = getCurrentCycle();
              const completedCycles = getPastCycles();
              const avgCycleLength = calculateCycleLength(filteredCycles);
              
              // Show predictions even with just one cycle (current or completed)
              const hasCycleData = currentCycle || completedCycles.length > 0;
              
              if (!hasCycleData) {
                return (
                  <Card className="p-4">
                    <h3 className="font-medium text-foreground mb-2">Cycle Predictions</h3>
                    <p className="text-sm text-muted-foreground">
                      Start tracking your first cycle to see predictions and patterns
                    </p>
                  </Card>
                );
              }
              
              return (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground">Cycle Predictions</h3>
                    <Badge variant="outline" className="text-xs">
                      {completedCycles.length > 0 ? `Avg ${avgCycleLength} days` : 'Default 28 days'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Current cycle predictions */}
                    {currentCycle && (
                      <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Current Cycle Timeline
                          </p>
                          <Badge className="bg-pink-500 text-white text-xs">
                            Active
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Started: {format(new Date(currentCycle.startDate), 'MMM d, yyyy')}
                          </p>
                          
                          {/* Ovulation prediction for current cycle */}
                          <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                            <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                              Predicted Ovulation: {format(addDays(new Date(currentCycle.startDate), calculateOvulationDay(avgCycleLength) - 1), 'MMM d')} 
                              (Day {calculateOvulationDay(avgCycleLength)})
                            </p>
                          </div>
                          
                          {/* Next period prediction */}
                          <div className="bg-red-50 dark:bg-red-950 p-2 rounded">
                            <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                              Next Period Expected: {format(addDays(new Date(currentCycle.startDate), avgCycleLength), 'MMM d')}
                              (Day {avgCycleLength + 1})
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Future cycle predictions */}
                    {(() => {
                      const baseCycle = currentCycle || completedCycles[0];
                      if (!baseCycle) return null;
                      
                      const startDate = currentCycle ? 
                        addDays(new Date(currentCycle.startDate), avgCycleLength) : 
                        addDays(new Date(baseCycle.startDate), avgCycleLength);
                        
                      const futurePredictions = [];
                      for (let i = 0; i < (currentCycle ? 2 : 3); i++) {
                        const cycleStart = addDays(startDate, avgCycleLength * i);
                        const ovulationDate = addDays(cycleStart, calculateOvulationDay(avgCycleLength) - 1);
                        
                        futurePredictions.push({
                          startDate: cycleStart,
                          ovulationDate,
                          phase: i === 0 ? "Next Period" : `${i + 1} cycles ahead`,
                          isNext: i === 0
                        });
                      }
                      
                      return futurePredictions.map((prediction, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${prediction.isNext ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <p className={`text-sm font-medium ${prediction.isNext ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}`}>
                              {prediction.phase}
                            </p>
                            <Badge className="bg-red-500 text-white text-xs">
                              Period
                            </Badge>
                          </div>
                          
                          <p className={`text-xs ${prediction.isNext ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            {format(prediction.startDate, 'MMM d, yyyy')}
                          </p>
                          
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Ovulation: {format(prediction.ovulationDate, 'MMM d')} 
                              (Day {calculateOvulationDay(avgCycleLength)})
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      {completedCycles.length > 0 ? 
                        "Predictions improve with more cycle data. The tracker will adjust as you add new cycles." :
                        "Initial predictions use a standard 28-day cycle. Accuracy improves as you track more cycles."
                      }
                    </p>
                  </div>
                </Card>
              );
            })()}
          </section>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && selectedPersonId !== null && (
          <section className="px-4 py-2">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Cycle Calendar</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="p-2 font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before month start */}
                {Array.from({ length: startOfWeek(monthStart).getTime() !== monthStart.getTime() ? getDay(monthStart) : 0 }, (_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                
                {/* Month days */}
                {monthDays.map(day => {
                  const cycle = getCycleForDay(day);
                  const stage = cycle ? getCycleStage(day, cycle) : null;
                  const isToday = isSameDay(day, new Date());
                  
                  // Check for predictions
                  const currentCycle = getCurrentCycle();
                  const avgCycleLength = calculateCycleLength(filteredCycles);
                  
                  let isPredictedPeriod = false;
                  let predictionPhase = null;
                  
                  if (currentCycle) {
                    // Predict next period
                    const nextPeriodDate = addDays(new Date(currentCycle.startDate), avgCycleLength);
                    if (isSameDay(day, nextPeriodDate)) {
                      isPredictedPeriod = true;
                    }
                    
                    // Get current cycle phase for the day
                    if (!cycle && day >= new Date(currentCycle.startDate)) {
                      const dayInCycle = differenceInDays(day, new Date(currentCycle.startDate)) + 1;
                      if (dayInCycle <= avgCycleLength) {
                        predictionPhase = getCyclePhase(dayInCycle, avgCycleLength);
                      }
                    }
                  } else {
                    // If no current cycle, predict from last completed cycle
                    const lastCycle = getPastCycles()[0];
                    if (lastCycle) {
                      const nextPeriodDate = addDays(new Date(lastCycle.startDate), avgCycleLength);

                      
                      if (isSameDay(day, nextPeriodDate)) {
                        isPredictedPeriod = true;
                      }

                    }
                  }
                  
                  return (
                    <div
                      key={day.getTime()}
                      className={`
                        relative p-1 h-10 w-10 flex flex-col items-center justify-center text-xs
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                        hover:bg-muted
                      `}
                    >
                      {/* Actual cycle days */}
                      {cycle && stage === 'menstrual' && (
                        <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-medium">
                          {format(day, 'd')}
                        </div>
                      )}
                      
                      {cycle && stage === 'ovulation' && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {format(day, 'd')}
                        </div>
                      )}
                      
                      {cycle && stage === 'fertile' && (
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                          {format(day, 'd')}
                        </div>
                      )}
                      
                      {cycle && stage === 'luteal' && (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <span className="text-purple-600 font-medium text-sm">{format(day, 'd')}</span>
                        </div>
                      )}
                      
                      {/* Follicular stage - tracked but not displayed */}
                      {cycle && stage === 'follicular' && (
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{format(day, 'd')}</span>
                      )}
                      
                      {/* Predicted period - dotted circle */}
                      {isPredictedPeriod && !cycle && (
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-pink-500 flex items-center justify-center text-pink-600 font-medium">
                          {format(day, 'd')}
                        </div>
                      )}
                      
                      {/* Regular days with no cycle or prediction */}
                      {!cycle && !isPredictedPeriod && (
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{format(day, 'd')}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                    <span>Menstrual phase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>Fertile window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    <span>Ovulation day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 flex items-center justify-center text-purple-600 font-medium text-xs">L</div>
                    <span>Luteal phase</span>
                  </div>
                </div>
                
                <div className="border-t pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Predictions:</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-dashed border-pink-500 flex items-center justify-center text-pink-600 text-xs font-medium">
                        P
                      </div>
                      <span>Expected next period</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* List View */}
        {viewMode === 'list' && selectedPersonId !== null && (
          <section className="px-4 py-2">
            <Card className="p-4">
              <h3 className="font-medium text-foreground mb-4">Cycle History</h3>
              
              {filteredCycles.length === 0 ? (
                <div className="text-center py-8">
                  <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No cycles recorded yet</p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setEditingCycle(null);
                          resetForm();
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start First Cycle
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCycles
                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                    .map((cycle) => (
                      <div key={cycle.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${cycle.endDate ? 'bg-green-500' : 'bg-orange-500'}`} />
                            <span className="font-medium">
                              {cycle.endDate ? 'Completed' : 'Active'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cycle)}
                              className="h-6 w-6"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Started:</span>{' '}
                            {format(new Date(cycle.startDate), 'MMM d, yyyy')}
                          </p>
                          {cycle.endDate && (
                            <p>
                              <span className="text-muted-foreground">Ended:</span>{' '}
                              {format(new Date(cycle.endDate), 'MMM d, yyyy')}
                            </p>
                          )}
                          <p>
                            <span className="text-muted-foreground">Length:</span>{' '}
                            {getCycleLength(cycle) ? `${getCycleLength(cycle)} days` : 'Ongoing'}
                          </p>
                          {cycle.flowIntensity && (
                            <p>
                              <span className="text-muted-foreground">Flow:</span>{' '}
                              {cycle.flowIntensity}
                            </p>
                          )}
                          {cycle.mood && (
                            <p>
                              <span className="text-muted-foreground">Mood:</span>{' '}
                              {cycle.mood}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </section>
        )}

        {/* Stats */}
        {selectedPersonId !== null && getAverageCycleLength() && (
          <section className="px-4 py-2">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Cycle Statistics for {getSelectedPersonName()}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{getAverageCycleLength()}</div>
                  <div className="text-xs text-muted-foreground">Avg Flow Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{getPastCycles().length}</div>
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

        {/* Connection Modal */}
        {connectionModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-heading font-semibold text-lg">Add New Connection</h2>
                <Button variant="ghost" size="icon" onClick={closeConnectionModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddConnection(formData);
              }} className="p-4 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Profile Image
                  </label>
                  <div className="mb-4">
                    <div className="flex items-center justify-center mb-3">
                      <Avatar className="h-20 w-20 border-2 border-blue-100 dark:border-blue-900">
                        {uploadedImage ? (
                          <AvatarImage src={uploadedImage} alt="Profile preview" />
                        ) : (
                          <AvatarFallback className="bg-blue-50 dark:bg-blue-950 text-blue-500">
                            <Camera className="h-6 w-6" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="fileUpload"
                        name="profileImageFile"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressedImage = await compressImage(file);
                              setUploadedImage(compressedImage);
                            } catch (error) {
                              console.error('Error compressing image:', error);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                setUploadedImage(result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => document.getElementById('fileUpload')?.click()}
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photo from Device
                      </Button>
                    </div>
                    
                    <p className="text-xs text-neutral-500 mt-1">
                      Choose a photo from your device to personalize this connection
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="name"
                    required
                    placeholder="Enter name"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Relationship Stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="relationshipStage"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                    defaultValue="Potential"
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
                    When did you start this connection?
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Track when you first connected with this person
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Birthday
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
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
                    <option value="">Select sign</option>
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
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeConnectionModal}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createConnectionMutation.isPending}
                    className="flex-1"
                  >
                    {createConnectionMutation.isPending ? "Adding..." : "Add Connection"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}