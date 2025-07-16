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
    refetchInterval: false, // Disable automatic refetching
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnReconnect: false, // Disable refetch on reconnect
    queryFn: async () => {
      console.log('🔍 AUTH: Checking authentication status...');
      
      // INVESTIGATION #39: React app authentication context initialization race condition
      console.log('🔍 INVESTIGATION #39: Enhanced auth context initialization with race condition prevention');
      console.log('🔍 Document.cookie:', document.cookie);
      console.log('🔍 Has session cookie:', document.cookie.includes('connect.sid'));
      
      // INVESTIGATION #39: Check if we need to wait for OAuth callback to complete
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'success') {
        console.log('🔍 INVESTIGATION #39: OAuth callback detected, waiting for session cookie propagation');
        // Wait for session cookie to be available after OAuth redirect
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('🔍 INVESTIGATION #39: Post-OAuth wait complete, document.cookie:', document.cookie);
      }
      
      const response = await fetch('/api/me', {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('🔍 AUTH: Response status:', response.status);
      
      // Check for session renewal
      if (response.headers.get('X-Session-Renewed') === 'true') {
        console.log('🧹 AUTH: Session renewed, expired cookies cleared');
        // Session was renewed, but we're still not authenticated
        // This means the expired cookie was cleared and we need to authenticate
        throw new Error('Session renewed - authentication required');
      }
      
      if (!response.ok) {
        console.log('🔍 AUTH: Not authenticated, status:', response.status);
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🔍 AUTH: Authentication successful for user:', data.email);
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

  // OAuth callback success handling
  useEffect(() => {
    const handleAuthSuccess = () => {
      console.log('🔐 OAuth authentication successful, refreshing user data...');
      
      // INVESTIGATION #4: Check if session cookie is now available after OAuth
      console.log('🔍 INVESTIGATION #4: Post-OAuth cookie check');
      console.log('🔍 Document.cookie after OAuth:', document.cookie);
      console.log('🔍 Session cookie available:', document.cookie.includes('connect.sid'));
      
      // INVESTIGATION #33: React app cookie reading timing issues
      // Allow time for session cookie to be set before refetching
      setTimeout(() => {
        console.log('🔍 INVESTIGATION #33: About to refetch auth after OAuth with timing fix');
        console.log('🔍 INVESTIGATION #33: Final cookie check:', document.cookie);
        refetch();
      }, 500); // Reduced timeout for faster response
    };

    // Check for auth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      console.log('🔍 INVESTIGATION #4: OAuth callback detected, checking for session cookie');
      
      // Check if session cookie is now available
      const hasCookie = document.cookie.includes('connect.sid');
      console.log('🔍 Session cookie available after OAuth:', hasCookie);
      
      if (hasCookie) {
        console.log('✅ Session cookie found, proceeding with authentication');
        handleAuthSuccess();
      } else {
        console.log('❌ Session cookie not found, waiting and retrying...');
        // Wait a moment and check again
        setTimeout(() => {
          const hasDelayedCookie = document.cookie.includes('connect.sid');
          console.log('🔍 Session cookie available after delay:', hasDelayedCookie);
          handleAuthSuccess();
        }, 500);
      }
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