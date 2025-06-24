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
  user: User & {
    totalBadges?: number;
    totalMoments?: number;
    totalConnections?: number;
    cycleTrackingEnabled?: boolean;
  };
  connections: Connection[];
  recentMoments: Moment[];
  connectionHealthScores: Array<{
    name: string;
    healthScore: number;
    totalMoments: number;
    positivePatterns: number;
  }>;
  cycles?: any[];
  badges?: any[];
}

export class AIRelationshipCoach {
  private conversationHistory: Map<number, ChatMessage[]> = new Map();
  private newConversationFlags: Map<number, boolean> = new Map();
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
      'my badges', 'my points', 'my stats',
      'analyze', 'me and', 'n me', '& me'
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
    
    // Check if they mention specific people from their connections
    const mentionedPeople = context.connections.filter(conn => 
      lowerMessage.includes(conn.name.toLowerCase()) || 
      (conn.firstName && lowerMessage.includes(conn.firstName.toLowerCase()))
    );
    
    // If they mention specific people, it's definitely data-specific
    if (mentionedPeople.length > 0) {
      dataSpecificScore += 4;
    }

    // Check for user context availability
    const hasConnections = context.connections && context.connections.length > 0;
    const hasMoments = context.recentMoments && context.recentMoments.length > 0;
    const hasDataContext = hasConnections || hasMoments;
    
    console.log("🔍 Intent Analysis Debug:", {
      message: lowerMessage,
      dataSpecificScore,
      generalScore,
      mentionedPeople: mentionedPeople.map(p => ({ name: p.name, stage: p.relationshipStage })),
      matchedDataIndicators: dataSpecificIndicators.filter(indicator => lowerMessage.includes(indicator))
    });
    
    // Determine intent
    let isDataSpecific = false;
    let needsClarification = false;
    let confidence = 0;
    let reasoning = "";
    
