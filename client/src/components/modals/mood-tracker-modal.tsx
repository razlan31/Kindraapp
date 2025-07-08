import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Connection } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TagSelector } from "@/components/ui/tag-selector";
import { Brain } from "lucide-react";

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
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  
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
  
  // Generate AI prompts based on notes content and mood/tags
  useEffect(() => {
    if (!notes || notes.length < 10) {
      setAiPrompt(null);
      setShowAiPrompt(false);
      return;
    }
    
    const lowerNotes = notes.toLowerCase();
    const selectedMoodOption = moodOptions.find(o => o.value === selectedMood);
    const flagType = selectedMoodOption?.flagType || "";
    
    // Keywords that might trigger specific AI responses
    const keywords = {
      conflict: ["argue", "disagree", "fight", "conflict", "upset", "misunderstand", "heated"],
      communication: ["talk", "communicate", "express", "listen", "heard", "understand", "communication"],
      growth: ["learn", "grow", "improve", "progress", "better", "change", "develop"],
      emotion: ["feel", "felt", "emotion", "stress", "anxiety", "happy", "sad", "frustrate", "angry"]
    };
    
    // Analyze notes for keywords
    const foundKeywords: string[] = [];
    Object.entries(keywords).forEach(([category, words]) => {
      if (words.some(word => lowerNotes.includes(word))) {
        foundKeywords.push(category);
      }
    });
    
    // Generate personalized AI prompt based on analysis
    if (foundKeywords.length > 0) {
      if (flagType === "Red Flag" && foundKeywords.includes("conflict")) {
        setAiPrompt(`It sounds like there was a conflict. Would you like some guidance on how to navigate this situation with ${connection?.name}?`);
      } else if (flagType === "Red Flag" && foundKeywords.includes("communication")) {
        setAiPrompt(`Communication challenges can be difficult. Would you like some tips on how to express your needs more clearly with ${connection?.name}?`);
      } else if (flagType === "Blue Flag" && foundKeywords.includes("growth")) {
        setAiPrompt(`It's wonderful that you're seeing opportunities for growth! This shows maturity in your relationship with ${connection?.name}.`);
      } else if (foundKeywords.includes("emotion")) {
        setAiPrompt(`Your emotional awareness is key to relationship growth. Would you like to explore ways to better understand these feelings?`);
      } else {
        // Default prompts based on flag type
        if (flagType === "Green Flag") {
          setAiPrompt(`It's great that you're having positive experiences with ${connection?.name}! Would you like to explore ways to nurture this connection?`);
        } else if (flagType === "Red Flag") {
          setAiPrompt(`Thank you for being honest about this challenging moment. Would you like to discuss ways to address this with ${connection?.name}?`);
        } else if (flagType === "Blue Flag") {
          setAiPrompt(`You've identified a growth opportunity in your relationship with ${connection?.name}. This is a positive step toward deeper connection.`);
        }
      }
      
      setShowAiPrompt(true);
    } else {
      // No specific keywords found, use default prompts
      if (notes.length > 20) {
        if (flagType === "Green Flag") {
          setAiPrompt(`I notice you've shared a positive moment. Would you like to explore what made this experience special?`);
        } else if (flagType === "Red Flag") {
          setAiPrompt(`Thank you for sharing this challenge. Would you like suggestions for navigating this situation?`);
        } else if (flagType === "Blue Flag") {
          setAiPrompt(`Growth opportunities like this are valuable for relationship development. Would you like to discuss this further?`);
        }
        setShowAiPrompt(true);
      }
    }
  }, [notes, selectedMood, selectedTags, connection]);
  
  // Create moment mutation
  const { mutate: createMoment, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/moments", "POST", data);
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
                  
                  {/* AI Prompt based on notes */}
                  {showAiPrompt && aiPrompt && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2 text-sm animate-fadeIn">
                      <Brain className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="text-neutral-800 dark:text-neutral-200">{aiPrompt}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-7 px-2 py-1"
                          >
                            Yes, help me
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs h-7 px-2 py-1"
                            onClick={() => setShowAiPrompt(false)}
                          >
                            No thanks
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
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

export default MoodTrackerModal;