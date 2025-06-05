import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "@/lib/auth";
import { User } from "@shared/schema";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("Auth: Starting to load user, setting loading to true");
        setLoading(true);
        const currentUser = await getCurrentUser();
        console.log("getCurrentUser successful:", currentUser);
        setUser(currentUser);
        console.log("Auth context setting user:", currentUser);
      } catch (error) {
        console.log("getCurrentUser failed - response not ok");
        // Try auto-login if no session exists
        try {
          const response = await fetch('/api/auto-login', {
            method: 'POST',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("Auto-login successful:", data.user);
            setUser(data.user);
          } else {
            console.log("Auto-login failed");
            setUser(null);
          }
        } catch (autoLoginError) {
          console.log("Auto-login error:", autoLoginError);
          setUser(null);
        }
      } finally {
        console.log("Auth: Finally block - setting loading to false");
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const loggedInUser = await loginUser(username, password);
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
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
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
