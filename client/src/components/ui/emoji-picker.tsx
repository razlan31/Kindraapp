import { useState } from "react";
import { Button } from "@/components/ui/button";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

// Common emojis for relationship tracking
const EMOJIS = [
  "😍", "❤️", "😊", "😐", "😕", 
  "😢", "😠", "🔥", "💭", "✨",
  "🙂", "💜", "🙏", "😇", "💖",
  "🤗", "😳", "🥰", "💯", "💋"
];

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Display 10 emojis by default, or all if showAll is true
  const displayEmojis = showAll ? EMOJIS : EMOJIS.slice(0, 10);
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {displayEmojis.map((emoji, index) => (
          <Button
            key={index}
            type="button"
            variant="outline"
            onClick={() => onChange(emoji)}
            className={`emoji-btn w-10 h-10 rounded-full flex items-center justify-center text-2xl p-0
              ${value === emoji ? 'bg-primary/10 border-primary' : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
          >
            {emoji}
          </Button>
        ))}
      </div>
      
      {!showAll && (
        <Button 
          type="button" 
          variant="ghost" 
          onClick={() => setShowAll(true)}
          className="w-full text-xs text-primary"
        >
          Show more emojis
        </Button>
      )}
    </div>
  );
}
