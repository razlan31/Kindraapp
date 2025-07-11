import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Settings, User, Trophy, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell, UserPointsDisplay } from "@/components/notifications";
import { useState, useEffect } from "react";

export function Header() {
  const { logout, isAuthenticated, user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

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
  const { data: userData } = useQuery({
    queryKey: ['/api/me'],
    enabled: isAuthenticated && !!user, // Only run when authenticated AND user exists
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
  
  const displayName = userData?.displayName || userData?.username || '';
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
        
        {/* Test button to verify component renders */}
        <div className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
          TEST
        </div>
        
        {/* Direct logout button - guaranteed to work */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium z-50 relative disabled:opacity-50"
          style={{ zIndex: 9999 }}
        >
          {loggingOut ? (
            <>
              <div className="h-4 w-4 mr-1 inline animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              LOGGING OUT
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-1 inline" />
              LOGOUT
            </>
          )}
        </button>
        

        
        <div className="relative dropdown-container">
          <Button 
            variant="ghost" 
            className="relative h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-full p-0"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11">
              <AvatarImage src={userData?.profileImage ?? undefined} alt={displayName} />
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
                    type="button"
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                    disabled={loggingOut}
                    onClick={handleLogout}
                  >
                    {loggingOut ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        <span>Logging out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </>
                    )}
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
