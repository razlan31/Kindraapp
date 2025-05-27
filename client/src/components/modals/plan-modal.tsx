import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Connection } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedConnection: Connection | null;
  selectedDate?: Date | null;
  showConnectionPicker?: boolean; // New prop to control picker visibility
}

const planSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledDate: z.date(),
  connectionId: z.number(),
  category: z.string().default("other"),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional()
});

type PlanFormData = z.infer<typeof planSchema>;

export function PlanModal({ isOpen, onClose, selectedConnection, selectedDate, showConnectionPicker = true }: PlanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local connection state for picker
  const [localSelectedConnection, setLocalSelectedConnection] = useState<Connection | null>(selectedConnection);
  
  const [formData, setFormData] = useState<Partial<PlanFormData>>({
    title: "",
    description: "",
    scheduledDate: selectedDate || new Date(),
    connectionId: localSelectedConnection?.id || selectedConnection?.id,
    category: "other",
    notes: "",
    isCompleted: false
  });

  // Milestone state
  const [isMilestone, setIsMilestone] = useState(false);
  const [milestoneIcon, setMilestoneIcon] = useState("");
  const [milestoneColor, setMilestoneColor] = useState("");
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  // Completion state
  const [isCompleted, setIsCompleted] = useState(false);
  const [reflection, setReflection] = useState("");

  // Update local state when selectedConnection prop changes
  useEffect(() => {
    if (selectedConnection && selectedConnection.id !== localSelectedConnection?.id) {
      setLocalSelectedConnection(selectedConnection);
      setFormData(prev => ({ ...prev, connectionId: selectedConnection.id }));
    }
  }, [selectedConnection, localSelectedConnection?.id]);

  // Fetch connections for the picker
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    enabled: isOpen, // Only fetch when modal is open
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      return apiRequest('/api/plans', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Plan created!",
        description: "Your plan has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: "Failed to create plan. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      scheduledDate: selectedDate || new Date(),
      connectionId: localSelectedConnection?.id || selectedConnection?.id,
      category: "other",
      notes: "",
      isCompleted: false
    });
    setLocalSelectedConnection(selectedConnection);
    
    // Reset milestone state
    setIsMilestone(false);
    setMilestoneIcon("");
    setMilestoneColor("");
    setIsAnniversary(false);
    setIsRecurring(false);
    
    // Reset completion state
    setIsCompleted(false);
    setReflection("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const connectionId = localSelectedConnection?.id || formData.connectionId;
    
    if (!formData.title || !formData.scheduledDate || !connectionId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a connection.",
        variant: "destructive",
      });
      return;
    }

    // If marked as milestone, create milestone instead of plan
    if (isMilestone) {
      const milestoneData = {
        connectionId,
        title: formData.title.trim(),
        description: formData.description?.trim() || "",
        date: formData.scheduledDate!.toISOString(),
        icon: milestoneIcon,
        color: milestoneColor,
        isAnniversary,
        isRecurring,
      };
      
      console.log("Creating milestone from plan:", milestoneData);
      
      // Create milestone using API
      fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestoneData),
      })
      .then(response => response.json())
      .then(() => {
        toast({
          title: "Success!",
          description: "Milestone created successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
        queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
        handleClose();
      })
      .catch(error => {
        console.error('Error creating milestone:', error);
        toast({
          title: "Error",
          description: "Failed to create milestone. Please try again.",
          variant: "destructive",
        });
      });
      return;
    }

    try {
      const validatedData = planSchema.parse({ 
        ...formData, 
        connectionId,
        isCompleted,
        notes: isCompleted ? reflection : formData.notes
      });
      createPlanMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0]?.message || "Please check your input.",
          variant: "destructive",
        });
      }
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const commonIcons = ["📅", "🍽️", "🎬", "🚶", "☕", "🎉", "💌", "🌮", "🍕", "🎵"];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Plan</DialogTitle>
        </DialogHeader>
        
        {/* Connection Picker - Show when enabled */}
        {showConnectionPicker && (
          <div className="space-y-2">
            <Label>Select Connection</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {localSelectedConnection ? (
                    <div className="flex items-center gap-2">
                      {localSelectedConnection.profileImage ? (
                        <img 
                          src={localSelectedConnection.profileImage} 
                          alt={localSelectedConnection.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium">
                          {localSelectedConnection.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{localSelectedConnection.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Choose a connection...</span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {connections.map((connection) => (
                  <DropdownMenuItem
                    key={connection.id}
                    onClick={() => {
                      setLocalSelectedConnection(connection);
                      setFormData(prev => ({ ...prev, connectionId: connection.id }));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {connection.profileImage ? (
                        <img 
                          src={connection.profileImage} 
                          alt={connection.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium">
                          {connection.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{connection.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Dinner date, Movie night, Coffee meet"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {commonIcons.map((icon) => (
                <Button
                  key={icon}
                  type="button"
                  variant={formData.icon === icon ? "default" : "outline"}
                  size="sm"
                  className="h-10 text-lg"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                >
                  {icon}
                </Button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about the plan..."
              rows={3}
            />
          </div>

          {/* Connection Info */}
          {selectedConnection && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Plan with: <span className="font-medium text-foreground">{selectedConnection.name}</span>
              </p>
            </div>
          )}

          {/* Completion Toggle */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="completion-toggle"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="completion-toggle" className="text-sm font-medium">
                Mark as complete
              </label>
            </div>

            {/* Reflection Input - Show when plan is marked as done */}
            {isCompleted && (
              <div className="space-y-2 pl-6 border-l-2 border-green-200">
                <label className="text-sm font-medium text-green-700">Reflection</label>
                <Textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="How did this plan go? What did you learn or enjoy about it?"
                  rows={3}
                  className="border-green-200 focus:border-green-300"
                />
              </div>
            )}
          </div>

          {/* Milestone Toggle */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="milestone-toggle"
                checked={isMilestone}
                onChange={(e) => setIsMilestone(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="milestone-toggle" className="text-sm font-medium">
                Mark as milestone
              </label>
            </div>

            {/* Milestone Options - Show when toggle is enabled */}
            {isMilestone && (
              <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                {/* Icon Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Milestone Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    <Button
                      type="button"
                      variant={milestoneIcon === "" ? "default" : "outline"}
                      size="sm"
                      className="h-10 text-xs"
                      onClick={() => setMilestoneIcon("")}
                    >
                      None
                    </Button>
                    {["🎉", "💝", "🌟", "❤️", "🎊", "💎", "🏆", "🎈", "💕"].map((icon) => (
                      <Button
                        key={icon}
                        type="button"
                        variant={milestoneIcon === icon ? "default" : "outline"}
                        size="sm"
                        className="h-10 text-lg"
                        onClick={() => setMilestoneIcon(icon)}
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={milestoneColor === "" ? "default" : "outline"}
                      size="sm"
                      className="w-12 h-8 p-0 text-xs"
                      onClick={() => setMilestoneColor("")}
                      title="None"
                    >
                      None
                    </Button>
                    {[
                      { color: "#3b82f6", name: "Blue" },
                      { color: "#ef4444", name: "Red" },
                      { color: "#22c55e", name: "Green" },
                      { color: "#f59e0b", name: "Yellow" },
                      { color: "#8b5cf6", name: "Purple" },
                      { color: "#ec4899", name: "Pink" }
                    ].map(({ color, name }) => (
                      <Button
                        key={color}
                        type="button"
                        variant={milestoneColor === color ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        style={{ backgroundColor: milestoneColor === color ? color : undefined }}
                        onClick={() => setMilestoneColor(color)}
                        title={name}
                      >
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Anniversary Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anniversary-toggle"
                    checked={isAnniversary}
                    onChange={(e) => setIsAnniversary(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="anniversary-toggle" className="text-sm">
                    Mark as anniversary
                  </label>
                </div>

                {/* Recurring Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recurring-toggle"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="recurring-toggle" className="text-sm">
                    Recurring annually
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createPlanMutation.isPending}
            >
              {createPlanMutation.isPending ? (
                <>
                  <Plus className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}