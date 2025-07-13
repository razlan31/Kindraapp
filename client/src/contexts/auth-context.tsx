import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  displayName?: string;
  zodiacSign?: string;
  loveLanguage?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const { data: currentUser, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/me'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const response = await fetch('/api/me', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    }
  });

  useEffect(() => {
    console.log('Auth context: Effect triggered', { currentUser, error, isLoading });
    if (currentUser && typeof currentUser === 'object' && currentUser.id) {
      console.log('Auth context: User loaded successfully:', currentUser.email);
      setUser(currentUser);
    } else if (error) {
      console.log('Auth context: No user found or error:', error);
      setUser(null);
    } else if (!isLoading) {
      console.log('Auth context: No user data and not loading');
      setUser(null);
    }
  }, [currentUser, error, isLoading]);

  const refreshUser = () => {
    console.log('Auth context: Refreshing user data');
    refetch();
  };

  const logout = () => {
    console.log('Auth context: Logging out user');
    setUser(null);
    
    // Call logout endpoint
    fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    }).then(() => {
      // Redirect to landing page
      window.location.href = '/';
    });
  };

  const value: AuthContextType = {
    user,
    loading: isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}