import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Connections from "@/pages/connections-simple";
import Activities from "@/pages/activities";
import Calendar from "@/pages/calendar";
import Homepage1 from "@/pages/homepage-1";
import LandingPage from "@/pages/landing";
import Insights from "@/pages/insights-original";
import Settings from "@/pages/settings";
import MenstrualCycle from "@/pages/menstrual-cycle";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import OnboardingWelcome from "@/pages/onboarding/welcome";
import OnboardingProfile from "@/pages/onboarding/profile";
import OnboardingGoals from "@/pages/onboarding/goals";
import OnboardingComplete from "@/pages/onboarding/complete";

// Removed OnboardingRouter to eliminate duplicate routing
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { RelationshipFocusProvider } from "./contexts/relationship-focus-context";
import { ModalProvider } from "./contexts/modal-context";
import { SyncProvider } from "./contexts/sync-context";
import { ThemeProvider } from "./contexts/theme-context";
import ModalsContainer from "./components/modals/modals-container";

function AppRoutes() {
  const { user, isLoading } = useAuth();
  
  console.log('App: Routing decision', { user: user ? user.email : 'null', isLoading });
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Check if user needs onboarding
  const needsOnboarding = user && !user.displayName;

  // Render different app sections based on authentication state
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/app" component={LandingPage} />
          <Route path="/login" component={Login} />
          <Route path="/auth/login" component={Login} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route component={LandingPage} />
        </Switch>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/" component={OnboardingWelcome} />
          <Route path="/onboarding/welcome" component={OnboardingWelcome} />
          <Route path="/onboarding/profile" component={OnboardingProfile} />
          <Route path="/onboarding/goals" component={OnboardingGoals} />
          <Route path="/onboarding/complete" component={OnboardingComplete} />
          <Route component={OnboardingWelcome} />
        </Switch>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/" component={Homepage1} />
        <Route path="/home" component={Homepage1} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/connections" component={Connections} />
        <Route path="/activities" component={Activities} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/insights" component={Insights} />
        <Route path="/settings" component={Settings} />
        <Route path="/menstrual-cycle" component={MenstrualCycle} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route component={NotFound} />
      </Switch>
      
      <ModalsContainer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <RelationshipFocusProvider>
            <SyncProvider>
              <ModalProvider>
                <TooltipProvider>
                  <AppRoutes />
                  <Toaster />
                </TooltipProvider>
              </ModalProvider>
            </SyncProvider>
          </RelationshipFocusProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}