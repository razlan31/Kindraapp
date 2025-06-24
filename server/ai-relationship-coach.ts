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

  // Analyze user intent to determine response strategy
  private analyzeIntent(message: string, context: RelationshipContext): {
    isDataSpecific: boolean;
    needsClarification: boolean;
    confidence: number;
    reasoning: string;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Strong indicators for data-specific questions
    const dataSpecificIndicators = [
      'my relationship', 'my connection', 'my partner', 'our relationship',
      'my data', 'my moments', 'my tracking', 'my progress',
      'how am i doing', 'what does my', 'based on my',
      'analyze my', 'my patterns', 'my behavior',
      'my cycle', 'my period', 'my mood',
      'my badges', 'my points', 'my stats'
    ];
    
    // Strong indicators for general questions
    const generalIndicators = [
      'how to', 'what should i', 'how do i',
      'in general', 'generally speaking', 'typically',
      'people usually', 'most relationships', 'dating advice',
      'relationship tips', 'communication skills',
      'red flags', 'green flags', 'healthy relationships'
    ];
    
    // Ambiguous phrases that might need clarification
    const ambiguousIndicators = [
      'relationship', 'dating', 'partner', 'communication',
      'trust', 'love', 'feelings', 'emotions',
      'conflict', 'fight', 'argue', 'problem'
    ];
    
    let dataSpecificScore = 0;
    let generalScore = 0;
    let ambiguousScore = 0;
    
    // Score based on indicators
    dataSpecificIndicators.forEach(indicator => {
      if (lowerMessage.includes(indicator)) dataSpecificScore += 2;
    });
    
    generalIndicators.forEach(indicator => {
      if (lowerMessage.includes(indicator)) generalScore += 2;
    });
    
    ambiguousIndicators.forEach(indicator => {
      if (lowerMessage.includes(indicator)) ambiguousScore += 1;
    });
    
    // Check for user context availability
    const hasConnections = context.connections && context.connections.length > 0;
    const hasMoments = context.recentMoments && context.recentMoments.length > 0;
    const hasDataContext = hasConnections || hasMoments;
    
    // Determine intent
    let isDataSpecific = false;
    let needsClarification = false;
    let confidence = 0;
    let reasoning = "";
    
    if (dataSpecificScore > generalScore && dataSpecificScore > 0) {
      isDataSpecific = true;
      confidence = Math.min(0.9, dataSpecificScore * 0.15);
      reasoning = "Question contains specific references to user's personal data";
      
      // But if no data available, suggest clarification
      if (!hasDataContext) {
        needsClarification = true;
        reasoning += " but no tracking data available";
      }
    } else if (generalScore > dataSpecificScore && generalScore > 0) {
      isDataSpecific = false;
      confidence = Math.min(0.9, generalScore * 0.15);
      reasoning = "Question appears to be asking for general relationship advice";
    } else if (ambiguousScore > 0 && (dataSpecificScore === generalScore)) {
      needsClarification = true;
      confidence = 0.3;
      reasoning = "Question is ambiguous - could be general or data-specific";
    } else {
      // Default to general for unclear questions
      isDataSpecific = false;
      confidence = 0.5;
      reasoning = "Defaulting to general advice for unclear question";
    }
    
    return { isDataSpecific, needsClarification, confidence, reasoning };
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

      // Analyze user intent
      const intent = this.analyzeIntent(userMessage, context);
      console.log(`🧠 Intent Analysis: ${intent.reasoning} (confidence: ${intent.confidence})`);

      // Generate relationship context summary
      const contextSummary = this.generateContextSummary(context);

      // Create system prompt based on intent
      const systemPrompt = this.createSystemPrompt(contextSummary, intent);

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

      // Don't save to database during regular chat - only save when starting new chat
      // This prevents duplicate conversations from being created

      return assistantResponse;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble connecting right now, but I'm here to support you. Could you try asking your question again?";
    }
  }

  private createSystemPrompt(contextSummary: string, intent?: {
    isDataSpecific: boolean;
    needsClarification: boolean;
    confidence: number;
    reasoning: string;
  }): string {
    const basePersonality = `You are Luna, a uniquely compassionate AI who embodies the best qualities of a best friend, relationship expert, ChatGPT, mother, sibling, therapist, and intelligent AI all rolled into one.

Your multifaceted personality:
- **Best Friend**: Loyal, fun, always on their side, shares in their excitement and supports them through tough times
- **Relationship Expert**: Knowledgeable about relationship dynamics, communication patterns, and healthy boundaries
- **ChatGPT Intelligence**: Conversational, knowledgeable, helpful, and naturally engaging in discussion
- **Motherly Wisdom**: Nurturing, protective, offers gentle guidance and unconditional support
- **Sibling Energy**: Sometimes playful and teasing (in a loving way), keeps things real, calls them out when needed but with love
- **Therapist Insight**: Asks the right questions, helps them understand patterns, non-judgmental and emotionally intelligent
- **Intelligent AI**: Analytical when needed, can process complex situations, remembers context and connections

Your conversational style:
- Switch naturally between these roles depending on what the person needs in the moment
- Sometimes be the encouraging best friend, sometimes the wise mother, sometimes the insightful therapist
- Use natural, flowing conversation that feels like talking to someone who truly understands and cares
- Be genuinely curious and invested in their growth and happiness
- Balance wisdom with warmth, insight with empathy, intelligence with heart
- Know when to be serious and when to lighten the mood
- Don't over-emphasize theories unless they're genuinely helpful to the situation
- Focus on what actually matters to them right now

CRITICAL: Always keep the conversation flowing:
- End every response with a thoughtful question or gentle suggestion
- Ask follow-up questions that show you're genuinely curious about their situation
- Suggest next steps or offer to explore topics deeper
- Make them feel heard and encourage them to share more
- Use questions like: "What's that been like for you?", "How are you feeling about that?", "Want to talk about what's really on your mind?", "What would feel most helpful right now?"
- Be the friend who always has something meaningful to ask or suggest`;

    if (intent?.needsClarification) {
      return `${basePersonality}

The user's question could be asking for either:
1. General relationship advice and wisdom
2. Analysis based on their personal relationship data in the app

Ask a clarifying question to understand what they're looking for, then follow up with genuine curiosity. Be conversational and caring - maybe something like "I want to give you the best support here - are you looking for general relationship wisdom, or would you like me to dive into your specific patterns and data from the app? Either way, I'm here for you - what's really on your mind today?" Always end with a follow-up question to keep them engaged.

User Context (if they want data-specific insights):
${contextSummary}`;
    }

    if (intent?.isDataSpecific) {
      return `${basePersonality}

The user is asking about their specific relationship data. Use their personal information to provide tailored insights and observations with the perfect blend of best friend excitement, motherly wisdom, and therapist insight.

User Context:
${contextSummary}

Focus on their actual patterns, behaviors, and relationship dynamics based on this data. Be specific and personal in your observations - like a best friend who's been paying attention, a mother who sees their growth, and a therapist who understands the deeper patterns. Only mention concepts like love languages or zodiac signs if they're genuinely helpful to understanding their specific situation.

ALWAYS end with engaging questions like: "What patterns are you noticing yourself?", "How does this resonate with your experience?", "What would you like to explore more about this?", "Is there a specific situation you'd like to work through together?"`;
    }

    return `${basePersonality}

The user is asking for general relationship advice. Be the perfect combination of wise best friend, caring mother figure, insightful therapist, and intelligent conversationalist. Provide thoughtful, engaging guidance based on relationship psychology and universal wisdom.

Don't assume you have access to their specific tracking data unless they mention it. Focus on practical wisdom that actually helps - the kind of advice a best friend with relationship expertise would give, with the depth of a therapist and the warmth of family.

If they share specific details about their situation, respond with genuine care and insight. Be the person they can trust with their relationship concerns - someone who combines intelligence with heart.

ALWAYS keep the conversation flowing with questions like: "Tell me more about that", "What's been the hardest part?", "How are you taking care of yourself through this?", "What feels like the next right step for you?", "Want to explore what you're really hoping for?"`;
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
- Name: ${user.displayName || user.username}`;

    // Only include love language and zodiac if they might be relevant
    if (user.loveLanguage) {
      summary += `\n- Love Language: ${user.loveLanguage}`;
    }
    if (user.zodiacSign) {
      summary += `\n- Zodiac Sign: ${user.zodiacSign}`;
    }

    summary += `

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
    
    // Save current conversation to database if it exists and has messages
    const currentHistory = this.conversationHistory.get(userId);
    if (currentHistory && currentHistory.length > 0) {
      try {
        const title = currentHistory[0].content.slice(0, 50) + "...";
        
        // Check if this conversation is already saved (to prevent duplicates)
        const existingConversations = await this.storage.getChatConversations(userId.toString());
        const isAlreadySaved = existingConversations.some(conv => {
          try {
            const existingMessages = typeof conv.messages === 'string' 
              ? JSON.parse(conv.messages) 
              : conv.messages;
            return existingMessages.length === currentHistory.length &&
                   existingMessages[0]?.content === currentHistory[0]?.content;
          } catch {
            return false;
          }
        });
        
        if (!isAlreadySaved) {
          await this.storage.createChatConversation({
            userId: userId.toString(),
            title,
            messages: JSON.stringify(currentHistory)
          });
          console.log("💾 Saved current conversation to database");
        } else {
          console.log("📝 Conversation already exists in database, skipping save");
        }
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