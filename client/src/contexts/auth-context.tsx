import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser, registerUser } from "@/lib/auth";
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
    console.log("🔴 SERVICE WORKER BYPASS LOGOUT START");
    console.log('🔍 TRACKING: logout() called from', new Error().stack);
    
    // Clear all storage immediately
    localStorage.clear();
    sessionStorage.clear();
    console.log("🔴 STORAGE CLEARED");
    
    // Clear user state immediately to stop any ongoing requests
    setUser(null);
    console.log("🔴 USER STATE CLEARED");
    
    // Attempt server logout (but don't wait for it)
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/logout', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send();
      console.log("🔴 SERVER LOGOUT:", xhr.status);
    } catch (e) {
      console.log("🔴 SERVER LOGOUT ERROR (IGNORED):", e);
    }
    
    // NUCLEAR OPTION: Bypass service worker with location.replace
    console.log("🔴 NUCLEAR REDIRECT - BYPASSING SERVICE WORKER");
    try {
      // Try multiple redirect methods to bypass service worker
      window.location.replace("/login");
    } catch (e1) {
      try {
        window.location.assign("/login");  
      } catch (e2) {
        try {
          window.location.href = "/login";
        } catch (e3) {
          // Last resort - reload to home
          window.location.reload();
        }
      }
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
