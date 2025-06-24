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
import ConnectionsNew from "@/pages/connections-new";
import ConnectionsFormNew from "./pages/connections-form-new";
import SimpleConnectionForm from "./pages/simple-connection-form";
import BasicConnectionForm from "./pages/basic-connection-form";
import SimpleConnectionCreate from "./pages/simple-connection-create";
import SimpleForm from "./pages/simple-form";
import Activities from "@/pages/activities";
import Calendar from "@/pages/calendar";
import Homepage1 from "@/pages/homepage-1";

import Luna from "@/pages/luna";
import Trackings from "@/pages/trackings";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";


import MenstrualCycle from "@/pages/menstrual-cycle";
import AICoach from "@/pages/ai-coach";
import SummaryReport from "@/pages/summary-report";
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
import { MessageCircle } from "lucide-react";

import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && location !== "/login") {
        console.log("Redirecting to login page - user not authenticated");
        setLocation("/login");
      } else if (isAuthenticated && location === "/login") {
        console.log("Redirecting to home page - user is authenticated");
        setLocation("/");
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
      <Route path="/" component={Homepage1} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/connections" component={Connections} />
      <Route path="/connections/add" component={ConnectionsFormNew} />
      <Route path="/connections/simple" component={SimpleConnectionForm} />
      <Route path="/connections/basic" component={BasicConnectionForm} />
      <Route path="/connections/test" component={SimpleConnectionCreate} />
      <Route path="/connections/bulletproof" component={SimpleForm} />
      <Route path="/connections/:id/edit" component={ConnectionEdit} />
      <Route path="/connections/:id" component={ConnectionDetail} />
      <Route path="/activities" component={Activities} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/badges" component={Badges} />
      <Route path="/insights" component={Homepage1} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />

      <Route path="/cycle" component={MenstrualCycle} />
      <Route path="/cycle-tracking" component={MenstrualCycle} />
      <Route path="/menstrual-cycle" component={MenstrualCycle} />
      <Route path="/ai-coach" component={AICoach} />
      <Route path="/summary-report" component={SummaryReport} />
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
                  <FloatingAIButton />
                </TooltipProvider>
              </ModalProvider>
            </SyncProvider>
          </RelationshipFocusProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function FloatingAIButton() {
  const [location, navigate] = useLocation();
  
  // Only show on certain pages
  if (location === '/ai-coach') {
    return null;
  }
  
  return (
    <button
      onClick={() => navigate('/ai-coach')}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
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
