import { useState } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./contexts/auth-context";
import { ThemeProvider } from "./contexts/theme-context";
import { RelationshipFocusProvider } from "./contexts/relationship-focus-context";
import { SyncProvider } from "./contexts/sync-context";
import { ModalProvider } from "./contexts/modal-context";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import { BadgeNotificationMonitor } from "./components/BadgeNotificationMonitor";
import { ModalsContainer } from "./components/ModalsContainer";

// Import all components
import LandingPage from "./pages/landing";
import Login from "./pages/login";
import Homepage1 from "./pages/homepage-1";
import Dashboard from "./pages/dashboard";
import Activities from "./pages/activities";
import Calendar from "./pages/calendar";
import Insights from "./pages/insights";
import { useAuth } from "./contexts/auth-context";

type AppState = 'landing' | 'login' | 'app';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>('landing');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // State management instead of routing
  const handleNavigation = (newState: AppState) => {
    setAppState(newState);
  };

  // Render based on state instead of routes
  switch (appState) {
    case 'landing':
      return <LandingPage onNavigate={() => handleNavigation('login')} />;
    case 'login':
      return <Login onNavigate={() => handleNavigation('app')} />;
    case 'app':
      return isAuthenticated ? <Homepage1 /> : <Login onNavigate={() => handleNavigation('app')} />;
    default:
      return <LandingPage onNavigate={() => handleNavigation('login')} />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <RelationshipFocusProvider>
            <SyncProvider>
              <ModalProvider>
                <TooltipProvider>
                  <Toaster />
                  <BadgeNotificationMonitor />
                  <AppContent />
                  <ModalsContainer />
                </TooltipProvider>
              </ModalProvider>
            </SyncProvider>
          </RelationshipFocusProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;