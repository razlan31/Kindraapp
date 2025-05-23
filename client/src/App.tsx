import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import Connections from "@/pages/connections";
import Moments from "@/pages/moments";
import Insights from "@/pages/insights";
import Profile from "@/pages/profile";
import CycleTracking from "@/pages/cycle-tracking";
import AICoach from "@/pages/ai-coach";
import SummaryReport from "@/pages/summary-report";
import { useAuth } from "./contexts/auth-context";
import { useModal } from "./contexts/modal-context";
import { MomentModal } from "./components/modals/moment-modal";
import { ConnectionModal } from "./components/modals/connection-modal";
import { MoodTrackerModal } from "./components/modals/mood-tracker-modal";
import { QuickMoodButton } from "./components/layout/quick-mood-button";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated && !location.startsWith("/auth")) {
      setLocation("/auth/login");
    }
  }, [isAuthenticated, loading, location, setLocation]);

  return (
    <Switch>
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/" component={Dashboard} />
      <Route path="/connections" component={Connections} />
      <Route path="/moments" component={Moments} />
      <Route path="/insights" component={Insights} />
      <Route path="/profile" component={Profile} />
      <Route path="/cycle-tracking" component={CycleTracking} />
      <Route path="/ai-coach" component={AICoach} />
      <Route path="/summary-report" component={SummaryReport} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <ModalsContainer />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function ModalsContainer() {
  const { 
    moodTrackerModalOpen, 
    closeMoodTrackerModal,
    selectedConnection 
  } = useModal();
  
  return (
    <>
      <MomentModal />
      <ConnectionModal />
      <MoodTrackerModal 
        isOpen={moodTrackerModalOpen} 
        onClose={closeMoodTrackerModal}
        connection={selectedConnection}
      />
      <QuickMoodButton />
    </>
  );
}

export default App;
