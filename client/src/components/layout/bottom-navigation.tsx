import { useLocation, Link } from "wouter";
import { useModal } from "@/contexts/modal-context";
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
  Trophy
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function BottomNavigation() {
  const [location] = useLocation();
  const { openMomentModal, openConnectionModal, openPlanModal } = useModal();
  
  return (
    <>
      {/* Floating Add Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <button 
          onClick={() => openMomentModal('moment')}
          className="bg-primary text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

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
            <Link href="/calendar" className={`bottom-tab flex flex-col items-center justify-center h-full ${location === '/calendar' ? 'active' : ''}`}>
              <Calendar className="h-5 w-5" />
              <span className="text-xs mt-1">Calendar</span>
            </Link>
            <Link href="/activities" className={`bottom-tab flex flex-col items-center justify-center h-full ${location === '/activities' ? 'active' : ''}`}>
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">Activities</span>
            </Link>
            <Link href="/badges" className={`bottom-tab flex flex-col items-center justify-center h-full ${location === '/badges' ? 'active' : ''}`}>
              <Trophy className="h-5 w-5" />
              <span className="text-xs mt-1">Badges</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}