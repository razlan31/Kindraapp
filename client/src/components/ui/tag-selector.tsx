import { momentTags } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [customTag, setCustomTag] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };
  
  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      onChange([...selectedTags, customTag.trim()]);
      setCustomTag("");
      setShowCustomInput(false);
    }
  };
  
  const getTagClass = (tag: string) => {
    // Helper to get category for similar tags
    const getCategory = (tag: string) => {
      // Positive moment tags
      if (["Green Flag", "Intimacy", "Affection", "Support", "Growth", "Trust", "Celebration"].includes(tag)) {
        return "positive";
      }
      // Negative moment tags
      else if (["Red Flag", "Conflict", "Jealousy", "Stress", "Disconnection"].includes(tag)) {
        return "negative";
      }
      // Growth moment tags
      else if (["Blue Flag", "Life Goals", "Career", "Future Planning", "Vulnerability", "Communication"].includes(tag)) {
        return "growth";
      }
      // Special tags
      else if (tag === "Milestone" || tag === "Menstrual") {
        return tag.toLowerCase();
      }
      // Default for anything else
      return "default";
    };

    const category = getCategory(tag);
    
    if (selectedTags.includes(tag)) {
      switch(category) {
        case "positive":
          return "bg-greenFlag/20 text-greenFlag border-greenFlag";
        case "negative":
          return "bg-redFlag/20 text-redFlag border-redFlag";
        case "growth":
          return "bg-blue-400/20 text-blue-600 dark:text-blue-400 border-blue-500";
        case "milestone":
          return "bg-accent/20 text-neutral-700 dark:text-neutral-300 border-accent";
        case "menstrual":
          return "bg-primary/20 text-primary border-primary";
        default:
          return "bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-500";
      }
    }
    
    // Default unselected style
    switch(category) {
      case "positive":
        return "bg-greenFlag/10 text-greenFlag hover:border-greenFlag";
      case "negative":
        return "bg-redFlag/10 text-redFlag hover:border-redFlag";
      case "growth":
        return "bg-blue-400/10 text-blue-600 dark:text-blue-400 hover:border-blue-500";
      case "milestone":
        return "bg-accent/10 text-neutral-700 dark:text-neutral-300 hover:border-accent";
      case "menstrual":
        return "bg-primary/10 text-primary hover:border-primary";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-500";
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {momentTags.map((tag) => (
          <Button
            key={tag}
            type="button"
            variant="outline"
            onClick={() => handleTagToggle(tag)}
            className={`text-xs px-3 py-1.5 rounded-full border border-transparent ${getTagClass(tag)}`}
          >
            {tag}
          </Button>
        ))}
        
        {/* Custom tag button */}
        {!showCustomInput && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCustomInput(true)}
            className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-transparent hover:border-neutral-500"
          >
            <Plus className="h-3 w-3 mr-1" /> Custom
          </Button>
        )}
      </div>
      
      {/* Display custom tags */}
      {selectedTags.filter(tag => !momentTags.includes(tag as any)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.filter(tag => !momentTags.includes(tag as any)).map((tag, index) => (
            <Button
              key={`custom-${index}`}
              type="button"
              variant="outline"
              onClick={() => handleTagToggle(tag)}
              className="text-xs px-3 py-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-500"
            >
              {tag}
              <X className="h-3 w-3 ml-1" />
            </Button>
          ))}
        </div>
      )}
      
      {/* Custom tag input */}
      {showCustomInput && (
        <div className="flex items-center mt-2">
          <Input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="Enter custom tag"
            className="text-sm rounded-l-lg"
          />
          <Button 
            type="button"
            onClick={handleAddCustomTag}
            className="rounded-l-none"
          >
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowCustomInput(false)}
            className="ml-1"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
