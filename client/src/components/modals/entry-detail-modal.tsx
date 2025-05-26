import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Edit2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch fresh moment data to ensure we have the latest reflection
  const { data: moments } = useQuery({
    queryKey: ["/api/moments"],
    enabled: isOpen && !!moment?.id,
  });

  // Get the fresh moment data from the query result
  const freshMoment = Array.isArray(moments) ? moments.find((m: Moment) => m.id === moment?.id) || moment : moment;

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

  const updateMomentMutation = useMutation({
    mutationFn: async (data: { id: number; content: string; reflection: string }) => {
      const response = await fetch(`/api/moments/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: data.content,
          reflection: data.reflection || null
        }),
      });
      if (!response.ok) throw new Error('Failed to update entry');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Entry updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/moments"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update entry", variant: "destructive" });
    },
  });

  const handleEdit = () => {
    if (freshMoment) {
      setEditedContent(freshMoment.content);
      setEditedReflection(freshMoment.reflection || "");
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!moment) return;
    
    setIsSubmitting(true);
    try {
      await updateMomentMutation.mutateAsync({
        id: moment.id,
        content: editedContent.trim(),
        reflection: editedReflection.trim()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent("");
    setEditedReflection("");
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
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
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

          {/* Tags */}
          {freshMoment.tags && freshMoment.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {freshMoment.tags.map((tag, index) => (
                <Badge key={index} className={getTagColor(tag)} variant="secondary">
                  {tag}
                </Badge>
              ))}
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
                {moment.content}
              </p>
            )}
          </div>

          {/* Conflict Resolution Info */}
          {activityType === 'conflict' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Resolution Status</label>
              <div className="flex items-center gap-2">
                <Badge variant={moment.isResolved ? "default" : "secondary"}>
                  {moment.isResolved ? "Resolved" : "Unresolved"}
                </Badge>
                {moment.isResolved && moment.resolvedAt && (
                  <span className="text-xs text-gray-500">
                    on {format(new Date(moment.resolvedAt), "PPP")}
                  </span>
                )}
              </div>
              {moment.isResolved && moment.resolutionNotes && (
                <p className="text-sm bg-green-50 dark:bg-green-900 p-3 rounded-md">
                  <strong>Resolution:</strong> {moment.resolutionNotes}
                </p>
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
                <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}