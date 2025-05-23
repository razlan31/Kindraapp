import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Connection } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TagSelector } from "@/components/ui/tag-selector";

interface MoodTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: Connection | null;
}

export function MoodTrackerModal({ isOpen, onClose, connection }: MoodTrackerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showDetailedTagging, setShowDetailedTagging] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  // Define mood options
  const moodOptions = [
    { emoji: "😃", label: "Very Happy", value: "very_happy", flagType: "Green Flag" },
    { emoji: "🙂", label: "Happy", value: "happy", flagType: "Green Flag" },
    { emoji: "😐", label: "Neutral", value: "neutral", flagType: "Blue Flag" },
    { emoji: "😕", label: "Unhappy", value: "unhappy", flagType: "Red Flag" },
    { emoji: "😞", label: "Very Unhappy", value: "very_unhappy", flagType: "Red Flag" }
  ];
  
  const getFlagTagFromMood = (mood: string | null): string => {
    if (!mood) return "";
    const option = moodOptions.find(o => o.value === mood);
    return option ? option.flagType : "";
  };
  
  // Create moment mutation
  const { mutate: createMoment, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/moments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mood logged successfully",
        description: "Your emotional moment has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/moments"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to log mood",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setSelectedMood(null);
    setShowDetailedTagging(false);
    setSelectedTags([]);
    setNotes('');
  };
  
  const handleSubmit = () => {
    if (!user || !connection || !selectedMood) return;
    
    // Determine emoji based on mood
    const moodEmoji = moodOptions.find(m => m.value === selectedMood)?.emoji || "😐";
    
    // Get the flag tag based on mood
    const flagTag = getFlagTagFromMood(selectedMood);
    
    // Combine auto-generated flag tag with any user-selected tags
    const allTags = showDetailedTagging ? 
      [...selectedTags, flagTag] : 
      [flagTag];
    
    // Create the moment data
    const momentData = {
      userId: user.id,
      connectionId: connection.id,
      emoji: moodEmoji,
      content: notes || `I felt ${moodOptions.find(m => m.value === selectedMood)?.label.toLowerCase()} with ${connection.name}`,
      tags: allTags,
      isPrivate: false
    };
    
    createMoment(momentData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold">
            {connection ? `How did you feel with ${connection.name}?` : "How are you feeling?"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Mood Selection */}
          <div className="flex flex-wrap justify-between gap-2">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                variant={selectedMood === mood.value ? "default" : "outline"}
                className={`flex-1 flex flex-col items-center p-3 min-w-[70px] ${
                  selectedMood === mood.value ? "ring-2 ring-primary" : ""
                }`}
              >
                <span className="text-2xl mb-1">{mood.emoji}</span>
                <span className="text-xs">{mood.label}</span>
              </Button>
            ))}
          </div>
          
          {/* Optional: Add more details */}
          {selectedMood && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Would you like to add more details?</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDetailedTagging(!showDetailedTagging)}
                >
                  {showDetailedTagging ? "Hide details" : "Add details"}
                </Button>
              </div>
              
              {showDetailedTagging && (
                <>
                  {/* Tagging */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags (Optional)</label>
                    <div className="bg-muted/30 rounded-lg p-3 mb-2">
                      <p className="text-xs mb-2">
                        This moment will be automatically tagged as <span className="font-medium">{getFlagTagFromMood(selectedMood)}</span> based on your mood.
                      </p>
                      <p className="text-xs">You can add more tags to help you track specific aspects of this relationship moment.</p>
                    </div>
                    <TagSelector 
                      selectedTags={selectedTags} 
                      onChange={setSelectedTags}
                    />
                  </div>
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="What happened? How did it make you feel?"
                      className="w-full h-24 px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedMood}
            className="w-full bg-primary text-white"
          >
            {isPending ? "Saving..." : "Save Mood"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}