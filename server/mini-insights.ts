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
          content: "You are an advanced relationship pattern analyst. Generate sophisticated, psychologically-informed insights that reveal hidden behavioral patterns, attachment dynamics, and relationship trajectories. Focus on actionable observations that go beyond surface-level analysis. Provide specific, data-driven insights in 2-3 sentences that demonstrate deep understanding of complex relationship dynamics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.8
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
      const connections = data.connections || [];
      const moments = data.recentMoments || [];
      const redFlags = moments.filter((m: any) => m.tags?.includes('Red Flag')).length;
      const greenFlags = moments.filter((m: any) => m.tags?.includes('Green Flag')).length;
      const intimateMoments = moments.filter((m: any) => m.isIntimate).length;
      
      return `Analyze comprehensive relationship patterns across ${connections.length} connections with ${moments.length} tracked moments:

BEHAVIORAL ANALYSIS:
- Red flag incidents: ${redFlags}
- Green flag moments: ${greenFlags}  
- Intimate interactions: ${intimateMoments}
- Connection stages: ${connections.map((c: any) => `${c.name} (${c.relationshipStage})`).join(', ')}

RECENT PATTERNS:
${moments.slice(0, 8).map((m: any) => `- ${m.emoji} ${m.content?.slice(0, 50)}... [${m.tags?.join(',') || 'untagged'}]`).join('\n')}

Identify hidden psychological patterns, attachment styles, communication dynamics, and predict relationship trajectories. Focus on unconscious behavioral trends and strategic relationship advice.`;

    case "calendar-day":
      return `Deep analysis of relationship dynamics on ${data.date}:
      
Day's emotional patterns: ${JSON.stringify(data.moments || []).slice(0, 300)}
Connection context: ${data.connectionContext || ""}

Analyze the emotional progression, identify triggers, assess relationship health indicators, and provide psychological insights about attachment patterns or communication styles demonstrated on this specific day.`;

    case "activity-card":
      return `Psychological analysis of this relationship moment:
      
Moment: ${data.content || data.title || ""}
Emotional indicator: ${data.emoji || ""}
Intimacy level: ${data.isPrivate ? "Private/intimate" : "General interaction"}
Behavioral tags: ${data.tags?.join(", ") || "untagged"}
Personal reflection: ${data.notes || data.reflection || "none"}

Analyze the underlying attachment dynamics, communication patterns, emotional regulation, and predict how this moment fits into broader relationship trajectory patterns.`;

    default:
      return `Conduct deep psychological analysis of relationship patterns:
      
Data: ${JSON.stringify(data).slice(0, 500)}

Identify attachment styles, communication effectiveness, emotional cycles, compatibility indicators, red flag progressions, and provide strategic relationship guidance based on behavioral psychology principles.`;
  }
}