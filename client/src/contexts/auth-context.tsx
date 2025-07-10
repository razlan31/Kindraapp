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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Always start with loading=false to prevent spinner blocking on any page
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentPath = window.location.pathname;
    console.log("🔥 AUTH CONTEXT v2025-01-09-FINAL: Checking authentication status for:", currentPath);
    console.log("🔥 AUTH CONTEXT: NO PUBLIC PAGE DETECTION - ALWAYS CALL getCurrentUser()");

    let isMounted = true;
    
    const loadUser = async () => {
      if (!isMounted) return;
      
      try {
        console.log("🔥 AUTH CONTEXT: Starting to load user, setting loading to true");
        setLoading(true);
        const currentUser = await getCurrentUser();
        
        if (isMounted) {
          console.log("🔥 AUTH CONTEXT: getCurrentUser successful:", currentUser);
          setUser(currentUser);
          console.log("🔥 AUTH CONTEXT: Auth context setting user:", currentUser);
        }
      } catch (error) {
        if (isMounted) {
          console.log("🔥 AUTH CONTEXT: getCurrentUser error:", error);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          console.log("🔥 AUTH CONTEXT: Finally block - setting loading to false");
          setLoading(false);
        }
      }
    };

    loadUser();
    
    return () => {
      isMounted = false;
    };
  }, []);  // Added empty dependency array to prevent infinite re-renders

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
    // Clear user state immediately - this triggers navigation via routing
    setUser(null);
    
    // Clear all local data
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    
    // Logout from server (but don't wait for it)
    fetch('/api/logout', { method: 'POST' }).catch(() => {});
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
