import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User, Trophy, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell, UserPointsDisplay } from "@/components/notifications";

export function Header() {
  const { logout, isAuthenticated } = useAuth();
  
  // Use React Query to get the latest user data including profile picture
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => fetch('/api/me').then(res => res.json()),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const displayName = user?.displayName || user?.username || '';
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center">
      <div className="flex items-center">
        <Link href="/" className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-primary hover:opacity-80 transition-opacity">
          Kindra
        </Link>
      </div>
      <div className="flex-1"></div>
      <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-5">
        <UserPointsDisplay />
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-full p-0"
              onClick={() => console.log("🔴 HEADER: Dropdown trigger clicked")}
            >
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11">
                <AvatarImage src={user?.profileImage ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-sm sm:text-base lg:text-lg font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={() => console.log("🔴 HEADER: Dropdown closed")}>
            <DropdownMenuItem asChild>
              <Link href="/profile" onClick={() => console.log("🔴 HEADER: Profile link clicked")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/badges">
                <Trophy className="mr-2 h-4 w-4" />
                <span>Badges</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/menstrual-cycle">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Cycle Tracker</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                console.log("🔴 HEADER: Logout menu item clicked, event:", e);
                console.log("🔴 HEADER: About to call logout function");
                e.preventDefault();
                e.stopPropagation();
                logout();
                console.log("🔴 HEADER: Logout function called");
              }}
              onSelect={(e) => {
                console.log("🔴 HEADER: Logout onSelect triggered");
                e.preventDefault();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
