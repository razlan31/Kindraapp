import { Card } from "@/components/ui/card";
import { Moment } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface MomentCardProps {
  moment: Moment;
  connection: {
    id: number;
    name: string;
    profileImage?: string;
  };
  onAddReflection?: (momentId: number) => void;
  hasAiReflection?: boolean;
}

export function MomentCard({ 
  moment, 
  connection, 
  onAddReflection,
  hasAiReflection = false 
}: MomentCardProps) {
  const getTagColor = (tag: string) => {
    switch(tag) {
      case "Intimacy":
        return "bg-secondary/10 text-secondary";
      case "Conflict":
        return "bg-redFlag/10 text-redFlag";
      case "Green Flag":
        return "bg-greenFlag/10 text-greenFlag";
      case "Red Flag":
        return "bg-warning/10 text-warning";
      case "Milestone":
        return "bg-accent/10 text-neutral-700 dark:text-neutral-300";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const timeAgo = formatDistanceToNow(new Date(moment.createdAt), { addSuffix: true });

  const mainTag = moment.tags && moment.tags.length > 0 ? moment.tags[0] : undefined;

  return (
    <Card className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex">
          <Avatar className="h-8 w-8 rounded-full flex-shrink-0 mr-2">
            <AvatarImage 
              src={connection.profileImage} 
              alt={connection.name} 
              className="h-full w-full object-cover rounded-full"
            />
            <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700">
              {getInitials(connection.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <span className="font-medium text-sm">{connection.name}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">{timeAgo}</span>
            </div>
            <div className="text-lg mt-1">{moment.emoji}</div>
          </div>
        </div>
        {mainTag && (
          <Badge variant="outline" className={`text-xs ${getTagColor(mainTag)} px-2 py-1 rounded-full`}>
            {mainTag}
          </Badge>
        )}
      </div>
      <p className="text-sm">{moment.content}</p>
      <div className="mt-2 flex justify-between items-center">
        {moment.tags?.includes("Green Flag") && (
          <Badge variant="outline" className="text-xs text-greenFlag bg-greenFlag/10 px-2 py-0.5 rounded-full">
            <i className="fa-solid fa-flag mr-1"></i> Green Flag
          </Badge>
        )}
        {moment.tags?.includes("Red Flag") && (
          <Badge variant="outline" className="text-xs text-redFlag bg-redFlag/10 px-2 py-0.5 rounded-full">
            <i className="fa-solid fa-flag mr-1"></i> Red Flag
          </Badge>
        )}
        {!moment.tags?.includes("Green Flag") && !moment.tags?.includes("Red Flag") && <div />}
        
        {hasAiReflection ? (
          <span className="text-xs text-secondary flex items-center">
            <i className="fa-solid fa-comment-dots mr-1"></i> AI Reflection Added
          </span>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-neutral-500 dark:text-neutral-400"
            onClick={() => onAddReflection && onAddReflection(moment.id)}
          >
            <MessageSquare className="h-3 w-3 mr-1" /> Add Reflection
          </Button>
        )}
      </div>
    </Card>
  );
}
