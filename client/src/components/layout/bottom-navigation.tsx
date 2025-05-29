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
              <DropdownMenuContent 
                align="center" 
                side="top" 
                className="mb-4 w-48 shadow-xl border-2 border-primary/20 bg-white dark:bg-neutral-800"
                sideOffset={8}
              >
                <DropdownMenuItem 
                  onClick={() => openMomentModal('moment')}
                  className="py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                      <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Add Moment</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openMomentModal('conflict')}
                  className="py-3 px-4 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 mr-3">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Add Conflict</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openMomentModal('intimacy')}
                  className="py-3 px-4 hover:bg-pink-50 dark:hover:bg-pink-900/20 focus:bg-pink-50 dark:focus:bg-pink-900/20 cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/30 mr-3">
                      <Lock className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Add Intimacy</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openPlanModal()}
                  className="py-3 px-4 hover:bg-green-50 dark:hover:bg-green-900/20 focus:bg-green-50 dark:focus:bg-green-900/20 cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
                      <CalendarPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Add Plan</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
  );
}
