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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    queryFn: async () => {
      // INVESTIGATION #4: Frontend cookie transmission failure
      console.log('🔍 INVESTIGATION #4: Auth context checking cookies:', document.cookie);
      console.log('🔍 INVESTIGATION #4: About to fetch /api/me with credentials: include');
      
      const response = await fetch('/api/me', {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('🔍 INVESTIGATION #4: /api/me response status:', response.status);
      console.log('🔍 INVESTIGATION #4: /api/me response headers:', Array.from(response.headers.entries()));
      
      if (!response.ok) {
        console.log('🔍 INVESTIGATION #4: Authentication failed - checking if cookies present');
        console.log('🔍 INVESTIGATION #4: Document cookies at failure time:', document.cookie);
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    }
  });

  useEffect(() => {
    if (currentUser && typeof currentUser === 'object' && currentUser.id) {
      setUser(currentUser);
    } else if (error) {
      setUser(null);
    } else if (!isLoading) {
      setUser(null);
    }
  }, [currentUser, error, isLoading]);

  // INVESTIGATION #8: Auth context refetch timing
  useEffect(() => {
    const handleAuthSuccess = () => {
      console.log('🔍 INVESTIGATION #8: Auth success detected, checking cookies before refetch');
      console.log('🔍 INVESTIGATION #8: Document cookies at auth success:', document.cookie);
      
      // Extended delay to ensure cookie is fully set
      setTimeout(() => {
        console.log('🔍 INVESTIGATION #8: About to refetch after auth success');
        console.log('🔍 INVESTIGATION #8: Document cookies before refetch:', document.cookie);
        refetch();
      }, 1000); // Increased delay from 500ms to 1000ms
    };

    // Check for auth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      handleAuthSuccess();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetch]);

  const refreshUser = () => {
    refetch();
  };

  const logout = () => {
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
    user: currentUser || null,
    loading: isLoading,
    isAuthenticated: !!(currentUser && currentUser.id),
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