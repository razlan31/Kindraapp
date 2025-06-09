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
    return `You are a warm, empathetic AI relationship coach specializing in both interpersonal relationships and personal growth. Your role is to provide supportive, practical advice based on the user's specific situation and tracking data.

PERSONALITY & TONE:
- Be warm, encouraging, and non-judgmental
- Use a conversational, supportive tone
- Show genuine care and understanding
- Acknowledge the user's feelings and experiences
- Be optimistic but realistic
- Celebrate achievements and growth patterns

CORE EXPERTISE AREAS:
1. INTERPERSONAL RELATIONSHIPS: Dating, committed partnerships, friendships, family dynamics
2. PERSONAL GROWTH: Self-awareness, achievements, reflection patterns, self-care habits
3. EMOTIONAL INTELLIGENCE: Understanding patterns, triggers, and emotional regulation
4. LIFE BALANCE: Integrating relationship health with personal development

GUIDELINES:
- Always reference the user's specific tracking data when relevant
- Provide actionable, practical suggestions tailored to their patterns
- Recognize both relationship moments AND self-connection moments
- For self-connection insights: focus on achievement patterns, reflection habits, growth opportunities
- For relationships: emphasize communication, connection quality, and stage-appropriate advice
- Avoid generic advice - make it deeply personal to their situation
- If unclear, ask clarifying questions
- Never provide medical, legal, or clinical psychological diagnoses
- Encourage both healthy relationships and strong self-relationship

USER'S COMPLETE CONTEXT:
${contextSummary}

SPECIAL FOCUS AREAS:
- If they track self-moments: acknowledge their self-awareness journey and growth patterns
- If they're achievement-focused: encourage balanced reflection and celebrate wins
- If they're reflection-heavy: encourage action-taking and achievement celebration
- If they lack self-tracking: gently suggest the value of personal growth documentation
- Always connect personal growth insights to relationship health when relevant

Remember to:
1. Use the user's actual tracking data in your responses
2. Reference specific connections by name when relevant
3. Acknowledge both relationship AND personal growth patterns
4. Provide concrete next steps for both areas
5. Ask follow-up questions to better understand their situation
6. Celebrate their progress in tracking and self-awareness`;
  }

  private generateContextSummary(context: RelationshipContext): string {
    const { user, connections, recentMoments, connectionHealthScores } = context;

    // Identify self-connection for personal growth analysis
    const selfConnection = connections.find(c => 
      c.relationshipStage === 'Self' || c.name.includes('(ME)')
    );
    
    const selfMoments = selfConnection ? 
      recentMoments.filter(m => m.connectionId === selfConnection.id) : [];
    
    const relationshipMoments = recentMoments.filter(m => 
      !selfConnection || m.connectionId !== selfConnection.id
    );

    let summary = `USER PROFILE:
- Name: ${user.displayName || user.username}
- Love Language: ${user.loveLanguage || 'Not specified'}
- Zodiac Sign: ${user.zodiacSign || 'Not specified'}

PERSONAL GROWTH TRACKING:`;

    if (selfConnection && selfMoments.length > 0) {
      const achievementTags = ['Achievement', 'Success', 'Growth', 'Milestone', 'Goal'];
      const selfReflectionTags = ['Reflection', 'Learning', 'Insight', 'Realization'];
      const selfCareTags = ['Self Care', 'Health', 'Wellness', 'Exercise', 'Rest'];
      
      const achievementMoments = selfMoments.filter(m => 
        m.tags?.some(tag => achievementTags.includes(tag)) ||
        ['🏆', '🎯', '✅', '💪', '🌟', '🎉', '🥳'].includes(m.emoji)
      );
      
      const reflectionMoments = selfMoments.filter(m => 
        m.tags?.some(tag => selfReflectionTags.includes(tag)) ||
        ['🤔', '💭', '📝', '🧠', '💡'].includes(m.emoji)
      );
      
      const selfCareMoments = selfMoments.filter(m => 
        m.tags?.some(tag => selfCareTags.includes(tag)) ||
        ['🧘', '🏃‍♀️', '🛀', '💆', '🌿', '🍃', '☕'].includes(m.emoji)
      );

      summary += `
- Self-moments tracked: ${selfMoments.length} total
- Achievements: ${achievementMoments.length} moments
- Reflections: ${reflectionMoments.length} moments  
- Self-care: ${selfCareMoments.length} moments`;

      if (achievementMoments.length > reflectionMoments.length * 2) {
        summary += `\n- Pattern: Achievement-focused mindset - celebrates wins regularly`;
      } else if (reflectionMoments.length > achievementMoments.length && achievementMoments.length < 2) {
        summary += `\n- Pattern: Reflection-heavy - thoughtful but may need more celebration`;
      } else if (selfCareMoments.length > achievementMoments.length + reflectionMoments.length) {
        summary += `\n- Pattern: Self-care focused - prioritizes wellness and health`;
      }

      // Recent self-moments preview
      summary += `\n- Recent self-moments:`;
      selfMoments.slice(0, 3).forEach(moment => {
        const tags = moment.tags && moment.tags.length > 0 ? ` [${moment.tags.join(', ')}]` : '';
        summary += `\n  · ${moment.emoji} "${moment.content}"${tags}`;
      });
    } else if (selfConnection) {
      summary += `\n- Self-connection available but no moments tracked yet`;
    } else {
      summary += `\n- No self-connection set up for personal growth tracking`;
    }

    summary += `\n\nRELATIONSHIP CONNECTIONS (${connections.filter(c => c.relationshipStage !== 'Self').length} total):`;

    connections.filter(c => c.relationshipStage !== 'Self').forEach(conn => {
      const healthData = connectionHealthScores.find(h => h.name === conn.name);
      summary += `\n- ${conn.name}: ${conn.relationshipStage} stage`;
      if (conn.zodiacSign) summary += `, ${conn.zodiacSign}`;
      if (conn.loveLanguage) summary += `, Love Language: ${conn.loveLanguage}`;
      if (healthData) summary += `, Health Score: ${healthData.healthScore}% (${healthData.positivePatterns}/${healthData.totalMoments} positive interactions)`;
    });

    summary += `\n\nRECENT RELATIONSHIP MOMENTS (last ${relationshipMoments.length}):`;
    
    relationshipMoments.slice(0, 8).forEach(moment => {
      const connection = connections.find(c => c.id === moment.connectionId);
      const connectionName = connection ? connection.name : 'Unknown';
      const tags = moment.tags && moment.tags.length > 0 ? ` [${moment.tags.join(', ')}]` : '';
      const intimacyNote = moment.isIntimate ? ' (intimate)' : '';
      summary += `\n- ${moment.emoji} with ${connectionName}: "${moment.content}"${tags}${intimacyNote}`;
    });

    // Add patterns analysis for relationship moments only
    const emotionCounts = relationshipMoments.reduce((acc: Record<string, number>, moment) => {
      acc[moment.emoji] = (acc[moment.emoji] || 0) + 1;
      return acc;
    }, {});

    const topEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emoji, count]) => `${emoji} (${count})`)
      .join(', ');

    if (topEmotions) {
      summary += `\n\nMOST FREQUENT RELATIONSHIP EMOTIONS: ${topEmotions}`;
    }

    const intimateMoments = relationshipMoments.filter(m => m.isIntimate).length;
    if (intimateMoments > 0) {
      summary += `\nINTIMATE MOMENTS: ${intimateMoments} of ${relationshipMoments.length} recent relationship moments`;
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