import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { Connection } from "@shared/schema";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";

interface FocusSelectorProps {
  connections: Connection[];
}

export function FocusSelector({ connections }: FocusSelectorProps) {
  const { mainFocusConnection, setMainFocusConnection } = useRelationshipFocus();

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Heart className="h-5 w-5" />
          <span>Relationship Focus</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mainFocusConnection ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Avatar className="h-10 w-10">
                {mainFocusConnection.profileImage ? (
                  <AvatarImage src={mainFocusConnection.profileImage} alt={mainFocusConnection.name} />
                ) : (
                  <AvatarFallback>{getInitials(mainFocusConnection.name)}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{mainFocusConnection.name}</span>
                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                </div>
                <span className="text-xs text-neutral-500">Main Focus</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setMainFocusConnection(null)}
              className="w-full"
            >
              Remove Focus
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Choose a connection to focus on for better insights and tracking.
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {connections.slice(0, 3).map((connection) => (
                <Button
                  key={connection.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setMainFocusConnection(connection)}
                  className="w-full justify-start p-2"
                >
                  <Avatar className="h-6 w-6 mr-2">
                    {connection.profileImage ? (
                      <AvatarImage src={connection.profileImage} alt={connection.name} />
                    ) : (
                      <AvatarFallback className="text-xs">{getInitials(connection.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm">{connection.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}