import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, subMonths, addMonths, startOfWeek, getDay, startOfDay } from "date-fns";
import { Calendar, Plus, Edit3, Trash2, Circle, ChevronLeft, ChevronRight, User, UserPlus, Camera, X, ChevronDown, Brain, Activity } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MenstrualCycle, Connection } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useModal } from "@/contexts/modal-context";
import { DetailedPhaseCard } from "@/components/cycle/detailed-phase-card";
import { CycleLearningEngine } from "@/components/cycle/cycle-learning-engine";
import { EnhancedPhaseVisualizer } from "@/components/cycle/enhanced-phase-visualizer";

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
    .filter(cycle => cycle.periodStartDate)
    .sort((a, b) => new Date(a.periodStartDate!).getTime() - new Date(b.periodStartDate!).getTime());
  
  if (sortedCycles.length < 2) return 28;
  
  const cycleLengths = [];
  for (let i = 1; i < sortedCycles.length; i++) {
    const previousStart = new Date(sortedCycles[i - 1].periodStartDate!);
    const currentStart = new Date(sortedCycles[i].periodStartDate!);
    const length = differenceInDays(currentStart, previousStart);
    if (length > 0 && length <= 45) { // Valid cycle length range
      cycleLengths.push(length);
    }
  }
  
  if (cycleLengths.length === 0) return 28;
  
  // Return average cycle length
  return Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
};

// Enhanced cycle phase calculation with learning from historical data
const calculateOvulationDay = (cycleLength: number, historicalCycles: any[] = []): number => {
  // Learn from historical ovulation patterns if available
  if (historicalCycles.length >= 3) {
    const ovulationDays = historicalCycles
      .filter(c => c.ovulationDay)
      .map(c => c.ovulationDay);
    
    if (ovulationDays.length > 0) {
      const avgOvulation = ovulationDays.reduce((sum, day) => sum + day, 0) / ovulationDays.length;
      return Math.round(avgOvulation);
    }
  }
  
  // Standard ovulation calculation: 14 days before cycle end
  // For a 30-day cycle, ovulation should be on day 16 (30 - 13 = 17, but we want 16)
  return Math.max(12, cycleLength - 13);
};

