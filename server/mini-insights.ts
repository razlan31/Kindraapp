import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export interface MiniInsightRequest {
  context: string;
  data: any;
}

export async function generateMiniInsight(request: MiniInsightRequest): Promise<string> {
  if (!openai.apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const prompt = createContextualPrompt(request.context, request.data);
    
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
    if (!generatedInsight) {
      throw new Error("No insight generated");
    }

    return generatedInsight;
  } catch (error) {
    console.error("Error generating mini insight:", error);
    throw new Error("Unable to generate insight");
  }
}

function createContextualPrompt(context: string, data: any): string {
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
}