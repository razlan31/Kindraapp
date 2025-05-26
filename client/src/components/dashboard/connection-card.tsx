import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { Connection } from "@shared/schema";
import { Link } from "wouter";

interface ConnectionCardProps {
  connection: Connection;
  isMainFocus?: boolean;
}

export function ConnectionCard({ connection, isMainFocus }: ConnectionCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Exclusive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Talking":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Situationship":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  return (
    <Link href={`/connections/${connection.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              {connection.profileImage ? (
                <AvatarImage src={connection.profileImage} alt={connection.name} />
              ) : (
                <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{connection.name}</h3>
                  {isMainFocus && (
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className={`text-xs ${getStageColor(connection.relationshipStage)}`}>
                  {connection.relationshipStage}
                </Badge>
                {connection.zodiacSign && (
                  <span className="text-xs text-neutral-500">{connection.zodiacSign}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}