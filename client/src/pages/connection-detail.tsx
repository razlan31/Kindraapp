import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Connection, Moment } from "@shared/schema";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Calendar, Star, MessageCircle, Edit, Trash2, Plus, Activity, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/contexts/modal-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { MilestoneModal } from "@/components/modals/milestone-modal";
import { PlanModal } from "@/components/modals/plan-modal";

// Helper function to generate descriptive activity names when no title is provided
function generateActivityName(moment: Moment): string {
  if (moment.title && moment.title.trim() !== '') {
    return moment.title;
  }

  // Define activity patterns based on emoji and tags
  const positiveEmojis = ['😍', '💕', '❤️', '🥰', '😊', '🤗', '💖', '🌟', '✨', '💫', '🔥', '😘', '🥳', '🎉', '💯', '🎊'];
  const conflictEmojis = ['😢', '😞', '😕', '💔', '😤', '😠', '🙄', '😣', '😭', '😰', '⚡', '😡', '🤬', '😩', '😫'];
  const intimateEmojis = ['💋', '🔥', '😘', '🥰', '💖', '😍', '🌹', '🍷', '🕯️', '🛏️'];
  const planEmojis = ['📅', '🎯', '✈️', '🎪', '🎭', '🎨', '🍽️', '🎬', '🎵', '🏞️', '🏖️', '🗓️'];
  const communicationEmojis = ['💬', '📱', '📞', '💌', '✉️', '🗣️', '👂', '🤝', '💭'];
  const supportEmojis = ['🤗', '🤲', '💪', '🙏', '💝', '🎁', '🌈', '☀️', '🌸'];

  // Check tags first for more specific categorization
  if (moment.tags?.includes('Green Flag')) return 'Positive Moment';
  if (moment.tags?.includes('Red Flag')) return 'Conflict Moment';
  if (moment.tags?.includes('Yellow Flag')) return 'Concerning Moment';
  if (moment.tags?.includes('Physical Touch')) return 'Intimate Moment';
  if (moment.tags?.includes('Quality Time')) return 'Quality Time Together';
  if (moment.tags?.includes('Deep Talk')) return 'Deep Conversation';
  if (moment.tags?.includes('Heart to Heart')) return 'Heart-to-Heart Talk';
  if (moment.tags?.includes('Future Plans')) return 'Future Planning';
  if (moment.tags?.includes('Date Night')) return 'Date Night';
  if (moment.tags?.includes('Support')) return 'Support Moment';
  if (moment.tags?.includes('Advice')) return 'Advice Exchange';
  if (moment.tags?.includes('Milestone')) return 'Milestone Celebration';
  if (moment.tags?.includes('Anniversary')) return 'Anniversary';
  if (moment.tags?.includes('Gift')) return 'Gift Exchange';
  if (moment.tags?.includes('Travel')) return 'Travel Experience';
  if (moment.tags?.includes('Family')) return 'Family Time';
  if (moment.tags?.includes('Friends')) return 'Social Gathering';

  // Check emoji categories
  if (intimateEmojis.includes(moment.emoji)) return 'Intimate Moment';
  if (planEmojis.includes(moment.emoji)) return 'Planning Session';
  if (communicationEmojis.includes(moment.emoji)) return 'Communication';
  if (supportEmojis.includes(moment.emoji)) return 'Support Moment';
  if (positiveEmojis.includes(moment.emoji)) return 'Positive Moment';
  if (conflictEmojis.includes(moment.emoji)) return 'Challenging Moment';

  // Check for intimate moments
  if (moment.isIntimate) return 'Intimate Moment';

  // Default based on content or fallback
  if (moment.content) {
    const content = moment.content.toLowerCase();
    if (content.includes('plan') || content.includes('future')) return 'Planning Discussion';
    if (content.includes('fight') || content.includes('argue') || content.includes('upset')) return 'Conflict Resolution';
    if (content.includes('love') || content.includes('happy') || content.includes('amazing')) return 'Positive Moment';
    if (content.includes('talk') || content.includes('discuss') || content.includes('conversation')) return 'Deep Conversation';
    if (content.includes('date') || content.includes('dinner') || content.includes('movie')) return 'Date Activity';
    if (content.includes('help') || content.includes('support') || content.includes('comfort')) return 'Support Moment';
  }

  // Final fallback
  return 'Shared Moment';
}

