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
    return `You are an advanced AI relationship analyst with deep expertise in behavioral patterns, attachment styles, and relationship dynamics. Provide sophisticated, personalized insights based on comprehensive data analysis.

ANALYTICAL APPROACH:
- Identify subtle patterns across multiple relationship dynamics
- Recognize attachment styles and communication patterns
- Detect emotional cycles and behavioral triggers
- Analyze compatibility indicators and conflict sources
- Spot red flags, green flags, and growth opportunities

INSIGHT DEPTH REQUIREMENTS:
- Go beyond surface observations to uncover underlying dynamics
- Connect patterns across different relationships and timeframes
- Identify psychological and emotional trends
- Provide predictions based on current trajectory
- Offer strategic relationship guidance

ANALYSIS FRAMEWORK:
1. PATTERN RECOGNITION: Identify recurring themes across relationships
2. EMOTIONAL INTELLIGENCE: Analyze emotional responses and triggers
3. COMPATIBILITY ASSESSMENT: Evaluate relationship health and potential
4. BEHAVIORAL TRENDS: Track changes over time and predict outcomes
5. STRATEGIC RECOMMENDATIONS: Provide specific, actionable guidance

USER'S COMPREHENSIVE RELATIONSHIP DATA:
${contextSummary}

RESPONSE REQUIREMENTS:
- Reference specific moments, patterns, and connections by name
- Provide multi-layered analysis with psychological depth
- Offer concrete predictions and strategic recommendations
- Identify both conscious and unconscious relationship patterns
- Connect individual moments to broader relationship trajectories`;
  }

  private generateContextSummary(context: RelationshipContext): string {
    const { user, connections, recentMoments, connectionHealthScores } = context;

    let summary = `USER PROFILE:
- Name: ${user.displayName || user.username}
- Love Language: ${user.loveLanguage || 'Not specified'}
- Zodiac Sign: ${user.zodiacSign || 'Not specified'}
- Total Tracked Connections: ${connections.length}
- Total Relationship Moments: ${recentMoments.length}

DETAILED CONNECTION ANALYSIS:`;

    connections.forEach(conn => {
      const connectionMoments = recentMoments.filter(m => m.connectionId === conn.id);
      const healthData = connectionHealthScores.find(h => h.name === conn.name);
      const intimateMoments = connectionMoments.filter(m => m.isIntimate).length;
      const redFlags = connectionMoments.filter(m => m.tags?.includes('Red Flag')).length;
      const greenFlags = connectionMoments.filter(m => m.tags?.includes('Green Flag')).length;
      
      summary += `\n\n${conn.name} (${conn.relationshipStage}):
  - Duration: Since ${conn.startDate ? new Date(conn.startDate).toLocaleDateString() : 'Unknown'}
  - Zodiac Compatibility: ${user.zodiacSign} + ${conn.zodiacSign || 'Unknown'}
  - Love Languages: ${user.loveLanguage} + ${conn.loveLanguage || 'Unknown'}
  - Total Moments: ${connectionMoments.length}
  - Intimate Moments: ${intimateMoments}
  - Red Flags: ${redFlags} | Green Flags: ${greenFlags}`;
      
      if (healthData) {
        summary += `\n  - Health Score: ${healthData.healthScore}% (${healthData.positivePatterns}/${healthData.totalMoments} positive)`;
      }
      
      // Recent pattern analysis for this connection
      const recentConnectionMoments = connectionMoments.slice(0, 3);
      if (recentConnectionMoments.length > 0) {
        summary += `\n  - Recent Pattern:`;
        recentConnectionMoments.forEach(moment => {
          const tags = moment.tags && moment.tags.length > 0 ? ` [${moment.tags.join(', ')}]` : '';
          summary += `\n    ${moment.emoji} "${moment.content}"${tags}`;
        });
      }
    });

    summary += `\n\nCOMPREHENSIVE EMOTIONAL PATTERNS:`;
    
    // Emotional frequency analysis
    const emotionCounts = recentMoments.reduce((acc: Record<string, number>, moment) => {
      acc[moment.emoji] = (acc[moment.emoji] || 0) + 1;
      return acc;
    }, {});

    const topEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emoji, count]) => `${emoji} (${count})`)
      .join(', ');

    summary += `\n- Most Frequent Emotions: ${topEmotions}`;

    // Tag analysis for behavioral patterns
    const allTags = recentMoments.flatMap(m => m.tags || []);
    const tagCounts = allTags.reduce((acc: Record<string, number>, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    const redFlags = tagCounts['Red Flag'] || 0;
    const greenFlags = tagCounts['Green Flag'] || 0;
    const intimateMoments = recentMoments.filter(m => m.isIntimate).length;

    summary += `\n- Behavioral Indicators: ${redFlags} Red Flags, ${greenFlags} Green Flags`;
    summary += `\n- Intimacy Level: ${intimateMoments}/${recentMoments.length} moments marked intimate`;

    // Relationship stage distribution
    const stageDistribution = connections.reduce((acc: Record<string, number>, conn) => {
      acc[conn.relationshipStage] = (acc[conn.relationshipStage] || 0) + 1;
      return acc;
    }, {});

    summary += `\n- Relationship Stages: ${Object.entries(stageDistribution).map(([stage, count]) => `${stage} (${count})`).join(', ')}`;

    // Time-based patterns
    const recentDays = recentMoments.filter(m => {
      if (!m.createdAt) return false;
      const momentDate = new Date(m.createdAt);
      const daysDiff = (Date.now() - momentDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    summary += `\n- Recent Activity: ${recentDays} moments in past 7 days`;

    summary += `\n\nKEY ANALYSIS AREAS FOR DEEP INSIGHTS:
1. Attachment style patterns across different relationship types
2. Communication effectiveness and conflict resolution trends
3. Emotional regulation during intimate vs non-intimate interactions
4. Love language compatibility and fulfillment patterns
5. Red flag progression and relationship trajectory predictions
6. Zodiac compatibility correlation with relationship satisfaction`;

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