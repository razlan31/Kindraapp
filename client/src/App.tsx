import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
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
import Insights from "@/pages/insights";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import CycleTracking from "@/pages/cycle-tracking";
import MenstrualCycle from "@/pages/menstrual-cycle";
import AICoach from "@/pages/ai-coach";
import SummaryReport from "@/pages/summary-report";
import ConnectionDetail from "@/pages/connection-detail";
import ConnectionEdit from "@/pages/connection-edit";
import Badges from "@/pages/badges";
import { useAuth } from "./contexts/auth-context";
import { useModal } from "./contexts/modal-context";
import { RelationshipFocusProvider } from "./contexts/relationship-focus-context";
import { ModalProvider } from "./contexts/modal-context";
import { ThemeProvider } from "./contexts/theme-context";
import { MomentModal } from "./components/modals/simplified-moment-modal";

import { MoodTrackerModal } from "./components/modals/mood-tracker-modal";

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
      <Route path="/" component={Insights} />
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
      <Route path="/insights" component={Insights} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/cycle-tracking" component={CycleTracking} />
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
      <ThemeProvider>
        <RelationshipFocusProvider>
          <ModalProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <ModalsContainer />
            </TooltipProvider>
          </ModalProvider>
        </RelationshipFocusProvider>
      </ThemeProvider>
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
      <MoodTrackerModal 
        isOpen={moodTrackerModalOpen} 
        onClose={closeMoodTrackerModal}
        connection={selectedConnection}
      />

    </>
  );
}

export default App;
