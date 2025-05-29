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

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { openMomentModal, openPlanModal } = useModal();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleActionClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  // Create connection mutation
  const { mutate: createConnection, isPending } = useMutation({
    mutationFn: async (data: any) => {
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
      setShowConnectionModal(false);
      toast({
        title: "Connection created",
        description: "New connection has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create connection.",
        variant: "destructive",
      });
    },
  });

  const handleAddConnection = (formData: FormData) => {
    const data = {
      name: formData.get('name') as string,
      relationshipStage: formData.get('relationshipStage') as string,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : null,
      birthday: formData.get('birthday') ? new Date(formData.get('birthday') as string) : null,
      zodiacSign: formData.get('zodiacSign') as string || null,
      loveLanguage: formData.get('loveLanguage') as string || null,
      profileImage: null,
      isPrivate: formData.get('isPrivate') === 'on',
    };

    createConnection(data);
  };
  
  return (
    <>
      {/* Floating Action Menu */}
      <div className="fixed bottom-20 right-4 z-50">
        {/* Action Menu Items */}
        {isMenuOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2 animate-in slide-in-from-bottom-2 duration-200">
            <button 
              onClick={() => handleActionClick(() => setShowConnectionModal(true))}
              className="bg-blue-500 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 relative group"
            >
              <UserPlus className="h-5 w-5" />
              <span className="absolute right-14 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Add Connection
              </span>
            </button>
            
            <button 
              onClick={() => handleActionClick(() => openPlanModal())}
              className="bg-purple-500 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 relative group"
            >
              <CalendarPlus className="h-5 w-5" />
              <span className="absolute right-14 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Add Plan
              </span>
            </button>
            
            <button 
              onClick={() => handleActionClick(() => openMomentModal('intimacy'))}
              className="bg-pink-500 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 relative group"
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
              className="bg-green-500 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 relative group"
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

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Connection</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConnectionModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleAddConnection(formData);
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="name">Name (Required)</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="relationshipStage">Relationship Stage (Required)</Label>
                  <Select name="relationshipStage" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Potential">Potential</SelectItem>
                      <SelectItem value="Talking">Talking</SelectItem>
                      <SelectItem value="Situationship">Situationship</SelectItem>
                      <SelectItem value="It's Complicated">It's Complicated</SelectItem>
                      <SelectItem value="Dating">Dating</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="FWB">FWB</SelectItem>
                      <SelectItem value="Ex">Ex</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Best Friend">Best Friend</SelectItem>
                      <SelectItem value="Siblings">Siblings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                  />
                </div>
                
                <div>
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    name="birthday"
                    type="date"
                  />
                </div>
                
                <div>
                  <Label htmlFor="zodiacSign">Zodiac Sign</Label>
                  <Select name="zodiacSign">
                    <SelectTrigger>
                      <SelectValue placeholder="Select zodiac sign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aries">Aries</SelectItem>
                      <SelectItem value="Taurus">Taurus</SelectItem>
                      <SelectItem value="Gemini">Gemini</SelectItem>
                      <SelectItem value="Cancer">Cancer</SelectItem>
                      <SelectItem value="Leo">Leo</SelectItem>
                      <SelectItem value="Virgo">Virgo</SelectItem>
                      <SelectItem value="Libra">Libra</SelectItem>
                      <SelectItem value="Scorpio">Scorpio</SelectItem>
                      <SelectItem value="Sagittarius">Sagittarius</SelectItem>
                      <SelectItem value="Capricorn">Capricorn</SelectItem>
                      <SelectItem value="Aquarius">Aquarius</SelectItem>
                      <SelectItem value="Pisces">Pisces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="loveLanguage">Love Language</Label>
                  <Select name="loveLanguage">
                    <SelectTrigger>
                      <SelectValue placeholder="Select love language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Words of Affirmation">Words of Affirmation</SelectItem>
                      <SelectItem value="Quality Time">Quality Time</SelectItem>
                      <SelectItem value="Physical Touch">Physical Touch</SelectItem>
                      <SelectItem value="Acts of Service">Acts of Service</SelectItem>
                      <SelectItem value="Receiving Gifts">Receiving Gifts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isPrivate" 
                    name="isPrivate" 
                    className="rounded"
                  />
                  <Label htmlFor="isPrivate">Private connection</Label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowConnectionModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending ? "Adding..." : "Add Connection"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}