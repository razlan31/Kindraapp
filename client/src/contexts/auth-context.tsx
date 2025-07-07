import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    zodiacSign?: string;
    loveLanguage?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Always start with loading=false to prevent spinner blocking on any page
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentPath = window.location.pathname;
    console.log("Auth: Checking authentication status for:", currentPath);

    // For public pages, set user to null immediately without API call to avoid loading states
    if (currentPath === "/login" || currentPath === "/" || currentPath === "/landing") {
      console.log("Auth: Public page detected, setting user to null without API call");
      setUser(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    const loadUser = async () => {
      if (!isMounted) return;
      
      try {
        console.log("Auth: Starting to load user for protected route, setting loading to true");
        setLoading(true);
        const currentUser = await getCurrentUser();
        
        if (isMounted) {
          console.log("getCurrentUser successful:", currentUser);
          setUser(currentUser);
          console.log("Auth context setting user:", currentUser);
        }
      } catch (error) {
        if (isMounted) {
          console.log("getCurrentUser error:", error);
          
          // No auto-login - let users see the welcome page
          if (isMounted) {
            setUser(null);
          }
        }
      } finally {
        if (isMounted) {
          console.log("Auth: Finally block - setting loading to false");
          setLoading(false);
        }
      }
    };

    loadUser();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username: string, password: string, rememberMe?: boolean) => {
    try {
      const loggedInUser = await loginUser(username, password, rememberMe);
      setUser(loggedInUser);
      console.log("Auth context: Login successful, user set:", loggedInUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    zodiacSign?: string;
    loveLanguage?: string;
  }) => {
    try {
      const newUser = await registerUser(userData);
      setUser(newUser);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("🔴 LOGOUT: Starting bulletproof logout process");
    
    // CRITICAL: Set user to null FIRST to stop all API calls immediately
    setUser(null);
    
    // IMMEDIATE synchronous cleanup to prevent any race conditions
    setUser(null);
    setLoading(false);
    
    // Clear all storage immediately
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies synchronously
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear React Query cache synchronously
      queryClient.clear();
      
      console.log("🔴 LOGOUT: All client state cleared immediately");
    } catch (error) {
      console.error("🔴 LOGOUT: Client cleanup warning:", error);
    }
    
    // Asynchronous cleanup that won't block navigation
    setTimeout(async () => {
      try {
        // Clear server session (fire and forget)
        fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true // Ensures request completes even if page unloads
        }).catch(() => {
          // Ignore errors - page is already redirecting
        });
        
        // Cleanup service workers (fire and forget)
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
              registration.unregister().catch(() => {
                // Ignore errors - page is already redirecting
              });
            });
          });
        }
      } catch (error) {
        // Ignore all errors - page is already redirecting
      }
    }, 0);
    
    // IMMEDIATE redirect without waiting for any async operations
    console.log("🔴 LOGOUT: Redirecting to landing page immediately");
    window.location.href = "/";
  };

  const refreshUser = async () => {
    try {
      console.log("Auth: refreshUser called");
      const currentUser = await getCurrentUser();
      console.log("Auth: refreshUser got user:", currentUser);
      setUser(currentUser);
      console.log("Auth: refreshUser updated context user");
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
