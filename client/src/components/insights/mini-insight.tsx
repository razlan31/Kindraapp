import { useState, useEffect } from "react";
import { Sparkles, Lightbulb, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MiniInsightProps {
  context: string; // The context where the insight is displayed
  data: any; // The relevant data for analysis
  className?: string;
}

export function MiniInsight({ context, data, className = "" }: MiniInsightProps) {
  const [insight, setInsight] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      generateInsight();
    }
  }, [data, context]);

  const generateInsight = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/ai/mini-insight", { context, data });
      const result = await response.json();
      if (result.insight) {
        setInsight(result.insight);
      }
    } catch (error) {
      console.error("Error generating mini insight:", error);
      setError("Unable to generate insight");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 ${className}`}>
        <Lightbulb className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="text-xs text-amber-700 dark:text-amber-300">
          {error}
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 ${className}`}>
        <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400 animate-pulse flex-shrink-0" />
        <span className="text-xs text-purple-700 dark:text-purple-300">
          Generating insight...
        </span>
      </div>
    );
  }

  if (!insight) {
    return null;
  }

  return (
    <div className={`flex items-start gap-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 ${className}`}>
      <TrendingUp className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
      <span className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
        {insight}
      </span>
    </div>
  );
}