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
import { CalendarIcon, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function MomentModal() {
  const { momentModalOpen, closeMomentModal, selectedConnectionId, activityType, editingMoment, selectedDate } = useModal();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Preset tag options organized by category
  const presetTags = {
    positive: ["Green Flag", "Quality Time", "Growth", "Support", "Trust", "Communication", "Affection", "Fun", "Celebration"],
    negative: ["Red Flag", "Stress", "Disconnection", "Jealousy", "Miscommunication", "Disappointment"],
    intimate: ["Physical Touch", "Emotional Connection", "Vulnerability", "Deep Conversation"],
    general: ["Milestone", "Life Goals", "Future Planning", "Career", "Family", "Friends", "Travel", "Hobbies"]
  };
  
  // Form state
  const [connectionId, setConnectionId] = useState<number>(2);
  const [emoji, setEmoji] = useState<string>("😊");
  const [content, setContent] = useState<string>("");
  const [localSelectedDate, setLocalSelectedDate] = useState<Date>(new Date());
  const [momentType, setMomentType] = useState<string>("positive");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing data when editing
  useEffect(() => {
    console.log("Modal useEffect - selectedDate from context:", selectedDate);
    console.log("Modal useEffect - editingMoment:", editingMoment);
    console.log("Modal useEffect - momentModalOpen:", momentModalOpen);
    
    // For new entries, FORCE default to May 25th for testing
    if (!editingMoment && momentModalOpen) {
      if (selectedDate) {
        console.log("Setting localSelectedDate to selectedDate:", selectedDate);
        setLocalSelectedDate(selectedDate);
      } else {
        console.log("No selectedDate provided, FORCING May 25th for testing");
        // FORCE May 25th, 2025 as default for calendar testing
        const may25 = new Date('2025-05-25T12:00:00.000Z');
        setLocalSelectedDate(may25);
      }
    }
    
    if (editingMoment) {
      setConnectionId(editingMoment.connectionId);
      setEmoji(editingMoment.emoji);
      setContent(editingMoment.content || "");
      setLocalSelectedDate(new Date(editingMoment.createdAt || new Date()));
      setSelectedTags(editingMoment.tags || []);
      setReflection(editingMoment.reflection || "");
      
      // Initialize conflict-specific fields
      setIsResolved(editingMoment.isResolved || false);
      setResolutionNotes(editingMoment.resolutionNotes || "");
      if (editingMoment.resolvedAt) {
        setResolvedDate(new Date(editingMoment.resolvedAt));
      }
      
      // Initialize intimacy-specific fields
      if (editingMoment.intimacyRating) {
        setIntimacyRating(editingMoment.intimacyRating);
      }
      
      // Determine moment type from existing moment emoji
      if (['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(editingMoment.emoji)) {
        setMomentType('positive');
      } else if (['😕', '😢', '😠', '😞', '😤'].includes(editingMoment.emoji)) {
        setMomentType('negative');
      } else {
        setMomentType('neutral');
      }
    } else {
      // Reset form for new entries
      setConnectionId(selectedConnectionId || 2);
      setEmoji(activityType === 'conflict' ? '⚡' : activityType === 'intimacy' ? '💕' : '😊');
      setContent("");
      setLocalSelectedDate(selectedDate || new Date());
      setMomentType('positive');
      setSelectedTags([]);
      setCustomTag("");
      setReflection("");
      setIsResolved(false);
      setResolutionNotes("");
      setResolvedDate(new Date());
      setIntimacyRating(5);
    }
  }, [editingMoment, selectedConnectionId, activityType, selectedDate]);

  // Tag handling functions
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleCustomTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  };
  
  // Conflict resolution fields
  const [isResolved, setIsResolved] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvedDate, setResolvedDate] = useState<Date>(new Date());
  
  // Intimacy fields
  const [intimacyRating, setIntimacyRating] = useState<number>(5);
  
  // Reflection field
  const [reflection, setReflection] = useState('');
  
  // Fetch user connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: momentModalOpen,
  });
  
  // This effect is removed as form initialization is handled in the main useEffect above
  
  // Success and error handlers - now optimized for instant updates
  const handleSuccess = () => {
    closeMomentModal();
    setIsSubmitting(false);
    // Instantly update the cache instead of full page reload
    queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
  };

  const handleError = (error: any) => {
    console.error("Error with moment:", error);
    toast({
      title: "Error",
      description: error?.message || "Failed to save entry. Please try again.",
      variant: "destructive",
    });
    setIsSubmitting(false);
  };

  // Create moment mutation
  const { mutate: createMoment } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create moment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: `${activityType === 'conflict' ? 'Conflict' : activityType === 'intimacy' ? 'Intimacy' : 'Moment'} logged successfully`,
        description: "Your entry has been recorded.",
      });
      // Close modal and update cache instantly
      closeMomentModal();
      setIsSubmitting(false);
      // Force immediate refresh for calendar and activities
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
      queryClient.refetchQueries({ queryKey: ['/api/moments'] });
    },
    onError: (error: any) => handleError(error),
  });

  // Update moment mutation
  const { mutate: updateMoment } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/moments/${editingMoment?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update moment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry updated successfully",
        description: "Your changes have been saved.",
      });
      closeMomentModal();
      setIsSubmitting(false);
      
      // Instantly update the cache instead of full page reload
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
    },
    onError: (error: any) => handleError(error),
  });

  // Delete moment mutation
  const { mutate: deleteMoment } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/moments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete moment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry deleted successfully",
        description: "The entry has been removed.",
      });
      closeMomentModal();
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
    },
    onError: (error: any) => handleError(error),
  });

  const handleDelete = () => {
    if (!editingMoment) return;
    
    // Show confirmation before deleting
    if (!confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      return;
    }
    
    setIsSubmitting(true);
    deleteMoment(editingMoment.id);
  };
  
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Use selected tags or fallback to activity type tags (but not moment type)
    let tags: string[] = [];
    let isIntimate = false;
    
    if (selectedTags.length > 0) {
      tags = selectedTags;
    } else {
      // Only add default tags for conflict and intimacy, not for regular moments
      if (activityType === 'conflict') {
        tags = ['Conflict'];
      } else if (activityType === 'intimacy') {
        tags = ['Intimacy'];
        isIntimate = true;
      }
      // For regular moments (activityType === 'moment'), don't add any default tags
      // Never add momentType as a tag
    }
    
    if (activityType === 'intimacy') {
      isIntimate = true;
    }
    
    // Set emoji based on activity type and moment type
    let finalEmoji = emoji;
    if (activityType === 'moment') {
      // Use moment type to determine emoji
      switch (momentType) {
        case 'positive':
          finalEmoji = '😊';
          break;
        case 'negative':
          finalEmoji = '😕';
          break;
        case 'neutral':
          finalEmoji = '🌱';
          break;
        default:
          finalEmoji = emoji;
      }
    } else if (activityType === 'conflict') {
      finalEmoji = '⚡';
    } else if (activityType === 'intimacy') {
      finalEmoji = '💕';
    }
    
    console.log("🗓️ FRONTEND - Creating moment with date:", {
      selectedDate, 
      localSelectedDate, 
      iso: localSelectedDate.toISOString(),
      createdAtField: localSelectedDate.toISOString()
    });
    
    const momentData = {
      connectionId,
      emoji: finalEmoji,
      content: content.trim() || "",
      tags,
      isPrivate: false,
      isIntimate,
      intimacyRating: isIntimate ? "high" : null,
      relatedToMenstrualCycle: false,
      createdAt: localSelectedDate.toISOString(),
      // Conflict resolution fields
      isResolved: activityType === 'conflict' ? isResolved : false,
      resolvedAt: (activityType === 'conflict' && isResolved) ? resolvedDate.toISOString() : null,
      resolutionNotes: (activityType === 'conflict' && isResolved) ? resolutionNotes : null,
      // Reflection field
      reflection: reflection.trim() || null,
    };
    
    // Use the appropriate mutation based on editing mode
    if (editingMoment) {
      updateMoment(momentData);
    } else {
      createMoment(momentData);
    }
  };
  
  const getModalTitle = () => {
    const action = editingMoment ? 'Edit' : 'Log';
    switch (activityType) {
      case 'conflict': return `${action} Conflict`;
      case 'intimacy': return `${action} Intimacy`;
      default: return `${action} Moment`;
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 px-1">
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
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              placeholder={getPlaceholder()}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Tags Selection - Only show for regular moments */}
          {activityType === 'moment' && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Tags (Optional)</label>
            
            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}

            {/* Preset Tags */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick Tags:</div>
              <div className="flex flex-wrap gap-1">
                {presetTags.positive.slice(0, 6).map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      selectedTags.includes(tag) ? "bg-green-100 border-green-300 text-green-800" : ""
                    )}
                    onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {presetTags.negative.slice(0, 4).map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      selectedTags.includes(tag) ? "bg-red-100 border-red-300 text-red-800" : ""
                    )}
                    onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {presetTags.intimate.slice(0, 4).map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      selectedTags.includes(tag) ? "bg-pink-100 border-pink-300 text-pink-800" : ""
                    )}
                    onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={handleCustomTagKeyPress}
                className="text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomTag}
                disabled={!customTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          )}

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
                  selected={localSelectedDate}
                  onSelect={(date) => date && setLocalSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Conflict Resolution Toggle - Only for conflicts */}
          {activityType === 'conflict' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isResolved"
                    checked={isResolved}
                    onChange={(e) => setIsResolved(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="isResolved" className="text-sm font-medium">
                    Mark as resolved
                  </label>
                </div>
              </div>

              {/* Resolution fields - Only show when resolved */}
              {isResolved && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Resolution Notes</label>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="How was this conflict resolved?"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Resolution Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !resolvedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {resolvedDate ? format(resolvedDate, "PPP") : <span>Pick resolution date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={resolvedDate}
                          onSelect={(date) => date && setResolvedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </>
          )}

          {/* Reflection Field - Only for regular moments */}
          {activityType === 'moment' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reflection (Optional)</label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What deeper thoughts do you have about this moment? How did it make you feel? What did you learn?"
                className="min-h-[80px]"
              />
              <p className="text-xs text-gray-500">
                Add your personal insights and thoughts about this experience
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            {editingMoment && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete} 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            )}
            
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" onClick={closeMomentModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}