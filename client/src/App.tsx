import { Switch, Route } from "wouter";

// TRACKING: App.tsx initialization
console.log('🔍 TRACKING: App.tsx loaded at', new Date().toISOString());
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LogoutPage from "@/pages/logout-page";
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
  console.log("🚨🚨🚨 ROUTER FUNCTION EXECUTING");
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();
  
  console.log("🚨🚨🚨 ROUTER: Got auth context", { isAuthenticated, loading });

  // Synchronize Wouter location with browser location to prevent state mismatches
  useEffect(() => {
    const browserPath = window.location.pathname;
    if (location !== browserPath) {
      console.log('🔄 Router sync:', { wouter: location, browser: browserPath });
      setLocation(browserPath);
    }
  }, [location, setLocation]);

  // Enhanced debug logging to track routing issues
  useEffect(() => {
    console.log('🚨🚨🚨 ROUTER STATE:', { location, isAuthenticated, loading });
    console.log('🚨🚨🚨 CURRENT URL PATH:', window.location.pathname);
  }, [location, isAuthenticated, loading]);

  // Redirect unauthenticated users trying to access protected routes
  useEffect(() => {
    // Skip redirect logic for public pages during logout transition
    const publicPages = ['/', '/login', '/landing'];
    if (publicPages.includes(location)) {
      return; // Don't redirect public pages
    }
    
    const protectedRoutes = ['/app', '/dashboard', '/connections', '/activities', '/calendar', '/badges', '/insights', '/profile', '/settings', '/subscription', '/cycle', '/menstrual-cycle'];
    const isProtectedRoute = protectedRoutes.some(route => location.startsWith(route));
    
    if (isProtectedRoute && !loading && !isAuthenticated) {
      console.log('Redirecting to login from protected route:', location);
      setLocation('/login');
    }
  }, [location, isAuthenticated, loading, setLocation]);

  // Public pages that should always render without auth checks
  const publicPages = ['/', '/login', '/landing'];
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
  // This prevents 404s during logout transitions
  if (location === '/logout') {
    return <LogoutPage />;
  }
  
  if (location === '/login') {
    console.log('🚨🚨🚨 RENDERING LOGIN PAGE DIRECTLY');
    return <Login />;
  }
  
  if (location === '/landing') {
    console.log('🚨🚨🚨 RENDERING LANDING PAGE DIRECTLY');
    return <LandingPage />;
  }

  // Force landing page for unauthenticated users on root path
  if (location === '/' && !isAuthenticated && !loading) {
    console.log('🚨🚨🚨 RENDERING LANDING PAGE FOR UNAUTHENTICATED ROOT');
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
      <Route path="/activities">
        {() => {
          console.log("🚨🚨🚨 ACTIVITIES ROUTE MATCHED - RENDERING COMPONENT");
          return <Activities />;
        }}
      </Route>
      <Route path="/calendar" component={Calendar} />
      <Route path="/badges" component={Badges} />
      <Route path="/insights" component={Insights} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/cycle" component={MenstrualCycle} />
      <Route path="/menstrual-cycle" component={MenstrualCycle} />
      
      {/* Explicit 404 route instead of catch-all to prevent logout conflicts */}
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log("🚨🚨🚨 APP COMPONENT RENDERING - TIMESTAMP:", new Date().toISOString());
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
                  {(() => {
                    console.log("🚨🚨🚨 ABOUT TO RENDER ROUTER COMPONENT");
                    return <Router />;
                  })()}
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
