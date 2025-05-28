import { useLocation, Link } from "wouter";
import { useModal } from "@/contexts/modal-context";
import { 
  Calendar, 
  Heart,
  Home, 
  LineChart, 
  Plus, 
  Users 
} from "lucide-react";

export function BottomNavigation() {
  const [location] = useLocation();
  const { openMomentModal, openConnectionModal } = useModal();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="grid grid-cols-5 h-16 items-center">
          <Link href="/" className={`bottom-tab flex flex-col items-center justify-center h-full ${location === '/' ? 'active' : ''}`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/connections" className={`bottom-tab flex flex-col items-center justify-center h-full ${location === '/connections' ? 'active' : ''}`}>
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Connections</span>
          </Link>
          <div className="flex justify-center">
            <button 
              onClick={() => openMomentModal()}
              className="bg-primary text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
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
  );
}
