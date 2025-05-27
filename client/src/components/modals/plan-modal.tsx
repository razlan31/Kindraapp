import { useState } from "react";
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
}

const planSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.date(),
  connectionId: z.number(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isAnniversary: z.boolean().optional(),
  isRecurring: z.boolean().optional()
});

type PlanFormData = z.infer<typeof planSchema>;

export function PlanModal({ isOpen, onClose, selectedConnection, selectedDate }: PlanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local connection state for picker
  const [localSelectedConnection, setLocalSelectedConnection] = useState<Connection | null>(selectedConnection);
  
  const [formData, setFormData] = useState<Partial<PlanFormData>>({
    title: "",
    description: "",
    date: selectedDate || new Date(),
    connectionId: localSelectedConnection?.id || selectedConnection?.id,
    color: "#3b82f6", // Default blue color
    icon: "📅"
  });

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
      date: selectedDate || new Date(),
      connectionId: localSelectedConnection?.id || selectedConnection?.id,
      color: "#3b82f6",
      icon: "📅"
    });
    setLocalSelectedConnection(selectedConnection);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const connectionId = localSelectedConnection?.id || formData.connectionId;
    
    if (!formData.title || !formData.date || !connectionId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a connection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const validatedData = planSchema.parse({ ...formData, connectionId });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Plan</DialogTitle>
        </DialogHeader>
        
        {/* Connection Picker - Only show when no connection is pre-selected */}
        {!selectedConnection && (
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