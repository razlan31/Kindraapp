import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Filter, Search, ArrowUpDown } from 'lucide-react';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import type { Connection, Moment } from '@shared/schema';

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

interface ConnectionTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: Connection | null;
}

export function ConnectionTimelineModal({ isOpen, onClose, connection }: ConnectionTimelineModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  if (!connection) return null;

  // Fetch moments for this connection
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: isOpen,
  });

  // Filter and sort moments
  const filteredMoments = moments
    .filter(m => m.connectionId === connection.id)
    .filter(m => {
      if (filterType === 'all') return true;
      if (filterType === 'positive') return ['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥', '💕'].includes(m.emoji);
      if (filterType === 'conflicts') return m.tags?.includes('Conflict') || m.emoji === '⚡';
      if (filterType === 'intimate') return m.isIntimate || m.tags?.includes('Intimacy');
      if (filterType === 'plans') return m.tags?.includes('Plan') || m.emoji === '📅';
      return true;
    })
    .filter(m => {
      if (!searchTerm) return true;
      return (
        m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Group moments by date
  const groupedMoments = filteredMoments.reduce((groups: { [key: string]: Moment[] }, moment) => {
    const date = format(new Date(moment.createdAt || 0), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(moment);
    return groups;
  }, {});

  // Format date for display
  const formatDateGroup = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    
    const daysDiff = differenceInDays(new Date(), date);
    if (daysDiff < 7) return `${daysDiff} days ago`;
    
    return format(date, 'MMMM d, yyyy');
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return 'Unknown time';
    try {
      return format(new Date(date), 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const getMomentTypeColor = (moment: Moment) => {
    if (moment.tags?.includes('Conflict') || moment.emoji === '⚡') return 'border-l-red-500';
    if (moment.isIntimate || moment.tags?.includes('Intimacy')) return 'border-l-pink-500';
    if (moment.tags?.includes('Plan')) return 'border-l-purple-500';
    if (['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥', '💕'].includes(moment.emoji)) return 'border-l-green-500';
    return 'border-l-blue-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {connection.profileImage ? (
                <img 
                  src={connection.profileImage} 
                  alt={connection.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {connection.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold">Timeline with {connection.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredMoments.length} moments found
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Filters and Search */}
        <div className="flex flex-col gap-3 py-4 border-b">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search moments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="conflicts">Conflicts</SelectItem>
                <SelectItem value="intimate">Intimate</SelectItem>
                <SelectItem value="plans">Plans</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
            </Button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {Object.entries(groupedMoments).map(([dateStr, dayMoments]) => (
            <div key={dateStr} className="space-y-3">
              {/* Date Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 border-b">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDateGroup(dateStr)}
                  <Badge variant="secondary" className="text-xs">
                    {dayMoments.length} {dayMoments.length === 1 ? 'moment' : 'moments'}
                  </Badge>
                </h3>
              </div>

              {/* Moments for this date */}
              <div className="space-y-3 pl-4">
                {dayMoments.map((moment, index) => (
                  <div key={moment.id} className="flex gap-4">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm">
                        {moment.emoji}
                      </div>
                      {index < dayMoments.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2"></div>
                      )}
                    </div>

                    {/* Moment content */}
                    <Card className={`flex-1 p-3 border-l-4 ${getMomentTypeColor(moment)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {generateActivityName(moment)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(moment.createdAt)}
                          </div>
                        </div>
                        {moment.tags && moment.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {moment.tags.slice(0, 3).map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {moment.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{moment.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {moment.content && (
                        <div className="text-sm text-muted-foreground mt-2">
                          {moment.content}
                        </div>
                      )}

                      {/* Special indicators */}
                      <div className="flex items-center gap-2 mt-2">
                        {moment.isIntimate && (
                          <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-800">
                            Intimate
                          </Badge>
                        )}
                        {moment.tags?.includes('Conflict') && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                            Conflict
                          </Badge>
                        )}
                        {moment.tags?.includes('Plan') && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                            Plan
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredMoments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No moments found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : `Start creating moments with ${connection.name} to see them here`
                }
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}