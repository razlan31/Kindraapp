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
    staleTime: 0,
    cacheTime: 0,
    queryFn: async () => {
      console.log('Auth context: Making /api/me request');
      console.log('Auth context: Document cookies:', document.cookie);
      const response = await fetch('/api/me', {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Auth context: /api/me response', response.status, response.statusText);
      console.log('Auth context: Response headers:', Object.fromEntries(response.headers.entries()));
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Auth context: User data received', data.email || 'no email');
      return data;
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

  // Listen for authentication success and refresh user data
  useEffect(() => {
    const handleAuthSuccess = () => {
      console.log('Auth context: Authentication success detected, refreshing user data');
      // Force immediate refetch with delay to ensure cookie is set
      setTimeout(() => {
        refetch();
      }, 500); // Increased delay to ensure cookie accessibility
    };

    // Check for auth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      handleAuthSuccess();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetch]);

  // Debug logging
  useEffect(() => {
    console.log('Auth context: Debug state', {
      currentUser: currentUser ? 'loaded' : 'null',
      isLoading,
      error: error ? error.message : 'none',
      user: user ? user.email : 'null'
    });
  }, [currentUser, isLoading, error, user]);

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