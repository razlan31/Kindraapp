import { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { relationshipStages } from "@shared/schema";

interface DropdownOption {
  value: string;
  label: string;
  highlight?: boolean;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
}

function CustomDropdown({ value, onChange, options }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border-2 border-gray-300 rounded bg-white text-left flex items-center justify-between focus:border-blue-500 focus:outline-none"
      >
        <span className={selectedOption?.value ? "text-black" : "text-gray-500"}>
          {selectedOption?.label || "Select an option"}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full p-3 text-left hover:bg-gray-100 ${
                option.highlight 
                  ? "bg-red-500 text-white font-bold hover:bg-red-600" 
                  : "text-black"
              } ${
                option.value === value ? "bg-blue-100" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
            <CustomDropdown 
              value={isCustomStage ? "Custom" : relationshipStage}
              onChange={(value) => {
                console.log("Custom dropdown changed to:", value);
                if (value === "Custom") {
                  setIsCustomStage(true);
                  setRelationshipStage("");
                } else {
                  setIsCustomStage(false);
                  setRelationshipStage(value);
                }
              }}
              options={[
                { value: "", label: "-- Select Relationship Stage --" },
                { value: "Custom", label: "🎯 CUSTOM RELATIONSHIP STAGE 🎯", highlight: true },
                { value: "Potential", label: "Potential" },
                { value: "Talking", label: "Talking" },
                { value: "Situationship", label: "Situationship" },
                { value: "It's Complicated", label: "It's Complicated" },
                { value: "Dating", label: "Dating" },
                { value: "Spouse", label: "Spouse" },
                { value: "FWB", label: "FWB" },
                { value: "Ex", label: "Ex" },
                { value: "Friend", label: "Friend" },
                { value: "Best Friend", label: "Best Friend" },
                { value: "Siblings", label: "Siblings" }
              ]}
            />
            
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