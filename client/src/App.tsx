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
import DashboardSocial from "@/pages/dashboard-social";
import Connections from "@/pages/connections-simple";
import Activities from "@/pages/activities";
import ActivitiesSocial from "@/pages/activities-social";
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

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !["/login", "/", "/landing"].includes(location)) {
        // Redirect to landing page for non-authenticated users on protected routes
        setLocation("/");
      } else if (isAuthenticated && ["/login", "/", "/landing"].includes(location)) {
        // Redirect authenticated users to their preferred dashboard
        const savedDefaultPage = localStorage.getItem('kindra-default-page');
        if (savedDefaultPage && savedDefaultPage !== "home") {
          const routeMap: Record<string, string> = {
            "connections": "/connections",
            "activities": "/activities", 
            "calendar": "/calendar",
            "insights": "/insights"
          };
          const targetRoute = routeMap[savedDefaultPage] || "/dashboard";
          setLocation(targetRoute);
        } else {
          setLocation("/dashboard");
        }
      }
    }
  }, [isAuthenticated, loading, location, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/onboarding/welcome" component={OnboardingWelcome} />
      <Route path="/onboarding/profile" component={OnboardingProfile} />
      <Route path="/onboarding/goals" component={OnboardingGoals} />
      <Route path="/onboarding/complete" component={OnboardingComplete} />
      <Route path="/" component={LandingPage} />
      <Route path="/home" component={Homepage1} />
      <Route path="/dashboard" component={DashboardSocial} />
      <Route path="/connections" component={Connections} />
      <Route path="/connections/:id/edit" component={ConnectionEdit} />
      <Route path="/connections/:id" component={ConnectionDetail} />
      <Route path="/activities" component={ActivitiesSocial} />
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
