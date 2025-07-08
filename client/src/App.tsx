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

  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Public routes */}
        <Route path="/" component={LandingPage} />
        <Route path="/login">
          {() => user ? <Homepage1 /> : <Login />}
        </Route>
        <Route path="/auth/login">
          {() => user ? <Homepage1 /> : <Login />}
        </Route>
        
        {/* Protected routes */}
        {user ? (
          <>
            <Route path="/home" component={Homepage1} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/connections" component={Connections} />
            <Route path="/activities" component={Activities} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/insights" component={Insights} />
            <Route path="/settings" component={Settings} />
            <Route path="/menstrual-cycle" component={MenstrualCycle} />
            
            {/* Default authenticated route */}
            <Route path="*">
              {(params) => {
                const path = params.path;
                if (path && path.startsWith('/')) {
                  return <NotFound />;
                }
                return <Homepage1 />;
              }}
            </Route>
          </>
        ) : (
          /* Redirect all other routes to login when not authenticated */
          <Route path="*" component={Login} />
        )}
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