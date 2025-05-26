import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Moment } from "@shared/schema";

interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  moment: Moment | null;
}

export function ReflectionModal({ isOpen, onClose, moment }: ReflectionModalProps) {
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addReflectionMutation = useMutation({
    mutationFn: async (data: { momentId: number; reflection: string }) => {
      const response = await fetch(`/api/moments/${data.momentId}/reflection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflection: data.reflection }),
      });
      if (!response.ok) throw new Error('Failed to add reflection');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Reflection added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/moments"] });
      setReflection("");
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to add reflection", variant: "destructive" });
    },
  });

  const handleSubmit = async () => {
    if (!moment || !reflection.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addReflectionMutation.mutateAsync({
        momentId: moment.id,
        reflection: reflection.trim()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReflection("");
    onClose();
  };

  if (!moment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Reflection</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 px-1">
          {/* Original Moment Display */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{moment.emoji}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(moment.createdAt || '').toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm">{moment.content}</p>
          </div>

          {/* Reflection Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Reflection</label>
            <Textarea
              placeholder="What deeper thoughts do you have about this moment? How did it make you feel? What did you learn?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !reflection.trim()}
            >
              {isSubmitting ? "Adding..." : "Add Reflection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}