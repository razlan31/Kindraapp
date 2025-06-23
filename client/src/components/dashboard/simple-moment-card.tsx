import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";
import { Moment, Connection } from "@shared/schema";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface SimpleMomentCardProps {
  moment: Moment;
}

export function SimpleMomentCard({ moment }: SimpleMomentCardProps) {
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections']
  });

  // Safety check for moment data
  if (!moment || !moment.id) {
    return null;
  }

  const connection = connections?.find(c => c.id === moment.connectionId);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{moment.emoji || '📝'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Circle className="h-3 w-3 fill-current text-purple-500" />
              <span>{connection?.name || 'Unknown Connection'}</span>
              <span>•</span>
              <span>{moment.createdAt ? formatDate(moment.createdAt) : 'No date'}</span>
            </div>
            {moment.title && (
              <h4 className="font-medium text-sm mb-1">{moment.title}</h4>
            )}
            {moment.content && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {moment.content}
              </p>
            )}
            {moment.tags && moment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {moment.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
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
        </div>
      </CardContent>
    </Card>
  );
}