import { useLocation, Link } from "wouter";
import { useModal } from "@/contexts/modal-context";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Heart,
  Home, 
  LineChart, 
  Plus, 
  Users,
  MessageSquare,
  AlertTriangle,
  Lock,
  CalendarPlus,
  Trophy,
  UserPlus,
  Smile,
  X,
  Zap
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleConnectionForm } from "@/components/modals/simple-connection-form";
import { apiRequest } from "@/lib/queryClient";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openMomentModal, openPlanModal, setSelectedConnection } = useModal();
  
  // Local connection modal state
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Convert FormData to object for JSON request
      const connectionData: any = {};
      const entries = Array.from(formData.entries());
      for (const [key, value] of entries) {
        connectionData[key] = value;
      }
      return await apiRequest("/api/connections", "POST", connectionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Success",
        description: "Connection created successfully!",
      });
      setConnectionModalOpen(false);
      setUploadedImage(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create connection. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleConnectionSubmit = async (formData: FormData) => {
    await createConnectionMutation.mutateAsync(formData);
  };

  const handleActionClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };


  
  return (
    <>
      {/* Floating Action Menu - Positioned between connections and activities */}
      <div className="fixed top-[180px] right-1/2 translate-x-1/2 z-50">
        {/* Action Menu Items */}
        {isMenuOpen && (
          <div className="absolute bottom-20 right-0 flex flex-col items-end gap-3 animate-in slide-in-from-bottom-2 duration-200">
            <button 
              onClick={() => handleActionClick(() => setConnectionModalOpen(true))}
              className="bg-blue-500 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative group border-2 border-white dark:border-gray-800"
            >
              <UserPlus className="h-5 w-5" />
              <span className="absolute right-14 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Add Connection
              </span>
            </button>
            
            <button 
              onClick={() => handleActionClick(() => {
                console.log("🔥 FLOATING PLAN BUTTON - Clicked, opening plan modal with connection picker enabled");
                // Open plan modal with connection picker enabled - let user select connection
                openPlanModal();
              })}
              className="bg-purple-500 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative group border-2 border-white dark:border-gray-800"
            >
              <CalendarPlus className="h-5 w-5" />
              <span className="absolute right-14 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Add Plan
              </span>
            </button>
            
            <button 
              onClick={() => handleActionClick(() => openMomentModal('intimacy'))}
              className="bg-pink-500 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative group border-2 border-white dark:border-gray-800"
            >
              <Heart className="h-5 w-5" />
              <span className="absolute right-14 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Log Intimacy
              </span>
            </button>
            
            <button 
              onClick={() => handleActionClick(() => openMomentModal('conflict'))}
              className="bg-red-500 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 relative group"
            >
              <AlertTriangle className="h-5 w-5" />
              <span className="absolute right-14 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Log Conflict
              </span>
            </button>
            
            <button 
              onClick={() => handleActionClick(() => openMomentModal('moment'))}
              className="bg-green-500 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative group border-2 border-white dark:border-gray-800"
            >
              <Smile className="h-5 w-5" />
              <span className="absolute right-14 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Log Moment
              </span>
            </button>
          </div>
        )}
        
        {/* Main Toggle Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`bg-primary text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
            isMenuOpen ? 'rotate-45' : ''
          }`}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-50">
        <div className="max-w-md mx-auto px-4">
          <div className="grid grid-cols-4 h-16 items-center">
            <Link href="/" className={`bottom-tab flex flex-col items-center justify-center h-full ${location === '/' ? 'active' : ''}`}>
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link href="/connections" className={`bottom-tab flex flex-col items-center justify-center h-full ${location === '/connections' ? 'active' : ''}`}>
              <Users className="h-5 w-5" />
              <span className="text-xs mt-1">Connections</span>
            </Link>
            <Link href="/activities" className={`bottom-tab flex flex-col items-center justify-center h-full ${location === '/activities' ? 'active' : ''}`}>
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">Activities</span>
            </Link>
            <Link href="/calendar" className={`bottom-tab flex flex-col items-center justify-center h-full ${location === '/calendar' ? 'active' : ''}`}>
              <Calendar className="h-5 w-5" />
              <span className="text-xs mt-1">Calendar</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Connection Modal */}
      <SimpleConnectionForm
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        onSubmit={handleConnectionSubmit}
        uploadedImage={uploadedImage}
        onImageUpload={handleImageUpload}
      />
    </>
  );
}