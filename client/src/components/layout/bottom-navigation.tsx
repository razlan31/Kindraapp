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
    <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-40">
      <div className="grid grid-cols-5 h-16">
        <Link href="/" className={`bottom-tab flex flex-col items-center justify-center ${location === '/' ? 'active' : ''}`}>
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link href="/connections" className={`bottom-tab flex flex-col items-center justify-center ${location === '/connections' ? 'active' : ''}`}>
          <Users className="h-5 w-5" />
          <span className="text-xs mt-1">Connections</span>
        </Link>
        <button 
          onClick={() => openMomentModal()}
          className="bottom-tab flex flex-col items-center justify-center bg-primary text-white rounded-full h-12 w-12 -mt-5 mx-auto shadow-md"
        >
          <Plus className="h-5 w-5" />
        </button>
        <Link href="/calendar" className={`bottom-tab flex flex-col items-center justify-center ${location === '/calendar' ? 'active' : ''}`}>
          <Calendar className="h-5 w-5" />
          <span className="text-xs mt-1">Calendar</span>
        </Link>
        <Link href="/activities" className={`bottom-tab flex flex-col items-center justify-center ${location === '/activities' ? 'active' : ''}`}>
          <Heart className="h-5 w-5" />
          <span className="text-xs mt-1">Activities</span>
        </Link>
      </div>
    </nav>
  );
}
