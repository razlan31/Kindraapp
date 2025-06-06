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
          content: "You are a relationship assistant. Provide short, simple insights in 1-2 sentences. Be direct and helpful without complex analysis. Focus on clear, actionable observations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 50,
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
      return `Brief insight about this conflict: ${data.content || ""} Tags: ${data.tags?.join(", ") || ""}`;

    case "moment-entry":
      return `Quick insight about this moment: ${data.content || ""} ${data.emoji || ""} Tags: ${data.tags?.join(", ") || ""}`;

    case "connection-profile":
      return `Brief relationship insight for ${data.relationshipStage || ""} stage with ${data.loveLanguage || ""} love language`;

    case "activities-overview":
      const connections = data.connections || [];
      const moments = data.recentMoments || [];
      return `Quick insight about ${connections.length} connections and ${moments.length} recent moments`;

    case "calendar-day":
      return `Brief insight about relationship activity on ${data.date}`;

    case "activity-card":
      return `Quick insight: ${data.content || ""} ${data.emoji || ""} Tags: ${data.tags?.join(", ") || ""}`;

    default:
      return `Brief relationship insight based on recent activity`;
  }
}