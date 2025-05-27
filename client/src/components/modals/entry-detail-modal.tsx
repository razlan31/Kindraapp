import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Edit2, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useModal } from "@/contexts/modal-context";
import type { Moment, Connection } from "@shared/schema";

interface EntryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  moment: Moment | null;
  connection: Connection | null;
}

export function EntryDetailModal({ isOpen, onClose, moment, connection }: EntryDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedReflection, setEditedReflection] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [editedEmoji, setEditedEmoji] = useState("");
  const [customTag, setCustomTag] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openMomentModal } = useModal();

  // Preset tag options for editing
  const presetTags = {
    positive: ["Green Flag", "Quality Time", "Growth", "Support", "Trust", "Communication", "Affection", "Fun", "Celebration"],
    negative: ["Red Flag", "Stress", "Disconnection", "Jealousy", "Miscommunication", "Disappointment"],
    intimate: ["Physical Touch", "Emotional Connection", "Vulnerability", "Deep Conversation"],
    general: ["Milestone", "Life Goals", "Future Planning", "Career", "Family", "Friends", "Travel", "Hobbies"]
  };

  // Fetch fresh moment data to ensure we have the latest reflection
  const { data: moments } = useQuery({
    queryKey: ["/api/moments"],
    enabled: isOpen && !!moment?.id,
  });

  // Get the fresh moment data from the query result
  const freshMoment = Array.isArray(moments) ? moments.find((m: Moment) => m.id === moment?.id) || moment : moment;

  // Reset to view mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  // Listen for reflection updates and refresh data
  useEffect(() => {
    const handleReflectionAdded = (event: CustomEvent) => {
      if (event.detail.momentId === moment?.id) {
        // Refresh the moments data to get the updated reflection
        queryClient.refetchQueries({ queryKey: ["/api/moments"] });
      }
    };

    window.addEventListener('reflectionAdded', handleReflectionAdded as EventListener);
    return () => {
      window.removeEventListener('reflectionAdded', handleReflectionAdded as EventListener);
    };
  }, [moment?.id, queryClient]);

  // Tag handling functions
  const addTag = (tag: string) => {
    if (!editedTags.includes(tag)) {
      setEditedTags([...editedTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !editedTags.includes(customTag.trim())) {
      setEditedTags([...editedTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleCustomTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  };

  const updateMomentMutation = useMutation({
    mutationFn: async (data: { id: number; content: string; emoji?: string; reflection: string; tags: string[] }) => {
      const response = await fetch(`/api/moments/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: data.content,
          emoji: data.emoji,
          reflection: data.reflection || null,
          tags: data.tags
        }),
      });
      if (!response.ok) throw new Error('Failed to update entry');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Entry updated successfully!" });
      setIsEditing(false);
      setIsSubmitting(false);
      
      // Instantly update the cache instead of full page reload
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
    },
    onError: () => {
      toast({ title: "Failed to update entry", variant: "destructive" });
      setIsSubmitting(false);
    },
  });

  // Delete mutation
  const deleteMomentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/moments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete entry');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Entry deleted successfully!" });
      setIsSubmitting(false);
      onClose(); // Close the modal
      
      // Instantly update the cache
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
    },
    onError: () => {
      toast({ title: "Failed to delete entry", variant: "destructive" });
      setIsSubmitting(false);
    },
  });

  const handleEdit = () => {
    if (freshMoment) {
      // Determine activity type from the moment
      const activityType = getActivityType(freshMoment);
      // Open the unified modal for editing
      openMomentModal(activityType as 'moment' | 'conflict' | 'intimacy', freshMoment);
      // Close this detail modal
      onClose();
    }
  };

  const handleSave = async () => {
    if (!moment) return;
    
    setIsSubmitting(true);
    try {
      await updateMomentMutation.mutateAsync({
        id: moment.id,
        content: editedContent.trim(),
        emoji: editedEmoji,
        reflection: editedReflection.trim(),
        tags: editedTags
      } as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent("");
    setEditedReflection("");
  };

  const handleDelete = async () => {
    if (!moment) return;
    
    // Show confirmation before deleting
    if (!confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await deleteMomentMutation.mutateAsync(moment.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityType = (moment: Moment) => {
    if (moment.tags?.includes('Conflict')) return 'conflict';
    if (moment.isIntimate) return 'intimacy';
    return 'moment';
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'conflict': return 'Conflict';
      case 'intimacy': return 'Intimacy';
      default: return 'Moment';
    }
  };

  const getTagColor = (tag: string) => {
    if (tag === "Green Flag" || ["Intimacy", "Affection", "Support", "Growth", "Trust", "Celebration"].includes(tag)) {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
    if (tag === "Red Flag" || ["Conflict", "Jealousy", "Stress", "Disconnection"].includes(tag)) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
    if (tag === "Blue Flag" || ["Life Goals", "Career", "Future Planning", "Vulnerability", "Communication"].includes(tag)) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
    return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300";
  };

  if (!freshMoment || !connection) return null;

  const activityType = getActivityType(freshMoment);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{freshMoment.emoji}</span>
              {getActivityTypeLabel(activityType)} Details
            </DialogTitle>

          </div>
        </DialogHeader>
        
        <div className="space-y-4 px-1">
          {/* Connection Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>with {connection.name}</span>
          </div>

          {/* Date Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(freshMoment.createdAt || ''), "PPP 'at' p")}</span>
          </div>

          {/* Moment Type and Activity Type */}
          <div className="flex items-center gap-2">
            {/* Show activity type for conflicts and intimacy */}
            {(freshMoment.tags?.includes('Conflict') || freshMoment.isIntimate === true || freshMoment.tags?.includes('Intimacy')) && (
              <Badge variant="outline" className="text-xs">
                {freshMoment.tags?.includes('Conflict') ? 'Conflict' : 'Intimacy'}
              </Badge>
            )}
            
            {/* Show moment type for regular moments based on emoji/content sentiment */}
            {!freshMoment.tags?.includes('Conflict') && !freshMoment.isIntimate && !freshMoment.tags?.includes('Intimacy') && (
              <Badge variant="outline" className="text-xs">
                {['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(freshMoment.emoji) ? 'Positive' :
                 ['😕', '😢', '😠', '😞', '😤'].includes(freshMoment.emoji) ? 'Negative' : 'Neutral'}
              </Badge>
            )}
          </div>



          {/* Emoji/Type Selection (when editing) - Only for regular moments */}
          {isEditing && !freshMoment.tags?.includes('Conflict') && !freshMoment.isIntimate && !freshMoment.tags?.includes('Intimacy') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Moment Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editedEmoji === "😊" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditedEmoji("😊")}
                >
                  😊 Positive
                </Button>
                <Button
                  type="button"
                  variant={editedEmoji === "😕" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditedEmoji("😕")}
                >
                  😕 Negative
                </Button>
                <Button
                  type="button"
                  variant={editedEmoji === "🌱" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditedEmoji("🌱")}
                >
                  🌱 Neutral
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                {moment?.content}
              </p>
            )}
          </div>

          {/* Conflict Resolution Info */}
          {activityType === 'conflict' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Resolution Status</label>
              <div className="flex items-center gap-2">
                <Badge variant={moment?.isResolved ? "default" : "secondary"}>
                  {moment?.isResolved ? "Resolved" : "Unresolved"}
                </Badge>
                {moment?.isResolved && moment?.resolvedAt && (
                  <span className="text-xs text-gray-500">
                    on {format(new Date(moment.resolvedAt), "PPP")}
                  </span>
                )}
              </div>
              {moment?.isResolved && moment?.resolutionNotes && (
                <p className="text-sm bg-green-50 dark:bg-green-900 p-3 rounded-md">
                  <strong>Resolution:</strong> {moment.resolutionNotes}
                </p>
              )}
            </div>
          )}

          {/* Tags Section - Only show for regular moments */}
          {!freshMoment.tags?.includes('Conflict') && !freshMoment.isIntimate && !freshMoment.tags?.includes('Intimacy') && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            {isEditing ? (
              <div className="space-y-3">
                {/* Selected Tags Display */}
                {editedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editedTags.map((tag, index) => (
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
                        className={`h-7 text-xs ${editedTags.includes(tag) ? "bg-green-100 border-green-300 text-green-800" : ""}`}
                        onClick={() => editedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
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
            ) : (
              <div className="flex flex-wrap gap-2">
                {freshMoment.tags && freshMoment.tags.filter(tag => !['Positive', 'Negative', 'Neutral', 'Conflict', 'Intimacy'].includes(tag)).length > 0 ? (
                  freshMoment.tags
                    .filter(tag => !['Positive', 'Negative', 'Neutral', 'Conflict', 'Intimacy'].includes(tag))
                    .map((tag: string, index: number) => (
                      <Badge key={index} className={getTagColor(tag)} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                ) : (
                  <span className="text-sm text-gray-500 italic">No tags</span>
                )}
              </div>
            )}
          </div>
          )}

          {/* Reflection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reflection</label>
            {isEditing ? (
              <Textarea
                value={editedReflection}
                onChange={(e) => setEditedReflection(e.target.value)}
                placeholder="Add your personal insights and thoughts..."
                className="min-h-[100px]"
              />
            ) : freshMoment.reflection ? (
              <p className="text-sm bg-blue-50 dark:bg-blue-900 p-3 rounded-md italic">
                {freshMoment.reflection}
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic">No reflection added</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            {isEditing ? (
              <>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete} 
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}