    if (dataSpecificScore > generalScore && dataSpecificScore > 0) {
      isDataSpecific = true;
      confidence = Math.min(0.9, dataSpecificScore * 0.15);
      reasoning = mentionedPeople.length > 0 
        ? `User mentioned specific people: ${mentionedPeople.map(p => p.name).join(', ')}`
        : "Question contains specific references to user's personal data";
      
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
      // Clear new conversation flag when user sends first message
      if (this.newConversationFlags.get(userId) === true) {
        console.log("🚩 Clearing new conversation flag - user sent first message");
        this.newConversationFlags.delete(userId);
      }
      
      // Get conversation history from memory only (no database fallback)
      let history = this.conversationHistory.get(userId) || [];
      console.log("📝 Current conversation history length:", history.length);
      
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
      console.log("🔍 Context Summary Generated:", contextSummary.substring(0, 500) + "...");

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

      // Save conversation when user starts typing (first message)
      if (history.length === 1) {
        try {
          const saved = await this.saveCurrentConversation(userId, history, false);
          if (saved) {
            console.log("💾 Created new conversation when user started typing");
          }
        } catch (error) {
          console.error("❌ Failed to create conversation:", error);
        }
      }
      
      // Auto-update existing conversation every few messages  
      if (history.length >= 4 && history.length % 4 === 0) {
        try {
          const saved = await this.saveCurrentConversation(userId, history, true);
          if (saved) {
            console.log("💾 Auto-updated conversation after", history.length, "messages");
          }
        } catch (error) {
          console.error("❌ Failed to auto-update conversation:", error);
        }
      }

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

CRITICAL: Always check if mentioned people are in their tracked relationships:
- When they mention someone by name (like "Alex", "Amalina", etc.), FIRST check the "IMPORTANT - YOUR TRACKED RELATIONSHIPS" section
- If the person is listed there, reference their relationship status and any data you have about them
- Use app data when relevant, but don't be limited to it - blend data insights with general relationship wisdom
- If someone is DATING/in a ROMANTIC relationship, give romantic relationship advice, not friendship advice
- You can answer both from their tracking data AND from general relationship knowledge
- Draw connections between their patterns and universal relationship principles
- Feel free to give advice that goes beyond just their tracked data - you're a full relationship expert

Your conversational style:
- Switch naturally between these roles depending on what the person needs in the moment
- Sometimes be the encouraging best friend, sometimes the wise mother, sometimes the insightful therapist
- Use natural, flowing conversation that feels like talking to someone who truly understands and cares
- Be genuinely curious and invested in their growth and happiness
- Balance wisdom with warmth, insight with empathy, intelligence with heart
- Know when to be serious and when to lighten the mood
- Don't over-emphasize theories unless they're genuinely helpful to the situation
- Focus on what actually matters to them right now

CRITICAL: Be conversational and provide comprehensive expert guidance:
- Sometimes give brief, direct responses, but when they ask for advice, provide COMPREHENSIVE guidance covering multiple dimensions
- Address them directly - use "you" and speak TO them, not just about situations
- Vary your response style: sometimes short and sweet, sometimes much deeper when they need thorough advice
- PROVIDE comprehensive answers, insights, and suggestions - YOU are the expert providing multi-layered guidance
- When they ask about improvements or advice, give BOTH immediate actionable steps AND deeper strategic guidance
- Include root cause analysis, multiple perspectives, immediate actions, long-term planning, contingency advice, and professional resources when relevant
- End responses with supportive follow-ups that invite deeper exploration:
  * Supportive check-ins: "How does this land with you?"
  * Offering depth: "I can dive deeper into any of these strategies if you'd like"
  * Validation: "You're already showing great self-awareness by asking these questions"
  * Encouragement: "This is totally workable with the right approach - you've got this"
  * Expert depth: "Want me to explore the psychology behind this more? Or focus on specific action steps?"
- Be the expert relationship coach who provides comprehensive guidance like the best therapists and relationship experts
- NEVER ask them "What do you think would help?" - YOU tell THEM what would help with detailed, multi-dimensional advice
- Combine their personal data insights with comprehensive relationship expertise for complete guidance`;

    if (intent?.needsClarification) {
      return `${basePersonality}

The user's question could be asking for either:
1. General relationship advice and wisdom
2. Analysis based on their personal relationship data in the app

Ask a clarifying question to understand what they're looking for. Be conversational and direct - maybe something like "I want to give you the best support here - are you looking for general relationship wisdom, or would you like me to dive into your specific patterns and data? What's really on your mind?" Keep it natural and vary your approach - sometimes brief, sometimes more detailed based on what they seem to need.

User Context (if they want data-specific insights):
${contextSummary}`;
    }

    if (intent?.isDataSpecific) {
      return `${basePersonality}

The user is asking about their specific relationship data. Use their personal information to provide tailored insights and observations with the perfect blend of best friend excitement, motherly wisdom, and therapist insight.

User Context:
${contextSummary}

You have access to their tracking data, but you're not limited to it. Blend insights from their patterns with universal relationship wisdom. Be specific about what you see in their data, but also draw from general relationship knowledge that applies to their situation. Address them directly about both their tracked patterns AND broader relationship dynamics.

You can reference their data (moments, connections, patterns) when relevant, but also provide general relationship advice, communication strategies, and emotional support that goes beyond just what's tracked in the app.

Vary your follow-up approach: sometimes ask for their perspective ("What patterns are you noticing?"), sometimes offer to go deeper ("Want me to elaborate on this?"), sometimes check their feelings ("How does this land with you?"), or sometimes just invite them to share more ("Tell me more about that").`;
    }

    return `${basePersonality}

The user is asking for general relationship advice, but you can also reference their app data if relevant. Be the perfect combination of wise best friend, caring mother figure, insightful therapist, and intelligent conversationalist. Provide thoughtful guidance that blends universal relationship wisdom with insights from their tracking data when applicable.

You can draw from both their tracked patterns AND general relationship psychology. If they mention someone or a situation that connects to their app data, feel free to reference it. But don't feel limited - provide comprehensive relationship advice that goes beyond just what's tracked.

If they share specific details about their situation, respond with genuine care and insight. Address them directly about their situation - be the person they can trust with their concerns. Sometimes be brief and supportive, sometimes go deeper when they need it.

Keep the conversation flowing naturally with varied approaches: quick check-ins ("How are you doing with this?"), simple invitations ("Tell me more"), clarification offers ("Want me to elaborate?"), deeper exploration ("What's really going on for you?"), or direct questions about their needs ("What would help most right now?").`;
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

    let summary = `USER PROFILE & ACCOUNT:
- Name: ${user.displayName || user.firstName || 'User'}
- Email: ${user.email}
- Username: ${user.username || 'Not set'}
- Birthday: ${user.birthday ? new Date(user.birthday).toLocaleDateString() : 'Not specified'}
- Relationship Goals: ${user.relationshipGoals || 'Not specified'}
- Relationship Style: ${user.relationshipStyle || 'Not specified'}
- Love Language: ${user.loveLanguage || 'Not specified'}
- Zodiac Sign: ${user.zodiacSign || 'Not specified'}
- Current Focus: ${user.currentFocus || 'General relationship growth'}
- Account Status: ${user.subscriptionStatus || 'free'} (${user.subscriptionPlan || 'no plan'})
- Points/Badges: ${user.points || 0} points earned
- Monthly AI Usage: ${user.monthlyAiInsights || 0} insights, ${user.monthlyAiCoaching || 0} coaching messages used this month`;
    
    if (user.personalNotes) {
      summary += `\n- Personal Notes: ${user.personalNotes}`;
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

    summary += `\n\nIMPORTANT - YOUR TRACKED RELATIONSHIPS (${connections.filter(c => c.relationshipStage !== 'Self').length} people you know):`;

    connections.filter(c => c.relationshipStage !== 'Self').forEach(conn => {
      const healthData = connectionHealthScores.find(h => h.name === conn.name);
      
      // Determine connection category for better AI context with CLEAR relationship status
      const familyStages = ['Mom', 'Dad', 'Mother', 'Father', 'Sister', 'Brother', 'Family', 'Parent', 'Child', 'Sibling'];
      const professionalStages = ['Colleague', 'Boss', 'Mentor', 'Coworker', 'Manager', 'Employee'];
      const romanticStages = ['Dating', 'Relationship', 'Partner', 'Spouse', 'Married', 'Engaged', 'Boyfriend', 'Girlfriend'];
      const friendshipStages = ['Friend', 'Best Friend', 'Acquaintance', 'Buddy'];
      const casualStages = ['Talking', 'Potential', 'Situationship', 'Crush'];
      
      let connectionType = 'Personal';
      let isRomantic = false;
      
      if (familyStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Family';
      } else if (professionalStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Professional';
      } else if (romanticStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Romantic Partner';
        isRomantic = true;
      } else if (friendshipStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Friendship';
      } else if (casualStages.some(stage => conn.relationshipStage.toLowerCase().includes(stage.toLowerCase()))) {
        connectionType = 'Casual/Developing';
      }
      
      // CRITICAL: Make relationship status very clear for AI context - include full name for recognition
      if (isRomantic) {
        summary += `\n- ${conn.name} (${conn.firstName || conn.name}): YOUR ${conn.relationshipStage.toUpperCase()} PARTNER (Romantic relationship)`;
      } else {
        summary += `\n- ${conn.name} (${conn.firstName || conn.name}): ${conn.relationshipStage} (${connectionType})`;
      }
      
      if (conn.zodiacSign) summary += `, ${conn.zodiacSign}`;
      if (conn.loveLanguage) summary += `, Love Language: ${conn.loveLanguage}`;
      if (healthData) summary += `, Health Score: ${healthData.healthScore}% (${healthData.positivePatterns}/${healthData.totalMoments} positive interactions)`;
    });

    summary += `\n\nRECENT ACTIVITIES & MOMENTS (last ${relationshipMoments.length} tracked):`;
    
    relationshipMoments.slice(0, 12).forEach(moment => {
      const connection = connections.find(c => c.id === moment.connectionId);
      const connectionName = connection ? connection.name : 'Unknown';
      const tags = moment.tags && moment.tags.length > 0 ? ` [${moment.tags.join(', ')}]` : '';
      const intimacyNote = moment.isIntimate ? ` (intimate - ${moment.intimacyRating || 'unrated'})` : '';
      const dateInfo = moment.createdAt ? ` on ${new Date(moment.createdAt).toLocaleDateString()}` : '';
      const privateNote = moment.isPrivate ? ' (private)' : '';
      
      summary += `\n- ${moment.emoji} with ${connectionName}${dateInfo}: "${moment.content}"${tags}${intimacyNote}${privateNote}`;
      
      if (moment.reflection) {
        summary += `\n  Reflection: "${moment.reflection}"`;
      }
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

    // Add comprehensive activity breakdown by type
    const momentsByType = {
      plans: relationshipMoments.filter(m => m.tags?.includes('Plan')),
      conflicts: relationshipMoments.filter(m => m.tags?.includes('Conflict')),
      intimacy: relationshipMoments.filter(m => m.isIntimate),
      achievements: relationshipMoments.filter(m => ['🏆', '🎯', '✅', '💪', '🌟', '🎉', '🥳'].includes(m.emoji)),
      communication: relationshipMoments.filter(m => ['💬', '📱', '📞', '💌', '📝'].includes(m.emoji)),
      dates: relationshipMoments.filter(m => ['💕', '❤️', '🥰', '😍', '💖', '🌹'].includes(m.emoji)),
      milestones: relationshipMoments.filter(m => m.tags?.includes('Milestone') || ['🎂', '💍', '🏠', '✈️'].includes(m.emoji))
    };

    summary += `\n\nACTIVITY BREAKDOWN:
- Plans: ${momentsByType.plans.length} scheduled/completed
- Conflicts: ${momentsByType.conflicts.length} tracked (for growth/resolution)
- Intimate moments: ${momentsByType.intimacy.length} recorded
- Achievements: ${momentsByType.achievements.length} celebrated
- Communication: ${momentsByType.communication.length} notable conversations
- Romantic dates: ${momentsByType.dates.length} special moments
- Milestones: ${momentsByType.milestones.length} important events

LOVE LANGUAGE INTEGRATION:
- Primary Love Language: ${user.loveLanguage || 'Not specified'}
- Gift-giving moments: ${relationshipMoments.filter(m => m.tags?.includes('Gift') || ['🎁', '💝', '🌹'].includes(m.emoji)).length} tracked
- Quality time activities: ${momentsByType.dates.length + momentsByType.plans.length} shared experiences
- Physical affection: ${relationshipMoments.filter(m => ['🤗', '💋', '🔥'].includes(m.emoji)).length} intimate moments
- Words of affirmation: ${momentsByType.communication.length} meaningful conversations
- Acts of service: ${relationshipMoments.filter(m => m.tags?.includes('Acts of Service') || ['🏠', '🍳', '🚗'].includes(m.emoji)).length} supportive actions`;

    // Add cycle tracking information if available
    const cycleConnections = connections.filter(c => c.relationshipStage === 'Dating' || c.relationshipStage === 'Relationship');
    if (cycleConnections.length > 0) {
      summary += `\n\nMENSTRUAL CYCLE TRACKING:`;
      cycleConnections.forEach(conn => {
        summary += `\n- ${conn.name}: Cycle tracking enabled (for relationship timing insights)`;
      });
    }

    // Add cycles data if available
    if (context.cycles && context.cycles.length > 0) {
      const activeCycles = context.cycles.filter((cycle: any) => cycle.isActive);
      summary += `\n- Active cycles: ${activeCycles.length}`;
      summary += `\n- Total cycles tracked: ${context.cycles.length}`;
    }

    // Add badges information if available
    if (context.badges && context.badges.length > 0) {
      summary += `\n\nACHIEVEMENTS & BADGES:
- Total badges earned: ${context.badges.length}
- Recent achievements tracked for relationship growth motivation`;
    }

    // Add relationship-specific insights based on goals and style
    summary += `\n\nRELATIONSHIP CONTEXT & INSIGHTS:
- Dating Goals: ${user.relationshipGoals || 'Not specified'} (tailor advice accordingly)
- Relationship Style: ${user.relationshipStyle || 'Not specified'}
- Current Focus: ${user.currentFocus || 'General relationship growth'}
- Zodiac Considerations: ${user.zodiacSign || 'Not specified'} (use sparingly, 25% of time)
- Connection health scores calculated for all ${connections.length} tracked relationships
- Pattern analysis across ${relationshipMoments.length} total moments reveals behavioral trends
- Emotional intelligence tracking through detailed moment reflections and tags
- Communication effectiveness patterns based on conflict resolution success
- Intimacy progression and connection quality metrics over time
- Activity preferences and love language alignment analysis available

COACHING APPROACH:
- Reference specific tracked moments when giving advice
- Connect patterns to user's stated relationship goals and love language preferences  
- Use health scores and activity breakdowns to provide personalized insights
- Balance app data analysis with universal relationship wisdom
- Relate cycle tracking data to relationship timing and emotional patterns when relevant`;

    return summary;
  }

  async startNewConversation(userId: number): Promise<void> {
    console.log("🆕 Starting new conversation for user:", userId);
    
    // CRITICAL: Clear memory cache completely to start fresh
    this.conversationHistory.delete(userId);
    console.log("🧹 Cleared in-memory conversation history - userId:", userId);
    
    // Don't create empty conversation - wait for user to actually start typing
    console.log("🚫 Waiting for user input before saving conversation");
    console.log("🔍 Memory cache state after clear:", this.conversationHistory.has(userId));
    console.log("📝 Conversation history size:", this.conversationHistory.size);
    
    // Set flag to prevent database restoration
    this.newConversationFlags.set(userId, true);
    console.log("🚩 Set new conversation flag for user:", userId);
    
    // Double-check the clear worked
    const verifyEmpty = this.conversationHistory.get(userId);
    console.log("🔍 Double-check after delete - userId", userId, "has messages:", verifyEmpty?.length || 0);
    
    // If somehow it still exists, force clear it
    if (verifyEmpty && verifyEmpty.length > 0) {
      console.log("⚠️ Memory cache still had data, force clearing...");
      this.conversationHistory.set(userId, []);
      this.conversationHistory.delete(userId);
    }
    
    console.log("✅ New conversation started - memory state reset");
  }

  async loadConversation(userId: number, messages: any[]): Promise<void> {
    console.log("📂 Loading conversation for user:", userId, "with", messages.length, "messages");
    
    // Parse messages if they're stored as string
    let parsedMessages: ChatMessage[];
    if (typeof messages === 'string') {
      parsedMessages = JSON.parse(messages);
    } else {
      parsedMessages = messages;
    }
    
    // Convert timestamps to Date objects
    const formattedMessages = parsedMessages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
    // Clear any new conversation flag
    this.newConversationFlags.delete(userId);
    
    // Load messages into memory cache
    this.conversationHistory.set(userId, formattedMessages);
    console.log("📂 Conversation loaded into memory cache");
  }

  private async saveCurrentConversation(userId: number, messages: ChatMessage[], isAutoSave: boolean = false): Promise<boolean> {
    if (messages.length === 0) return false;
    
    const title = messages[0]?.content.slice(0, 50) + "..." || "New Conversation";
    const messagesJson = JSON.stringify(messages);
    
    try {
      // Get existing conversations to check for duplicates
      const conversations = await this.storage.getChatConversations(userId.toString());
      
      // Check for exact duplicate by comparing message content (not just title)
      const exactDuplicate = conversations.find((conv: any) => {
        try {
          const existingMessages = typeof conv.messages === 'string' ? conv.messages : JSON.stringify(conv.messages);
          return existingMessages === messagesJson;
        } catch {
          return false;
        }
      });
      
      if (exactDuplicate) {
        console.log("📝 Exact conversation already exists, skipping save");
        return false;
      }
      
      // Check if this is a continuation of an existing conversation (by first message content)
      const existingConversation = conversations.find((conv: any) => {
        try {
          const existingMessages = typeof conv.messages === 'string' ? JSON.parse(conv.messages) : conv.messages;
          return existingMessages.length > 0 && existingMessages[0]?.content === messages[0]?.content;
        } catch {
          return false;
        }
      });
      
      if (existingConversation) {
        // Update existing conversation with new messages
        await this.storage.updateChatConversation(existingConversation.id, {
          messages: messagesJson,
          updatedAt: new Date()
        });
        console.log("💾 Updated existing conversation:", title);
        return true;
      } else {
        // Create new conversation
        await this.storage.createChatConversation({
          userId: userId.toString(),
          title,
          messages: messagesJson
        });
        console.log("💾 Created new conversation:", title);
        return true;
      }
    } catch (error) {
      console.error("❌ Failed to save conversation:", error);
      return false;
    }
  }

  async clearConversationHistory(userId: number): Promise<void> {
    console.log("🗑️ Clearing all conversation history for user:", userId);
    
    // Clear memory cache completely
    this.conversationHistory.delete(userId);
    console.log("🧹 Cleared in-memory conversation history");
    
    // Also clear from database
    try {
      const conversations = await this.storage.getChatConversations(userId.toString());
      for (const conversation of conversations) {
        await this.storage.deleteChatConversation(conversation.id);
      }
      console.log("🗑️ Cleared all conversations from database");
      console.log("✅ All conversation history cleared completely");
    } catch (dbError) {
      console.error("❌ Failed to clear conversation from database:", dbError);
    }
  }

  async getConversationHistory(userId: number): Promise<ChatMessage[]> {
    console.log("🔍 Loading conversation history for user:", userId);
    console.log("🔍 Memory cache state - has user?", this.conversationHistory.has(userId));
    console.log("🔍 New conversation flag:", this.newConversationFlags.get(userId));
    console.log("🔍 Total users in memory:", this.conversationHistory.size);
    
    // If user just started a new conversation, always return empty array
    if (this.newConversationFlags.get(userId) === true) {
      console.log("🆕 User has new conversation flag - returning empty history");
      return [];
    }
    
    // Only return memory cache - no database fallback for fresh conversation experience
    const memoryHistory = this.conversationHistory.get(userId);
    console.log("📱 Memory cache has:", memoryHistory?.length || 0, "messages");
    
    if (memoryHistory && memoryHistory.length > 0) {
      console.log("🎯 Returning from memory cache:", memoryHistory.map(m => m.role + ': ' + m.content.substring(0, 50)));
      return memoryHistory;
    }
    
    console.log("📝 No memory cache found - returning empty for fresh start");
    console.log("🎯 Returning empty conversation to client");
    return [];
  }
}