export default function ConnectionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { openMomentModal, openPlanModal, planModalOpen, closePlanModal, setSelectedConnection } = useModal();
  const { mainFocusConnection, setMainFocusConnection } = useRelationshipFocus();
  const queryClient = useQueryClient();
  const connectionId = parseInt(id as string);
  
  const isMainFocus = mainFocusConnection?.id === connectionId;
  
  console.log('Focus Debug - Connection Detail:', {
    connectionId,
    mainFocusConnection,
    isMainFocus,
    mainFocusId: mainFocusConnection?.id
  });
  
  // Fetch connection details
  const { data: connection, isLoading, error } = useQuery({
    queryKey: ['/api/connections', connectionId],
    queryFn: async () => {
      const response = await fetch(`/api/connections/${connectionId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch connection details');
      }
      
      return response.json() as Promise<Connection>;
    },
    enabled: !isNaN(connectionId),
  });
  
  // Fetch moments for this connection
  const { data: moments } = useQuery({
    queryKey: ['/api/moments', { connectionId }],
    queryFn: async () => {
      const response = await fetch(`/api/moments?connectionId=${connectionId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch moments');
      }
      
      return response.json();
    },
    enabled: !isNaN(connectionId),
  });
  
  // Calculate activity counts
  const activityCounts = {
    positive: 0,
    negative: 0,
    neutral: 0,
    conflicts: 0,
    intimacy: 0
  };
  
  if (moments) {
    moments.forEach((moment: any) => {
      // Count conflicts first (has specific emoji)
      if (moment.emoji === '⚡') {
        activityCounts.conflicts++;
      }
      // Count intimacy moments (has specific emoji)
      else if (moment.emoji === '💕' || moment.isIntimate) {
        activityCounts.intimacy++;
      }
      // Count by emoji for regular moments
      else if (moment.emoji === '😊') {
        activityCounts.positive++;
      }
      else if (moment.emoji === '😕') {
        activityCounts.negative++;
      }
      else if (moment.emoji === '🌱') {
        activityCounts.neutral++;
      }
      // Fallback: check tags for older entries
      else if (moment.tags && moment.tags.some((tag: string) => 
        ['Quality Time', 'Affection', 'Support', 'Trust Building', 'Celebration'].includes(tag)
      )) {
        activityCounts.positive++;
      }
      else if (moment.tags && moment.tags.some((tag: string) => 
        ['Sexual Intimacy', 'Physical Intimacy', 'Emotional Intimacy'].includes(tag)
      )) {
        activityCounts.intimacy++;
      }
      else {
        // Default to neutral if can't categorize
        activityCounts.neutral++;
      }
    });
  }
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent double-clicking
    
    if (window.confirm('Are you sure you want to delete this connection?')) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/connections/${connectionId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok || response.status === 404) {
          // Both 200 (success) and 404 (already deleted) are fine
          // Invalidate the connections cache to refresh the list
          queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
          
          toast({
            title: 'Connection deleted',
            description: 'The connection has been removed'
          });
          
          setLocation('/connections');
        } else {
          throw new Error('Failed to delete connection');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete connection',
          variant: 'destructive'
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSetAsFocus = () => {
    if (connection) {
      if (isMainFocus) {
        // If already main focus, remove it
        console.log('Removing focus from:', connection);
        setMainFocusConnection(null);
        
        toast({
          title: 'Focus removed',
          description: 'This connection is no longer your main focus'
        });
      } else {
        // Set as main focus
        console.log('Setting as focus:', connection);
        setMainFocusConnection(connection);
        
        toast({
          title: 'Focus updated',
          description: 'This connection is now your main focus'
        });
      }
    }
  };
  
  const handleEdit = () => {
    // Navigate to the edit page
    setLocation(`/connections/${connectionId}/edit`);
  };
  

  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const getFormattedDate = (date: Date | null) => {
    if (!date) return "Not specified";
    return format(new Date(date), 'MMMM d, yyyy');
  };
  
  const getDurationText = (startDate: Date | null) => {
    if (!startDate) return "Not specified";
    
    const start = new Date(startDate);
    const now = new Date();
    
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    
    // Adjust for negative days
    if (days < 0) {
      months--;
      const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += daysInPrevMonth;
    }
    
    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    
    if (parts.length === 0) return "Today";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts.join(" and ");
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading connection details...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  if (error || !connection) {
    return (
      <div className="min-h-screen pb-16 p-4">
        <div className="max-w-md mx-auto text-center mt-12">
          <h2 className="text-xl font-semibold mb-2">Connection not found</h2>
          <p className="text-neutral-500 mb-4">The connection you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => setLocation('/connections')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Connections
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b px-4 py-3 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/connections')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Connection Details</h1>
        </div>
        
        {/* Profile section */}
        <div className="bg-white dark:bg-neutral-900 p-6 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 rounded-full">
              <AvatarImage 
                src={connection.profileImage || undefined} 
                alt={connection.name} 
                className="h-full w-full object-cover"
              />
              <AvatarFallback className="text-lg bg-neutral-200 dark:bg-neutral-700">
                {getInitials(connection.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{connection.name}</h2>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="px-2 py-1 text-xs">
                  {connection.relationshipStage}
                </Badge>
                {connection.isPrivate && (
                  <Badge variant="outline" className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800">
                    Private
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex mt-6 gap-2">
            <Button 
              variant={isMainFocus ? "secondary" : "default"}
              className={`flex-1 ${isMainFocus ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary text-white'}`}
              onClick={handleSetAsFocus}
            >
              <Heart className={`mr-2 h-4 w-4 ${isMainFocus ? 'fill-white' : ''}`} />
              {isMainFocus ? 'Remove Focus' : 'Set as Focus'}
            </Button>
            
            <Button 
              variant="outline"
              size="icon"
              onClick={handleEdit}
              className="h-10 w-10"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDelete}
              className="h-10 w-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Details section */}
        <div className="bg-white dark:bg-neutral-900 mt-2 p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Relationship Details</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="text-neutral-500">Connection Started</div>
              <div>{getFormattedDate(connection.startDate)}</div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-neutral-500">Relationship Duration</div>
              <div>{getDurationText(connection.startDate)}</div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-neutral-500">Birthday</div>
              <div>{getFormattedDate(connection.birthday)}</div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-neutral-500">Zodiac Sign</div>
              <div>{connection.zodiacSign || "Not specified"}</div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-neutral-500">Love Language</div>
              <div>{connection.loveLanguage || "Not specified"}</div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Activity Summary</h4>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center">
                  <div className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 text-sm font-semibold rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                    {activityCounts.positive}
                  </div>
                  <div className="text-xs">Positive 😊</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-sm font-semibold rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                    {activityCounts.negative}
                  </div>
                  <div className="text-xs">Negative 😕</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                    {activityCounts.neutral}
                  </div>
                  <div className="text-xs">Neutral 🌱</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm font-semibold rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                    {activityCounts.conflicts}
                  </div>
                  <div className="text-xs">Conflicts ⚡</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 text-sm font-semibold rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                    {activityCounts.intimacy}
                  </div>
                  <div className="text-xs">Intimacy 💕</div>
                </div>
              </div>
              
              {Object.values(activityCounts).every(count => count === 0) && (
                <div className="text-neutral-500 text-sm py-3 text-center w-full">
                  No moments tracked yet. Start adding moments to see activity summary.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Timeline Section */}
        <div className="mt-4 px-4 pb-8 mb-20">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">Timeline</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                View all activities for this connection
              </p>
            </div>
            
            {/* Timeline content */}
            <div className="p-4">
              {moments && moments.length > 0 ? (
                <div className="space-y-4">
                  {moments
                    .filter((moment: any) => moment.connectionId === connectionId)
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((moment: any) => (
                    <div key={moment.id} className="flex gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div className="text-2xl">{moment.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{generateActivityName(moment)}</h4>
                          <span className="text-xs text-neutral-500">
                            {format(new Date(moment.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {moment.content}
                        </p>
                        {moment.tags && moment.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {moment.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-neutral-500 py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-1">No moments yet</p>
                  <p className="text-sm">Start tracking your relationship by adding moments!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Add Button */}
        <div className="fixed bottom-20 right-4">
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => {
              setSelectedConnection(connection.id, connection);
              openMomentModal('moment');
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

      </div>
      
      <BottomNavigation />
      
      <MilestoneModal
        isOpen={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        connectionId={connectionId}
      />
      
      <PlanModal
        isOpen={planModalOpen}
        onClose={closePlanModal}
        selectedConnection={connection}
        selectedDate={null}
        showConnectionPicker={false}
      />
    </div>
  );
}