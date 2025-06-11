import { useState } from "react";
import { X } from "lucide-react";
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
  const [isCustomStage, setIsCustomStage] = useState(false);
  const [customStageValue, setCustomStageValue] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Use custom value if custom stage is selected
    const finalStage = isCustomStage ? customStageValue : relationshipStage;
    formData.set('relationshipStage', finalStage);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add New Connection - SEPARATE COMPONENT</h2>
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
            <div className="relative">
              <select 
                value={isCustomStage ? "Custom" : relationshipStage}
                onChange={(e) => {
                  console.log("Dropdown changed to:", e.target.value);
                  if (e.target.value === "Custom") {
                    setIsCustomStage(true);
                    setRelationshipStage("");
                  } else {
                    setIsCustomStage(false);
                    setRelationshipStage(e.target.value);
                  }
                }}
                className="w-full p-3 border-2 border-red-500 rounded bg-yellow-100 text-black appearance-none"
                size={15}
              >
                <option value="">-- Select Relationship Stage --</option>
                <option value="Custom" style={{backgroundColor: '#ff0000', color: '#ffffff', fontWeight: 'bold'}}>🎯 🎯 🎯 CUSTOM OPTION HERE 🎯 🎯 🎯</option>
                <option value="Potential">Potential</option>
                <option value="Talking">Talking</option>
                <option value="Situationship">Situationship</option>
                <option value="It's Complicated">It's Complicated</option>
                <option value="Dating">Dating</option>
                <option value="Spouse">Spouse</option>
                <option value="FWB">FWB</option>
                <option value="Ex">Ex</option>
                <option value="Friend">Friend</option>
                <option value="Best Friend">Best Friend</option>
                <option value="Siblings">Siblings</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            
            {isCustomStage && (
              <div className="mt-2">
                <Input
                  value={customStageValue}
                  onChange={(e) => setCustomStageValue(e.target.value)}
                  placeholder="Enter custom relationship stage (e.g., Mom, Dad, Sister, Colleague)"
                  className="w-full"
                />
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Examples: Mom, Dad, Sister, Colleague, Mentor, etc.
            </p>
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