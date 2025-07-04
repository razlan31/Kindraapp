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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip authentication on landing page
    if (window.location.pathname === "/landing" || window.location.pathname === "/") {
      console.log("Auth: Skipping authentication on landing page");
      setLoading(false);
      setUser(null);
      return;
    }

    let isMounted = true;
    
    const loadUser = async () => {
      if (!isMounted) return;
      
      try {
        console.log("Auth: Starting to load user, setting loading to true");
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
          
          // Auto-login with test credentials for development
          try {
            console.log("Attempting automatic login with test credentials");
            const loggedInUser = await loginUser("testuser", "password123", true);
            if (isMounted) {
              console.log("Auto-login successful:", loggedInUser);
              setUser(loggedInUser);
            }
          } catch (loginError) {
            console.log("Auto-login failed:", loginError);
            if (isMounted) {
              setUser(null);
            }
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
    console.log("🔴 LOGOUT: Clearing authentication state");
    
    // Clear user state first
    setUser(null);
    
    // Clear all stored data
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    
    // Navigate to home page instead of login
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
