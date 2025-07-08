import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Star, Heart, Gift, Trophy, Home, Plane, Circle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Milestone } from "@shared/schema";

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: number;
  editingMilestone?: Milestone | null;
}

const milestoneIcons = [
  { value: "star", label: "Star", icon: Star },
  { value: "heart", label: "Heart", icon: Heart },
  { value: "gift", label: "Gift", icon: Gift },
  { value: "trophy", label: "Achievement", icon: Trophy },
  { value: "home", label: "Home", icon: Home },
  { value: "plane", label: "Travel", icon: Plane },
  { value: "ring", label: "Ring", icon: Circle },
];

const milestoneColors = [
  { value: "#C084FC", label: "Purple" },
  { value: "#F59E0B", label: "Yellow" },
  { value: "#EF4444", label: "Red" },
  { value: "#10B981", label: "Green" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#EC4899", label: "Pink" },
  { value: "#8B5CF6", label: "Violet" },
];

export function MilestoneModal({ isOpen, onClose, connectionId, editingMilestone }: MilestoneModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>();
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [color, setColor] = useState("#C084FC");
  const [icon, setIcon] = useState("star");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when modal opens/closes or editing changes
  useEffect(() => {
    if (isOpen) {
      if (editingMilestone) {
        setTitle(editingMilestone.title);
        setDescription(editingMilestone.description || "");
        setDate(new Date(editingMilestone.date));
        setIsAnniversary(editingMilestone.isAnniversary || false);
        setIsRecurring(editingMilestone.isRecurring || false);
        setColor(editingMilestone.color || "#C084FC");
        setIcon(editingMilestone.icon || "star");
      } else {
        setTitle("");
        setDescription("");
        setDate(undefined);
        setIsAnniversary(false);
        setIsRecurring(false);
        setColor("#C084FC");
        setIcon("star");
      }
    }
  }, [isOpen, editingMilestone]);

  const createMilestone = useMutation({
    mutationFn: async (milestoneData: any) => {
      console.log("📋 CLIENT DEBUG - Sending milestone data:", milestoneData);
      
      const response = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(milestoneData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("📋 CLIENT DEBUG - Server error response:", errorData);
        toast({
          title: "Error",
          description: "Failed to create milestone. Please try again.",
          variant: "destructive",
        });
        throw new Error("Failed to create milestone");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections", connectionId] });
      toast({
        title: "Milestone created",
        description: "Your milestone has been saved successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive",
      });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: async (milestoneData: any) => {
      const response = await fetch(`/api/milestones/${editingMilestone?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(milestoneData),
      });

      if (!response.ok) {
        toast({
          title: "Error", 
          description: "Failed to update milestone. Please try again.",
          variant: "destructive",
        });
        throw new Error("Failed to update milestone");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections", connectionId] });
      toast({
        title: "Milestone updated",
        description: "Your milestone has been updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update milestone",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !date) {
      toast({
        title: "Missing information",
        description: "Please fill in the title and date",
        variant: "destructive",
      });
      return;
    }

    const milestoneData = {
      connectionId,
      title: title.trim(),
      description: description.trim() || null,
      date: date.toISOString(),
      isAnniversary,
      isRecurring,
      color,
      icon,
    };

    if (editingMilestone) {
      updateMilestone.mutate(milestoneData);
    } else {
      createMilestone.mutate(milestoneData);
    }
  };

  const SelectedIcon = milestoneIcons.find(i => i.value === icon)?.icon || Star;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingMilestone ? "Edit Milestone" : "Add Milestone"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., First Date, Moving In Together"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this milestone..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <SelectedIcon className="h-4 w-4" />
                      {milestoneIcons.find(i => i.value === icon)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {milestoneIcons.map((iconOption) => {
                    const IconComponent = iconOption.icon;
                    return (
                      <SelectItem key={iconOption.value} value={iconOption.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {iconOption.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: color }}
                      />
                      {milestoneColors.find(c => c.value === color)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {milestoneColors.map((colorOption) => (
                    <SelectItem key={colorOption.value} value={colorOption.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: colorOption.value }}
                        />
                        {colorOption.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="anniversary">Anniversary</Label>
                <p className="text-xs text-muted-foreground">Mark as an important anniversary</p>
              </div>
              <Switch
                id="anniversary"
                checked={isAnniversary}
                onCheckedChange={setIsAnniversary}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="recurring">Recurring</Label>
                <p className="text-xs text-muted-foreground">Remind me every year</p>
              </div>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={createMilestone.isPending || updateMilestone.isPending}
            >
              {createMilestone.isPending || updateMilestone.isPending 
                ? "Saving..." 
                : editingMilestone 
                  ? "Update" 
                  : "Create"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}