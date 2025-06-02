import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ManualInsightProps {
  context: string;
  data: any;
  className?: string;
}

export function ManualInsight({ context, data, className = "" }: ManualInsightProps) {
  const [insight, setInsight] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsight = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/ai/mini-insight", { context, data });
      const result = await response.json();
      if (result.insight) {
        setInsight(result.insight);
        setHasGenerated(true);
      }
    } catch (error) {
      console.error("Error generating insight:", error);
      setError("Unable to generate insight");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 ${className}`}>
        <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="text-sm text-amber-700 dark:text-amber-300">
          {error}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setError(null);
            setHasGenerated(false);
          }}
          className="ml-auto text-amber-600 hover:text-amber-700"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (hasGenerated && insight) {
    return (
      <div className={`flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 ${className}`}>
        <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed mb-2">
            {insight}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setInsight("");
              setHasGenerated(false);
            }}
            className="text-purple-600 hover:text-purple-700 text-xs p-0 h-auto"
          >
            Generate New Insight
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={generateInsight}
        disabled={isLoading}
        className="w-full flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20"
      >
        <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
        {isLoading ? 'Generating AI Insight...' : 'Generate AI Insight'}
      </Button>
    </div>
  );
}