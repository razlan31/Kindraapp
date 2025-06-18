import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/contexts/modal-context";
import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import { Connection } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { MediaUpload, type MediaFile } from "@/components/ui/media-upload";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function MomentModal() {
  const { momentModalOpen, closeMomentModal, selectedConnectionId, activityType, editingMoment, selectedDate, setSelectedConnection } = useModal();
  const { user } = useAuth();
  const { triggerConnectionSync } = useSync();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debug modal state
  console.log("MomentModal render - momentModalOpen:", momentModalOpen, "activityType:", activityType);

  // Preset tag options organized by category
  const presetTags = {
    positive: ["Green Flag", "Quality Time", "Growth", "Support", "Trust", "Communication", "Affection", "Fun", "Celebration"],
    negative: ["Red Flag", "Stress", "Disconnection", "Jealousy", "Miscommunication", "Disappointment"],
    intimate: ["Physical Touch", "Emotional Connection", "Vulnerability", "Deep Conversation"],
    general: ["Milestone", "Life Goals", "Future Planning", "Career", "Family", "Friends", "Travel", "Hobbies"]
  };
  
  // Form state
  const [connectionId, setConnectionId] = useState<number>(2);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [emoji, setEmoji] = useState("😊");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [localSelectedDate, setLocalSelectedDate] = useState<Date>(new Date());
  const [momentType, setMomentType] = useState<string>("positive");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Debug state changes
  useEffect(() => {
    console.log("🔥 STATE DEBUG - isSubmitting changed:", isSubmitting);
  }, [isSubmitting]);
  
  useEffect(() => {
    console.log("🔥 STATE DEBUG - connectionId changed:", connectionId, "selectedConnectionId:", selectedConnectionId);
  }, [connectionId, selectedConnectionId]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isIntimate, setIsIntimate] = useState<boolean>(false);
  const [reflection, setReflection] = useState('');
  const [isResolved, setIsResolved] = useState(false);
  const [resolvedDate, setResolvedDate] = useState<Date | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isMilestone, setIsMilestone] = useState(false);
  const [milestoneIcon, setMilestoneIcon] = useState("");
  const [milestoneColor, setMilestoneColor] = useState("");
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [intimacyRating, setIntimacyRating] = useState<string>("5");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(true);
  const [isReflectionCollapsed, setIsReflectionCollapsed] = useState(true);

  // Initialize form with existing data when editing
  useEffect(() => {
    console.log("Modal useEffect - selectedDate from context:", selectedDate);
    console.log("Modal useEffect - editingMoment:", editingMoment);
    console.log("Modal useEffect - momentModalOpen:", momentModalOpen);
    
    // Reset submitting state when modal opens
    console.log("🔥 MODAL OPEN - Resetting isSubmitting to false");
    setIsSubmitting(false);
    
    // For new entries, FORCE default to May 25th for testing
    if (!editingMoment && momentModalOpen) {
      if (selectedDate) {
        console.log("Setting localSelectedDate to selectedDate:", selectedDate);
        setLocalSelectedDate(selectedDate);
      } else {
        console.log("No selectedDate provided, using current date");
        setLocalSelectedDate(new Date());
      }
    }
    
    if (editingMoment) {
      setConnectionId(editingMoment.connectionId);
      setTitle(editingMoment.title || "");
      setEmoji(editingMoment.emoji);
      setContent(editingMoment.content || "");
      setLocalSelectedDate(new Date(editingMoment.createdAt || new Date()));
      setSelectedTags(editingMoment.tags || []);
      setReflection(editingMoment.reflection || "");
      setMediaFiles(editingMoment.mediaFiles || []);
      
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
      const initialConnectionId = selectedConnectionId || 2;
      console.log("🔥 MODAL INIT - Setting connectionId:", initialConnectionId, "from selectedConnectionId:", selectedConnectionId);
      setConnectionId(initialConnectionId);
      setEmoji(activityType === 'conflict' ? '⚡' : activityType === 'intimacy' ? '💗' : '😊');
      setContent("");
      setLocalSelectedDate(selectedDate || new Date());
      setMomentType('positive');
      
      // Automatically set Sex tag and intimate flag for intimacy tab
      if (activityType === 'intimacy') {
        setSelectedTags(['Sex']);
        setIsIntimate(true);
      } else if (activityType === 'conflict') {
        setSelectedTags(['Conflict']);
        setIsIntimate(false);
      } else {
        setSelectedTags([]);
        setIsIntimate(false);
      }
      
      setCustomTag("");
      setReflection("");
      setMediaFiles([]);
      setIsResolved(false);
      setResolutionNotes("");
      setResolvedDate(new Date());
      setIntimacyRating("5");
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
    const tagToAdd = customTag.trim().toLowerCase();
    const restrictedTags = ['plan', 'conflict', 'intimacy', 'positive', 'negative', 'neutral'];
    
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      // Check if the tag is restricted
      if (restrictedTags.includes(tagToAdd)) {
        toast({
          title: "Tag not allowed",
          description: `"${customTag.trim()}" is a system tag and cannot be used. Please choose a different tag.`,
          variant: "destructive",
        });
        return;
      }
      
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
  
  // Removed duplicate state declarations
  
  // Fetch user connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: momentModalOpen,
  });
  
  // Mutation for creating/updating moments
  const { mutate: createMoment } = useMutation({
    mutationFn: async (momentData: any) => {
      const response = await fetch(`/api/moments${editingMoment ? `/${editingMoment.id}` : ''}`, {
        method: editingMoment ? 'PATCH' : 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(momentData),
      });
      if (!response.ok) throw new Error('Failed to save moment');
      return response.json();
    },
    onMutate: async (newMoment) => {
      await queryClient.cancelQueries({ queryKey: ['/api/moments'] });
      const previousMoments = queryClient.getQueryData(['/api/moments']);
      const optimisticMoment = {
        ...newMoment,
        id: Date.now(),
        userId: user?.id,
        createdAt: newMoment.createdAt,
      };
      queryClient.setQueryData(['/api/moments'], (old: any) => {
        if (!old) return [optimisticMoment];
        return [optimisticMoment, ...old];
      });
      return { previousMoments };
    },
    onSuccess: (data) => {
      if (data.newBadges && data.newBadges.length > 0) {
        data.newBadges.forEach((badge: any) => {
          toast({
            title: "🎉 New Badge Unlocked!",
            description: `${badge.icon} ${badge.name} - ${badge.description}`,
            duration: 5000,
          });
        });
      }
      
      toast({
        title: `${activityType === 'conflict' ? 'Conflict' : activityType === 'intimacy' ? 'Intimacy' : 'Moment'} logged successfully`,
        description: "Your entry has been recorded.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
      
      // Trigger connection sync for activities page
      const syncConnectionId = selectedConnectionId || connectionId;
      console.log("🔄 SYNC CONTEXT - About to trigger sync:", syncConnectionId, activityType, "selectedConnectionId:", selectedConnectionId, "formConnectionId:", connectionId);
      
      // Always try to trigger sync even without explicit connectionId by using form connectionId
      const finalConnectionId = syncConnectionId || connectionId;
      if (finalConnectionId) {
        console.log("🔄 SYNC CONTEXT - Triggering sync with connectionId:", finalConnectionId);
        triggerConnectionSync(finalConnectionId, activityType || 'moment');
        console.log("🔄 SYNC CONTEXT - Sync triggered for connection:", finalConnectionId);
      } else {
        console.log("🔄 SYNC CONTEXT - No connectionId available for sync");
      }
      
      // Clear form and close modal
      if (!editingMoment) {
        setTitle("");
        setContent("");
        setSelectedTags([]);
        setCustomTag("");
        setReflection("");
        setResolutionNotes("");
        setIsResolved(false);
        setIsMilestone(false);
        setMilestoneColor("");
        setMilestoneIcon("");
        setIsAnniversary(false);
        setIsRecurring(false);
        setLocalSelectedDate(new Date());
        setMomentType("positive");
        setEmoji("😊");
        setIntimacyRating("5");
      }
      
      closeMomentModal();
    },
    onError: (error: any, newMoment, context) => {
      console.log("🔥 MUTATION ERROR - Resetting isSubmitting to false");
      setIsSubmitting(false); // Reset submitting state on error
      
      if (context?.previousMoments) {
        queryClient.setQueryData(['/api/moments'], context.previousMoments);
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleError = (error: any) => {
    console.error("Error with moment:", error);
    console.log("🔥 HANDLE ERROR - Resetting isSubmitting to false");
    setIsSubmitting(false);
    toast({
      title: "Error",
      description: error?.message || "Failed to save entry. Please try again.",
      variant: "destructive",
    });
  };

  // Create moment mutation with optimistic updates
  const { mutate: createMilestone } = useMutation({
    mutationFn: async (data: any) => {
      console.log("🔥 FORM SUBMISSION - Data being sent to API:", data);
      console.log("🔥 FORM SUBMISSION - data.createdAt:", data.createdAt);
      console.log("🔥 FORM SUBMISSION - JSON.stringify result:", JSON.stringify(data));
      
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create moment');
      const result = await response.json();
      console.log("🔥 FORM SUBMISSION - API response:", result);
      console.log("🔥 FORM SUBMISSION - result.createdAt:", result.createdAt);
      return result;
    },
    onMutate: async (newMoment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/moments'] });

      // Snapshot previous value
      const previousMoments = queryClient.getQueryData(['/api/moments']);

      // Optimistically update with temporary data
      const optimisticMoment = {
        ...newMoment,
        id: Date.now(),
        userId: user?.id,
        createdAt: newMoment.createdAt,
      };

      queryClient.setQueryData(['/api/moments'], (old: any) => {
        if (!old) return [optimisticMoment];
        return [optimisticMoment, ...old];
      });

      return { previousMoments };
    },
    onSuccess: (data) => {
      console.log("🔥 MUTATION SUCCESS - Resetting isSubmitting to false");
      setIsSubmitting(false); // Reset submitting state
      
      // Check if any new badges were earned
      if (data.newBadges && data.newBadges.length > 0) {
        // Show celebratory toast for each new badge
        data.newBadges.forEach((badge: any) => {
          toast({
            title: "🎉 New Badge Unlocked!",
            description: `${badge.icon} ${badge.name} - ${badge.description}`,
            duration: 5000,
          });
        });
      }
      
      toast({
        title: `${activityType === 'conflict' ? 'Conflict' : activityType === 'intimacy' ? 'Intimacy' : 'Moment'} logged successfully`,
        description: "Your entry has been recorded.",
      });
      
      // Optimized cache invalidation - single invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
      
      // Trigger connection sync for activities page
      const syncConnectionId = selectedConnectionId || connectionId;
      console.log("🔄 SYNC CONTEXT - About to trigger sync:", syncConnectionId, activityType, "selectedConnectionId:", selectedConnectionId, "formConnectionId:", connectionId);
      
      // Always try to trigger sync even without explicit connectionId by using form connectionId
      const finalConnectionId = syncConnectionId || connectionId;
      if (finalConnectionId) {
        console.log("🔄 SYNC CONTEXT - Triggering sync with connectionId:", finalConnectionId);
        triggerConnectionSync(finalConnectionId, activityType || 'moment');
        console.log("🔄 SYNC CONTEXT - Sync triggered for connection:", finalConnectionId);
      } else {
        console.log("🔄 SYNC CONTEXT - No connectionId available for sync");
      }
      
      // Clear form and close modal (removed duplicate handleSuccess call)
      if (!editingMoment) {
        setTitle("");
        setContent("");
        setSelectedTags([]);
        setCustomTag("");
        setReflection("");
        setResolutionNotes("");
        setIsResolved(false);
        setIsMilestone(false);
        setMilestoneColor("");
        setMilestoneIcon("");
        setIsAnniversary(false);
        setIsRecurring(false);
        setLocalSelectedDate(new Date());
        setMomentType("positive");
        setEmoji("😊");
        setIntimacyRating("5");
      }
      
      closeMomentModal();
    },
    onError: (error: any, newMoment, context) => {
      // Rollback optimistic update if mutation fails
      if (context?.previousMoments) {
        queryClient.setQueryData(['/api/moments'], context.previousMoments);
      }
      handleError(error);
    },
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
    onSuccess: (updatedData) => {
      toast({
        title: "Entry updated successfully",
        description: "Your changes have been saved.",
      });
      
      // Optimistically update the cache with the new data
      queryClient.setQueryData(['/api/moments'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((moment: any) => 
          moment.id === editingMoment?.id ? { ...moment, ...updatedData } : moment
        );
      });
      
      // Trigger connection sync back to activity page
      console.log("Moment updated - triggering connection sync:", selectedConnectionId);
      if (selectedConnectionId) {
        const selectedConnection = connections.find(c => c.id === selectedConnectionId);
        setSelectedConnection(selectedConnectionId, selectedConnection);
      }
      
      closeMomentModal();
      setIsSubmitting(false);
      
      // Also invalidate to ensure fresh data
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
    console.log("🔥 SUBMIT DEBUG - Starting submit with:", {
      isSubmitting,
      connectionId,
      selectedConnectionId,
      title: title.trim(),
      content: content.trim(),
      activityType
    });
    
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
        tags = ['Sex'];
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
      finalEmoji = '💗';
    }
    
    console.log("🗓️ FRONTEND - Creating moment with date:", {
      selectedDate, 
      localSelectedDate, 
      iso: localSelectedDate.toISOString(),
      createdAtField: localSelectedDate.toISOString()
    });
    
    // If marked as milestone, create milestone instead of moment
    if (isMilestone && activityType === 'moment') {
      const milestoneData = {
        connectionId,
        title: title.trim() || "",
        description: content.trim() || "",
        date: localSelectedDate.toISOString(),
        icon: milestoneIcon,
        color: milestoneColor,
        isAnniversary,
        isRecurring,
      };
      
      console.log("Creating milestone:", milestoneData);
      
      // Create milestone using API
      fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestoneData),
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to create milestone');
        return response.json();
      })
      .then(() => {
        console.log("🔥 MILESTONE SUCCESS - Resetting isSubmitting to false");
        setIsSubmitting(false); // Reset submitting state
        
        toast({
          title: "Milestone created successfully",
          description: "Your milestone has been recorded.",
        });
        
        // Invalidate milestone queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
        
        // Clear form and close modal
        if (!editingMoment) {
          setTitle("");
          setContent("");
          setSelectedTags([]);
          setCustomTag("");
          setEmoji("😊");
          setMediaFiles([]);
          setReflection("");
          setMomentType("positive");
          setIsIntimate(false);
          setIsResolved(false);
          setResolvedDate(null);
          setResolutionNotes("");
        }
        closeMomentModal();
      })
      .catch((error) => {
        console.log("🔥 MILESTONE ERROR - Resetting isSubmitting to false");
        setIsSubmitting(false); // Reset submitting state on error
        handleError(error);
      });
      
      return;
    }
    
    console.log("🔥 SUBMIT DEBUG - Creating momentData with connectionId:", connectionId);
    
    const momentData = {
      connectionId,
      title: title.trim() || "",
      emoji: finalEmoji,
      content: content.trim() || "",
      tags,
      isPrivate: false,
      isIntimate,
      intimacyRating: isIntimate ? "high" : null,
      relatedToMenstrualCycle: false,
      createdAt: localSelectedDate.toISOString(),
      // Media files
      mediaFiles: mediaFiles.length > 0 ? mediaFiles : null,
      // Conflict resolution fields
      isResolved: activityType === 'conflict' ? isResolved : false,
      resolvedAt: (activityType === 'conflict' && isResolved && resolvedDate) ? resolvedDate.toISOString() : null,
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

          {/* Title - Only show for regular moments and conflicts */}
          {activityType !== 'intimacy' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Give this moment a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                required
              />
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

          {/* Media Upload */}
          <div className="space-y-2">
            <MediaUpload
              value={mediaFiles}
              onChange={setMediaFiles}
              maxFiles={5}
              acceptedTypes={['image/*', 'video/*']}
              maxSize={50}
            />
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !localSelectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localSelectedDate ? format(localSelectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="p-3">
                  <Calendar
                    mode="single"
                    selected={localSelectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setLocalSelectedDate(date);
                        setDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                  <div className="flex justify-between mt-3 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDatePickerOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLocalSelectedDate(new Date());
                        setDatePickerOpen(false);
                      }}
                    >
                      Today
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Tags Selection - Only show for regular moments */}
          {activityType === 'moment' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tags (Optional)</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsTagsCollapsed(!isTagsCollapsed)}
                className="p-1 h-6 w-6"
              >
                {isTagsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
            
            {!isTagsCollapsed && (
              <>
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
              </>
            )}
          </div>
          )}

          {/* Conflict Resolution - Only for conflicts */}
          {activityType === 'conflict' && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Resolution Status</label>
                <Button
                  type="button"
                  variant={isResolved ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsResolved(!isResolved)}
                  className={cn(
                    "px-4 py-2",
                    isResolved ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-gray-50"
                  )}
                >
                  {isResolved ? "✓ Resolved" : "Mark as Resolved"}
                </Button>
              </div>

              {/* Resolution notes - Show when resolved */}
              {isResolved && (
                <div className="space-y-3 pl-4 border-l-2 border-green-200">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Resolution Notes</label>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="How was this conflict resolved? What was the outcome?"
                      className="min-h-[80px] border-green-200 focus:border-green-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Resolution Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-green-200",
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
                          selected={resolvedDate ?? undefined}
                          onSelect={(date) => {
                            if (date) {
                              setResolvedDate(date);
                              document.body.click();
                            }
                          }}
                          initialFocus
                        />
                        <div className="flex justify-between p-3 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => document.body.click()}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResolvedDate(new Date());
                              document.body.click();
                            }}
                          >
                            Today
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reflection Field - Only for regular moments */}
          {activityType === 'moment' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Reflection (Optional)</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReflectionCollapsed(!isReflectionCollapsed)}
                  className="p-1 h-6 w-6"
                >
                  {isReflectionCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
              
              {!isReflectionCollapsed && (
                <>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="What deeper thoughts do you have about this moment? How did it make you feel? What did you learn?"
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-gray-500">
                    Add your personal insights and thoughts about this experience
                  </p>
                </>
              )}
            </div>
          )}

          {/* Milestone Toggle - Only show for regular moments */}
          {activityType === 'moment' && (
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
                    <label className="text-sm font-medium">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={milestoneIcon === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMilestoneIcon("")}
                        className="text-xs"
                      >
                        None
                      </Button>
                      {['star', 'heart', 'gift', 'trophy', 'home', 'plane', 'ring'].map((icon) => (
                        <Button
                          key={icon}
                          type="button"
                          variant={milestoneIcon === icon ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMilestoneIcon(icon)}
                          className="text-lg"
                        >
                          {icon === 'star' && '⭐'}
                          {icon === 'heart' && '💖'}
                          {icon === 'gift' && '🎁'}
                          {icon === 'trophy' && '🏆'}
                          {icon === 'home' && '🏠'}
                          {icon === 'plane' && '✈️'}
                          {icon === 'ring' && '💍'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={milestoneColor === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMilestoneColor("")}
                        className="text-xs"
                      >
                        None
                      </Button>
                      {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                        <Button
                          key={color}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMilestoneColor(color)}
                          className="w-8 h-8 p-0 rounded-full border-2"
                          style={{ 
                            backgroundColor: color,
                            borderColor: milestoneColor === color ? '#000' : color
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Anniversary and Recurring toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="anniversary-toggle"
                        checked={isAnniversary}
                        onChange={(e) => setIsAnniversary(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="anniversary-toggle" className="text-sm">
                        Anniversary (yearly reminder)
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="recurring-toggle"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="recurring-toggle" className="text-sm">
                        Recurring milestone
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
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
              <Button 
                onClick={(e) => {
                  console.log("🔥 BUTTON CLICK - Save button clicked", {
                    isSubmitting,
                    connectionId,
                    selectedConnectionId,
                    disabled: isSubmitting,
                    event: e
                  });
                  handleSubmit();
                }} 
                disabled={isSubmitting}
                className={isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                onMouseDown={() => console.log("🔥 BUTTON CLICK - Mouse down on save button")}
                onMouseUp={() => console.log("🔥 BUTTON CLICK - Mouse up on save button")}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}