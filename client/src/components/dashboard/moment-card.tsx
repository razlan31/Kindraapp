import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Sparkles } from "lucide-react";
import { Moment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface MomentCardProps {
  moment: Moment;
  connection: {
    id: number;
    name: string;
    profileImage?: string;
  };
  onAddReflection: (momentId: number) => void;
  onViewDetail?: (momentId: number) => void;
  hasAiReflection?: boolean;
}

export function MomentCard({ moment, connection, onAddReflection, onViewDetail, hasAiReflection }: MomentCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
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
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow" 
      onClick={() => onViewDetail?.(moment.id)}
    >
      <CardContent className="p-0">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            {connection.profileImage ? (
              <AvatarImage src={connection.profileImage} alt={connection.name} />
            ) : (
              <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{connection.name}</span>
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
                    moment.emoji === '😐' ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700' :
                    ['❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(moment.emoji) ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700' :
                    ['😢', '😠', '😞', '😤'].includes(moment.emoji) ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700' :
                    'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
                  }`}>
                    {moment.emoji === '😊' ? 'Positive' :
                     moment.emoji === '😕' ? 'Negative' :
                     moment.emoji === '😐' ? 'Neutral' :
                     ['❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(moment.emoji) ? 'Positive' :
                     ['😢', '😠', '😞', '😤'].includes(moment.emoji) ? 'Negative' : 'Neutral'}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-neutral-500">
                {formatDistanceToNow(new Date(moment.createdAt || new Date()), { addSuffix: true })}
              </span>
            </div>
            
            {moment.content && (
              <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">
                {moment.content}
              </p>
            )}
            
            {/* Only show tags for regular moments, not conflicts or intimacy */}
            {getMomentType(moment) === null && moment.tags && moment.tags.length > 0 && (
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
            
            {/* Only show reflection for regular moments, not conflicts or intimacy */}
            {getMomentType(moment) === null && (
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}