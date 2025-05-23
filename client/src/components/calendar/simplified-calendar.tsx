import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Connection, Moment, MenstrualCycle } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { format, isSameDay, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Droplets, 
  MoreHorizontal
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RelationshipCalendarProps {
  selectedConnection?: Connection | null;
}

export function SimplifiedCalendar({ selectedConnection }: RelationshipCalendarProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  
  // Get all moments
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !!user,
  });
  
  // Get all menstrual cycles
  const { data: cycles = [] } = useQuery<MenstrualCycle[]>({
    queryKey: ["/api/menstrual-cycles"],
    enabled: !!user,
  });
  
  // Filter moments if a connection is selected
  const filteredMoments = selectedConnection 
    ? moments.filter(m => m.connectionId === selectedConnection.id)
    : moments;
  
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
    
    const hasIntimacyMoment = dayMoments.some(m => m.isIntimate);
    
    const hasConflictMoment = dayMoments.some(m => 
      m.tags?.includes('Conflict') || 
      m.tags?.includes('Red Flag')
    );
    
    const hasHappyMoment = dayMoments.some(m => 
      ['😃', '🙂', '😊', '❤️', '😍', '🥰'].includes(m.emoji)
    );
    
    const hasSadMoment = dayMoments.some(m => 
      ['😕', '😞', '😢', '😠', '😡'].includes(m.emoji)
    );
    
    return {
      inMenstrualCycle,
      hasIntimacyMoment,
      hasConflictMoment,
      hasHappyMoment,
      hasSadMoment,
      dayMoments
    };
  };
  
  // Render day with indicators
  const renderDay = (day: Date) => {
    const { 
      inMenstrualCycle, 
      hasIntimacyMoment, 
      hasConflictMoment, 
      hasHappyMoment,
      hasSadMoment,
      dayMoments
    } = getDayState(day);
    
    const formatMoments = (moments: Moment[]) => {
      return moments.map(m => ({
        type: m.isIntimate ? 'Intimacy' : 
              m.tags?.includes('Conflict') ? 'Conflict' : 
              m.tags?.includes('Red Flag') ? 'Red Flag' : 
              m.tags?.includes('Green Flag') ? 'Green Flag' : 'Moment',
        emoji: m.emoji,
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
              {hasIntimacyMoment && (
                <div className="h-1.5 w-1.5 rounded-full bg-pink-400" />
              )}
              
              {hasConflictMoment && (
                <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
              )}
              
              {hasHappyMoment && !hasConflictMoment && (
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
              
              {hasSadMoment && !hasConflictMoment && (
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded view for days with moments */}
        {dayMoments.length > 0 && (
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
                  <div className="space-y-1.5">
                    {formatMoments(dayMoments).map((moment, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs">
                        <span>{moment.emoji}</span>
                        <div>
                          <span className={cn(
                            "font-medium",
                            moment.type === 'Intimacy' && "text-pink-500",
                            moment.type === 'Conflict' && "text-red-500",
                            moment.type === 'Red Flag' && "text-red-500",
                            moment.type === 'Green Flag' && "text-emerald-500",
                          )}>
                            {moment.type}:
                          </span>
                          <span className="ml-1">{moment.content.substring(0, 50)}{moment.content.length > 50 ? '...' : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
            See menstrual cycles, intimacy, and relationship moments
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
          components={{
            Day: ({ date: day, ...props }: { date: Date } & Record<string, any>) => {
              // Remove invalid DOM props
              const { className, displayMonth, ...restProps } = props as any;
              return (
                <div className="relative w-9 h-9 p-0">
                  <button 
                    {...restProps} 
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
            <div className="h-3 w-3 rounded-full bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800" />
            <span className="text-xs">Menstrual Cycle</span>
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
            <span className="text-xs">Sad</span>
          </div>
        </div>
        
        {/* Display current menstrual cycle phase if available */}
        {cycles.length > 0 && (
          <div className="mt-6 bg-pink-50 dark:bg-pink-950/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-pink-500" />
              <h4 className="text-sm font-medium">Current Cycle Phase</h4>
            </div>
            <p className="text-xs">
              {cycles[0] ? `Cycle started: ${format(new Date(cycles[0].startDate), 'MMM d')}` : 'No cycle data available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}