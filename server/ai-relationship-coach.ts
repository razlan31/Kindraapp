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
  private storage: any;

  constructor(storage: any) {
    this.storage = storage;
  }

  async generateResponse(
    userId: number,
    userMessage: string,
    context: RelationshipContext
  ): Promise<string> {
    try {
      // Get conversation history from database first, fallback to memory
      let history = this.conversationHistory.get(userId) || [];
      
      // If no memory cache, try to load from database
      if (history.length === 0) {
        const conversations = await this.storage.getChatConversations(userId.toString());
        if (conversations.length > 0) {
          // Get the most recent conversation
          const latestConversation = conversations[conversations.length - 1];
          if (latestConversation.messages) {
            const messages = typeof latestConversation.messages === 'string' 
              ? JSON.parse(latestConversation.messages) 
              : latestConversation.messages;
            history = messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            this.conversationHistory.set(userId, history);
          }
        }
      }
      
      // Add user message to history
      const newUserMessage = {
        role: 'user' as const,
        content: userMessage,
        timestamp: new Date()
      };
      history.push(newUserMessage);

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

      // Store AI response in history
      const newAssistantMessage = {
        role: 'assistant' as const,
        content: assistantResponse,
        timestamp: new Date()
      };
      history.push(newAssistantMessage);

      // Update conversation history in memory
      this.conversationHistory.set(userId, history);

      // Save conversation to database
      try {
        const title = history.length > 1 ? history[0].content.slice(0, 50) + "..." : "New Conversation";
        const conversations = await this.storage.getChatConversations(userId.toString());
        
        console.log("💾 Saving conversation to database, current conversations:", conversations.length);
        
        if (conversations.length > 0) {
          // Update the most recent conversation
          const latestConversation = conversations[conversations.length - 1];
          console.log("📝 Updating existing conversation:", latestConversation.id);
          await this.storage.updateChatConversation(latestConversation.id, {
            messages: JSON.stringify(history),
            updatedAt: new Date()
          });
        } else {
          // Create new conversation
          console.log("📝 Creating new conversation with title:", title);
          await this.storage.createChatConversation({
            userId: userId.toString(),
            title,
            messages: JSON.stringify(history)
          });
        }
        console.log("✅ Conversation saved successfully");
      } catch (dbError) {
        console.error("❌ Failed to save conversation to database:", dbError);
        // Continue execution even if database save fails
      }

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
- Adapt advice to relationship type (Family, Romantic, Friendship, Professional, Casual/Developing)
- For family relationships (Mom, Dad, Sister, etc.): focus on appreciation, understanding, support, and maintaining healthy boundaries
- For professional relationships: emphasize respect, collaboration, and appropriate boundaries
- For romantic relationships: focus on intimacy, communication, and relationship growth
- For friendships: emphasize mutual support, shared experiences, and loyalty
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
      
      // Determine connection category for better AI context
      const familyStages = ['Mom', 'Dad', 'Mother', 'Father', 'Sister', 'Brother', 'Family', 'Parent', 'Child', 'Sibling'];
      const professionalStages = ['Colleague', 'Boss', 'Mentor', 'Coworker', 'Manager', 'Employee'];
      const romanticStages = ['Dating', 'Relationship', 'Partner', 'Spouse', 'Married', 'Engaged'];
      const friendshipStages = ['Friend', 'Best Friend', 'Acquaintance', 'Buddy'];
      const casualStages = ['Talking', 'Potential', 'Situationship', 'Crush'];
      
      let connectionType = 'Personal';
      if (familyStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Family';
      } else if (professionalStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Professional';
      } else if (romanticStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Romantic';
      } else if (friendshipStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Friendship';
      } else if (casualStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Casual/Developing';
      }
      
      summary += `\n- ${conn.name}: ${conn.relationshipStage} (${connectionType}) stage`;
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

  async startNewConversation(userId: number): Promise<void> {
    console.log("🆕 Starting new conversation for user:", userId);
    
    // Save current conversation to database if it exists
    const currentHistory = this.conversationHistory.get(userId);
    if (currentHistory && currentHistory.length > 0) {
      try {
        const title = currentHistory[0].content.slice(0, 50) + "...";
        await this.storage.createChatConversation({
          userId: userId.toString(),
          title,
          messages: JSON.stringify(currentHistory)
        });
        console.log("💾 Saved current conversation to database");
      } catch (dbError) {
        console.error("❌ Failed to save current conversation:", dbError);
      }
    }
    
    // Clear memory cache to start fresh
    this.conversationHistory.delete(userId);
    console.log("✅ New conversation started");
  }

  async clearConversationHistory(userId: number): Promise<void> {
    console.log("🗑️ Clearing all conversation history for user:", userId);
    this.conversationHistory.delete(userId);
    
    // Also clear from database
    try {
      const conversations = await this.storage.getChatConversations(userId.toString());
      for (const conversation of conversations) {
        await this.storage.deleteChatConversation(conversation.id);
      }
      console.log("✅ All conversation history cleared");
    } catch (dbError) {
      console.error("❌ Failed to clear conversation from database:", dbError);
    }
  }

  async getConversationHistory(userId: number): Promise<ChatMessage[]> {
    console.log("🔍 Loading conversation history for user:", userId);
    
    // Check memory first
    let history = this.conversationHistory.get(userId);
    console.log("📱 Memory cache has:", history?.length || 0, "messages");
    
    if (!history || history.length === 0) {
      // Load from database if not in memory
      try {
        console.log("💾 Loading from database...");
        const conversations = await this.storage.getChatConversations(userId.toString());
        console.log("📊 Found", conversations.length, "conversations in database");
        
        if (conversations.length > 0) {
          const latestConversation = conversations[conversations.length - 1];
          console.log("📄 Latest conversation:", latestConversation.title, "created:", latestConversation.createdAt);
          
          if (latestConversation.messages) {
            const messages = typeof latestConversation.messages === 'string' 
              ? JSON.parse(latestConversation.messages) 
              : latestConversation.messages;
            history = messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            console.log("✅ Loaded", history.length, "messages from database");
            this.conversationHistory.set(userId, history);
          }
        } else {
          console.log("📭 No conversations found in database");
        }
      } catch (dbError) {
        console.error("❌ Failed to load conversation from database:", dbError);
      }
    }
    
    const result = history || [];
    console.log("🎯 Returning", result.length, "messages to client");
    return result;
  }
}