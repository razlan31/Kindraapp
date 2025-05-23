import { useState } from "react";
import { Connection } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  ChevronsUpDown, 
  Heart,
  HeartOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "@/components/ui/command";

export function FocusSelector() {
  const { user } = useAuth();
  const { mainFocusConnection, setMainFocusConnection } = useRelationshipFocus();
  const [open, setOpen] = useState(false);

  // Fetch all connections
  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  const handleSelectConnection = (connectionId: string) => {
    if (connectionId === "none") {
      setMainFocusConnection(null);
    } else {
      const connection = connections.find(c => c.id.toString() === connectionId);
      if (connection) {
        setMainFocusConnection(connection);
      }
    }
    setOpen(false);
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading || connections.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Main Focus</p>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between text-xs px-3 h-8"
            >
              {mainFocusConnection ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    {mainFocusConnection.profileImage && (
                      <AvatarImage src={mainFocusConnection.profileImage} alt={mainFocusConnection.name} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(mainFocusConnection.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{mainFocusConnection.name}</span>
                </div>
              ) : (
                <span>All Connections</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search connections..." />
              <CommandEmpty>No connections found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="none"
                  onSelect={() => handleSelectConnection("none")}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="flex h-5 w-5 items-center justify-center">
                    {!mainFocusConnection && <Check className="h-4 w-4" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <HeartOff className="h-4 w-4 text-neutral-400" />
                    <span>All Connections</span>
                  </div>
                </CommandItem>
                
                {connections.map((connection) => (
                  <CommandItem
                    key={connection.id}
                    value={connection.name}
                    onSelect={() => handleSelectConnection(connection.id.toString())}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="flex h-5 w-5 items-center justify-center">
                      {mainFocusConnection?.id === connection.id && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        {connection.profileImage && (
                          <AvatarImage src={connection.profileImage} alt={connection.name} />
                        )}
                        <AvatarFallback className="text-[10px]">
                          {getInitials(connection.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{connection.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {mainFocusConnection && (
        <p className="text-xs text-neutral-500 mt-1">
          Showing data primarily for {mainFocusConnection.name}
        </p>
      )}
    </div>
  );
}