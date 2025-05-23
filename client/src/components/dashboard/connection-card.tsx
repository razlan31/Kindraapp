import { Card } from "@/components/ui/card";
import { Connection } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ConnectionCardProps {
  connection: Connection;
  onSelect: (connection: Connection) => void;
  recentEmojis?: string[];
  flagCount?: { green: number; red: number };
}

export function ConnectionCard({ 
  connection, 
  onSelect, 
  recentEmojis = ["😊", "❤️", "✨"], 
  flagCount = { green: 0, red: 0 }
}: ConnectionCardProps) {
  const stageColorMap = useMemo(() => ({
    "Exclusive": "bg-secondary/20 text-secondary",
    "Talking": "bg-primary/20 text-primary",
    "Situationship": "bg-accent/20 text-neutral-700 dark:text-neutral-300",
    "FWB": "bg-warning/20 text-warning",
    "Sneaky Link": "bg-redFlag/20 text-redFlag",
    "Best Friend": "bg-primary/20 text-primary",
    "Potential": "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300",
  }), []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const relationshipDuration = useMemo(() => {
    if (!connection.startDate) return "New";
    return formatDistanceToNow(new Date(connection.startDate), { addSuffix: false });
  }, [connection.startDate]);

  return (
    <Card 
      className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(connection)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-12 w-12 rounded-full relative mr-3">
            <AvatarImage 
              src={connection.profileImage} 
              alt={connection.name} 
              className="h-full w-full object-cover rounded-full"
            />
            <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700">
              {getInitials(connection.name)}
            </AvatarFallback>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-success rounded-full border border-white dark:border-neutral-900"></div>
          </Avatar>
          <div>
            <h4 className="font-medium">{connection.name}</h4>
            <div className="flex items-center mt-1">
              <Badge 
                variant="outline" 
                className={`relationship-stage text-xs px-2 py-0.5 rounded-full ${stageColorMap[connection.relationshipStage as keyof typeof stageColorMap] || "bg-neutral-200 text-neutral-700"} mr-2`}
              >
                {connection.relationshipStage}
              </Badge>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{relationshipDuration}</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex">
          {recentEmojis.map((emoji, index) => (
            <span key={index} className="emoji-btn text-lg mr-2">{emoji}</span>
          ))}
        </div>
        <div className="flex space-x-2">
          {flagCount.green > 0 && (
            <span className="text-xs text-greenFlag bg-greenFlag/10 px-2 py-1 rounded-full">
              <i className="fa-solid fa-flag mr-1"></i> {flagCount.green} green flags
            </span>
          )}
          {flagCount.red > 0 && (
            <span className="text-xs text-redFlag bg-redFlag/10 px-2 py-1 rounded-full">
              <i className="fa-solid fa-flag mr-1"></i> {flagCount.red} red flags
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
