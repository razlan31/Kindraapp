import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/contexts/modal-context";
import { useAuth } from "@/contexts/auth-context";
import { Connection } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MomentModal() {
  const { momentModalOpen, closeMomentModal, selectedConnectionId, activityType } = useModal();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [connectionId, setConnectionId] = useState<number>(2);
  const [emoji, setEmoji] = useState<string>("😊");
  const [content, setContent] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [momentType, setMomentType] = useState<string>("positive");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch user connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: momentModalOpen,
  });
  
  // Reset form when modal opens
  useEffect(() => {
    if (momentModalOpen) {
      setConnectionId(selectedConnectionId || 2);
      setEmoji(activityType === 'conflict' ? "😠" : activityType === 'intimacy' ? "💕" : "😊");
      setContent("");
      setSelectedDate(new Date());
      setMomentType("positive");
    }
  }, [momentModalOpen, selectedConnectionId, activityType]);
  
  // Create moment mutation
  const { mutate: createMoment } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/moments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: `${activityType === 'conflict' ? 'Conflict' : activityType === 'intimacy' ? 'Intimacy' : 'Moment'} logged successfully`,
        description: "Your entry has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/moments"] });
      queryClient.refetchQueries({ queryKey: ["/api/moments"] });
      window.dispatchEvent(new CustomEvent('momentCreated'));
      closeMomentModal();
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error creating moment:", error);
      toast({
        title: "Error",
        description: "Failed to create entry. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Missing description",
        description: "Please add a description for your entry.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Determine tags based on activity type
    let tags: string[] = [];
    let isIntimate = false;
    
    if (activityType === 'moment') {
      tags = [momentType === 'positive' ? 'Positive' : momentType === 'negative' ? 'Negative' : 'Neutral'];
    } else if (activityType === 'conflict') {
      tags = ['Conflict'];
    } else if (activityType === 'intimacy') {
      tags = ['Intimacy'];
      isIntimate = true;
    }
    
    const momentData = {
      connectionId,
      emoji,
      content: content.trim(),
      tags,
      isPrivate: false,
      isIntimate,
      intimacyRating: isIntimate ? "high" : null,
      relatedToMenstrualCycle: false,
      createdAt: selectedDate.toISOString(),
    };
    
    createMoment(momentData);
  };
  
  const getModalTitle = () => {
    switch (activityType) {
      case 'conflict': return 'Log Conflict';
      case 'intimacy': return 'Log Intimacy';
      default: return 'Log Moment';
    }
  };
  
  const getPlaceholder = () => {
    switch (activityType) {
      case 'conflict': return 'Describe what happened during this conflict...';
      case 'intimacy': return 'Describe this intimate moment...';
      default: return 'Describe what happened...';
    }
  };

  return (
    <Dialog open={momentModalOpen} onOpenChange={closeMomentModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connection Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Connection</label>
            <Select value={connectionId.toString()} onValueChange={(value) => setConnectionId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id.toString()}>
                    {connection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Emoji Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Emoji</label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          {/* Moment Type - Only for regular moments */}
          {activityType === 'moment' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={momentType} onValueChange={setMomentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder={getPlaceholder()}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={closeMomentModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}