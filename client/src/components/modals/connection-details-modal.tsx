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
import { EditConnectionModal } from './edit-connection-modal';
import { MiniInsight } from '@/components/insights/mini-insight';

import type { Connection, Moment } from '@shared/schema';

interface ConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: Connection | null;
}

export function ConnectionDetailsModal({ isOpen, onClose, connection }: ConnectionDetailsModalProps) {
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch moments for this connection (hooks must be called before early returns)
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: isOpen && !!connection,
  });

  if (!connection) return null;

  const connectionMoments = moments.filter(m => m.connectionId === connection.id);

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
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
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
              {duration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{duration}</span>
                </div>
              )}
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

          {/* AI Relationship Insight */}
          <MiniInsight 
            context="connection-profile"
            data={{
              relationshipStage: connection.relationshipStage,
              loveLanguage: connection.loveLanguage,
              zodiacSign: connection.zodiacSign,
              recentMoments: recentMoments.map(m => ({
                emoji: m.emoji,
                content: m.content,
                title: m.title,
                isIntimate: m.isIntimate,
                tags: m.tags
              })),
              totalMoments,
              positiveMoments,
              conflictMoments,
              intimateMoments,
              connectionName: connection.name
            }}
            className="mx-4"
          />

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

          {/* Action Button */}
          <div className="flex justify-center">
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              onClick={() => {
                onClose();
                setShowDetailedModal(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Edit Modal */}
      <EditConnectionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        connection={connection}
      />

      {/* Detailed Modal */}
      <ConnectionDetailedModal
        isOpen={showDetailedModal}
        onClose={() => setShowDetailedModal(false)}
        connection={connection}
      />
    </Dialog>
  );
}