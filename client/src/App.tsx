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

  // Redirect unauthenticated users trying to access app routes
  useEffect(() => {
    const isAppRoute = location.startsWith('/app');
    
    if (isAppRoute && !loading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [location, isAuthenticated, loading, setLocation]);

  // Show loading spinner during authentication state changes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes - serve landing page for root */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />

      {/* Onboarding routes */}
      <Route path="/onboarding/welcome" component={OnboardingWelcome} />
      <Route path="/onboarding/profile" component={OnboardingProfile} />
      <Route path="/onboarding/goals" component={OnboardingGoals} />
      <Route path="/onboarding/complete" component={OnboardingComplete} />
      
      {/* Protected app routes - all under /app to bypass service worker */}
      <Route path="/app" component={Homepage1} />
      <Route path="/app/dashboard" component={Dashboard} />
      <Route path="/app/connections" component={Connections} />
      <Route path="/app/connections/:id/edit" component={ConnectionEdit} />
      <Route path="/app/connections/:id" component={ConnectionDetail} />
      <Route path="/app/activities" component={Activities} />
      <Route path="/app/calendar" component={Calendar} />
      <Route path="/app/badges" component={Badges} />
      <Route path="/app/insights" component={Insights} />
      <Route path="/app/profile" component={Profile} />
      <Route path="/app/settings" component={Settings} />
      <Route path="/app/subscription" component={Subscription} />
      <Route path="/app/cycle" component={MenstrualCycle} />
      <Route path="/app/menstrual-cycle" component={MenstrualCycle} />
      
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
