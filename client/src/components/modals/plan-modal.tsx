import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Connection, Moment } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/contexts/modal-context";
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
  editingMoment?: Moment | null; // For editing existing plans
}

const planSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledDate: z.date(),
  scheduledTime: z.string().optional(),
  connectionId: z.number(),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional(),
  hasReminder: z.boolean().optional(),
  reminderMinutes: z.number().optional()
});

type PlanFormData = z.infer<typeof planSchema>;

export function PlanModal({ isOpen, onClose, selectedConnection, selectedDate, showConnectionPicker = true, editingMoment }: PlanModalProps) {
  const { toast } = useToast();
  const { selectedDate: contextSelectedDate } = useModal();
  const queryClient = useQueryClient();
  
  // Local connection state for picker
  const [localSelectedConnection, setLocalSelectedConnection] = useState<Connection | null>(selectedConnection);
  
  const [formData, setFormData] = useState<Partial<PlanFormData>>({
    title: "",
    description: "",
    scheduledDate: selectedDate || new Date(),
    scheduledTime: "",
    connectionId: localSelectedConnection?.id || selectedConnection?.id,
    notes: "",
    isCompleted: false,
    hasReminder: false,
    reminderMinutes: 15
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
  
  // Date picker state
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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

  // Initialize form data when editing an existing plan or creating new one
  useEffect(() => {
    if (editingMoment && isOpen && connections.length > 0) {
      // Find the connection for the editing moment
      const momentConnection = connections.find(c => c.id === editingMoment.connectionId);
      
      setFormData({
        title: editingMoment.title || "",
        description: editingMoment.content || "",
        scheduledDate: editingMoment.createdAt ? new Date(editingMoment.createdAt) : new Date(),
        scheduledTime: "", // Will extract from date if stored
        connectionId: editingMoment.connectionId,
        notes: editingMoment.content || "",
        isCompleted: false, // Plans stored as moments don't have completion status
        hasReminder: false,
        reminderMinutes: 15
      });
      
      // Set the connection for the picker
      setLocalSelectedConnection(momentConnection || selectedConnection);
    } else if (!editingMoment && isOpen) {
      // Reset form for new plans - use selectedDate from modal context if available
      setFormData({
        title: "",
        description: "",
        scheduledDate: contextSelectedDate || selectedDate || new Date(),
        connectionId: localSelectedConnection?.id || selectedConnection?.id,
        notes: "",
        isCompleted: false,
        hasReminder: false,
        reminderMinutes: 15
      });
    }
  }, [editingMoment, isOpen, selectedConnection, selectedDate, contextSelectedDate, localSelectedConnection?.id, connections]);

  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const momentData = {
        title: data.title,
        content: data.description || `Plan scheduled for ${data.scheduledDate}`,
        emoji: "📅", // Calendar emoji for plans
        tags: ["Plan"],
        connectionId: data.connectionId,
        createdAt: data.scheduledDate, // Use scheduled date as the moment date
        isCompleted: data.isCompleted || false,
        notes: data.notes
      };

      // If editing, use PATCH; otherwise, use POST
      if (editingMoment) {
        return apiRequest('PATCH', `/api/moments/${editingMoment.id}`, momentData);
      } else {
        return apiRequest('POST', '/api/moments', momentData);
      }
    },
    onSuccess: () => {
      toast({
        title: editingMoment ? "Plan updated!" : "Plan created!",
        description: editingMoment ? "Your plan has been updated successfully." : "Your plan has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
      handleClose();
    },
    onError: (error) => {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: editingMoment ? "Failed to update plan. Please try again." : "Failed to create plan. Please try again.",
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

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
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
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.scheduledDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.scheduledDate ? format(formData.scheduledDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.scheduledDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData(prev => ({ ...prev, scheduledDate: date }));
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                />
                <div className="flex justify-between p-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDatePickerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, scheduledDate: new Date() }));
                      setDatePickerOpen(false);
                    }}
                  >
                    Today
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduledTime">Time (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                onFocus={(e) => {
                  // Auto-select current time if no time is set
                  if (!formData.scheduledTime) {
                    const now = new Date();
                    const currentTime = now.toTimeString().slice(0, 5);
                    setFormData(prev => ({ ...prev, scheduledTime: currentTime }));
                  }
                }}
                className="flex-1"
              />
              {formData.scheduledTime && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, scheduledTime: "" }))}
                  className="px-3"
                >
                  Clear
                </Button>
              )}
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

          {/* Reminder Settings - Moved above completion toggle */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasReminder"
                checked={formData.hasReminder || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasReminder: checked as boolean }))}
              />
              <Label htmlFor="hasReminder" className="text-sm font-medium">
                Set reminder
              </Label>
            </div>
            
            {formData.hasReminder && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="reminderMinutes" className="text-sm text-muted-foreground">
                  Remind me before:
                </Label>
                <Select
                  value={formData.reminderMinutes?.toString() || "15"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reminderMinutes: parseInt(value) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

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