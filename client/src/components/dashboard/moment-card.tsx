import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Sparkles, ZoomIn, ZoomOut, RotateCcw, Eye } from "lucide-react";
import { Moment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ManualInsight } from "@/components/insights/manual-insight";
import { useState } from "react";
import { MediaViewerModal } from "@/components/ui/media-viewer-modal";


interface MomentCardProps {
  moment: Moment;
  connection: {
    id: number;
    name: string;
    profileImage?: string;
  };
  onAddReflection: (momentId: number) => void;
  onViewDetail?: (momentId: number) => void;
  onResolveConflict?: (momentId: number) => void;
  onViewConnection?: (connection: { id: number; name: string; profileImage?: string }, event?: React.MouseEvent) => void;
  hasAiReflection?: boolean;
}

export function MomentCard({ moment, connection, onAddReflection, onViewDetail, onResolveConflict, onViewConnection, hasAiReflection }: MomentCardProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev * 1.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  const openMediaViewer = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedMediaIndex(index);
    setMediaViewerOpen(true);
  };

  const getMomentType = (moment: Moment) => {
    // Determine moment type based on tags and properties
    if (moment.tags?.includes('Conflict')) {
      return 'Conflict';
    }
    if (moment.isIntimate === true || moment.tags?.includes('Intimacy')) {
      return 'Intimacy';
    }
    // For regular moments, we don't show a type badge since type is just positive/negative/neutral
    return null;
  };

  const getTagColor = (tag: string) => {
    if (tag === "Sex") {
      return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
    }
    if (tag === "Green Flag" || ["Intimacy", "Affection", "Support", "Growth", "Trust", "Celebration"].includes(tag)) {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
    if (tag === "Red Flag" || ["Conflict", "Jealousy", "Stress", "Disconnection"].includes(tag)) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
    if (tag === "Blue Flag" || ["Life Goals", "Career", "Future Planning", "Vulnerability", "Communication"].includes(tag)) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
    return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300";
  };

  return (
    <div 
      className="card-moment p-4 cursor-pointer" 
      onClick={() => onViewDetail?.(moment.id)}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start space-x-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-1 -ml-1 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewConnection?.(connection, e);
                  }}
                  title={`View ${connection.name}'s profile`}
                >
                  {connection.profileImage ? (
                    <img 
                      src={connection.profileImage} 
                      alt={connection.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {getInitials(connection.name)}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-sm hover:text-primary transition-colors">{connection.name}</span>
                </div>
                <span className="text-2xl">{moment.emoji}</span>
                {/* Moment Type Indicator */}
                {(moment.tags?.includes('Conflict') || moment.isIntimate) ? (
                  <Badge variant="outline" className={`text-xs ${
                    moment.tags?.includes('Conflict') ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700' : 
                    'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700'
                  }`}>
                    {moment.tags?.includes('Conflict') ? 'Conflict' : 'Intimacy'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className={`text-xs ${
                    moment.emoji === '😊' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700' :
                    moment.emoji === '😕' ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700' :
                    moment.emoji === '🌱' ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700' :
                    ['❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(moment.emoji) ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700' :
                    ['😢', '😠', '😞', '😤'].includes(moment.emoji) ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700' :
                    'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
                  }`}>
                    {moment.emoji === '😊' ? 'Positive' :
                     moment.emoji === '😕' ? 'Negative' :
                     moment.emoji === '🌱' ? 'Neutral' :
                     ['❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(moment.emoji) ? 'Positive' :
                     ['😢', '😠', '😞', '😤'].includes(moment.emoji) ? 'Negative' : 'Neutral'}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-neutral-500">
                {formatDistanceToNow(new Date(moment.createdAt || new Date()), { addSuffix: true })}
              </span>
            </div>
            
            {moment.title && (
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {moment.title}
              </p>
            )}
            {moment.content && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                {moment.content}
              </p>
            )}

            {/* Media Files with Zoom Controls */}
            {moment.mediaFiles && moment.mediaFiles.length > 0 && (
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-2">
                  {moment.mediaFiles.slice(0, 4).map((file, index) => (
                    <div key={file.id} className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      {file.type === 'photo' ? (
                        <div className="relative group">
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-20 object-cover transition-transform duration-200"
                            style={{
                              transform: `scale(${zoomLevel})`,
                              transformOrigin: 'center center'
                            }}
                            onClick={(e) => openMediaViewer(e, index)}
                          />
                          {/* Zoom Controls Overlay */}
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                              onClick={handleZoomIn}
                              disabled={zoomLevel >= 3}
                            >
                              <ZoomIn className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                              onClick={handleZoomOut}
                              disabled={zoomLevel <= 0.5}
                            >
                              <ZoomOut className="h-3 w-3" />
                            </Button>
                            {zoomLevel !== 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                                onClick={handleResetZoom}
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {/* Full View Button */}
                          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                              onClick={(e) => openMediaViewer(e, index)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-20 flex items-center justify-center bg-gray-200 dark:bg-gray-700 cursor-pointer"
                             onClick={(e) => openMediaViewer(e, index)}>
                          <div className="text-center">
                            <div className="text-2xl mb-1">🎥</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">Video</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {moment.mediaFiles.length > 4 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{moment.mediaFiles.length - 4} more files
                  </div>
                )}
              </div>
            )}
            
            {/* Show tags for regular moments and intimacy moments, but not conflicts */}
            {getMomentType(moment) !== 'Conflict' && moment.tags && moment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {moment.tags
                  .filter(tag => !['Positive', 'Negative', 'Neutral'].includes(tag))
                  .map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`text-xs ${getTagColor(tag)}`}
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
            )}


            
            {/* Action buttons based on moment type */}
            {getMomentType(moment) === 'Conflict' ? (
              /* Conflict Resolution Button */
              <div className="flex items-center justify-between">
                <Button
                  variant={moment.isResolved ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolveConflict ? onResolveConflict(moment.id) : onAddReflection(moment.id);
                  }}
                  className={`text-xs h-8 ${
                    moment.isResolved 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  {moment.isResolved ? "✓ Resolved" : "Mark as Resolved"}
                </Button>
                
                {moment.isResolved && moment.resolutionNotes && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Has Notes
                  </Badge>
                )}
              </div>
            ) : getMomentType(moment) === null ? (
              /* Regular moment reflection button */
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddReflection(moment.id);
                  }}
                  className="text-xs h-8"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Add Reflection
                </Button>
                
                {hasAiReflection && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Insight
                  </Badge>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Media Viewer Modal */}
        {moment.mediaFiles && moment.mediaFiles.length > 0 && (
          <MediaViewerModal
            isOpen={mediaViewerOpen}
            onClose={() => setMediaViewerOpen(false)}
            mediaFiles={moment.mediaFiles.map(file => ({
              id: file.id,
              type: file.type as 'photo' | 'video',
              url: file.url,
              filename: file.filename
            }))}
            initialIndex={selectedMediaIndex}
          />
        )}
      </div>
    </div>
  );
}