import OpenAI from "openai";
import { Connection, Moment, User } from "../shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface RelationshipContext {
  user: User;
  connections: Connection[];
  recentMoments: Moment[];
  connectionHealthScores: Array<{
    name: string;
    healthScore: number;
    totalMoments: number;
    positivePatterns: number;
  }>;
}

export class AIRelationshipCoach {
  private conversationHistory: Map<number, ChatMessage[]> = new Map();

  async generateResponse(
    userId: number,
    userMessage: string,
    context: RelationshipContext
  ): Promise<string> {
    try {
      // Get or initialize conversation history
      const history = this.conversationHistory.get(userId) || [];
      
      // Add user message to history
      history.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Generate relationship context summary
      const contextSummary = this.generateContextSummary(context);

      // Create system prompt
      const systemPrompt = this.createSystemPrompt(contextSummary);

      // Prepare messages for OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantResponse = completion.choices[0].message.content || "I'm here to help with your relationships. Could you tell me more about what's on your mind?";

      // Add assistant response to history
      history.push({
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      });

      // Update conversation history
      this.conversationHistory.set(userId, history);

      return assistantResponse;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble connecting right now, but I'm here to support you. Could you try asking your question again?";
    }
  }

  private createSystemPrompt(contextSummary: string): string {
    return `You are a warm, empathetic AI relationship coach. Your role is to provide supportive, practical relationship advice based on the user's specific situation and tracking data.

PERSONALITY & TONE:
- Be warm, encouraging, and non-judgmental
- Use a conversational, supportive tone
- Show genuine care and understanding
- Acknowledge the user's feelings and experiences
- Be optimistic but realistic

GUIDELINES:
- Always reference the user's specific relationship data when relevant
- Provide actionable, practical suggestions
- Avoid generic advice - make it personal to their situation
- If unclear, ask clarifying questions
- Never provide medical, legal, or clinical psychological diagnoses
- Focus on healthy relationship patterns and communication
- Encourage self-reflection and growth

USER'S RELATIONSHIP CONTEXT:
${contextSummary}

Remember to:
1. Use the user's actual relationship data in your responses
2. Reference specific connections by name when relevant
3. Acknowledge their tracking patterns and progress
4. Provide concrete next steps they can take
5. Ask follow-up questions to better understand their situation`;
  }

  private generateContextSummary(context: RelationshipContext): string {
    const { user, connections, recentMoments, connectionHealthScores } = context;

    let summary = `USER PROFILE:
- Name: ${user.displayName || user.username}
- Love Language: ${user.loveLanguage || 'Not specified'}
- Zodiac Sign: ${user.zodiacSign || 'Not specified'}

CONNECTIONS (${connections.length} total):`;

    connections.forEach(conn => {
      const healthData = connectionHealthScores.find(h => h.name === conn.name);
      summary += `\n- ${conn.name}: ${conn.relationshipStage} stage`;
      if (conn.zodiacSign) summary += `, ${conn.zodiacSign}`;
      if (conn.loveLanguage) summary += `, Love Language: ${conn.loveLanguage}`;
      if (healthData) summary += `, Health Score: ${healthData.healthScore}% (${healthData.positivePatterns}/${healthData.totalMoments} positive interactions)`;
    });

    summary += `\n\nRECENT EMOTIONAL MOMENTS (last ${recentMoments.length}):`;
    
    recentMoments.slice(0, 10).forEach(moment => {
      const connection = connections.find(c => c.id === moment.connectionId);
      const connectionName = connection ? connection.name : 'Unknown';
      const tags = moment.tags && moment.tags.length > 0 ? ` [${moment.tags.join(', ')}]` : '';
      const intimacyNote = moment.isIntimate ? ' (intimate)' : '';
      summary += `\n- ${moment.emoji} with ${connectionName}: "${moment.content}"${tags}${intimacyNote}`;
    });

    // Add patterns analysis
    const emotionCounts = recentMoments.reduce((acc: Record<string, number>, moment) => {
      acc[moment.emoji] = (acc[moment.emoji] || 0) + 1;
      return acc;
    }, {});

    const topEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emoji, count]) => `${emoji} (${count})`)
      .join(', ');

    if (topEmotions) {
      summary += `\n\nMOST FREQUENT EMOTIONS: ${topEmotions}`;
    }

    const intimateMoments = recentMoments.filter(m => m.isIntimate).length;
    if (intimateMoments > 0) {
      summary += `\nINTIMATE MOMENTS: ${intimateMoments} of ${recentMoments.length} recent moments`;
    }

    return summary;
  }

  clearConversation(userId: number): void {
    this.conversationHistory.delete(userId);
  }

  getConversationHistory(userId: number): ChatMessage[] {
    return this.conversationHistory.get(userId) || [];
  }
}

export const aiCoach = new AIRelationshipCoach();