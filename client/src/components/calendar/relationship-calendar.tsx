import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Connection, Moment, MenstrualCycle, Milestone } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { format, isSameDay, startOfMonth, endOfMonth, isWithinInterval, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Calendar as CalendarIcon, 
  CircleAlert, 
  Droplets, 
  MessageCircle, 
  MoreHorizontal,
  Star as StarIcon,
  Cake as CakeIcon
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { MilestoneDisplay } from "./milestone-display";
import { MilestoneModal } from "@/components/modals/milestone-modal";

interface RelationshipCalendarProps {
  selectedConnection?: Connection | null;
}

export function RelationshipCalendar({ selectedConnection }: RelationshipCalendarProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedMilestoneDate, setSelectedMilestoneDate] = useState<Date>(new Date());
  
  // Get all moments
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !!user,
  });
  
  // Get all connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });
  
  // Get all menstrual cycles
  const { data: cycles = [] } = useQuery<MenstrualCycle[]>({
    queryKey: ["/api/menstrual-cycles"],
    enabled: !!user,
  });
  
  // Get milestone data
  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones", selectedConnection?.id],
    queryFn: async () => {
      const queryString = selectedConnection 
        ? `?connectionId=${selectedConnection.id}` 
        : '';
      const response = await fetch(`/api/milestones${queryString}`);
      const data = await response.json();
      return data;
    },
    enabled: !!user,
  });
  
  // Filter moments if a connection is selected
  const filteredMoments = selectedConnection 
    ? moments.filter(m => m.connectionId === selectedConnection.id)
    : moments;
  
  // When month changes, recalculate days
  useEffect(() => {
    setMonth(date);
  }, [date]);
  
  const getDayState = (day: Date) => {
    // Check if day is within a menstrual cycle
    const inMenstrualCycle = cycles.some(cycle => {
      if (!cycle.endDate) return false;
      
      const start = new Date(cycle.startDate);
      const end = new Date(cycle.endDate);
      
      return isWithinInterval(day, { start, end });
    });
    
    // Check if day has any moments
    const dayMoments = filteredMoments.filter(moment => {
      const momentDate = new Date(moment.createdAt || "");
      return isSameDay(momentDate, day);
    });
    
    // Check if day has any milestones
    const dayMilestones = milestones.filter(milestone => {
      const milestoneDate = new Date(milestone.date);
      return isSameDay(milestoneDate, day);
    });
    
    // Check for recurring anniversaries (yearly events)
    const dayAnniversaries = milestones.filter(milestone => 
      milestone.isAnniversary && 
      new Date(milestone.date).getDate() === day.getDate() &&
      new Date(milestone.date).getMonth() === day.getMonth()
    );
    
    // Combine regular milestones and anniversaries, removing duplicates
    const allMilestones = [...dayMilestones, ...dayAnniversaries.filter(
      anniv => !dayMilestones.some(ms => ms.id === anniv.id)
    )];
    
    const hasIntimacyMoment = dayMoments.some(m => m.isIntimate);
    
    const hasPlanMoment = dayMoments.some(m => 
      m.tags?.includes('Plan')
    );
    
    const hasConflictMoment = dayMoments.some(m => 
      m.tags?.includes('Conflict') || 
      m.tags?.includes('Red Flag')
    );
    
    const hasHappyMoment = dayMoments.some(m => 
      ['😃', '🙂', '😊', '❤️', '😍', '🥰'].includes(m.emoji) && 
      !m.tags?.includes('Plan') && !m.tags?.includes('Conflict')
    );
    
    const hasSadMoment = dayMoments.some(m => 
      ['😕', '😞', '😢', '😠', '😡'].includes(m.emoji) && 
      !m.tags?.includes('Plan') && !m.tags?.includes('Conflict')
    );
    
    const hasCycleMoment = dayMoments.some(m => 
      m.relatedToMenstrualCycle && !m.tags?.includes('Plan')
    );
    
    return {
      inMenstrualCycle,
      hasIntimacyMoment,
      hasPlanMoment,
      hasConflictMoment,
      hasHappyMoment,
      hasSadMoment,
      hasCycleMoment,
      dayMoments,
      dayMilestones: allMilestones,
      hasMilestone: allMilestones.length > 0
    };
  };
  
  // Render day with indicators
  const renderDay = (day: Date) => {
    const { 
      inMenstrualCycle, 
      hasIntimacyMoment, 
      hasPlanMoment,
      hasConflictMoment, 
      hasHappyMoment,
      hasSadMoment,
      hasCycleMoment,
      dayMoments,
      dayMilestones,
      hasMilestone
    } = getDayState(day);
    
    const formatMoments = (moments: Moment[]) => {
      return moments.map(m => ({
        type: m.tags?.includes('Plan') ? 'Plan' :
              m.isIntimate ? 'Intimacy' : 
              m.tags?.includes('Conflict') ? 'Conflict' : 
              m.tags?.includes('Red Flag') ? 'Red Flag' : 
              m.tags?.includes('Green Flag') ? 'Green Flag' : 
              m.relatedToMenstrualCycle ? 'Menstrual' : 'Moment',
        emoji: m.tags?.includes('Plan') ? '📅' : m.emoji,
        content: m.content
      }));
    };
    
    return (
      <div className="relative w-full h-full flex flex-col justify-center items-center p-1">
        <div className={cn(
          "w-full h-full rounded-md flex items-center justify-center",
          inMenstrualCycle && "bg-pink-50 dark:bg-pink-950/20",
        )}>
          <div className="relative">
            {day.getDate()}
            
            {/* Indicator dots - positioned at the bottom of the date */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-0.5">
              {hasPlanMoment && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Plan</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {hasIntimacyMoment && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Intimacy moment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {hasConflictMoment && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Conflict</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {hasHappyMoment && !hasConflictMoment && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Positive moment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {hasSadMoment && !hasConflictMoment && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Sad moment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {hasCycleMoment && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Menstrual cycle related</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {hasMilestone && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Milestone/Anniversary</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded view for days with moments or milestones */}
        {(dayMoments.length > 0 || dayMilestones.length > 0) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-0 right-0 cursor-pointer">
                  <MoreHorizontal className="h-3 w-3 text-neutral-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="w-60 p-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium">{format(day, 'MMMM d, yyyy')}</p>
                  
                  {/* Milestones section */}
                  {dayMilestones.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-amber-500">Milestones & Anniversaries</p>
                      {dayMilestones.map((milestone, idx) => (
                        <div key={`milestone-${idx}`} className="flex items-start gap-1.5 text-xs">
                          <span>
                            {milestone.icon === 'heart' ? <HeartIcon className="h-3 w-3" /> : 
                             milestone.icon === 'star' ? <StarIcon className="h-3 w-3" /> : 
                             <CakeIcon className="h-3 w-3" />}
                          </span>
                          <div>
                            <span className="font-medium" style={{ color: milestone.color || '#C084FC' }}>
                              {milestone.title}:
                            </span>
                            {milestone.description && (
                              <span className="ml-1">{milestone.description.substring(0, 50)}
                                {milestone.description?.length > 50 ? '...' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Moments section */}
                  {dayMoments.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-neutral-500">Moments</p>
                      {formatMoments(dayMoments).map((moment, idx) => (
                        <div key={`moment-${idx}`} className="flex items-start gap-1.5 text-xs">
                          <span>{moment.emoji}</span>
                          <div>
                            <span className={cn(
                              "font-medium",
                              moment.type === 'Intimacy' && "text-pink-500",
                              moment.type === 'Conflict' && "text-red-500",
                              moment.type === 'Red Flag' && "text-red-500",
                              moment.type === 'Green Flag' && "text-emerald-500",
                              moment.type === 'Menstrual' && "text-purple-500",
                            )}>
                              {moment.type}:
                            </span>
                            <span className="ml-1">{moment.content.substring(0, 50)}{moment.content.length > 50 ? '...' : ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Button to add milestone */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-1 text-xs h-7" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMilestoneDate(day);
                      setShowMilestoneModal(true);
                    }}
                  >
                    <StarIcon className="mr-1 h-3 w-3" />
                    Add Milestone
                  </Button>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 pb-2">
        <div className="text-center mb-2">
          <h3 className="text-sm font-medium">
            {selectedConnection ? 
              `${selectedConnection.name}'s Calendar` : 
              "Your Relationship Calendar"}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {selectedConnection ? 
              `Showing moments with ${selectedConnection.name}` : 
              "Visualize your relationship cycles and patterns"}
          </p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(day: Date | undefined) => day && setDate(day)}
          className="rounded-md border"
          showOutsideDays={true}
          modifiersClassNames={{
            selected: "bg-primary text-primary-foreground",
            today: "bg-accent text-accent-foreground",
          }}
          modifiers={{
            selected: date,
            today: new Date(),
          }}
          components={{
            Day: ({ date: day, ...props }: { date: Date } & Record<string, any>) => {
              return (
                <div className="relative w-9 h-9 p-0">
                  <button 
                    {...props} 
                    className="h-9 w-9 p-0 font-normal"
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    {renderDay(day)}
                  </div>
                </div>
              );
            },
          }}
        />
        
        {/* Calendar legend */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-purple-400" />
            <span className="text-xs">Plans</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-pink-400" />
            <span className="text-xs">Intimacy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <span className="text-xs">Conflict</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="text-xs">Positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-blue-400" />
            <span className="text-xs">Neutral</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="text-xs">🏆 Milestones</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800" />
            <span className="text-xs">Menstrual Cycle</span>
          </div>
        </div>
        
        {/* Display current menstrual cycle phase if available */}
        {cycles.length > 0 && (
          <div className="mt-6 bg-pink-50 dark:bg-pink-950/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="h-4 w-4 text-pink-500" />
              <h4 className="text-sm font-medium">Current Menstrual Phase</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Your Phase:</p>
                <p className="text-sm">
                  {getCyclePhase(cycles[0])}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Tips:</p>
                <p className="text-xs">
                  {getCycleTips(getCyclePhase(cycles[0]))}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Display cycle insights */}
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Calendar Insights</h4>
          <div className="space-y-2">
            {getCycleInsights(cycles, filteredMoments)}
          </div>
        </div>
      </div>

      {/* Milestone Modal */}
      {showMilestoneModal && selectedConnection && (
        <MilestoneModal 
          isOpen={showMilestoneModal}
          onClose={() => setShowMilestoneModal(false)}
          selectedDate={selectedMilestoneDate}
          selectedConnection={selectedConnection}
        />
      )}
    </div>
  );
}

// Helper function to get the current menstrual phase
function getCyclePhase(cycle: MenstrualCycle): string {
  if (!cycle) return "No cycle data";
  
  const startDate = new Date(cycle.startDate);
  const today = new Date();
  
  // Calculate days since cycle start
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Approximate phases based on a standard 28-day cycle
  if (daysSinceStart < 0) {
    return "Pre-Menstrual";
  } else if (daysSinceStart < 5) {
    return "Menstrual Phase";
  } else if (daysSinceStart < 14) {
    return "Follicular Phase";
  } else if (daysSinceStart < 16) {
    return "Ovulation Phase";
  } else if (daysSinceStart < 28) {
    return "Luteal Phase";
  } else {
    return "Post-Cycle";
  }
}

// Helper function to get tips based on the current phase
function getCycleTips(phase: string): string {
  switch (phase) {
    case "Menstrual Phase":
      return "You may feel more introspective. Take time for self-care and rest.";
    case "Follicular Phase":
      return "Energy levels are rising. Good time for starting new projects and social activities.";
    case "Ovulation Phase":
      return "Communication and confidence peak. Ideal for important conversations and intimacy.";
    case "Luteal Phase":
      return "You may be more sensitive. Be mindful of emotional responses to relationship dynamics.";
    case "Pre-Menstrual":
      return "Practice self-care and open communication as emotions may be heightened.";
    default:
      return "Track your cycle regularly for personalized insights.";
  }
}

// Generate insights based on patterns
function getCycleInsights(cycles: MenstrualCycle[], moments: Moment[]): JSX.Element[] {
  const insights: JSX.Element[] = [];
  
  // Check if there are any cycles and moments to analyze
  if (cycles.length === 0 || moments.length === 0) {
    insights.push(
      <div key="no-data" className="text-xs text-neutral-500 dark:text-neutral-400">
        Log more moments and cycle data to receive relationship insights.
      </div>
    );
    return insights;
  }
  
  // Check for intimacy patterns
  const intimacyMoments = moments.filter(m => m.isIntimate);
  if (intimacyMoments.length >= 3) {
    insights.push(
      <div key="intimacy" className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded-md">
        <div className="flex items-center gap-1.5 mb-1">
          <Heart className="h-3 w-3 text-pink-500" />
          <span className="text-xs font-medium">Intimacy Pattern</span>
        </div>
        <p className="text-xs">
          You've logged {intimacyMoments.length} intimate moments. Tracking these alongside your cycle may reveal patterns in your connection.
        </p>
      </div>
    );
  }
  
  // Check for conflict patterns
  const conflictMoments = moments.filter(m => 
    m.tags?.includes('Conflict') || m.tags?.includes('Red Flag')
  );
  
  if (conflictMoments.length >= 2) {
    insights.push(
      <div key="conflict" className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded-md">
        <div className="flex items-center gap-1.5 mb-1">
          <CircleAlert className="h-3 w-3 text-red-500" />
          <span className="text-xs font-medium">Conflict Awareness</span>
        </div>
        <p className="text-xs">
          Notice if conflicts occur during certain phases of your cycle. This awareness can help improve communication.
        </p>
      </div>
    );
  }
  
  // Cycle-related moments
  const cycleRelatedMoments = moments.filter(m => m.relatedToMenstrualCycle);
  if (cycleRelatedMoments.length >= 2) {
    insights.push(
      <div key="cycle-mood" className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded-md">
        <div className="flex items-center gap-1.5 mb-1">
          <Droplets className="h-3 w-3 text-purple-500" />
          <span className="text-xs font-medium">Cycle Influence</span>
        </div>
        <p className="text-xs">
          You've noted {cycleRelatedMoments.length} moments influenced by your cycle. Understanding these patterns can improve relationship awareness.
        </p>
      </div>
    );
  }
  
  // If no specific insights yet
  if (insights.length === 0) {
    insights.push(
      <div key="general" className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded-md">
        <div className="flex items-center gap-1.5 mb-1">
          <MessageCircle className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium">Calendar Tracking</span>
        </div>
        <p className="text-xs">
          Continue tracking your moments and cycle data. Over time, patterns will emerge to provide deeper relationship insights.
        </p>
      </div>
    );
  }
  
  return insights;
}