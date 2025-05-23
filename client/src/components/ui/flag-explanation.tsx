import { useState } from "react";
import { Brain, ChevronDown, ChevronUp, Flag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlagExplanationProps {
  initiallyExpanded?: boolean;
}

export function FlagExplanation({ initiallyExpanded = false }: FlagExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const flagDescriptions = [
    {
      color: "Green",
      title: "Positive behaviors",
      description: "Signs of growth or healthy relationship dynamics",
      icon: <Heart className="h-5 w-5 text-green-500" />,
      examples: [
        "They remembered your preferences without prompting",
        "You had a meaningful conversation about your values",
        "They showed up for you during a difficult time",
        "You felt safe being vulnerable with them"
      ]
    },
    {
      color: "Red",
      title: "Concerning behaviors",
      description: "Signs that may need attention or discussion",
      icon: <Flag className="h-5 w-5 text-red-500" />,
      examples: [
        "They missed an important event without explanation",
        "Communication broke down during a disagreement",
        "You felt dismissed or invalidated",
        "Trust was broken in some way"
      ]
    },
    {
      color: "Blue",
      title: "Growth opportunities",
      description: "Areas for relationship development and deeper connection",
      icon: <Brain className="h-5 w-5 text-blue-500" />,
      examples: [
        "You discovered differences in future goals or values",
        "You identified a communication pattern that could improve",
        "A situation revealed different love languages or needs",
        "You recognized areas where more openness is needed"
      ]
    }
  ];

  return (
    <div className="bg-muted/30 rounded-lg p-4 mb-4">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-medium text-sm">Understanding Moment Tags</h3>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-3 space-y-4 text-sm">
          <p className="text-muted-foreground">
            Categorizing your moments helps you understand patterns and growth in your relationships.
          </p>
          
          <div className="space-y-4">
            {flagDescriptions.map(flag => (
              <div key={flag.color} className="space-y-2">
                <div className="flex items-center gap-2">
                  {flag.icon}
                  <span className="font-medium">{flag.color} Flag: {flag.title}</span>
                </div>
                <p className="text-muted-foreground text-xs">{flag.description}</p>
                <div className="pl-7 space-y-1">
                  <p className="text-xs font-medium">Examples:</p>
                  <ul className="list-disc pl-4 text-xs space-y-1">
                    {flag.examples.map((example, i) => (
                      <li key={i}>{example}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground italic">
            Note: Blue flags are not negative - they represent positive opportunities for growth that can strengthen your relationship with patience and communication.
          </p>
        </div>
      )}
    </div>
  );
}