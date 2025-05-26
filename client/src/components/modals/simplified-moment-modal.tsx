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
  const { momentModalOpen, closeMomentModal, selectedConnectionId, activityType, editingMoment } = useModal();
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [momentType, setMomentType] = useState<string>("positive");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (editingMoment) {
      setConnectionId(editingMoment.connectionId);
      setEmoji(editingMoment.emoji);
      setContent(editingMoment.content || "");
      setSelectedDate(new Date(editingMoment.createdAt || new Date()));
      setSelectedTags(editingMoment.tags || []);
      
      // Determine activity type from existing moment
      if (editingMoment.tags?.includes('Conflict')) {
        setMomentType('negative');
      } else if (editingMoment.isIntimate) {
        setMomentType('positive');
      } else {
        setMomentType('positive');
      }
    } else {
      // Reset form for new entries
      setConnectionId(selectedConnectionId || 2);
      setEmoji(activityType === 'conflict' ? '⚡' : activityType === 'intimacy' ? '💕' : '😊');
      setContent("");
      setSelectedDate(new Date());
      setMomentType('positive');
      setSelectedTags([]);
      setCustomTag("");
    }
  }, [editingMoment, selectedConnectionId, activityType]);

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
  
  // Reflection field
  const [reflection, setReflection] = useState('');
  
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
  
  // Success and error handlers
  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/moments"] });
    queryClient.refetchQueries({ queryKey: ["/api/moments"] });
    window.dispatchEvent(new CustomEvent('momentUpdated'));
    closeMomentModal();
    setIsSubmitting(false);
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
      handleSuccess();
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
      handleSuccess();
    },
    onError: (error: any) => handleError(error),
  });
  
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
    
    // Set default emoji if none selected for conflict/intimacy
    const finalEmoji = activityType === 'moment' ? emoji : 
                      activityType === 'conflict' ? '⚡' : 
                      activityType === 'intimacy' ? '💕' : emoji;
    
    const momentData = {
      connectionId,
      emoji: finalEmoji,
      content: content.trim() || "",
      tags,
      isPrivate: false,
      isIntimate,
      intimacyRating: isIntimate ? "high" : null,
      relatedToMenstrualCycle: false,
      createdAt: selectedDate.toISOString(),
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

          {/* Emoji Selection - Only for regular moments */}
          {activityType === 'moment' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Emoji</label>
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </div>
          )}

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
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
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