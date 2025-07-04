import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import OnboardingWelcome from "@/pages/onboarding/welcome";
import OnboardingProfile from "@/pages/onboarding/profile";
import OnboardingGoals from "@/pages/onboarding/goals";
import OnboardingComplete from "@/pages/onboarding/complete";
import Dashboard from "@/pages/dashboard";
import Connections from "@/pages/connections-simple";
import Activities from "@/pages/activities";
import Calendar from "@/pages/calendar";
import Homepage1 from "@/pages/homepage-1";
import LandingPage from "@/pages/landing";
import LandingMinimal from "@/pages/landing-minimal";
import Insights from "@/pages/insights-original";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Subscription from "@/pages/subscription";
import MenstrualCycle from "@/pages/menstrual-cycle";
import ConnectionDetail from "@/pages/connection-detail";
import ConnectionEdit from "@/pages/connection-edit";
import Badges from "@/pages/badges";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { useModal } from "./contexts/modal-context";
import { RelationshipFocusProvider } from "./contexts/relationship-focus-context";
import { ModalProvider } from "./contexts/modal-context";
import { ThemeProvider } from "./contexts/theme-context";
import { SyncProvider } from "./contexts/sync-context";
import { MomentModal } from "./components/modals/simplified-moment-modal";
import { PlanModal } from "./components/modals/plan-modal";
import { MoodTrackerModal } from "./components/modals/mood-tracker-modal";
import { BadgeNotificationMonitor } from "./components/BadgeNotificationMonitor";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('🔍 Router state:', { location, isAuthenticated, loading, pathname: window.location.pathname });
  }, [location, isAuthenticated, loading]);

  // Redirect unauthenticated users trying to access protected routes
  useEffect(() => {
    const protectedRoutes = ['/app', '/dashboard', '/connections', '/activities', '/calendar', '/badges', '/insights', '/profile', '/settings', '/subscription', '/cycle', '/menstrual-cycle'];
    const isProtectedRoute = protectedRoutes.some(route => location.startsWith(route));
    
    if (isProtectedRoute && !loading && !isAuthenticated) {
      console.log('Redirecting to login from protected route:', location);
      setLocation('/login');
    }
  }, [location, isAuthenticated, loading, setLocation]);

  // Public pages that should always render without auth checks
  const publicPages = ['/', '/login', '/landing', '/landing-minimal'];
  const isPublicPage = publicPages.includes(location);
  
  // Only show loading for authenticated protected routes
  if (loading && !isPublicPage && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Handle public routes immediately without auth state complications
  if (location === '/login') {
    return <Login />;
  }
  
  if (location === '/landing') {
    return <LandingPage />;
  }

  // Force landing page for unauthenticated users on root path
  if (location === '/' && !isAuthenticated && !loading) {
    return <LandingPage />;
  }

  return (
    <Switch>
      {/* Public routes - Direct rendering to avoid component resolution issues */}
      <Route path="/" component={LandingPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/login" component={Login} />

      {/* Onboarding routes */}
      <Route path="/onboarding/welcome" component={OnboardingWelcome} />
      <Route path="/onboarding/profile" component={OnboardingProfile} />
      <Route path="/onboarding/goals" component={OnboardingGoals} />
      <Route path="/onboarding/complete" component={OnboardingComplete} />
      
      {/* App routes */}
      <Route path="/app" component={Homepage1} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/connections" component={Connections} />
      <Route path="/connections/:id/edit" component={ConnectionEdit} />
      <Route path="/connections/:id" component={ConnectionDetail} />
      <Route path="/activities" component={Activities} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/badges" component={Badges} />
      <Route path="/insights" component={Insights} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/cycle" component={MenstrualCycle} />
      <Route path="/menstrual-cycle" component={MenstrualCycle} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Normal app initialization without forced redirects

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
                  <Router />
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



function ModalsContainer() {
  const { 
    moodTrackerModalOpen, 
    closeMoodTrackerModal,
    planModalOpen,
    closePlanModal,
    selectedConnection,
    selectedDate
  } = useModal();
  
  return (
    <>
      <MomentModal />
      <MoodTrackerModal 
        isOpen={moodTrackerModalOpen} 
        onClose={closeMoodTrackerModal}
        connection={selectedConnection}
      />
      <PlanModal
        isOpen={planModalOpen}
        onClose={closePlanModal}
        selectedConnection={selectedConnection}
        selectedDate={selectedDate}
      />
    </>
  );
}

export default App;
