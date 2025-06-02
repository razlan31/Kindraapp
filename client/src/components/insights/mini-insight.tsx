import { useState, useEffect } from "react";
import { Sparkles, Lightbulb, TrendingUp } from "lucide-react";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

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
    if (!openai.apiKey) {
      setError("AI insights require API configuration");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const prompt = createContextualPrompt(context, data);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a relationship insight AI. Provide brief, actionable insights in 1-2 sentences. Be empathetic, practical, and focus on relationship growth. Avoid being overly positive or prescriptive."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      const generatedInsight = response.choices[0]?.message?.content?.trim();
      if (generatedInsight) {
        setInsight(generatedInsight);
      }
    } catch (error) {
      console.error("Error generating mini insight:", error);
      setError("Unable to generate insight");
    } finally {
      setIsLoading(false);
    }
  };

  const createContextualPrompt = (context: string, data: any): string => {
    switch (context) {
      case "conflict-entry":
        return `Analyze this relationship conflict entry and provide a brief insight about conflict resolution or communication:
        Description: ${data.description || data.content || ""}
        Resolution: ${data.resolution || data.resolutionNotes || ""}
        Tags: ${data.tags?.join(", ") || ""}`;

      case "moment-entry":
        return `Analyze this relationship moment and provide a brief insight about relationship patterns:
        Content: ${data.content || ""}
        Emoji: ${data.emoji || ""}
        Type: ${data.isIntimate ? "Intimate" : "General"}
        Tags: ${data.tags?.join(", ") || ""}`;

      case "connection-profile":
        return `Analyze this connection profile and provide a brief insight about compatibility or relationship dynamics:
        Relationship Stage: ${data.relationshipStage || ""}
        Love Language: ${data.loveLanguage || ""}
        Zodiac Sign: ${data.zodiacSign || ""}
        Recent Activity: ${data.recentMoments || ""}`;

      case "activities-overview":
        return `Analyze these recent relationship activities and provide a brief insight about relationship health:
        Recent Moments: ${JSON.stringify(data.recentMoments || []).slice(0, 200)}
        Total Activities: ${data.totalCount || 0}
        Connection: ${data.connectionName || ""}`;

      case "calendar-day":
        return `Analyze this day's relationship activities and provide a brief insight:
        Date: ${data.date || ""}
        Moments: ${JSON.stringify(data.moments || []).slice(0, 200)}
        Connection Context: ${data.connectionContext || ""}`;

      case "activity-card":
        return `Analyze this specific relationship activity and provide a brief insight:
        Activity: ${data.content || data.title || ""}
        Emotion: ${data.emoji || ""}
        Context: ${data.isPrivate ? "Private moment" : "Shared moment"}
        Notes: ${data.notes || data.reflection || ""}`;

      default:
        return `Provide a brief relationship insight based on this data: ${JSON.stringify(data).slice(0, 200)}`;
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