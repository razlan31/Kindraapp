import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User, Trophy, Calendar, Home, Brain } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export function Header() {
  const { logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Use React Query to get the latest user data including profile picture
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => fetch('/api/me').then(res => res.json()),
    enabled: isAuthenticated,
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
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-2xl font-heading font-bold text-primary">Kindra</h1>
      </div>
      
      {/* Navigation Links */}
      <div className="flex items-center space-x-1">
        <Link href="/">
          <Button 
            variant={location === "/" ? "default" : "ghost"} 
            size="sm"
            className="flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
        </Link>
        <Link href="/insights">
          <Button 
            variant={location === "/insights" ? "default" : "ghost"} 
            size="sm"
            className="flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>Insights</span>
          </Button>
        </Link>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="text-neutral-600 dark:text-neutral-400 rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileImage ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/profile">
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
            <DropdownMenuItem onClick={async () => {
              try {
                await logout();
                // Clear any cached data and redirect to login
                window.location.href = "/auth/login";
              } catch (error) {
                console.error("Logout error:", error);
                // Even if logout fails, redirect to login page
                window.location.href = "/auth/login";
              }
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
