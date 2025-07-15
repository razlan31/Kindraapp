import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InlineConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationshipStages?: string[];
}

const defaultRelationshipStages = [
  "Potential", "Talking", "Situationship", "It's Complicated", 
  "Dating", "Spouse", "FWB", "Ex", "Friend", "Best Friend", "Siblings"
];

export function InlineConnectionModal({ 
  isOpen, 
  onClose, 
  relationshipStages = defaultRelationshipStages 
}: InlineConnectionModalProps) {
  
  const [isCustomStage, setIsCustomStage] = useState(false);
  const [customStageValue, setCustomStageValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createConnectionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const relationshipStage = formData.get('relationshipStage') as string;
      const customStage = formData.get('customStage') as string;
      
      // Use custom stage if "Custom" is selected and custom value is provided
      const finalStage = relationshipStage === 'Custom' && customStage.trim() 
        ? customStage.trim() 
        : relationshipStage || 'Dating';

      // Handle multiple love languages
      const loveLanguages = formData.getAll('loveLanguage') as string[];
      const loveLanguageString = loveLanguages.length > 0 ? loveLanguages.join(', ') : null;

      const data = {
        name: formData.get('name') as string,
        relationshipStage: finalStage,
        startDate: formData.get('startDate') || null,
        birthday: formData.get('birthday') || null,
        zodiacSign: formData.get('zodiacSign') || null,
        loveLanguage: loveLanguageString,
        isPrivate: formData.get('isPrivate') === 'on',
      };

      return apiRequest('/api/connections', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      onClose();
      setIsCustomStage(false);
      setCustomStageValue("");
      toast({
        title: "Connection Added",
        description: "New connection has been successfully added.",
      });
    },
    onError: (error: Error) => {
      console.error('Connection creation error:', error);
      
      // Handle specific limit reached error
      if (error?.message?.includes('limit reached') || error?.requiresUpgrade) {
        toast({
          title: "Connection Limit Reached",
          description: "You've reached your free plan limit. Upgrade to Premium for unlimited connections.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to add connection. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add custom stage value to form data if custom is selected
    if (isCustomStage) {
      formData.set('customStage', customStageValue);
    }
    
    createConnectionMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-heading font-semibold text-lg">Add New Connection</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <Input name="name" required placeholder="Enter name" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Relationship Stage <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {relationshipStages.map((stage) => (
                <label key={stage} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="relationshipStage"
                    value={stage}
                    defaultChecked={stage === "Dating"}
                    onChange={() => setIsCustomStage(false)}
                    className="text-blue-600"
                  />
                  <span>{stage}</span>
                </label>
              ))}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="relationshipStage"
                  value="Custom"
                  onChange={() => setIsCustomStage(true)}
                  className="text-blue-600"
                />
                <span>Custom Relationship Stage</span>
              </label>
            </div>
            
            {isCustomStage && (
              <div className="mt-2">
                <Input
                  value={customStageValue}
                  onChange={(e) => setCustomStageValue(e.target.value)}
                  placeholder="Enter custom stage (e.g., Mom, Dad, Sister, Colleague)"
                  className="w-full"
                />
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Examples: Mom, Dad, Sister, Colleague, Mentor, etc.
            </p>
          </div>

          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-sm font-medium">Optional Details</h3>
            
            <div className="space-y-2">
              <label className="block text-xs text-neutral-500">Zodiac Sign</label>
              <select name="zodiacSign" className="w-full p-2 border rounded-md bg-background text-sm">
                <option value="">Select sign or enter birthday above</option>
                <option value="Aries">Aries</option>
                <option value="Taurus">Taurus</option>
                <option value="Gemini">Gemini</option>
                <option value="Cancer">Cancer</option>
                <option value="Leo">Leo</option>
                <option value="Virgo">Virgo</option>
                <option value="Libra">Libra</option>
                <option value="Scorpio">Scorpio</option>
                <option value="Sagittarius">Sagittarius</option>
                <option value="Capricorn">Capricorn</option>
                <option value="Aquarius">Aquarius</option>
                <option value="Pisces">Pisces</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-neutral-500">Birthday</label>
              <input
                name="birthday"
                type="date"
                className="w-full p-2 border rounded-md bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-neutral-500">Connection Start Date</label>
              <input
                name="startDate"
                type="date"
                className="w-full p-2 border rounded-md bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-neutral-500">Love Languages</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Words of Affirmation" className="mr-2" />
                  <span className="text-sm">Words of Affirmation</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Quality Time" className="mr-2" />
                  <span className="text-sm">Quality Time</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Physical Touch" className="mr-2" />
                  <span className="text-sm">Physical Touch</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Acts of Service" className="mr-2" />
                  <span className="text-sm">Acts of Service</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Receiving Gifts" className="mr-2" />
                  <span className="text-sm">Receiving Gifts</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createConnectionMutation.isPending || (isCustomStage && !customStageValue.trim())}
              className="flex-1"
            >
              {createConnectionMutation.isPending ? "Adding..." : "Add Connection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}