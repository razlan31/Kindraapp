import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Settings, User, Trophy, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell, UserPointsDisplay } from "@/components/notifications";
import { useState, useEffect } from "react";

export function Header() {
  const { logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);
  
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
        
        {/* Direct logout button - guaranteed to work */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔴 DIRECT: Raw button clicked, calling logout");
            logout();
          }}
          onMouseDown={() => console.log("🔴 DIRECT: Mouse down on logout button")}
          onMouseUp={() => console.log("🔴 DIRECT: Mouse up on logout button")}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium z-50 relative"
          style={{ zIndex: 9999 }}
        >
          <LogOut className="h-4 w-4 mr-1 inline" />
          LOGOUT
        </button>
        
        {/* Nuclear option - force hard redirect */}
        <a
          href="/landing"
          onClick={(e) => {
            e.preventDefault();
            console.log("🔴 NUCLEAR: Hard redirect clicked");
            // Clear everything and force redirect
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/landing';
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs font-medium z-50 relative"
          style={{ zIndex: 9999 }}
        >
          FORCE OUT
        </a>
        
        <div className="relative dropdown-container">
          <Button 
            variant="ghost" 
            className="relative h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-full p-0"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11">
              <AvatarImage src={user?.profileImage ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-sm sm:text-base lg:text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="py-1">
                <Link 
                  href="/profile" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <Link 
                  href="/badges"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>Badges</span>
                </Link>
                <Link 
                  href="/menstrual-cycle"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Cycle Tracker</span>
                </Link>
                <Link 
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
