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
  CalendarPlus
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function BottomNavigation() {
  const [location] = useLocation();
  const { openMomentModal, openConnectionModal, openPlanModal } = useModal();
  
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="bg-primary text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <Plus className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="mb-2">
                <DropdownMenuItem onClick={() => openMomentModal('moment')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Moment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openMomentModal('conflict')}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Add Conflict
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openMomentModal('intimacy')}>
                  <Lock className="h-4 w-4 mr-2" />
                  Add Intimacy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openPlanModal()}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
