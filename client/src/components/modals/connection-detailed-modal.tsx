import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Heart, MessageCircle, Sparkles, Edit, Trash2, Activity, Clock, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Connection, Moment } from '@shared/schema';

interface ConnectionDetailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: Connection | null;
}

export function ConnectionDetailedModal({ isOpen, onClose, connection }: ConnectionDetailedModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Connection>>({});
  const { toast } = useToast();

  // Fetch moments for this connection (must be before early return)
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: isOpen && !!connection,
  });

  // Update connection mutation (must be before early return)
  const updateConnection = useMutation({
    mutationFn: async (data: Partial<Connection>) => {
      if (!connection) throw new Error('No connection');
      const response = await fetch(`/api/connections/${connection.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update connection');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      setEditMode(false);
      toast({ title: 'Connection updated successfully!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating connection', 
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  if (!connection) return null;

  const connectionMoments = moments
    .filter(m => m.connectionId === connection.id)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Calculate relationship duration
  const calculateDuration = (startDate: Date | null) => {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day";
    if (diffDays < 30) return `${diffDays} days`;
    
    const diffMonths = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    
    if (diffMonths === 1 && remainingDays === 0) return "1 month";
    if (diffMonths < 12) {
      if (remainingDays === 0) return `${diffMonths} months`;
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
    }
    
    const diffYears = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    
    if (diffYears === 1 && remainingMonths === 0) return "1 year";
    if (remainingMonths === 0) return `${diffYears} years`;
    return `${diffYears} year${diffYears > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  };

  const duration = calculateDuration(connection.startDate);

  // Calculate detailed stats
  const stats = {
    total: connectionMoments.length,
    positive: connectionMoments.filter(m => 
      ['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥', '💕'].includes(m.emoji)
    ).length,
    conflicts: connectionMoments.filter(m => 
      m.tags?.includes('Conflict') || m.emoji === '⚡'
    ).length,
    intimate: connectionMoments.filter(m => 
      m.isIntimate || m.tags?.includes('Intimacy') || m.emoji === '💕'
    ).length,
    plans: connectionMoments.filter(m => 
      m.tags?.includes('Plan') || m.emoji === '📅'
    ).length,
  };

  // Format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not set';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return 'Unknown';
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const handleSave = () => {
    updateConnection.mutate(editData);
  };

  const handleEditChange = (field: keyof Connection, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connection.profileImage ? (
                <img 
                  src={connection.profileImage} 
                  alt={connection.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {connection.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{connection.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  {connection.relationshipStage}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (editMode) {
                  setEditMode(false);
                  setEditData({});
                } else {
                  setEditMode(true);
                  setEditData(connection);
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Basic Information */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  {editMode ? (
                    <Input
                      value={editData.name || ''}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="text-sm mt-1">{connection.name}</div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Relationship Stage</label>
                  {editMode ? (
                    <Input
                      value={editData.relationshipStage || ''}
                      onChange={(e) => handleEditChange('relationshipStage', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="text-sm mt-1">{connection.relationshipStage}</div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={editData.startDate ? format(new Date(editData.startDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleEditChange('startDate', new Date(e.target.value))}
                      className="mt-1"
                    />
                  ) : (
                    <div className="text-sm mt-1">{formatDate(connection.startDate)}</div>
                  )}
                </div>
                {duration && (
                  <div>
                    <label className="text-sm font-medium">Duration</label>
                    <div className="text-sm mt-1">{duration}</div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Birthday</label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={editData.birthday ? format(new Date(editData.birthday), 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleEditChange('birthday', new Date(e.target.value))}
                      className="mt-1"
                    />
                  ) : (
                    <div className="text-sm mt-1">{formatDate(connection.birthday)}</div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Zodiac Sign</label>
                  {editMode ? (
                    <Input
                      value={editData.zodiacSign || ''}
                      onChange={(e) => handleEditChange('zodiacSign', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="text-sm mt-1">{connection.zodiacSign || 'Not set'}</div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Love Language</label>
                  {editMode ? (
                    <Input
                      value={editData.loveLanguage || ''}
                      onChange={(e) => handleEditChange('loveLanguage', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="text-sm mt-1">{connection.loveLanguage || 'Not set'}</div>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleSave} disabled={updateConnection.isPending}>
                    {updateConnection.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quick Stats
              </h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
                  <div className="text-xs text-muted-foreground">Positive</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.conflicts}</div>
                  <div className="text-xs text-muted-foreground">Conflicts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{stats.intimate}</div>
                  <div className="text-xs text-muted-foreground">Intimate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.plans}</div>
                  <div className="text-xs text-muted-foreground">Plans</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Showing all {connectionMoments.length} activities with {connection.name}
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {connectionMoments.map((moment) => (
                <Card key={moment.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{moment.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {moment.title || 'Untitled moment'}
                      </div>
                      {moment.content && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {moment.content}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(moment.createdAt)}
                        </div>
                        {moment.tags && moment.tags.length > 0 && (
                          <div className="flex gap-1">
                            {moment.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Relationship Insights</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Activity Frequency</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.total > 0 ? 
                      `${(stats.total / Math.max(1, Math.ceil((Date.now() - new Date(connection.startDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)} activities per day on average` :
                      'No activity recorded yet'
                    }
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Positive Ratio</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.total > 0 ? 
                      `${Math.round((stats.positive / stats.total) * 100)}% positive interactions` :
                      'No data available'
                    }
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Communication Pattern</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.conflicts > 0 && stats.positive > 0 ?
                      stats.positive > stats.conflicts * 2 ? 'Healthy communication' : 'Moderate challenges' :
                      'Developing communication'
                    }
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Chronological view of your relationship journey
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {connectionMoments.map((moment, index) => (
                <div key={moment.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                      {moment.emoji}
                    </div>
                    {index < connectionMoments.length - 1 && (
                      <div className="w-px h-8 bg-border mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="font-medium text-sm">
                      {moment.title || 'Untitled moment'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(moment.createdAt)}
                    </div>
                    {moment.content && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {moment.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}