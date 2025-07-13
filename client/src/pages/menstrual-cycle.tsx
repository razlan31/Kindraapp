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
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { useAuth } from "@/contexts/auth-context";
import { useModal } from "@/contexts/modal-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { DetailedPhaseCard } from "@/components/cycle/detailed-phase-card";
import { CycleLearningEngine } from "@/components/cycle/cycle-learning-engine";
import { EnhancedPhaseVisualizer } from "@/components/cycle/enhanced-phase-visualizer";
import { getCyclePhaseForDay, getCycleDisplayInfo, calculateCycleLength, calculateOvulationDay, getDetailedCyclePhase, calculateExpectedCycleEnd } from "@/lib/cycle-utils";

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





const predictNextCycles = (lastCycle: MenstrualCycle, avgCycleLength: number, numberOfCycles: number = 3): Array<{
  startDate: Date;
  ovulationDate: Date;
  phase: string;
  isNext: boolean;
}> => {
  const predictions = [];
  
  // FIXED: Start from the cycle end date, not the start date
  let baseDate = lastCycle.cycleEndDate ? new Date(lastCycle.cycleEndDate) : new Date(lastCycle.periodStartDate!);
  
  for (let i = 1; i <= numberOfCycles; i++) {
    // FIXED: Next cycle starts 1 day after the previous cycle ends
    const nextStartDate = addDays(baseDate, 1);
    const ovulationDate = addDays(nextStartDate, calculateOvulationDay(avgCycleLength) - 1);
    
    predictions.push({
      startDate: nextStartDate,
      ovulationDate,
      phase: i === 1 ? "Next Period" : `Period in ${i} cycles`,
      isNext: i === 1
    });
    
    // Update base date for next iteration (cycle end = start + cycle length - 1)
    baseDate = addDays(nextStartDate, avgCycleLength - 1);
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
  const { user, loading, isAuthenticated } = useAuth();
  const { mainFocusConnection } = useRelationshipFocus();
  // Modal context not needed for this page
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<MenstrualCycle | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<number[]>([]);
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
    enabled: isAuthenticated && !!user,
  });

  // Fetch cycles
  const { data: cycles = [], isLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
    enabled: isAuthenticated && !!user,
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
    
    // Add self as option 0 (user themselves)
    if (user) {
      persons.push({
        id: 0,
        name: user.displayName || user.username || 'You',
        isUser: true,
        profileImage: user.profileImageUrl,
        colorIndex: 0
      });
    }
    
    // Add all connections (assuming they could have cycles)
    connections.forEach((connection, index) => {
      persons.push({
        id: connection.id,
        name: connection.name,
        isUser: false,
        profileImage: connection.profileImage,
        colorIndex: (index + 1) % personColors.length
      });
    });
    
    return persons;
  }, [connections, user]);

  // Sync Focus Context with selectedConnectionIds (copying calendar's working pattern)
  useEffect(() => {
    if (mainFocusConnection && !selectedConnectionIds.includes(mainFocusConnection.id)) {
      console.log(`🔍 FOCUS SYNC - Setting selectedConnectionIds to [${mainFocusConnection.id}]`);
      setSelectedConnectionIds([mainFocusConnection.id]);
    }
  }, [mainFocusConnection]);

  // Initialize with focus connection if available
  useEffect(() => {
    if (mainFocusConnection && selectedConnectionIds.length === 0) {
      console.log(`🔍 INITIAL SYNC - Setting selectedConnectionIds to [${mainFocusConnection.id}]`);
      setSelectedConnectionIds([mainFocusConnection.id]);
    }
  }, [mainFocusConnection, selectedConnectionIds.length]);

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
    

    
    // First, filter cycles to only selected persons
    const relevantCycles = selectedConnectionIds.length === 0 ? cycles : cycles.filter(cycle => {
      // Check if this cycle belongs to a selected person
      return selectedConnectionIds.some(selectedId => {
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

    // No more predictions - automatic cycles will be created by the server
    return actualCycles;
  };

  // Create cycle mutation
  const createCycleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/menstrual-cycles', 'POST', data);
      return response.json();
    },
    onSuccess: (newCycle) => {
      console.log("✅ Create successful:", newCycle);
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      setIsDialogOpen(false);
      setCycleForPersonId(null);
      resetForm();
      toast({
        title: "Cycle Added",
        description: "Your menstrual cycle has been recorded successfully.",
      });
    },
    onError: (error) => {
      console.error("❌ Create failed:", error);
      toast({
        title: "Error",
        description: "Failed to add cycle. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update cycle mutation
  const updateCycleMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & any) => {
      const response = await apiRequest(`/api/menstrual-cycles/${id}`, 'PATCH', data);
      return response.json();
    },
    onSuccess: async (updatedCycle) => {
      console.log("✅ Update successful, refreshing data:", updatedCycle);
      
      // CRITICAL FIX: Update the editing cycle with fresh data immediately
      setEditingCycle(updatedCycle);
      
      // Update form data with the fresh cycle information
      const formatDateSafely = (dateString: string) => {
        const isoString = dateString.includes('T') ? dateString : `${dateString}T00:00:00.000Z`;
        const datePart = isoString.split('T')[0];
        return datePart;
      };
      
      setFormData({
        startDate: formatDateSafely(updatedCycle.periodStartDate),
        periodEndDate: updatedCycle.periodEndDate ? formatDateSafely(updatedCycle.periodEndDate) : '',
        endDate: updatedCycle.cycleEndDate ? formatDateSafely(updatedCycle.cycleEndDate) : '',
        flowIntensity: updatedCycle.flowIntensity || '',
        mood: updatedCycle.mood || '',
        symptoms: Array.isArray(updatedCycle.symptoms) ? updatedCycle.symptoms : [],
        notes: updatedCycle.notes || '',
        connectionId: updatedCycle.connectionId
      });
      
      // Clear all related cache entries and force fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      await queryClient.refetchQueries({ queryKey: ['/api/menstrual-cycles'] });
      
      // Close dialog after successful update
      setIsDialogOpen(false);
      setEditingCycle(null);
      resetForm();
      
      toast({
        title: "Cycle Updated",
        description: "Your menstrual cycle has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("❌ Update failed:", error);
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
      connectionId: selectedConnectionIds.length === 1 ? selectedConnectionIds[0] : null
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
    } else if (selectedConnectionIds.length === 1) {
      // Only one person selected, use that person
      targetPersonId = selectedConnectionIds[0];
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
    console.log("🔧 Form startDate value:", formData.startDate);
    console.log("🔧 editingCycle periodStartDate:", editingCycle?.periodStartDate);

    if (editingCycle) {
      updateCycleMutation.mutate({ id: editingCycle.id, ...submitData });
    } else {
      createCycleMutation.mutate(submitData);
    }
  };

  const handleEdit = (cycle: MenstrualCycle) => {
    console.log("🔧 Opening edit form for cycle:", cycle);
    setEditingCycle(cycle);
    
    // Get the most recent data from cache
    const latestCycles = queryClient.getQueryData(['/api/menstrual-cycles']) as MenstrualCycle[];
    const latestCycle = latestCycles?.find(c => c.id === cycle.id) || cycle;
    
    console.log("🔧 Using cycle data for form:", latestCycle);
    console.log("🔧 Raw periodStartDate:", latestCycle.periodStartDate);
    console.log("🔧 Cycle ID being edited:", latestCycle.id);
    
    // FIX: Extract date parts directly to avoid timezone issues
    const formatDateSafely = (dateValue: any): string => {
      if (!dateValue) return '';
      let isoString = '';
      if (typeof dateValue === 'string') {
        isoString = dateValue;
      } else if (dateValue instanceof Date) {
        isoString = dateValue.toISOString();
      } else {
        return '';
      }
      const datePart = isoString.split('T')[0]; // Get just the YYYY-MM-DD part
      return datePart;
    };
    
    setFormData({
      startDate: formatDateSafely(latestCycle.periodStartDate),
      periodEndDate: formatDateSafely(latestCycle.periodEndDate),
      endDate: formatDateSafely(latestCycle.cycleEndDate),
      flowIntensity: latestCycle.flowIntensity || '',
      mood: latestCycle.mood || '',
      symptoms: Array.isArray(latestCycle.symptoms) ? latestCycle.symptoms : [],
      notes: latestCycle.notes || '',
      connectionId: latestCycle.connectionId || null
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
    if (selectedConnectionIds.length === 0) return cycles;
    return cycles.filter(cycle => {
      return selectedConnectionIds.some(selectedId => {
        if (selectedId === 0) {
          // User's cycles (connectionId is null)
          return cycle.connectionId === null;
        } else {
          // Connection's cycles
          return cycle.connectionId === selectedId;
        }
      });
    });
  }, [cycles, selectedConnectionIds]);

  const getCurrentCycle = () => filteredCycles.find(cycle => !cycle.cycleEndDate);
  const getPastCycles = () => {
    const today = new Date();
    return filteredCycles
      .filter(cycle => {
        // Only include cycles that have ended AND the end date is in the past
        if (!cycle.cycleEndDate) return false;
        const cycleEndDate = new Date(cycle.cycleEndDate);
        return cycleEndDate < today;
      })
      .sort((a, b) => new Date(b.periodStartDate).getTime());
  };

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
    const lastCycle = getPastCycles()[0];
    
    if (!lastCycle?.cycleEndDate) return null;
    
    // FIXED: Next cycle starts 1 day after the last cycle ends
    return addDays(new Date(lastCycle.cycleEndDate), 1);
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
    
    // CRITICAL FIX: Check subPhase for ovulation detection
    if (phase.subPhase === 'ovulation') {
      return 'ovulation';
    }
    
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
        <UpgradeBanner 
          message="Free Plan: Only 1 connection unlocked"
          description="You can only create cycles for connection 'ghjghjhgjg' (ID: 30). Set a main focus connection or upgrade to Premium for unlimited access."
          variant="compact"
        />
        
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
                    {selectedConnectionIds.length === 0 ? 'Choose connection' : 
                     selectedConnectionIds.length === 1 ? 
                       trackablePersons.find(p => p.id === selectedConnectionIds[0])?.name || 'Unknown' :
                     `${selectedConnectionIds.length} people selected`}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" sideOffset={4}>
                <DropdownMenuItem 
                  onClick={() => setSelectedConnectionIds([])}
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
                      checked={selectedConnectionIds.includes(person.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedConnectionIds([...selectedConnectionIds, person.id]);
                        } else {
                          setSelectedConnectionIds(selectedConnectionIds.filter(id => id !== person.id));
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
                        {person.isUser ? `${person.name} (ME)` : person.name}
                        {mainFocusConnection?.id === person.id && !person.isUser && (
                          <span className="ml-1 text-red-500">❤️</span>
                        )}
                      </div>
                    </DropdownMenuCheckboxItem>
                  );
                })}
                <Separator className="my-1" />
                <DropdownMenuItem 
                  onClick={() => setLocation('/connections')}
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
        {(() => {
          console.log(`🔍 CYCLE TRACKER RENDER DEBUG:`, {
            selectedConnectionIds,
            selectedConnectionIdsLength: selectedConnectionIds.length,
            includes30: selectedConnectionIds.includes(30),
            trackablePersons: trackablePersons.map(p => ({ id: p.id, name: p.name }))
          });
          return null;
        })()}
        {selectedConnectionIds.length > 0 && (
          <section className="px-4 py-2 space-y-4">
            {selectedConnectionIds.map((personId) => {
              const person = trackablePersons.find(p => p.id === personId);
              if (!person) return null;
              
              const personCycles = cycles.filter(cycle => {
                if (personId === 0) {
                  return cycle.connectionId === null; // User's cycles
                } else {
                  return cycle.connectionId === personId; // Connection's cycles
                }
              });
              

              
              // Find active cycle - only cycles that contain today's date (not future cycles)
              const currentCycle = personCycles.find(cycle => {
                const today = new Date();
                const startDate = new Date(cycle.periodStartDate);
                
                // Filter out future cycles - cycle must have started already
                if (today < startDate) return false;
                
                if (!cycle.cycleEndDate) {
                  // No end date - only show if cycle started in the past/today and hasn't been going for more than 45 days
                  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  return daysSinceStart <= 45; // Reasonable maximum cycle length
                }
                
                const endDate = new Date(cycle.cycleEndDate);
                // Check if today is within the completed cycle period
                return today >= startDate && today <= endDate;
              });
              const avgCycleLength = calculateCycleLength(personCycles);
              // CRITICAL FIX: For cycle tracker, show upcoming period info when near end of current cycle
              let displayCycle = currentCycle;
              let currentPhaseInfo = null;
              let currentDay = 0;
              
              const today = new Date();
              
              // Use the same logic as the calendar to find the correct cycle for today
              currentPhaseInfo = getCyclePhaseForDay(today, personId, cycles);
              
              if (currentPhaseInfo && currentPhaseInfo.cycle) {
                // Use the cycle that getCyclePhaseForDay determined is correct for today
                displayCycle = currentPhaseInfo.cycle;
                currentDay = currentPhaseInfo.day;
                
                console.log(`🔍 CYCLE TRACKER - Using cycle ${displayCycle.id} for today (${format(today, 'yyyy-MM-dd')}):`, {
                  day: currentDay,
                  phase: currentPhaseInfo.detailedInfo?.phase,
                  emoji: currentPhaseInfo.detailedInfo?.emoji,
                  cycleStart: format(new Date(displayCycle.periodStartDate), 'yyyy-MM-dd'),
                  cycleEnd: displayCycle.cycleEndDate ? format(new Date(displayCycle.cycleEndDate), 'yyyy-MM-dd') : 'ongoing'
                });
              } else if (currentCycle) {
                // Fallback to the originally detected current cycle
                displayCycle = currentCycle;
                currentDay = 0;
                console.log(`🔍 CYCLE TRACKER - No phase info found, using fallback cycle ${currentCycle.id}`);
              } else {
                console.log(`🔍 CYCLE TRACKER - No cycles found for person ${personId}`);
              }
              const periodLength = displayCycle?.periodEndDate && displayCycle?.periodStartDate ? 
                differenceInDays(new Date(displayCycle.periodEndDate), new Date(displayCycle.periodStartDate)) + 1 : 5;
              
              const currentPhase = currentPhaseInfo?.detailedInfo || null;
              
              // Debug cycle tracker calculations for connection 30
              if (personId === 30) {
                console.log(`🔍 CYCLE TRACKER DEBUG - Connection 30:`, {
                  avgCycleLength,
                  currentDay,
                  periodLength,
                  ovulationDay: calculateOvulationDay(avgCycleLength, personCycles),
                  currentCycleId: displayCycle?.id,
                  currentPhase: currentPhase?.phase,
                  currentSubPhase: currentPhase?.subPhase,
                  currentEmoji: currentPhase?.emoji,
                  hasPhaseInfo: !!currentPhaseInfo,
                  hasDetailedInfo: !!currentPhaseInfo?.detailedInfo,
                  personCycles: personCycles.map(c => ({ id: c.id, start: c.periodStartDate, end: c.cycleEndDate }))
                });
              }
              
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
                            {personId === 0 ? `${person.name} (ME)` : person.name}'s Cycle
                            {mainFocusConnection?.id === personId && personId !== 0 && (
                              <span className="ml-1 text-red-500">❤️</span>
                            )}
                          </h3>
                        </div>
                        <Circle className={`h-5 w-5 ${phaseColors.accent.replace('bg-', 'text-')}`} />
                      </div>
                      
                      {currentCycle ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {/* Debug emoji rendering for connection 30 */}
                              {personId === 30 && (() => {
                                console.log(`🔍 EMOJI RENDER DEBUG:`, {
                                  hasCurrentPhaseInfo: !!currentPhaseInfo,
                                  hasDetailedInfo: !!currentPhaseInfo?.detailedInfo,
                                  emoji: currentPhaseInfo?.detailedInfo?.emoji,
                                  phase: currentPhaseInfo?.detailedInfo?.phase,
                                  shouldShowEmoji: !!(currentPhaseInfo?.detailedInfo?.emoji)
                                });
                                return null;
                              })()}
                              {currentPhaseInfo?.detailedInfo?.emoji && (
                                <span className="text-lg">{currentPhaseInfo.detailedInfo.emoji}</span>
                              )}
                              <p className={`text-sm ${phaseColors.text}`}>
                                Day {currentDay} of cycle
                              </p>
                            </div>
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
                          
                          <div className={`text-xs ${phaseColors.text} opacity-80 space-y-1`}>
                            <p>Started {format(new Date(currentCycle.periodStartDate), 'MMM d, yyyy')}</p>
                            {!currentCycle.cycleEndDate && (
                              <p>Expected end: {format(calculateExpectedCycleEnd(new Date(currentCycle.periodStartDate), personCycles), 'MMM d, yyyy')} ({avgCycleLength}-day cycle)</p>
                            )}
                          </div>
                          
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
                                   currentPhase.phase === 'follicular' ? '🌱' :
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
        {viewMode === 'calendar' && selectedConnectionIds.length > 0 && (
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
              <div className="w-full">
                {/* Header row */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="p-2 font-medium text-muted-foreground text-center text-xs">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                
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
                        relative p-1 h-14 flex flex-col items-center justify-center text-sm border rounded transition-colors hover:bg-accent/50
                        border-border/20
                        ${cyclesOnDay.length > 0 ? 
                          // Apply cycle background styling to match calendar page - enhanced visual hierarchy
                          cyclesOnDay.length === 1 ? 
                            getCycleStage(day, cyclesOnDay[0]) === 'menstrual' ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 border-2' :
                            getCycleStage(day, cyclesOnDay[0]) === 'ovulation' ? 'bg-blue-200 dark:bg-blue-800/50 border-blue-300 dark:border-blue-700 border-2 font-bold' :
                            getCycleStage(day, cyclesOnDay[0]) === 'fertile' ? 'bg-yellow-200 dark:bg-yellow-800/50 border-yellow-300 dark:border-yellow-700 border-2 font-bold' :
                            getCycleStage(day, cyclesOnDay[0]) === 'follicular' ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 border-2 opacity-50' :
                            getCycleStage(day, cyclesOnDay[0]) === 'luteal' ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 border-2 opacity-50' :
                            'bg-background/50'
                          :
                          // Multiple cycles - determine background based on prominent phases
                          (() => {
                            const hasProminentPhase = cyclesOnDay.some(cycle => {
                              const stage = getCycleStage(day, cycle);
                              return stage === 'menstrual' || stage === 'fertile' || stage === 'ovulation';
                            });
                            
                            if (hasProminentPhase) {
                              const prominentCycle = cyclesOnDay.find(cycle => {
                                const stage = getCycleStage(day, cycle);
                                return stage === 'menstrual' || stage === 'ovulation' || stage === 'fertile';
                              });
                              if (prominentCycle) {
                                const stage = getCycleStage(day, prominentCycle);
                                if (stage === 'menstrual') return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 border-2';
                                if (stage === 'ovulation') return 'bg-blue-200 dark:bg-blue-800/50 border-blue-300 dark:border-blue-700 border-2 font-bold';
                                if (stage === 'fertile') return 'bg-yellow-200 dark:bg-yellow-800/50 border-yellow-300 dark:border-yellow-700 border-2 font-bold';
                              }
                            }
                            
                            return 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-700 border-2';
                          })()
                        :
                        'bg-background/50'
                        }
                      `}

                    >
                      <div className="text-xs font-bold text-gray-600 mb-0.5">
                        {format(day, 'd')}
                      </div>
                      
                      {/* Priority display system matching calendar page exactly */}
                      <div className="flex flex-wrap gap-0.5 items-center justify-center overflow-hidden w-full">
                        {/* Priority 1: Activity emojis (moments/milestones) - not applicable to cycle tracker */}
                        
                        {/* Cycle tracker priority system: 1) Alphabet letters for multiple connections, 2) Menstrual emojis */}
                        {(() => {
                          // Debug June 1st connection selection state
                          if (format(day, 'yyyy-MM-dd') === '2025-06-01') {
                            console.log(`🔍 JUNE 1ST DEBUG - Connection Selection State:`, {
                              selectedConnectionIds,
                              mainFocusConnection: mainFocusConnection?.id,
                              availableCycles: cycles.filter(c => c.connectionId === 30).map(c => ({
                                id: c.id,
                                connectionId: c.connectionId,
                                periodStart: c.periodStartDate,
                                cycleEnd: c.cycleEndDate
                              }))
                            });
                          }
                          
                          // Get cycles for ALL selected connections (not just ones with cycles on this specific day)
                          const allSelectedCycles = cycles.filter(cycle => {
                            if (!cycle.connectionId || !selectedConnectionIds.includes(cycle.connectionId)) {
                              // Debug June 1st specifically
                              if (format(day, 'yyyy-MM-dd') === '2025-06-01' && cycle.connectionId === 30) {
                                console.log(`🔍 JUNE 1ST CONNECTION FILTER FAIL:`, {
                                  cycleConnectionId: cycle.connectionId,
                                  selectedConnectionIds,
                                  includes30: selectedConnectionIds.includes(30),
                                  filterResult: false
                                });
                              }
                              return false;
                            }
                            
                            const cycleStart = new Date(cycle.periodStartDate);
                            const cycleEnd = cycle.cycleEndDate ? new Date(cycle.cycleEndDate) : null;
                            
                            if (!cycleEnd) return false;
                            
                            // Normalize dates to midnight for accurate comparison
                            const dayNormalized = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                            const cycleStartNormalized = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), cycleStart.getDate());
                            const cycleEndNormalized = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth(), cycleEnd.getDate());
                            
                            const dateMatch = dayNormalized >= cycleStartNormalized && dayNormalized <= cycleEndNormalized;
                            
                            // Debug June 1st specifically
                            if (format(day, 'yyyy-MM-dd') === '2025-06-01' && cycle.connectionId === 30) {
                              console.log(`🔍 JUNE 1ST FIXED - Cycle ${cycle.id}:`, {
                                dateMatch,
                                dayStr: format(dayNormalized, 'yyyy-MM-dd'),
                                cycleStartStr: format(cycleStartNormalized, 'yyyy-MM-dd'),
                                cycleEndStr: format(cycleEndNormalized, 'yyyy-MM-dd'),
                                willPassFilter: dateMatch
                              });
                            }
                            
                            return dateMatch;
                          });
                          
                          // For alphabet letters, check all selected connections regardless of cycle status
                          const selectedConnections = connections.filter(c => selectedConnectionIds.includes(c.id));
                          
                          // Priority 1: Multiple connections selected - show alphabet letters for ALL selected connections
                          if (selectedConnectionIds.length > 1) {
                            return (
                              <div className="flex gap-0.5">
                                {selectedConnections.slice(0, 2).map((connection, index) => {
                                  // Always try to get phase info for the connection, regardless of whether there's a cycle on this specific day
                                  const phaseInfo = getCyclePhaseForDay(day, connection.id, cycles);
                                  
                                  // Show alphabet letter even if no cycle data, but with different styling
                                  const hasPhase = !!phaseInfo;
                                  
                                  const getPhaseColor = (phase?: string, subPhase?: string) => {
                                    if (!phase) return 'bg-gray-100 text-gray-600 border-gray-300';
                                    if (phase === 'menstrual') return 'bg-red-100 text-red-800 border-red-300';
                                    if (phase === 'fertile' && subPhase === 'ovulation') return 'bg-blue-100 text-blue-800 border-blue-300';
                                    if (phase === 'fertile') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                    if (phase === 'follicular') return 'bg-green-100 text-green-800 border-green-300';
                                    if (phase === 'luteal') return 'bg-purple-100 text-purple-800 border-purple-300';
                                    return 'bg-gray-100 text-gray-800 border-gray-300';
                                  };
                                  
                                  return (
                                    <div
                                      key={connection.id}
                                      className={`inline-flex items-center justify-center rounded-full border w-5 h-5 text-xs font-bold ${getPhaseColor(phaseInfo?.phase, phaseInfo?.subPhase)}`}
                                      title={hasPhase ? `${connection.name}: ${phaseInfo!.phase} phase` : `${connection.name}: No cycle data`}
                                    >
                                      <span className="font-bold text-xs">
                                        {connection.name[0].toUpperCase()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          
                          // Priority 2: Single connection - show accurate menstrual emoji according to legend
                          // Debug June 1st flow
                          if (format(day, 'yyyy-MM-dd') === '2025-06-01') {
                            console.log(`🔍 JUNE 1ST FLOW DEBUG:`, {
                              selectedConnectionIds,
                              selectedConnectionIdsLength: selectedConnectionIds.length,
                              allSelectedCyclesLength: allSelectedCycles.length,
                              multipleConnectionsCheck: selectedConnectionIds.length > 1,
                              willShowAlphabet: selectedConnectionIds.length > 1,
                              willShowEmoji: selectedConnectionIds.length <= 1 && allSelectedCycles.length > 0
                            });
                          }
                          
                          if (allSelectedCycles.length === 0) {
                            if (format(day, 'yyyy-MM-dd') === '2025-06-01') {
                              console.log(`🔍 JUNE 1ST EARLY EXIT: No cycles found in allSelectedCycles`);
                            }
                            return null;
                          }
                          
                          const cycle = allSelectedCycles[0];
                          const phaseInfo = cycle.connectionId ? getCyclePhaseForDay(day, cycle.connectionId, cycles) : null;
                          
                          if (format(day, 'yyyy-MM-dd') === '2025-06-01') {
                            console.log(`🔍 JUNE 1ST PHASE DEBUG:`, {
                              cycleId: cycle.id,
                              connectionId: cycle.connectionId,
                              phaseInfo,
                              phaseInfoExists: !!phaseInfo
                            });
                          }
                          
                          if (!phaseInfo) {
                            if (format(day, 'yyyy-MM-dd') === '2025-06-01') {
                              console.log(`🔍 JUNE 1ST PHASE EXIT: No phaseInfo returned from getCyclePhaseForDay`);
                            }
                            return null;
                          }
                          
                          const getAccuratePhaseEmoji = (phase: string, subPhase?: string) => {
                            // Use exact emojis from legend - check legend component for accuracy
                            if (phase === 'menstrual') return '🩸';
                            if (phase === 'follicular') return '🌱';
                            if (phase === 'fertile' && subPhase === 'ovulation') return '🥚';
                            if (phase === 'fertile') return '🌸';
                            if (phase === 'luteal') return '🌙';
                            return '';
                          };
                          
                          const emoji = getAccuratePhaseEmoji(phaseInfo.phase, phaseInfo.subPhase);
                          if (!emoji) return null;
                          
                          return (
                            <span 
                              className="text-sm"
                              title={`${phaseInfo.phase}${phaseInfo.subPhase ? ` (${phaseInfo.subPhase})` : ''} phase`}
                            >
                              {emoji}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
                </div>
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
                    <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded flex items-center justify-center">
                      <span className="text-xs">🌸</span>
                    </div>
                    <span>Fertile window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded flex items-center justify-center">
                      <span className="text-xs">🥚</span>
                    </div>
                    <span>Ovulation day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded flex items-center justify-center">
                      <span className="text-xs">🌙</span>
                    </div>
                    <span>Luteal phase</span>
                  </div>
                </div>
                
                {selectedConnectionIds.length > 1 && (
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
        {selectedConnectionIds.length > 0 && getAverageCycleLength() && (
          <section className="px-4 py-2">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Cycle Statistics {selectedConnectionIds.length === 0 ? 'for All People' : selectedConnectionIds.length === 1 ? `for ${trackablePersons.find(p => p.id === selectedConnectionIds[0])?.name || 'Unknown'}` : `for ${selectedConnectionIds.length} people`}</h3>
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
                          {format(cycle.periodStartDate, 'MMM d')} - {cycle.cycleEndDate ? format(cycle.cycleEndDate, 'MMM d') : 'Ongoing'}
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
      <BottomNavigation />
    </div>
  );
}