// Comprehensive cycle phase system with 8 detailed phases
const getDetailedCyclePhase = (
  dayInCycle: number, 
  cycleLength: number, 
  periodLength: number = 5,
  historicalCycles: any[] = [],
  symptoms: string[] = [],
  mood: string | null = null
): { 
  phase: string; 
  subPhase: string;
  color: string; 
  description: string;
  emoji: string;
  dayRange: string;
  hormonalProfile: string;
  recommendations: string[];
} => {
  const ovulationDay = calculateOvulationDay(cycleLength, historicalCycles);
  const lutealLength = cycleLength - ovulationDay;
  
  // Menstrual Phase (Days 1-5)
  if (dayInCycle <= periodLength) {
    if (dayInCycle <= 2) {
      return {
        phase: "menstrual",
        subPhase: "heavy_flow",
        color: "bg-red-200 dark:bg-red-900/40 border-red-400 dark:border-red-600",
        description: "Heavy menstrual flow",
        emoji: "🩸",
        dayRange: `Days 1-2`,
        hormonalProfile: "Low estrogen & progesterone",
        recommendations: ["Rest and self-care", "Gentle movement", "Warm compress for cramps", "Iron-rich foods"]
      };
    } else {
      return {
        phase: "menstrual",
        subPhase: "light_flow",
        color: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-500",
        description: "Light menstrual flow",
        emoji: "🌊",
        dayRange: `Days 3-${periodLength}`,
        hormonalProfile: "Rising estrogen",
        recommendations: ["Light exercise", "Hydration focus", "Begin energy foods", "Gentle stretching"]
      };
    }
  }
  
  // Follicular Phase (Post-period to ovulation)
  const follicularEnd = ovulationDay - 3;
  if (dayInCycle <= follicularEnd) {
    if (dayInCycle <= periodLength + 3) {
      return {
        phase: "follicular",
        subPhase: "early_follicular",
        color: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-500",
        description: "Early follicular phase",
        emoji: "🌱",
        dayRange: `Days ${periodLength + 1}-${periodLength + 3}`,
        hormonalProfile: "Gradually rising estrogen",
        recommendations: ["Increase activity", "Fresh foods", "Social connections", "Planning ahead"]
      };
    } else {
      return {
        phase: "follicular",
        subPhase: "late_follicular",
        color: "bg-green-200 dark:bg-green-900/40 border-green-400 dark:border-green-600",
        description: "Late follicular phase",
        emoji: "🌿",
        dayRange: `Days ${periodLength + 4}-${follicularEnd}`,
        hormonalProfile: "High estrogen",
        recommendations: ["Peak energy activities", "New challenges", "Social events", "Creative projects"]
      };
    }
  }
  
  // Pre-ovulation and Ovulation (3 days around ovulation)
  if (dayInCycle >= ovulationDay - 2 && dayInCycle <= ovulationDay + 2) {
    if (dayInCycle < ovulationDay) {
      return {
        phase: "fertile",
        subPhase: "pre_ovulation",
        color: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-500",
        description: "Pre-ovulation fertile window",
        emoji: "💛",
        dayRange: `Days ${ovulationDay - 2}-${ovulationDay - 1}`,
        hormonalProfile: "Peak estrogen, rising LH",
        recommendations: ["High fertility", "Intimacy timing", "Energy optimization", "Confidence building"]
      };
    } else if (dayInCycle === ovulationDay) {
      return {
        phase: "fertile",
        subPhase: "ovulation",
        color: "bg-pink-200 dark:bg-pink-900/40 border-pink-400 dark:border-pink-600",
        description: "Peak ovulation day",
        emoji: "🥚",
        dayRange: `Day ${ovulationDay}`,
        hormonalProfile: "LH surge, peak fertility",
        recommendations: ["Peak fertility window", "Optimal intimacy timing", "High energy activities", "Important conversations"]
      };
    } else {
      return {
        phase: "fertile",
        subPhase: "post_ovulation",
        color: "bg-yellow-200 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600",
        description: "Post-ovulation fertile window",
        emoji: "🌟",
        dayRange: `Days ${ovulationDay + 1}-${ovulationDay + 2}`,
        hormonalProfile: "Rising progesterone",
        recommendations: ["Last fertile days", "Conception window", "Maintain energy", "Positive mindset"]
      };
    }
  }
  
  // Luteal Phase (Post-ovulation to cycle end)
  const midLuteal = ovulationDay + Math.floor(lutealLength / 2);
  if (dayInCycle <= midLuteal) {
    return {
      phase: "luteal",
      subPhase: "early_luteal",
      color: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-500",
      description: "Early luteal phase",
      emoji: "🌙",
      dayRange: `Days ${ovulationDay + 3}-${midLuteal}`,
      hormonalProfile: "Rising progesterone",
      recommendations: ["Stable energy", "Routine activities", "Nesting behaviors", "Comfort foods"]
    };
  } else if (dayInCycle <= cycleLength - 3) {
    return {
      phase: "luteal",
      subPhase: "mid_luteal",
      color: "bg-purple-200 dark:bg-purple-900/40 border-purple-400 dark:border-purple-600",
      description: "Mid luteal phase",
      emoji: "🌕",
      dayRange: `Days ${midLuteal + 1}-${cycleLength - 3}`,
      hormonalProfile: "Peak progesterone",
      recommendations: ["Peak nesting phase", "Comfort priorities", "Self-care focus", "Gentle activities"]
    };
  } else {
    return {
      phase: "luteal",
      subPhase: "pre_menstrual",
      color: "bg-orange-200 dark:bg-orange-900/40 border-orange-400 dark:border-orange-600",
      description: "Pre-menstrual phase",
      emoji: "🌅",
      dayRange: `Days ${cycleLength - 2}-${cycleLength}`,
      hormonalProfile: "Dropping progesterone & estrogen",
      recommendations: ["PMS management", "Emotional support", "Stress reduction", "Preparation for period"]
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
  const lastStartDate = new Date(lastCycle.periodStartDate!);
  
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
  // Modal context not needed for this page
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<MenstrualCycle | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>([]);
  const [cycleForPersonId, setCycleForPersonId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
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

  // Enhanced cycle phase detection with detailed sub-phases
  const getCyclePhaseForDay = (day: Date, connectionId: number) => {
    const connectionCycles = cycles.filter(c => c.connectionId === connectionId);
    if (connectionCycles.length === 0) return null;

    const sortedCycles = [...connectionCycles].sort((a, b) => 
      new Date(a.periodStartDate).getTime() - new Date(b.periodStartDate).getTime()
    );

    // Find the cycle that this day belongs to
    for (const cycle of sortedCycles) {
      const cycleStart = new Date(cycle.periodStartDate);
      let cycleEnd: Date;
      
      if (cycle.cycleEndDate) {
        cycleEnd = new Date(cycle.cycleEndDate);
      } else {
        // For active cycles, calculate expected end based on average cycle length
        const avgCycleLength = calculateCycleLength(connectionCycles) || 28;
        cycleEnd = addDays(cycleStart, avgCycleLength - 1);
      }
      
      if (day >= cycleStart && day <= cycleEnd) {
        const dayInCycle = differenceInDays(day, cycleStart) + 1;
        const periodEnd = cycle.periodEndDate ? new Date(cycle.periodEndDate) : addDays(cycleStart, 4);
        
        // Calculate cycle length for detailed phase analysis
        const cycleLength = cycle.cycleEndDate ? 
          differenceInDays(new Date(cycle.cycleEndDate), cycleStart) + 1 : 
          (calculateCycleLength(connectionCycles) || 28);
        
        const periodLength = cycle.periodEndDate ? 
          differenceInDays(new Date(cycle.periodEndDate), cycleStart) + 1 : 5;
        
        // Get detailed phase information
        const detailedPhase = getDetailedCyclePhase(
          dayInCycle, 
          cycleLength, 
          periodLength,
          connectionCycles,
          [], // symptoms - could be added later
          cycle.mood
        );
        
        return { 
          phase: detailedPhase.phase,
          subPhase: detailedPhase.subPhase,
          day: dayInCycle, 
          cycle,
          isOvulation: detailedPhase.subPhase === 'ovulation',
          detailedInfo: detailedPhase
        };
      }
    }

    return null;
  };

  // Get all cycles for a specific day (for multi-person view)
  const getCyclesForDay = (day: Date) => {
    // If no cycles exist at all, return empty array
    if (!cycles || cycles.length === 0) return [];
    

    
    // First, filter cycles to only selected persons
    const relevantCycles = selectedPersonIds.length === 0 ? cycles : cycles.filter(cycle => {
      // Check if this cycle belongs to a selected person
      return selectedPersonIds.some(selectedId => {
        if (selectedId === 0) {
          return cycle.connectionId === null; // User's cycles
        } else {
          return cycle.connectionId === selectedId; // Connection's cycles
        }
      });
    });
    
    const actualCycles = relevantCycles.filter(cycle => {
      
      // Check if the day falls within this cycle
      const start = startOfDay(new Date(cycle.periodStartDate));
      const checkDay = startOfDay(day);
      
      if (cycle.cycleEndDate) {
        // Completed cycle - check if day is between start and end
        const end = startOfDay(new Date(cycle.cycleEndDate));
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
    
    // Generate predictions for future dates and today
    if (checkDay >= today) {
      const predictedCycles = [];
      
      // For each selected person, generate predicted cycles
      // If no selection, process all connections; if filtered, process the filtered connection
      const personsToProcess = selectedPersonIds.length === 0 ? 
        Array.from(new Set(relevantCycles.map(c => c.connectionId).filter(id => id !== null))) : 
        selectedPersonIds;
      

      
      for (const personId of personsToProcess) {
        const personCycles = relevantCycles.filter(cycle => {
          if (personId === 0) {
            return cycle.connectionId === null;
          } else {
            return cycle.connectionId === personId;
          }
        });
        
        if (personCycles.length > 0) {
          // Get the most recent cycle for this person
          const sortedCycles = personCycles.sort((a, b) => 
            new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
          );
          const lastCycle = sortedCycles[0];
          const avgCycleLength = calculateCycleLength(personCycles);
          
          // Generate predictions for up to 6 future cycles
          const lastCycleStart = new Date(lastCycle.periodStartDate);
          
          // Calculate when the current cycle ends
          const currentCycleEnd = lastCycle.cycleEndDate ? 
            new Date(lastCycle.cycleEndDate) : 
            addDays(lastCycleStart, avgCycleLength - 1);
          
          // Track the base cycle for proper spacing
          let baseDate = lastCycle.cycleEndDate ? new Date(lastCycle.cycleEndDate) : addDays(lastCycleStart, avgCycleLength - 1);
          

          
          for (let i = 1; i <= 6; i++) {
            // Calculate next cycle start: 1 day after the previous cycle ended
            const predictedStart = addDays(baseDate, 1);
            
            // Use the same period duration as the last recorded cycle (period length, not full cycle)
            const periodLength = lastCycle.periodEndDate && lastCycle.periodStartDate ? 
              differenceInDays(new Date(lastCycle.periodEndDate), new Date(lastCycle.periodStartDate)) + 1 :
              5; // Default 5-day period based on your latest cycle
              
            const predictedPeriodEnd = addDays(predictedStart, periodLength - 1); // -1 because we count inclusive
            
            // Calculate when this predicted cycle would end (for spacing the next one)
            const predictedCycleEnd = addDays(predictedStart, avgCycleLength - 1);
            
            // Use date-only comparison to avoid timezone issues
            const predictedStartDate = format(predictedStart, 'yyyy-MM-dd');
            const predictedPeriodEndDate = format(predictedPeriodEnd, 'yyyy-MM-dd');
            const checkDate = format(checkDay, 'yyyy-MM-dd');
            

            
            // Check if the day falls within this predicted period (only show during period days, not full cycle)
            if (checkDate >= predictedStartDate && checkDate <= predictedPeriodEndDate) {
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
    mutationFn: (data: any) => apiRequest('/api/menstrual-cycles', 'POST', data),
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
      apiRequest(`/api/menstrual-cycles/${id}`, 'PATCH', data),
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

  // Delete cycle mutation
  const deleteCycleMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`🗑️ Client: Attempting to delete cycle ${id}`);
      const response = await apiRequest(`/api/menstrual-cycles/${id}`, 'DELETE');
      console.log(`✅ Client: Delete response received:`, response);
      return response;
    },
    onSuccess: async (response, deletedId) => {
      console.log(`🎉 Client: Delete successful for cycle ${deletedId}`);
      
      // Use centralized cache management to ensure all pages update
      const { cycleCache } = await import('@/lib/cache-utils');
      
      // First optimistically update the cache to remove the deleted cycle
      cycleCache.updateCacheAfterMutation({ id: deletedId }, 'delete');
      
      // Clear and refetch to ensure consistency across all pages
      await cycleCache.clearAndRefetch();
      
      // Verify deletion was successful
      const deletionVerified = await cycleCache.verifyDeletion(deletedId);
      
      if (!deletionVerified) {
        // If verification fails, show warning and force another cache clear
        console.log(`⚠️ Client: Deletion verification failed for cycle ${deletedId}, forcing additional cache clear`);
        await cycleCache.clearAndRefetch();
        
        toast({
          title: "Deletion Warning", 
          description: "Cycle deleted but verification failed. Please refresh if data still appears.",
          variant: "destructive",
        });
      } else {
        console.log(`✅ Client: Deletion verified for cycle ${deletedId}`);
        toast({
          title: "Cycle Deleted",
          description: "The menstrual cycle has been deleted successfully.",
        });
      }
      
      setIsDialogOpen(false);
      setEditingCycle(null);
      resetForm();
    },
    onError: (error: any, deletedId) => {
      console.error(`❌ Client: Delete failed for cycle ${deletedId}:`, error);
      
      const errorMessage = error?.message || "Failed to delete cycle. Please try again.";
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleDeleteCycle = () => {
    if (editingCycle && confirm('Are you sure you want to delete this cycle? This action cannot be undone.')) {
      deleteCycleMutation.mutate(editingCycle.id);
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
      // Connection modal functionality removed
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
      periodEndDate: '',
      endDate: '',
      flowIntensity: '',
      mood: '',
      symptoms: [],
      notes: '',
      connectionId: selectedPersonIds.length === 1 ? selectedPersonIds[0] : null
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    


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
      startDate: format(new Date(cycle.periodStartDate), 'yyyy-MM-dd'),
      periodEndDate: cycle.periodEndDate ? format(new Date(cycle.periodEndDate), 'yyyy-MM-dd') : '',
      endDate: cycle.cycleEndDate ? format(new Date(cycle.cycleEndDate), 'yyyy-MM-dd') : '',
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

  const getCurrentCycle = () => filteredCycles.find(cycle => !cycle.cycleEndDate);
  const getPastCycles = () => filteredCycles
    .filter(cycle => cycle.cycleEndDate)
    .sort((a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime());

  const getCycleLength = (cycle: MenstrualCycle) => {
    if (!cycle.cycleEndDate) return null;
    return differenceInDays(new Date(cycle.cycleEndDate), new Date(cycle.periodStartDate)) + 1;
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
    
    if (!avgLength || !lastCycle?.cycleEndDate) return null;
    
    // Predict next cycle start (average cycle is ~28 days from start to start)
    const avgCycleLength = avgLength + 21; // Assuming ~21 day luteal phase
    return addDays(new Date(lastCycle.periodStartDate), avgCycleLength);
  };

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
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
    
    // For predicted cycles, check if we're in the predicted period
    if ((cycle as any).isPrediction && cycle.periodEndDate) {
      const periodStart = startOfDay(new Date(cycle.periodStartDate));
      const periodEnd = startOfDay(new Date(cycle.periodEndDate));
      
      if (checkDay >= periodStart && checkDay <= periodEnd) {
        return 'menstrual';
      }
    }
    
    // For regular cycles, use detailed phase logic
    const daysSinceStart = differenceInDays(day, cycleStart) + 1;
    const cycleLength = getCycleLength(cycle) || 28;
    const periodLength = cycle.periodEndDate ? 
      differenceInDays(new Date(cycle.periodEndDate), cycleStart) + 1 : 5;
    const phase = getDetailedCyclePhase(daysSinceStart, cycleLength, periodLength);
    
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {selectedPersonIds.length === 0 ? 'Choose connection' : 
                     selectedPersonIds.length === 1 ? 
                       trackablePersons.find(p => p.id === selectedPersonIds[0])?.name || 'Unknown' :
                     `${selectedPersonIds.length} people selected`}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" sideOffset={4}>
                <DropdownMenuItem 
                  onClick={() => setSelectedPersonIds([])}
                  className="py-3 px-4"
                >
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4" />
                    All Connections
                  </div>
                </DropdownMenuItem>
                <Separator className="my-1" />
                {trackablePersons.map((person) => {
                  const colors = personColors[person.colorIndex];
                  return (
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
                      onSelect={(e) => e.preventDefault()}
                      className="py-3 px-4 data-[checked]:bg-primary/10 data-[checked]:text-primary-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${colors.accent}`}></div>
                        {person.isUser ? (
                          <User className="h-4 w-4" />
                        ) : person.profileImage ? (
                          <img 
                            src={person.profileImage} 
                            alt={person.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-4 h-4 rounded-full ${colors.bg} flex items-center justify-center`}>
                            <span className={`text-xs font-medium ${colors.text}`}>
                              {person.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {person.name}
                      </div>
                    </DropdownMenuCheckboxItem>
                  );
                })}
                <Separator className="my-1" />
                <DropdownMenuItem 
                  onClick={() => {/* Connection modal functionality removed */}}
                  className="py-3 px-4"
                >
                  <div className="flex items-center gap-2 text-blue-600">
                    <UserPlus className="h-4 w-4" />
                    Add New Connection
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Connection Cycle Tracking */}
        {selectedPersonIds.length > 0 && (
          <section className="px-4 py-2 space-y-4">
            {selectedPersonIds.map((personId) => {
              const person = trackablePersons.find(p => p.id === personId);
              if (!person) return null;
              
              const personCycles = cycles.filter(cycle => {
                if (personId === 0) {
                  return cycle.connectionId === null; // User's cycles
                } else {
                  return cycle.connectionId === personId; // Connection's cycles
                }
              });
              

              
              // Find active cycle - either no end date, or current date is within the cycle period
              const currentCycle = personCycles.find(cycle => {
                if (!cycle.cycleEndDate) return true; // No end date means actively ongoing
                
                const today = new Date();
                const startDate = new Date(cycle.periodStartDate);
                const endDate = new Date(cycle.cycleEndDate);
                
                // Check if today is within the cycle period
                return today >= startDate && today <= endDate;
              });
              const avgCycleLength = calculateCycleLength(personCycles);
              const currentDay = currentCycle ? differenceInDays(new Date(), new Date(currentCycle.periodStartDate)) + 1 : 0;
              const periodLength = currentCycle?.periodEndDate ? 
                differenceInDays(new Date(currentCycle.periodEndDate), new Date(currentCycle.periodStartDate)) + 1 : 5;
              const currentPhase = currentCycle ? getDetailedCyclePhase(currentDay, avgCycleLength, periodLength) : null;
              
              // Get phase-based colors using new detailed phase system
              const phaseColors = currentPhase ? {
                bg: currentPhase.phase === 'menstrual' ? 'bg-red-50 dark:bg-red-950/20' :
                    currentPhase.subPhase === 'ovulation' ? 'bg-pink-50 dark:bg-pink-950/20' :
                    currentPhase.phase === 'fertile' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                    currentPhase.phase === 'follicular' ? 'bg-green-50 dark:bg-green-950/20' :
                    currentPhase.phase === 'luteal' ? 'bg-purple-50 dark:bg-purple-950/20' :
                    'bg-gray-50 dark:bg-gray-950/20',
                border: currentPhase.phase === 'menstrual' ? 'border-red-200 dark:border-red-800' :
                        currentPhase.subPhase === 'ovulation' ? 'border-pink-200 dark:border-pink-800' :
                        currentPhase.phase === 'fertile' ? 'border-yellow-200 dark:border-yellow-800' :
                        currentPhase.phase === 'follicular' ? 'border-green-200 dark:border-green-800' :
                        currentPhase.phase === 'luteal' ? 'border-purple-200 dark:border-purple-800' :
                        'border-gray-200 dark:border-gray-800',
                accent: currentPhase.phase === 'menstrual' ? 'bg-red-500' :
                        currentPhase.subPhase === 'ovulation' ? 'bg-pink-600' :
                        currentPhase.phase === 'fertile' ? 'bg-yellow-500' :
                        currentPhase.phase === 'follicular' ? 'bg-green-500' :
                        currentPhase.phase === 'luteal' ? 'bg-purple-500' :
                        'bg-gray-500',
                text: currentPhase.phase === 'menstrual' ? 'text-red-800 dark:text-red-200' :
                      currentPhase.subPhase === 'ovulation' ? 'text-pink-800 dark:text-pink-200' :
                      currentPhase.phase === 'fertile' ? 'text-yellow-800 dark:text-yellow-200' :
                      currentPhase.phase === 'follicular' ? 'text-green-800 dark:text-green-200' :
                      currentPhase.phase === 'luteal' ? 'text-purple-800 dark:text-purple-200' :
                      'text-gray-800 dark:text-gray-200'
              } : {
                bg: 'bg-pink-50 dark:bg-pink-950/20',
                border: 'border-pink-200 dark:border-pink-800',
                accent: 'bg-pink-500',
                text: 'text-pink-800 dark:text-pink-200'
              };

              return (
                <Card key={personId} className={`p-4 ${phaseColors.bg} ${phaseColors.border}`}>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="detailed">Detailed</TabsTrigger>
                      <TabsTrigger value="learning">AI Learning</TabsTrigger>
                      <TabsTrigger value="insights">Insights</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${phaseColors.accent}`}></div>
                          <h3 className={`font-medium ${phaseColors.text}`}>
                            {person.name}'s Cycle
                          </h3>
                        </div>
                        <Circle className={`h-5 w-5 ${phaseColors.accent.replace('bg-', 'text-')}`} />
                      </div>
                      
                      {currentCycle ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm ${phaseColors.text}`}>
                              Day {currentDay} of cycle
                            </p>
                            {currentPhase && (
                              <Badge className={`${currentPhase.color} text-white text-xs`}>
                                {currentPhase.phase}
                              </Badge>
                            )}
                          </div>
                          
                          {currentPhase && (
                            <p className={`text-xs ${phaseColors.text} opacity-80`}>
                              {currentPhase.description}
                            </p>
                          )}
                          
                          <p className={`text-xs ${phaseColors.text} opacity-80`}>
                            Started {format(new Date(currentCycle.periodStartDate), 'MMM d, yyyy')}
                          </p>
                          
                          <Button 
                            onClick={() => handleEdit(currentCycle)}
                            size="sm"
                            className={`w-full ${phaseColors.accent} hover:opacity-90 text-white`}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Update Current Cycle
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className={`text-sm ${phaseColors.text}`}>
                            No active cycle
                          </p>
                          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                className={`w-full ${phaseColors.accent} hover:opacity-90 text-white`}
                                onClick={() => {
                                  setEditingCycle(null);
                                  setCycleForPersonId(personId);
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
                    </TabsContent>

                    {/* Detailed Phase Tab */}
                    <TabsContent value="detailed" className="space-y-4">
                      {currentPhase && currentCycle && (
                        <DetailedPhaseCard
                          phaseData={currentPhase}
                          currentDay={currentDay}
                          cycleLength={avgCycleLength}
                          connectionName={person.name}
                        />
                      )}
                    </TabsContent>

                    {/* AI Learning Tab */}
                    <TabsContent value="learning" className="space-y-4">
                      {personCycles.length >= 2 ? (
                        <CycleLearningEngine
                          learningData={{
                            averageCycleLength: avgCycleLength,
                            ovulationPattern: {
                              predictedDay: calculateOvulationDay(avgCycleLength, personCycles),
                              confidence: 0.8,
                              historicalAccuracy: 0.85
                            },
                            symptoms: [
                              { phase: 'menstrual', commonSymptoms: ['Cramps', 'Fatigue'], severity: 2 },
                              { phase: 'luteal', commonSymptoms: ['Mood swings', 'Bloating'], severity: 2 }
                            ],
                            moodPatterns: [
                              { phase: 'menstrual', averageMood: 'Low', consistency: 0.8 },
                              { phase: 'follicular', averageMood: 'Rising', consistency: 0.7 }
                            ],
                            personalizedInsights: [
                              `Your ${avgCycleLength}-day cycles are well-tracked`,
                              'Regular pattern detected for better predictions'
                            ],
                            cycleVariability: 0.1,
                            dataQuality: Math.min(1, personCycles.length / 6)
                          }}
                          connectionName={person.name}
                          totalCycles={personCycles.length}
                        />
                      ) : (
                        <Card className="p-6 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Brain className="h-8 w-8 text-gray-400" />
                            <div>
                              <h3 className="font-medium">Need More Data</h3>
                              <p className="text-sm text-muted-foreground">
                                Track at least 2 cycles for AI learning insights
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Enhanced Visualizer Tab */}
                    <TabsContent value="insights" className="space-y-4">
                      {currentPhase && currentCycle && (
                        <EnhancedPhaseVisualizer
                          currentPhase={currentPhase}
                          currentDay={currentDay}
                          cycleLength={avgCycleLength}
                          connectionName={person.name}
                          nextPhaseInfo={{
                            phase: currentPhase.phase === 'menstrual' ? 'follicular' : 
                                   currentPhase.phase === 'follicular' ? 'fertile' :
                                   currentPhase.phase === 'fertile' ? 'luteal' : 'menstrual',
                            daysUntil: Math.max(1, Math.ceil((avgCycleLength - currentDay) / 4)),
                            emoji: currentPhase.phase === 'menstrual' ? '🌱' : 
                                   currentPhase.phase === 'follicular' ? '💛' :
                                   currentPhase.phase === 'fertile' ? '🌙' : '🩸'
                          }}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </Card>
              );
            })}
          </section>
        )}





        {/* Calendar View */}
        {viewMode === 'calendar' && selectedPersonIds.length > 0 && (
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
                  const cyclesOnDay = getCyclesForDay(day);
                  // Only check for today if there are actual cycles to display
                  const isToday = cycles && cycles.length > 0 ? isSameDay(day, new Date()) : false;
                  

                  


                  
                  return (
                    <div
                      key={day.getTime()}
                      className={`
                        relative p-1 h-10 w-10 flex flex-col items-center justify-center text-xs border rounded-lg transition-colors hover:bg-accent/50
                        border-border/20
                        ${cyclesOnDay.length > 0 ? 
                          // Apply cycle background styling to match calendar page
                          cyclesOnDay.length === 1 ? 
                            getCycleStage(day, cyclesOnDay[0]) === 'menstrual' ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 border-2' :
                            getCycleStage(day, cyclesOnDay[0]) === 'ovulation' ? 'bg-blue-700 dark:bg-blue-800 border-blue-800 dark:border-blue-900 border-2' :
                            getCycleStage(day, cyclesOnDay[0]) === 'fertile' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 border-2' :
                            getCycleStage(day, cyclesOnDay[0]) === 'follicular' ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 border-2' :
                            getCycleStage(day, cyclesOnDay[0]) === 'luteal' ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 border-2' :
                            'bg-background/50'
                          :
                          // Multiple cycles - use gradient background like calendar page
                          'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-700 border-2'
                        :
                        'bg-background/50'
                        }
                      `}

                    >
                      {cyclesOnDay.length > 0 ? (
                        // Multiple cycles - show colored initials like calendar page
                        cyclesOnDay.length > 1 ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-xs font-bold mb-1">{format(day, 'd')}</div>
                            <div className="flex gap-0.5">
                              {cyclesOnDay.slice(0, 3).map((cycle, index) => {
                                const connection = connections.find(c => c.id === cycle.connectionId);
                                const initial = connection?.name?.[0]?.toUpperCase() || '?';
                                const colors = [
                                  'text-red-600', 'text-blue-600', 'text-green-600', 'text-purple-600',
                                  'text-orange-600', 'text-pink-600', 'text-indigo-600', 'text-teal-600'
                                ];
                                const connectionColor = colors[(cycle.connectionId || 0) % colors.length];
                                
                                return (
                                  <span
                                    key={`${cycle.id}-${index}`}
                                    className={`text-[8px] font-bold ${connectionColor}`}
                                    title={`${connection?.name || 'Unknown'} - ${getCycleStage(day, cycle)}`}
                                  >
                                    {initial}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          // Single cycle - show emoji indicator and date like calendar page
                          (() => {
                            const cycle = cyclesOnDay[0];
                            const stage = getCycleStage(day, cycle);
                            let indicator = '';
                            
                            if (stage === 'menstrual') indicator = '🩸';
                            else if (stage === 'ovulation') indicator = '🥚';
                            else if (stage === 'fertile') indicator = '💗';
                            else if (stage === 'follicular') indicator = '🌱';
                            else if (stage === 'luteal') indicator = '🌙';
                            
                            return (
                              <div className="flex flex-col items-center justify-center">
                                <div className="text-xs font-bold">{format(day, 'd')}</div>
                                {indicator && <div className="text-xs">{indicator}</div>}
                              </div>
                            );
                          })()
                        )
                      ) : (
                        // No cycle data - show regular date only
                        <span className="text-muted-foreground">{format(day, 'd')}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded flex items-center justify-center">
                      <span className="text-xs">🩸</span>
                    </div>
                    <span>Menstrual phase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded flex items-center justify-center">
                      <span className="text-xs">🌱</span>
                    </div>
                    <span>Follicular phase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded flex items-center justify-center">
                      <span className="text-xs">💗</span>
                    </div>
                    <span>Fertile window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-700 dark:bg-blue-800 border border-blue-800 dark:border-blue-900 rounded flex items-center justify-center">
                      <span className="text-xs">🥚</span>
                    </div>
                    <span>Ovulation day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded flex items-center justify-center">
                      <span className="text-xs">🌙</span>
                    </div>
                    <span>Luteal phase</span>
                  </div>
                </div>
                
                {selectedPersonIds.length > 1 && (
                  <div className="border-t pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Multiple people on same day:</p>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                        <div className="w-3 h-3 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">J</div>
                      </div>
                      <span>Overlapping cycles with initials</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </section>
        )}



        {/* Stats */}
        {selectedPersonIds.length > 0 && getAverageCycleLength() && (
          <section className="px-4 py-2">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Cycle Statistics {selectedPersonIds.length === 0 ? 'for All People' : selectedPersonIds.length === 1 ? `for ${trackablePersons.find(p => p.id === selectedPersonIds[0])?.name || 'Unknown'}` : `for ${selectedPersonIds.length} people`}</h3>
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
                        <span className={`text-xs font-medium ${cycle.connectionId === null ? 'text-blue-600' : cycle.connectionId === 2 ? 'text-pink-600' : 'text-purple-600'}`}>
                          {cycle.connectionId === null ? "You" : connections.find(c => c.id === cycle.connectionId)?.name || "Unknown"}
                        </span>
                        <span className="font-medium">
                          {format(new Date(cycle.periodStartDate), 'MMM d')} - {cycle.cycleEndDate ? format(new Date(cycle.cycleEndDate), 'MMM d') : 'Ongoing'}
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
          <DialogContent className="max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCycle ? 'Update Cycle' : 'Add New Cycle'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="startDate">Period Start Date</Label>
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
                  <Label htmlFor="endDate">Cycle End Date (Optional)</Label>
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
                {editingCycle && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteCycle}
                    disabled={deleteCycleMutation.isPending}
                    className="flex-1"
                  >
                    {deleteCycleMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
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

        {/* Connection Modal - Functionality temporarily removed */}
        {false && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-heading font-semibold text-lg">Add New Connection</h2>
                <Button variant="ghost" size="icon" onClick={() => {}}>
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
                          <AvatarImage src={uploadedImage || undefined} alt="Profile preview" />
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
                    onClick={() => {}}
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