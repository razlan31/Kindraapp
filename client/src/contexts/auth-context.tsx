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

  const logout = async () => {
    console.log("🚨🚨🚨 LOGOUT FUNCTION EXECUTING - IMMEDIATE ACTION");
    
    // Set user to null FIRST to prevent any component queries
    setUser(null);
    setLoading(false); // Ensure loading is false to allow login page to render
    console.log("🚨🚨🚨 USER STATE SET TO NULL AND LOADING SET TO FALSE");
    
    queryClient.cancelQueries();
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();
    console.log("🚨🚨🚨 ALL DATA CLEARED");
    
    console.log("🚨🚨🚨 MAKING SERVER LOGOUT CALL");
    
    try {
      const res = await fetch("/api/logout", { method: "POST", credentials: "include" });
      console.log("🚨🚨🚨 SERVER RESPONSE:", res.status, res.statusText);
      
      if (!res.ok) {
        console.log("🚨🚨🚨 SERVER ERROR - Response not OK:", res.status, res.statusText);
        const errorText = await res.text();
        console.log("🚨🚨🚨 ERROR RESPONSE BODY:", errorText);
      }
      
      // Force full page reload to login to avoid any SPA routing issues
      console.log("🚨🚨🚨 NOW REDIRECTING TO LOGIN WITH FULL RELOAD");
      window.location.assign("/login");
      
    } catch (err) {
      console.log("🚨🚨🚨 SERVER ERROR:", err);
      // Even if server error, still redirect to prevent stuck state
      window.location.assign("/login");
    }
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
