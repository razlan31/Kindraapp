import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Heart, MessageCircle, Sparkles, Edit, Trash2, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { ConnectionDetailedModal } from './connection-detailed-modal';
import { ConnectionTimelineModal } from './connection-timeline-modal';
import type { Connection, Moment } from '@shared/schema';

interface ConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: Connection | null;
}

export function ConnectionDetailsModal({ isOpen, onClose, connection }: ConnectionDetailsModalProps) {
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  // Fetch moments for this connection (hooks must be called before early returns)
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: isOpen && !!connection,
  });

  if (!connection) return null;

  const connectionMoments = moments.filter(m => m.connectionId === connection.id);

  // Calculate stats
  const totalMoments = connectionMoments.length;
  const positiveMoments = connectionMoments.filter(m => 
    ['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(m.emoji)
  ).length;
  const conflictMoments = connectionMoments.filter(m => 
    m.tags?.includes('Conflict') || m.emoji === '⚡'
  ).length;
  const intimateMoments = connectionMoments.filter(m => 
    m.isIntimate || m.tags?.includes('Intimacy') || m.emoji === '💕'
  ).length;

  // Get recent moments (last 5)
  const recentMoments = connectionMoments
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  // Format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not set';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
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
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started:</span>
                <span>{formatDate(connection.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Birthday:</span>
                <span>{formatDate(connection.birthday)}</span>
              </div>
              {connection.zodiacSign && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zodiac:</span>
                  <span>{connection.zodiacSign}</span>
                </div>
              )}
              {connection.loveLanguage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Love Language:</span>
                  <span className="text-right">{connection.loveLanguage}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Activity Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{positiveMoments}</div>
                <div className="text-xs text-muted-foreground">Positive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{conflictMoments}</div>
                <div className="text-xs text-muted-foreground">Conflicts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{intimateMoments}</div>
                <div className="text-xs text-muted-foreground">Intimate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalMoments}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          {recentMoments.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentMoments.map((moment, index) => (
                  <div key={moment.id} className="flex items-start gap-3">
                    <div className="text-lg">{moment.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {moment.title || 'Untitled moment'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(moment.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  // Navigate to connection detail page
                  window.location.href = `/connections/${connection.id}`;
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Full Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  // Navigate to activities page with this connection selected
                  localStorage.setItem('navigation-connection-id', connection.id.toString());
                  window.location.href = '/activities';
                }}
              >
                <Activity className="h-4 w-4 mr-2" />
                Activities
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  onClose();
                  setShowDetailedModal(true);
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Detailed View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  onClose();
                  setShowTimelineModal(true);
                }}
              >
                <Heart className="h-4 w-4 mr-2" />
                Timeline
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Additional Modals */}
      <ConnectionDetailedModal
        isOpen={showDetailedModal}
        onClose={() => setShowDetailedModal(false)}
        connection={connection}
      />
      
      <ConnectionTimelineModal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        connection={connection}
      />
    </Dialog>
  );
}