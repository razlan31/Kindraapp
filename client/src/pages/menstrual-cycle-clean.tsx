import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, subMonths, addMonths, startOfWeek, getDay, startOfDay } from "date-fns";
import { Calendar, Plus, Edit3, Trash2, Circle, ChevronLeft, ChevronRight, User, UserPlus, Camera, X, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MenstrualCycle, Connection } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { SimpleConnectionForm } from "@/components/modals/simple-connection-form";
import { compressImage } from "@/lib/image-utils";

const symptomsList = [
  "Cramps", "Bloating", "Headache", "Mood swings", "Fatigue", 
  "Breast tenderness", "Acne", "Food cravings", "Back pain", "Nausea"
];

const flowIntensityOptions = [
  { value: "light", label: "Light", color: "bg-pink-200" },
  { value: "medium", label: "Medium", color: "bg-pink-400" },
  { value: "heavy", label: "Heavy", color: "bg-pink-600" }
];

const moodOptions = [
  "Happy", "Sad", "Anxious", "Irritable", "Energetic", "Tired", "Emotional", "Calm"
];

export default function MenstrualCyclePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<MenstrualCycle | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>([]);
  const [cycleForPersonId, setCycleForPersonId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    periodEndDate: '',
    endDate: '',
    flowIntensity: '',
    mood: '',
    symptoms: [] as string[],
    notes: '',
    connectionId: null as number | null
  });

  // Connection handlers
  const openConnectionModal = () => setConnectionModalOpen(true);
  const closeConnectionModal = () => setConnectionModalOpen(false);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadedImage(null);
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setUploadedImage(compressedDataUrl);
    } catch (error) {
      console.error('Error compressing image:', error);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add connection mutation and handler
  const createConnectionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest('/api/connections', 'POST', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      setConnectionModalOpen(false);
      setUploadedImage(null);
      toast({
        title: "Connection added",
        description: "New connection has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating connection:', error);
      toast({
        title: "Error",
        description: "Failed to add connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddConnection = async (formData: FormData) => {
    await createConnectionMutation.mutateAsync(formData);
  };

  // Fetch data
  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ['/api/menstrual-cycles'],
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['/api/connections'],
  });

  const trackablePersons = useMemo(() => {
    if (!connections || !user) return [];
    
    return [
      { id: 0, name: user.displayName || user.username || 'You', isUser: true, profileImage: user.profileImageUrl },
      ...connections
        .filter(conn => !conn.isArchived)
        .map(conn => ({ 
          id: conn.id, 
          name: conn.name, 
          isUser: false, 
          profileImage: conn.profileImage 
        }))
    ];
  }, [connections, user]);

  const getPersonName = (connectionId: number | null) => {
    if (connectionId === null || connectionId === 0) return user?.displayName || user?.username || 'You';
    const person = trackablePersons.find(p => p.id === connectionId);
    return person?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20">
        <section className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/calendar')}
              >
                <Calendar className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Cycle Tracker</h1>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Cycle
            </Button>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Person Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedPersonIds.length === 0 
                        ? "All People" 
                        : selectedPersonIds.length === 1 
                          ? getPersonName(selectedPersonIds[0])
                          : `${selectedPersonIds.length} people selected`
                      }
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {trackablePersons.map((person) => (
                      <DropdownMenuCheckboxItem
                        key={person.id}
                        checked={selectedPersonIds.includes(person.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPersonIds([...selectedPersonIds, person.id]);
                          } else {
                            setSelectedPersonIds(selectedPersonIds.filter(id => id !== person.id));
                          }
                        }}
                      >
                        {person.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuItem onClick={openConnectionModal}>
                      <div className="flex items-center gap-2 text-blue-600">
                        <UserPlus className="h-4 w-4" />
                        Add New Connection
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>

            {cycles.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No cycles recorded yet.</p>
                  <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                    Add Your First Cycle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {cycles.map((cycle) => (
                  <Card key={cycle.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{getPersonName(cycle.connectionId)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(cycle.startDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {cycle.flowIntensity || 'Unknown'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Connection Modal */}
        <SimpleConnectionForm
          isOpen={connectionModalOpen}
          onClose={closeConnectionModal}
          onSubmit={handleAddConnection}
          uploadedImage={uploadedImage}
          onImageUpload={handleImageUpload}
        />
      </main>
    </div>
  );
}