import { differenceInDays, addDays, startOfDay, format } from "date-fns";
import type { MenstrualCycle } from "@shared/schema";

// Cycle prediction utilities
export const calculateCycleLength = (cycles: MenstrualCycle[]): number => {
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
export const calculateOvulationDay = (cycleLength: number, historicalCycles: any[] = []): number => {
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
  
  // Use standard calculation - 14 days before cycle end
  return Math.max(12, cycleLength - 14);
};

// Comprehensive cycle phase system with 8 detailed phases
export const getDetailedCyclePhase = (
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
        color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-600 opacity-50",
        description: "Early follicular phase",
        emoji: "🌱",
        dayRange: `Days ${periodLength + 1}-${periodLength + 3}`,
        hormonalProfile: "Gradually rising estrogen",
        recommendations: ["Increase activity", "Focus on goals", "Social activities", "Creative projects"]
      };
    } else {
      return {
        phase: "follicular",
        subPhase: "late_follicular",
        color: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-500 opacity-50",
        description: "Late follicular phase",
        emoji: "🌿",
        dayRange: `Days ${periodLength + 4}-${follicularEnd}`,
        hormonalProfile: "High estrogen, rising energy",
        recommendations: ["Peak performance time", "Important decisions", "Physical challenges", "New initiatives"]
      };
    }
  }
  
  // Fertile Window (3 days before ovulation to ovulation day)
  const fertileStart = ovulationDay - 2;
  const fertileEnd = ovulationDay + 1;
  if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) {
    if (dayInCycle === ovulationDay) {
      return {
        phase: "fertile",
        subPhase: "ovulation",
        color: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-500",
        description: "Ovulation day",
        emoji: "🔵",
        dayRange: `Day ${ovulationDay}`,
        hormonalProfile: "LH surge, peak fertility",
        recommendations: ["Peak intimacy window", "High energy activities", "Social connections", "Important conversations"]
      };
    } else {
      return {
        phase: "fertile",
        subPhase: "fertile_window",
        color: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-500",
        description: "Fertile window",
        emoji: "💛",
        dayRange: `Days ${fertileStart}-${fertileEnd}`,
        hormonalProfile: "High estrogen, approaching ovulation",
        recommendations: ["Fertility awareness", "Communication focus", "Relationship building", "Self-confidence peak"]
      };
    }
  }
  
  // Luteal Phase (Post-ovulation to next period)
  if (dayInCycle > ovulationDay + 1) {
    const lutealDay = dayInCycle - ovulationDay - 1;
    const midLuteal = Math.floor(lutealLength / 2);
    
    if (lutealDay <= midLuteal) {
      return {
        phase: "luteal",
        subPhase: "early_luteal",
        color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-600 opacity-50",
        description: "Early luteal phase",
        emoji: "🌙",
        dayRange: `Days ${ovulationDay + 2}-${ovulationDay + 1 + midLuteal}`,
        hormonalProfile: "Rising progesterone, stable mood",
        recommendations: ["Steady routines", "Detailed tasks", "Planning ahead", "Nurturing activities"]
      };
    } else {
      return {
        phase: "luteal",
        subPhase: "late_luteal",
        color: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-500 opacity-50",
        description: "Late luteal phase (PMS)",
        emoji: "🌚",
        dayRange: `Days ${ovulationDay + 1 + midLuteal + 1}-${cycleLength}`,
        hormonalProfile: "Declining hormones, PMS symptoms",
        recommendations: ["Self-care priority", "Stress management", "Gentle exercise", "Comfort foods in moderation"]
      };
    }
  }
  
  // Fallback
  return {
    phase: "unknown",
    subPhase: "unknown",
    color: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600",
    description: "Unknown phase",
    emoji: "❓",
    dayRange: `Day ${dayInCycle}`,
    hormonalProfile: "Unknown",
    recommendations: ["Monitor your cycle", "Track symptoms"]
  };
};

// Main function to get cycle phase for a specific day - used by both calendar and cycle tracker
export const getCyclePhaseForDay = (day: Date, connectionId: number, cycles: MenstrualCycle[]) => {
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
    
    // Debug logging for May dates and connection 6 (Amalina)
    const dayStr = format(day, 'yyyy-MM-dd');
    if (connectionId === 6 && (dayStr === '2025-05-01' || dayStr === '2025-05-02' || dayStr === '2025-05-03' || dayStr === '2025-05-04')) {
      console.log(`🔍 AMALINA MAY DEBUG - ${dayStr}:`, {
        dayStr,
        cycleId: cycle.id,
        periodStart: format(cycleStart, 'yyyy-MM-dd'),
        periodEnd: cycle.periodEndDate ? format(new Date(cycle.periodEndDate), 'yyyy-MM-dd') : 'no end date',
        cycleEnd: format(cycleEnd, 'yyyy-MM-dd'),
        dayWithinRange: day >= cycleStart && day <= cycleEnd,
        dayAsDate: day,
        cycleStartAsDate: cycleStart,
        periodStartDate: cycle.periodStartDate,
        periodEndDate: cycle.periodEndDate
      });
    }
    
    if (day >= cycleStart && day <= cycleEnd) {
      // Normalize dates to start of day to avoid timezone issues
      const normalizedDay = startOfDay(day);
      const normalizedCycleStart = startOfDay(cycleStart);
      
      const dayInCycle = differenceInDays(normalizedDay, normalizedCycleStart) + 1;
      const periodEnd = cycle.periodEndDate ? new Date(cycle.periodEndDate) : addDays(cycleStart, 4);
      
      // Calculate cycle length for detailed phase analysis
      const cycleLength = cycle.cycleEndDate ? 
        differenceInDays(new Date(cycle.cycleEndDate), cycleStart) + 1 : 
        (calculateCycleLength(connectionCycles) || 28);
      
      const periodLength = cycle.periodEndDate ? 
        differenceInDays(new Date(cycle.periodEndDate), cycleStart) + 1 : 5;
      
      // Debug for May period days
      if (connectionId === 6 && (dayStr === '2025-05-01' || dayStr === '2025-05-02' || dayStr === '2025-05-03' || dayStr === '2025-05-04')) {
        console.log(`🔍 PERIOD CALCULATION - ${dayStr}:`, {
          dayInCycle,
          periodLength,
          cycleLength,
          dayInCycleCalc: `${dayStr} - ${format(new Date(cycle.periodStartDate), 'yyyy-MM-dd')} = ${dayInCycle}`,
          periodLengthCalc: cycle.periodEndDate ? `${format(new Date(cycle.periodEndDate), 'yyyy-MM-dd')} - ${format(new Date(cycle.periodStartDate), 'yyyy-MM-dd')} + 1 = ${periodLength}` : 'no period end, using 5',
          isMenstrualPhase: dayInCycle <= periodLength,
          willReturnPhase: dayInCycle <= periodLength ? 'menstrual' : 'other'
        });
      }
      
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

// Helper function to get cycle display info for calendar - matches cycle tracker exactly
export const getCycleDisplayInfo = (phaseInfo: any) => {
  if (!phaseInfo) return null;
  
  // Use the exact same styling as the cycle tracker
  return {
    color: phaseInfo.detailedInfo.color,
    indicator: phaseInfo.detailedInfo.emoji,
    title: `Day ${phaseInfo.day} - ${phaseInfo.detailedInfo.description}`,
    description: phaseInfo.detailedInfo.description,
    hormonalProfile: phaseInfo.detailedInfo.hormonalProfile,
    recommendations: phaseInfo.detailedInfo.recommendations
  };
};