import React from 'react';
import { format, isSameDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CakeIcon, StarIcon, HeartIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { useRelationshipFocus } from '@/contexts/relationship-focus-context';
import { Milestone } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

type MilestoneDisplayProps = {
  date: Date;
  onAddMilestone?: (date: Date) => void;
};

export function MilestoneDisplay({ date, onAddMilestone }: MilestoneDisplayProps) {
  const { user } = useAuth();
  const { mainFocusConnection } = useRelationshipFocus();
  
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', mainFocusConnection?.id],
    queryFn: async () => {
      const queryString = mainFocusConnection 
        ? `?connectionId=${mainFocusConnection.id}` 
        : '';
      return apiRequest<Milestone[]>(`/api/milestones${queryString}`);
    },
    enabled: !!user,
  });
  
  // Filter milestones for this specific date
  const milestonesForDate = milestones.filter(milestone => 
    isSameDay(new Date(milestone.date), date)
  );
  
  // Get recurring anniversaries (yearly events)
  const anniversaries = milestones.filter(milestone => 
    milestone.isAnniversary && 
    new Date(milestone.date).getDate() === date.getDate() &&
    new Date(milestone.date).getMonth() === date.getMonth()
  );
  
  // Combine regular milestones and anniversaries, removing duplicates
  const allEvents = [...milestonesForDate, ...anniversaries.filter(
    anniv => !milestonesForDate.some(ms => ms.id === anniv.id)
  )];
  
  if (allEvents.length === 0) {
    return null;
  }
  
  const getIconForMilestone = (milestone: Milestone) => {
    switch (milestone.icon) {
      case 'heart':
        return <HeartIcon className="h-3 w-3" />;
      case 'star':
        return <StarIcon className="h-3 w-3" />;
      case 'cake':
      default:
        return <CakeIcon className="h-3 w-3" />;
    }
  };
  
  return (
    <div className="flex flex-col gap-1 mt-1">
      {allEvents.map(milestone => (
        <TooltipProvider key={milestone.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center justify-center p-1 rounded-full" 
                style={{ backgroundColor: milestone.color || '#C084FC' }}
              >
                {getIconForMilestone(milestone)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p className="font-bold">{milestone.title}</p>
                {milestone.description && <p>{milestone.description}</p>}
                <p className="text-gray-500 dark:text-gray-400">
                  {format(new Date(milestone.date), 'MMM d, yyyy')}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

export function MilestoneAddButton({ date, onClick }: { date: Date; onClick: () => void }) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="absolute bottom-0 right-0 h-5 w-5" 
      onClick={onClick}
    >
      <StarIcon className="h-3 w-3" />
    </Button>
  );
}