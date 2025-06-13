import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, subMonths, addMonths, startOfWeek, getDay, startOfDay } from "date-fns";
import { Calendar, Plus, Edit3, Trash2, Circle, ChevronLeft, ChevronRight, User, UserPlus, Camera, X, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
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
// Removed modal context import

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
      color: "bg-blue-300",
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
  // Modal functionality removed for simplicity
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<MenstrualCycle | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>([]);
  const [cycleForPersonId, setCycleForPersonId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  // Removed uploadedImage state
  const startDateRef = useRef<HTMLInputElement>(null);

  // Note: Date picker auto-opening is browser behavior that's difficult to prevent consistently

  // Form state
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

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });

  // Fetch cycles
  const { data: cycles = [], isLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
  });

  // Color palette for visual distinction
  const personColors = [
    { bg: 'bg-pink-100 dark:bg-pink-900', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-700 dark:text-pink-300', accent: 'bg-pink-500' },
    { bg: 'bg-purple-100 dark:bg-purple-900', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300', accent: 'bg-purple-500' },
    { bg: 'bg-blue-100 dark:bg-blue-900', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300', accent: 'bg-blue-500' },
    { bg: 'bg-green-100 dark:bg-green-900', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300', accent: 'bg-green-500' },
    { bg: 'bg-orange-100 dark:bg-orange-900', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', accent: 'bg-orange-500' }
  ];

  // Create list of people who can have cycles (user + female connections)
  const trackablePersons = useMemo(() => {
    const persons: Array<{ id: number; name: string; isUser: boolean; profileImage?: string | null; colorIndex: number }> = [];
    
    // Add all connections (assuming they could have cycles)
    connections.forEach((connection, index) => {
      persons.push({
        id: connection.id,
        name: connection.name,
        isUser: false,
        profileImage: connection.profileImage,
        colorIndex: index % personColors.length
      });
    });
    
    return persons;
  }, [connections]);

  // Helper to get person color
  const getPersonColor = (personId: number) => {
    const person = trackablePersons.find(p => p.id === personId);
    return person ? personColors[person.colorIndex] : personColors[0];
  };

  // Helper to get person name
  const getPersonName = (connectionId: number | null) => {
    if (connectionId === null) return user?.displayName || user?.username || 'Me';
    const connection = connections.find(c => c.id === connectionId);
    return connection?.name || 'Unknown';
  };

  // Helper to get person initial
  const getPersonInitial = (connectionId: number | null) => {
    const name = getPersonName(connectionId);
    return name.charAt(0).toUpperCase();
  };

  // Get all cycles for a specific day (for multi-person view)
  const getCyclesForDay = (day: Date) => {
    // If no cycles exist at all, return empty array
    if (!cycles || cycles.length === 0) return [];
    
    const actualCycles = selectedPersonIds.length === 0 ? cycles : cycles.filter(cycle => {
      // Check if this cycle belongs to a selected person
      const belongsToSelectedPerson = selectedPersonIds.some(selectedId => {
        if (selectedId === 0) {
          return cycle.connectionId === null; // User's cycles
        } else {
          return cycle.connectionId === selectedId; // Connection's cycles
        }
      });
      
      if (!belongsToSelectedPerson) return false;
      
      // Check if the day falls within this cycle
      const start = startOfDay(new Date(cycle.startDate));
      const checkDay = startOfDay(day);
      
      if (cycle.endDate) {
        // Completed cycle - check if day is between start and end
        const end = startOfDay(new Date(cycle.endDate));
        return checkDay >= start && checkDay <= end;
      } else {
        // Ongoing cycle - calculate expected cycle length and check if day is within reasonable range
        const personCycles = cycles.filter(c => c.connectionId === cycle.connectionId);
        const avgLength = calculateCycleLength(personCycles);
        
        // If no historical cycles exist, use a default 28-day assumption but be more conservative
        const cycleLength = avgLength || 28;
        const expectedEnd = addDays(start, cycleLength - 1);
        return checkDay >= start && checkDay <= expectedEnd;
      }
    });

    // Generate predicted cycles for future dates
    const checkDay = startOfDay(day);
    const today = startOfDay(new Date());
    
    // Only generate predictions for future dates
    if (checkDay > today) {
      const predictedCycles = [];
      
      // For each selected person, generate predicted cycles
      for (const personId of selectedPersonIds) {
        const personCycles = cycles.filter(cycle => {
          if (personId === 0) {
            return cycle.connectionId === null;
          } else {
            return cycle.connectionId === personId;
          }
        });
        
        if (personCycles.length > 0) {
          // Get the most recent cycle for this person
          const sortedCycles = personCycles.sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          const lastCycle = sortedCycles[0];
          const avgCycleLength = calculateCycleLength(personCycles);
          
          // Generate predictions for up to 6 future cycles
          const lastCycleStart = new Date(lastCycle.startDate);
          
          // Calculate when the current cycle ends
          const currentCycleEnd = lastCycle.endDate ? 
            new Date(lastCycle.endDate) : 
            addDays(lastCycleStart, avgCycleLength - 1);
          
          // Track the base cycle for proper spacing
          let baseDate = lastCycle.endDate ? new Date(lastCycle.endDate) : addDays(lastCycleStart, avgCycleLength - 1);
          
          console.log('Prediction debug:', {
            personId,
            lastCycleStart: lastCycleStart.toISOString(),
            lastCycleEnd: lastCycle.endDate,
            baseDate: baseDate.toISOString(),
            avgCycleLength,
            checkDay: checkDay.toISOString()
          });
          
          for (let i = 1; i <= 6; i++) {
            // Calculate next cycle start: 1 day after the previous cycle ended
            const predictedStart = addDays(baseDate, 1);
            
            // Use the same period duration as the last recorded cycle (period length, not full cycle)
            const periodLength = lastCycle.periodEndDate && lastCycle.startDate ? 
              differenceInDays(new Date(lastCycle.periodEndDate), new Date(lastCycle.startDate)) + 1 :
              5; // Default 5-day period based on your latest cycle
              
            const predictedPeriodEnd = addDays(predictedStart, periodLength - 1); // -1 because we count inclusive
            
            // Calculate when this predicted cycle would end (for spacing the next one)
            const predictedCycleEnd = addDays(predictedStart, avgCycleLength - 1);
            
            const predictedStartDay = startOfDay(predictedStart);
            const predictedPeriodEndDay = startOfDay(predictedPeriodEnd);
            const checkDayStart = startOfDay(new Date(checkDay));
            
            console.log(`Cycle ${i} prediction:`, {
              predictedStart: predictedStart.toISOString(),
              predictedPeriodEnd: predictedPeriodEnd.toISOString(),
              checkDay: checkDay.toISOString(),
              checkDayStart: checkDayStart.toISOString(),
              periodLength,
              isMatch: checkDayStart >= predictedStartDay && checkDayStart <= predictedPeriodEndDay
            });
            
            // Check if the day falls within this predicted period (only show during period days, not full cycle)
            if (checkDayStart >= predictedStartDay && checkDayStart <= predictedPeriodEndDay) {
              // Create a virtual cycle for prediction
              const virtualCycle = {
                ...lastCycle,
                id: -i, // Use negative ID to distinguish from real cycles
                startDate: predictedStart.toISOString(),
                periodEndDate: predictedPeriodEnd.toISOString(),
                endDate: predictedCycleEnd.toISOString(),
                isPrediction: true
              } as any;
              predictedCycles.push(virtualCycle);
            }
            
            // Update baseDate for next iteration
            baseDate = predictedCycleEnd;
          }
        }
      }
      
      return [...actualCycles, ...predictedCycles];
    }
    
    return actualCycles;
  };

  // Create cycle mutation
  const createCycleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/menstrual-cycles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      setIsDialogOpen(false);
      setCycleForPersonId(null);
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

  // Connection functionality removed for simplicity

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submission debug:", {
      selectedPersonIds,
      trackablePersons,
      connections,
      editingCycle
    });

    // Determine which person to create/update the cycle for
    let targetPersonId: number;
    
    if (editingCycle) {
      // When editing, use the existing cycle's connectionId
      targetPersonId = editingCycle.connectionId || 0; // null becomes 0 for user
    } else if (cycleForPersonId !== null) {
      // A specific person's "Start New Cycle" button was clicked
      targetPersonId = cycleForPersonId;
    } else if (selectedPersonIds.length === 1) {
      // Only one person selected, use that person
      targetPersonId = selectedPersonIds[0];
    } else {
      // Multiple people selected but no specific person button clicked
      alert("Please select exactly one person to create a cycle for.");
      return;
    }

    const submitData = {
      startDate: formData.startDate,
      periodEndDate: formData.periodEndDate || null,
      endDate: formData.endDate || null,
      flowIntensity: formData.flowIntensity || null,
      mood: formData.mood || null,
      symptoms: formData.symptoms.length > 0 ? formData.symptoms : null,
      notes: formData.notes || null,
      connectionId: targetPersonId === 0 ? null : targetPersonId // 0 means user, null in DB
    };

    console.log("Submit data being sent:", submitData);

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
      periodEndDate: cycle.periodEndDate ? format(new Date(cycle.periodEndDate), 'yyyy-MM-dd') : '',
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

  // Filter cycles based on selected persons
  const filteredCycles = useMemo(() => {
    if (selectedPersonIds.length === 0) return cycles;
    return cycles.filter(cycle => {
      return selectedPersonIds.some(selectedId => {
        if (selectedId === 0) {
          // User's cycles (connectionId is null)
          return cycle.connectionId === null;
        } else {
          // Connection's cycles
          return cycle.connectionId === selectedId;
        }
      });
    });
  }, [cycles, selectedPersonIds]);

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
    
    const lengths = completedCycles
      .map(cycle => getCycleLength(cycle))
      .filter(length => length !== null) as number[];
    
    if (lengths.length === 0) return null;
    return Math.round(lengths.reduce((sum, length) => sum + length, 0) / lengths.length);
  };

  // Calendar days for current month
  const calendarDays = useMemo(() => {
    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = startOfWeek(endOfMonth(currentMonth));
    const end = addDays(endDate, 41); // 6 weeks * 7 days
    return eachDayOfInterval({ start: startDate, end });
  }, [currentMonth]);

  const handleDayClick = (day: Date) => {
    setFormData(prev => ({
      ...prev,
      startDate: format(day, 'yyyy-MM-dd')
    }));
    setEditingCycle(null);
    setIsDialogOpen(true);
  };

  const prevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 px-4 pt-5">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-5">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-heading font-semibold">Menstrual Cycle Tracking</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Track cycles for yourself and your connections
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingCycle(null);
              setCycleForPersonId(null);
              resetForm();
              setIsDialogOpen(true);
            }} 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Cycle
          </Button>
        </div>

        {/* Person Filter & View Mode */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Filter by Person:</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {selectedPersonIds.length === 0 
                    ? "All" 
                    : selectedPersonIds.length === 1 
                      ? trackablePersons.find(p => p.id === selectedPersonIds[0])?.name || "Unknown"
                      : `${selectedPersonIds.length} selected`
                  }
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {trackablePersons.map(person => (
                  <DropdownMenuCheckboxItem
                    key={person.id}
                    checked={selectedPersonIds.includes(person.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPersonIds([...selectedPersonIds, person.id]);
                      } else {
                        setSelectedPersonIds(selectedPersonIds.filter(id => id !== person.id));
                      }
                    }}
                  >
                    {person.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">View:</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-8"
              >
                Calendar
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8"
              >
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg">
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-xs font-medium p-2 text-neutral-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, dayIdx) => {
                  const dayCycles = getCyclesForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  
                  // Enhanced display for multiple cycles on same day
                  const dayInfo = (() => {
                    if (dayCycles.length === 0) {
                      return {
                        color: 'transparent',
                        indicator: '',
                        title: format(day, 'MMM d'),
                        description: 'No cycles'
                      };
                    }
                    
                    if (dayCycles.length === 1) {
                      const cycle = dayCycles[0];
                      const isStart = isSameDay(day, new Date(cycle.startDate));
                      const isEnd = cycle.endDate && isSameDay(day, new Date(cycle.endDate));
                      const isPredicted = (cycle as any).isPrediction;
                      
                      const personName = getPersonName(cycle.connectionId);
                      const initial = getPersonInitial(cycle.connectionId);
                      
                      return {
                        color: isPredicted ? 'bg-pink-200/50' : 'bg-pink-300',
                        indicator: isStart ? '●' : isEnd ? '○' : '·',
                        title: `${personName} - ${format(day, 'MMM d')}`,
                        description: isStart ? 'Period start' : isEnd ? 'Period end' : 'Period day',
                        initial: initial
                      };
                    } else {
                      // Multiple cycles - show colored initials
                      const coloredInitials = dayCycles.map((cycle, index) => {
                        const initial = getPersonInitial(cycle.connectionId);
                        const isPredicted = (cycle as any).isPrediction;
                        const colorClass = isPredicted ? 'bg-pink-200/50' : personColors[index % personColors.length].accent;
                        
                        return {
                          initial,
                          color: colorClass,
                          person: getPersonName(cycle.connectionId)
                        };
                      });
                      
                      return {
                        color: 'bg-gradient-to-r from-pink-300 to-purple-300',
                        indicator: '●',
                        title: `Multiple cycles - ${format(day, 'MMM d')}`,
                        description: `${dayCycles.length} people`,
                        isMultiple: true,
                        coloredInitials
                      };
                    }
                  })();

                  return (
                    <div
                      key={dayIdx}
                      className={`relative aspect-square border border-neutral-200 dark:border-neutral-700 rounded cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${!isCurrentMonth ? 'opacity-50' : ''}`}
                      onClick={() => handleDayClick(day)}
                      title={dayInfo.title}
                    >
                      <div className={`absolute inset-0 rounded ${dayInfo.color}`} />
                      <div className="relative p-1 h-full flex flex-col">
                        <span className="text-xs font-medium">
                          {day.getDate()}
                        </span>
                        
                        {/* Show single person initial or multiple colored initials */}
                        {dayInfo.isMultiple && dayInfo.coloredInitials ? (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="flex -space-x-1">
                              {dayInfo.coloredInitials.slice(0, 3).map((item, idx) => (
                                <Avatar key={idx} className="w-4 h-4 border border-white">
                                  <AvatarImage src="" />
                                  <AvatarFallback className={`text-xs ${item.color} text-white`}>
                                    {item.initial}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {dayInfo.coloredInitials.length > 3 && (
                                <div className="w-4 h-4 rounded-full bg-neutral-400 border border-white flex items-center justify-center">
                                  <span className="text-xs text-white">+</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : dayInfo.initial ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {dayInfo.initial}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {/* Current Cycles */}
            {filteredCycles.filter(cycle => !cycle.endDate).map(cycle => {
              const daysInCycle = differenceInDays(new Date(), new Date(cycle.startDate)) + 1;
              const personName = getPersonName(cycle.connectionId);
              const avgCycleLength = getAverageCycleLength() || 28;
              const expectedEndDate = addDays(new Date(cycle.startDate), avgCycleLength - 1);
              
              return (
                <Card key={cycle.id} className="border-l-4 border-l-pink-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={trackablePersons.find(p => p.id === cycle.connectionId)?.profileImage || ''} />
                            <AvatarFallback className="text-xs">
                              {getPersonInitial(cycle.connectionId)}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-medium text-sm">{personName} - Current Cycle</h3>
                        </div>
                        
                        <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                          <p>Started: {format(new Date(cycle.startDate), 'PPP')}</p>
                          <p>Day {daysInCycle} of cycle</p>
                          <p>Expected end: {format(expectedEndDate, 'PPP')}</p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cycle)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Past Cycles */}
            {getPastCycles().map(cycle => {
              const cycleLength = getCycleLength(cycle);
              const personName = getPersonName(cycle.connectionId);
              
              return (
                <Card key={cycle.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={trackablePersons.find(p => p.id === cycle.connectionId)?.profileImage || ''} />
                            <AvatarFallback className="text-xs">
                              {getPersonInitial(cycle.connectionId)}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-medium text-sm">{personName}</h3>
                        </div>
                        
                        <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                          <p>{format(new Date(cycle.startDate), 'PPP')} - {cycle.endDate ? format(new Date(cycle.endDate), 'PPP') : 'Ongoing'}</p>
                          {cycleLength && <p>{cycleLength} days</p>}
                          {cycle.mood && <p>Mood: {cycle.mood}</p>}
                          {cycle.flowIntensity && <p>Flow: {cycle.flowIntensity}</p>}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cycle)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredCycles.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-neutral-500 mb-4">No cycles tracked yet</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    Add First Cycle
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Cycle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCycle ? 'Edit Cycle' : 'Add New Cycle'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="connection">Person</Label>
              <Select
                value={formData.connectionId?.toString() || ''}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  connectionId: value ? parseInt(value) : null 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {trackablePersons.map(person => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                ref={startDateRef}
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
              <Label htmlFor="flowIntensity">Flow Intensity</Label>
              <Select
                value={formData.flowIntensity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, flowIntensity: value }))}
              >
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
              <Select
                value={formData.mood}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map(mood => (
                    <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Symptoms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {symptomsList.map(symptom => (
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
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingCycle ? 'Update' : 'Add'} Cycle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Connection modal removed for simplicity */}
    </div>
  );
}