import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Heart, MessageCircle, Sparkles, Edit, Trash2, Activity, Clock, TrendingUp, Users, Archive, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EditConnectionModal } from './edit-connection-modal';
import { ConnectionAIInsights } from '@/components/insights/connection-ai-insights';
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

interface ConnectionDetailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: Connection | null;
}

export function ConnectionDetailedModal({ isOpen, onClose, connection }: ConnectionDetailedModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const { toast } = useToast();

  // Use fresh connection data from the connections list
  const { data: allConnections = [], refetch: refetchConnections } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: isOpen,
  });

  // Listen for connection update events
  useEffect(() => {
    const handleConnectionUpdated = async () => {
      console.log("Connection updated event received, forcing refresh...");
      // Invalidate queries first
      await queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      // Force refetch
      await refetchConnections();
      // Update render key to force complete re-render
      setRenderKey(prev => prev + 1);
    };

    window.addEventListener('connectionUpdated', handleConnectionUpdated);
    
    return () => {
      window.removeEventListener('connectionUpdated', handleConnectionUpdated);
    };
  }, [refetchConnections, queryClient]);

  // Always use the most up-to-date connection data
  const currentConnection = connection?.id 
    ? (allConnections as Connection[]).find(c => c.id === connection.id) || connection
    : connection;

  // Debug connection data
  console.log("Connection Data Debug:", {
    originalConnection: connection,
    allConnections: allConnections.length,
    currentConnection,
    renderKey
  });

  const handleEditSuccess = () => {
    // Force complete re-render by updating key
    setRenderKey(prev => prev + 1);
    
    // Invalidate and refetch data
    queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    refetchConnections();
    
    setShowEditModal(false);
  };

  // Fetch moments for this connection (must be before early return)
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: isOpen && !!connection,
  });

  // Fetch user data for insights
  const { data: user } = useQuery({
    queryKey: ["/api/me"],
    enabled: isOpen && !!connection,
  });

  // Delete connection mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      return await apiRequest(`/api/connections/${connectionId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/moments"] });
      setShowDeleteConfirm(false);
      toast({
        title: "Connection Deleted",
        description: "Connection and all associated entries have been permanently deleted.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete connection",
        variant: "destructive",
      });
    },
  });

  // Archive connection mutation
  const archiveConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      return await apiRequest(`/api/connections/${connectionId}`, "PATCH", {
        isArchived: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      setShowArchiveConfirm(false);
      toast({
        title: "Connection Archived",
        description: "Connection has been archived. You can restore it from settings.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive connection",
        variant: "destructive",
      });
    },
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

  if (!currentConnection) return null;

  const connectionMoments = moments
    .filter(m => m.connectionId === currentConnection.id)
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
    <Dialog key={`connection-${connection?.id}-${renderKey}`} open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentConnection.profileImage ? (
                <img 
                  src={currentConnection.profileImage} 
                  alt={currentConnection.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {currentConnection.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{currentConnection.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  {currentConnection.relationshipStage}
                </Badge>
              </div>
            </div>

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
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchiveConfirm(true)}
                disabled={archiveConnectionMutation.isPending}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteConnectionMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {/* Basic Information */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span>{formatDate(currentConnection.startDate)}</span>
                </div>
                {duration && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{duration}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Birthday:</span>
                  <span>{formatDate(currentConnection.birthday)}</span>
                </div>
                {currentConnection.zodiacSign && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zodiac:</span>
                    <span>{currentConnection.zodiacSign}</span>
                  </div>
                )}
                {currentConnection.loveLanguage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Love Language:</span>
                    <span className="text-right">{currentConnection.loveLanguage}</span>
                  </div>
                )}
              </div>
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
                        {generateActivityName(moment)}
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
            {currentConnection && user ? (
              <ConnectionAIInsights
                connection={currentConnection}
                moments={connectionMoments}
                userData={{
                  zodiacSign: (user as any).zodiacSign,
                  loveLanguage: (user as any).loveLanguage
                }}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Loading insights...</div>
                </div>
              </div>
            )}
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
                      {generateActivityName(moment)}
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

      {/* Edit Modal */}
      <EditConnectionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        connection={currentConnection}
        onEditSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Connection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this connection? This action will permanently delete:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>The connection profile for {currentConnection.name}</li>
              <li>All moments and entries associated with this connection</li>
              <li>All milestones and plans</li>
              <li>This action cannot be undone</li>
            </ul>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteConnectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteConnectionMutation.mutate(currentConnection.id);
                }}
                disabled={deleteConnectionMutation.isPending}
              >
                {deleteConnectionMutation.isPending ? "Deleting..." : "Delete Forever"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-orange-500" />
              Archive Connection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to archive this connection?
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>The connection will be hidden from your active connections</li>
              <li>All data will be preserved</li>
              <li>You can restore it anytime from Settings</li>
            </ul>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowArchiveConfirm(false)}
                disabled={archiveConnectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  archiveConnectionMutation.mutate(currentConnection.id);
                }}
                disabled={archiveConnectionMutation.isPending}
              >
                {archiveConnectionMutation.isPending ? "Archiving..." : "Archive Connection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}