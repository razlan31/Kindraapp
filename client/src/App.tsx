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
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { RelationshipFocusProvider } from "./contexts/relationship-focus-context";
import { ModalProvider } from "./contexts/modal-context";
import { SyncProvider } from "./contexts/sync-context";
import { ThemeProvider } from "./contexts/theme-context";
import ModalsContainer from "./components/modals/modals-container";

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Remove debug logs
  
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Public routes */}
        <Route path="/" component={LandingPage} />
        <Route path="/login">
          {() => user ? <Homepage1 /> : <Login />}
        </Route>
        
        <Route path="/auth/login" component={Login} />
        <Route path="/home" component={user ? Homepage1 : Login} />
        <Route path="/dashboard" component={user ? Dashboard : Login} />
        <Route path="/connections" component={user ? Connections : Login} />
        <Route path="/activities" component={user ? Activities : Login} />
        <Route path="/calendar" component={user ? Calendar : Login} />
        <Route path="/insights" component={user ? Insights : Login} />
        <Route path="/settings" component={user ? Settings : Login} />
        <Route path="/menstrual-cycle" component={user ? MenstrualCycle : Login} />
        
        {/* Catch all route */}
        <Route path="*" component={user ? Homepage1 : Login} />
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