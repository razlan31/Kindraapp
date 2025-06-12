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
import InsightsNew from "@/pages/insights-new";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import CycleTracking from "@/pages/cycle-tracking";
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
import { MomentModal } from "./components/modals/simplified-moment-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X } from "lucide-react";
import { MoodTrackerModal } from "./components/modals/mood-tracker-modal";
import { BadgeNotificationMonitor } from "./components/BadgeNotificationMonitor";

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";

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
      <Route path="/" component={InsightsNew} />
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
      <Route path="/insights" component={InsightsNew} />
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
      <AuthProvider>
        <ThemeProvider>
          <RelationshipFocusProvider>
            <ModalProvider>
              <TooltipProvider>
                <Toaster />
                <BadgeNotificationMonitor />
                <Router />
                <ModalsContainer />
              </TooltipProvider>
            </ModalProvider>
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
    connectionModalOpen,
    closeConnectionModal,
    selectedConnection 
  } = useModal();

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { mutate: createConnection, isPending } = useMutation({
    mutationFn: async (formData: FormData) => {
      const data = {
        name: formData.get('name') as string,
        relationshipStage: formData.get('relationshipStage') as string,
        startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : null,
        birthday: formData.get('birthday') ? new Date(formData.get('birthday') as string) : null,
        zodiacSign: formData.get('zodiacSign') as string || null,
        loveLanguage: formData.get('loveLanguage') as string || null,
        profileImage: uploadedImage,
        isPrivate: formData.get('isPrivate') === 'on',
      };

      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create connection');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      setUploadedImage(null);
      closeConnectionModal();
    },
    onError: (error: any) => {
      console.error('Failed to create connection:', error);
    },
  });
  
  return (
    <>
      <MomentModal />
      
      {/* Connection Modal with Avatar Photo Upload */}
      <Dialog open={connectionModalOpen} onOpenChange={closeConnectionModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto mb-20">
          <DialogHeader>
            <DialogTitle>Add New Connection</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createConnection(formData);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={uploadedImage || undefined} />
                    <AvatarFallback className="text-lg">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Photo from Device
                  </label>
                  {uploadedImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedImage(null)}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input
                  name="name"
                  required
                  placeholder="Enter name"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Relationship Stage
                </label>
                <select
                  name="relationshipStage"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                >
                  <option value="Potential">Potential</option>
                  <option value="Talking">Talking</option>
                  <option value="Situationship">Situationship</option>
                  <option value="It's Complicated">It's Complicated</option>
                  <option value="Dating">Dating</option>
                  <option value="Spouse">Spouse</option>
                  <option value="FWB">FWB</option>
                  <option value="Ex">Ex</option>
                  <option value="Friend">Friend</option>
                  <option value="Best Friend">Best Friend</option>
                  <option value="Siblings">Siblings</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  name="startDate"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Birthday
                </label>
                <Input
                  type="date"
                  name="birthday"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Zodiac Sign
                </label>
                <select
                  name="zodiacSign"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                >
                  <option value="">Select zodiac sign</option>
                  <option value="Aries">Aries</option>
                  <option value="Taurus">Taurus</option>
                  <option value="Gemini">Gemini</option>
                  <option value="Cancer">Cancer</option>
                  <option value="Leo">Leo</option>
                  <option value="Virgo">Virgo</option>
                  <option value="Libra">Libra</option>
                  <option value="Scorpio">Scorpio</option>
                  <option value="Sagittarius">Sagittarius</option>
                  <option value="Capricorn">Capricorn</option>
                  <option value="Aquarius">Aquarius</option>
                  <option value="Pisces">Pisces</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Love Language
                </label>
                <select
                  name="loveLanguage"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                >
                  <option value="">Select love language</option>
                  <option value="Words of Affirmation">Words of Affirmation</option>
                  <option value="Quality Time">Quality Time</option>
                  <option value="Physical Touch">Physical Touch</option>
                  <option value="Acts of Service">Acts of Service</option>
                  <option value="Receiving Gifts">Receiving Gifts</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isPrivate"
                  id="isPrivate"
                  className="rounded"
                />
                <label htmlFor="isPrivate" className="text-sm">
                  Keep this connection private
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeConnectionModal} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Adding..." : "Add Connection"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MoodTrackerModal 
        isOpen={moodTrackerModalOpen} 
        onClose={closeMoodTrackerModal}
        connection={selectedConnection}
      />

    </>
  );
}

export default App;
