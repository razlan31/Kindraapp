import { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { relationshipStages } from "@shared/schema";

interface AddConnectionModalProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export function AddConnectionModal({ onClose, onSubmit, isLoading }: AddConnectionModalProps) {
  const [relationshipStage, setRelationshipStage] = useState("Potential");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Add the custom relationship stage to form data
    formData.set('relationshipStage', relationshipStage);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add New Connection</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Profile Image</label>
            <input 
              name="profileImage" 
              type="file" 
              accept="image/*" 
              className="w-full p-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
            <p className="text-xs text-gray-500 mt-1">Choose a photo from your device</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <Input name="name" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Relationship Stage</label>
            <select name="relationshipStage" className="w-full p-2 border rounded" defaultValue="Potential">
              {relationshipStages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input name="startDate" type="date" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Birthday</label>
            <Input name="birthday" type="date" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Zodiac Sign</label>
            <select name="zodiacSign" className="w-full p-2 border rounded">
              <option value="">Select sign</option>
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

          <div>
            <label className="block text-sm font-medium mb-1">Love Language</label>
            <select name="loveLanguage" className="w-full p-2 border rounded">
              <option value="">Select language</option>
              <option value="Words of Affirmation">Words of Affirmation</option>
              <option value="Quality Time">Quality Time</option>
              <option value="Physical Touch">Physical Touch</option>
              <option value="Acts of Service">Acts of Service</option>
              <option value="Receiving Gifts">Receiving Gifts</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" name="isPrivate" id="isPrivate" />
            <label htmlFor="isPrivate" className="text-sm">Keep this connection private</label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Adding..." : "Add Connection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}