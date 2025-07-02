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
import TestLandingPage from "@/pages/test-landing";
import DebugTest from "@/pages/debug-test";
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
import { PWAStatusIndicator } from "./components/ui/pwa-install-button";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    console.log("Router Debug - loading:", loading, "isAuthenticated:", isAuthenticated, "location:", location);
    
    if (!loading) {
      if (!isAuthenticated && !["/login", "/landing"].includes(location)) {
        console.log("Router: Redirecting unauthenticated user to /landing");
        setLocation("/landing");
      } else if (isAuthenticated && ["/login", "/landing"].includes(location)) {
        // Check for saved default page preference
        const savedDefaultPage = localStorage.getItem('kindra-default-page');
        if (savedDefaultPage && savedDefaultPage !== "home") {
          // Map setting values to actual routes
          const routeMap: Record<string, string> = {
            "connections": "/connections",
            "activities": "/activities", 
            "calendar": "/calendar",
            "insights": "/insights"
          };
          const targetRoute = routeMap[savedDefaultPage] || "/";
          console.log("Router: Redirecting authenticated user to:", targetRoute);
          setLocation(targetRoute);
        } else {
          console.log("Router: Redirecting authenticated user to home");
          setLocation("/");
        }
      }
    }
  }, [isAuthenticated, loading, location, setLocation]);

  console.log("Router: Rendering routes for location:", location);
  
  return (
    <Switch>
      <Route path="/landing">{() => { console.log("Landing route matched"); return <TestLandingPage />; }}</Route>
      <Route path="/login">{() => { console.log("Login route matched"); return <Login />; }}</Route>
      <Route path="/onboarding/welcome" component={OnboardingWelcome} />
      <Route path="/onboarding/profile" component={OnboardingProfile} />
      <Route path="/onboarding/goals" component={OnboardingGoals} />
      <Route path="/onboarding/complete" component={OnboardingComplete} />
      <Route path="/">{() => { console.log("Home route matched - showing debug test"); return <DebugTest />; }}</Route>
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
      <Route>{() => { console.log("NotFound route matched for:", location); return <NotFound />; }}</Route>
    </Switch>
  );
}

function App() {
  console.log("App component rendering");
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
                  <PWAStatusIndicator />
                  <div>
                    <h1 style={{color: 'red', padding: '20px'}}>DEBUG: App component is rendering</h1>
                    <Router />
                  </div>
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
