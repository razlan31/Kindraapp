import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag } from "lucide-react";

interface FlagExplanationProps {
  showTitle?: boolean;
}

export function FlagExplanation({ showTitle = true }: FlagExplanationProps) {
  return (
    <Card className="mb-4">
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Understanding Flag Types
          </CardTitle>
          <CardDescription>
            Different flags help you track emotional patterns in your relationships
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-greenFlag/20 flex items-center justify-center flex-shrink-0">
              <span className="text-greenFlag text-xs font-bold">G</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-greenFlag">Green Flags</h4>
              <p className="text-xs text-muted-foreground">
                Healthy, positive behaviors or emotional growth in your relationship. Examples: "They remembered your favorite coffee" or "You had a meaningful conversation about your future."
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-redFlag/20 flex items-center justify-center flex-shrink-0">
              <span className="text-redFlag text-xs font-bold">R</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-redFlag">Red Flags</h4>
              <p className="text-xs text-muted-foreground">
                Concerns or behaviors that need attention but aren't necessarily relationship-ending. Examples: "They didn't show up to an important event" or "A miscommunication caused frustration."
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">B</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">Blue Flags</h4>
              <p className="text-xs text-muted-foreground">
                Opportunities where you can grow together, showing potential for improvement. Examples: "Different future goals that need clarity" or "Working through differences in values."
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}