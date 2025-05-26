import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

// Predefined tag categories with their respective tags
const tagCategories = [
  {
    name: "Connection Type",
    tags: ["Intimacy", "Growth", "Communication", "Trust", "Support", "Fun"]
  },
  {
    name: "Needs & Desires",
    tags: ["Physical Touch", "Quality Time", "Words of Affirmation", "Acts of Service", "Gifts"]
  },
  {
    name: "Life Areas",
    tags: ["Life Goals", "Career", "Family", "Future Planning", "Finances", "Health"]
  },
  {
    name: "Emotions",
    tags: ["Joy", "Vulnerability", "Excitement", "Disappointment", "Anxiety", "Trust Issues"]
  }
];

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [activeCategory, setActiveCategory] = useState(tagCategories[0].name);

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
        {tagCategories.map(category => (
          <Button
            key={category.name}
            type="button"
            variant={activeCategory === category.name ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(category.name)}
            className="whitespace-nowrap text-xs"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map(tag => (
            <div 
              key={tag} 
              className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs flex items-center gap-1"
            >
              {tag}
              <button 
                onClick={() => handleTagClick(tag)}
                className="text-primary hover:text-primary/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tags for the active category */}
      <div className="flex flex-wrap gap-2">
        {tagCategories
          .find(category => category.name === activeCategory)
          ?.tags.map(tag => (
            <Button
              key={tag}
              type="button"
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              size="sm"
              onClick={() => handleTagClick(tag)}
              className={`text-xs ${selectedTags.includes(tag) ? "bg-primary" : ""}`}
            >
              {tag}
            </Button>
          ))}
      </div>
    </div>
  );
}