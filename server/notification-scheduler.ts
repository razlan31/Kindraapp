import { DatabaseStorage } from './database-storage';

interface NotificationRule {
  type: 'moment_reminder' | 'ai_insight' | 'quote_of_the_day' | 'cycle_reminder';
  priority: number; // 1-5, higher = more important
  cooldownHours: number; // Minimum hours between same type notifications
  conditions: {
    minDaysSinceLastMoment?: number;
    maxNotificationsPerWeek?: number;
    requiresActiveConnections?: boolean;
    cycleDayRange?: [number, number]; // For cycle reminders
  };
}

export class NotificationScheduler {
  private storage: DatabaseStorage;
  
  // Smart notification rules to maintain engagement without overwhelming
  private rules: NotificationRule[] = [
    {
      type: 'moment_reminder',
      priority: 3,
      cooldownHours: 48, // Only remind every 2 days max
      conditions: {
        minDaysSinceLastMoment: 2,
        maxNotificationsPerWeek: 3,
        requiresActiveConnections: true
      }
    },
    {
      type: 'ai_insight',
      priority: 4,
      cooldownHours: 72, // Weekly insights feel more valuable
      conditions: {
        maxNotificationsPerWeek: 2,
        requiresActiveConnections: true
      }
    },
    {
      type: 'quote_of_the_day',
      priority: 2,
      cooldownHours: 24, // Daily but not forced
      conditions: {
        maxNotificationsPerWeek: 4 // Skip some days to maintain freshness
      }
    },
    {
      type: 'cycle_reminder',
      priority: 5,
      cooldownHours: 24,
      conditions: {
        maxNotificationsPerWeek: 7, // Can be daily during relevant phases
        cycleDayRange: [1, 35] // Only during active cycles
      }
    }
  ];

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  async shouldSendNotification(
    userId: string, 
    notificationType: NotificationRule['type']
  ): Promise<{ send: boolean; reason?: string }> {
    const rule = this.rules.find(r => r.type === notificationType);
    if (!rule) return { send: false, reason: 'Unknown notification type' };

    // Check cooldown period
    const recentNotifications = await this.getRecentNotifications(userId, notificationType, rule.cooldownHours);
    if (recentNotifications.length > 0) {
      return { send: false, reason: 'Still in cooldown period' };
    }

    // Check weekly limits
    const weeklyCount = await this.getWeeklyNotificationCount(userId, notificationType);
    if (weeklyCount >= (rule.conditions.maxNotificationsPerWeek || Infinity)) {
      return { send: false, reason: 'Weekly limit reached' };
    }

    // Type-specific conditions
    switch (notificationType) {
      case 'moment_reminder':
        return await this.checkMomentReminderConditions(userId, rule);
      
      case 'ai_insight':
        return await this.checkAIInsightConditions(userId, rule);
      
      case 'cycle_reminder':
        return await this.checkCycleReminderConditions(userId, rule);
      
      case 'quote_of_the_day':
        return { send: true }; // Quote is always safe to send
      
      default:
        return { send: false, reason: 'Unhandled notification type' };
    }
  }

  private async checkMomentReminderConditions(
    userId: string, 
    rule: NotificationRule
  ): Promise<{ send: boolean; reason?: string }> {
    // Check if user has active connections
    if (rule.conditions.requiresActiveConnections) {
      const connections = await this.storage.getConnectionsByUserId(userId);
      if (connections.length === 0) {
        return { send: false, reason: 'No active connections' };
      }
    }

    // Check days since last moment
    const recentMoments = await this.storage.getMomentsByUserId(userId, 10);
    if (recentMoments.length === 0) {
      return { send: true }; // First time user, gentle nudge
    }

    const lastMoment = recentMoments[0];
    const daysSinceLastMoment = this.getDaysBetween(new Date(lastMoment.createdAt!), new Date());
    
    if (daysSinceLastMoment < (rule.conditions.minDaysSinceLastMoment || 0)) {
      return { send: false, reason: 'User recently logged moments' };
    }

    // Progressive reminders: be more patient with active users
    if (recentMoments.length >= 5 && daysSinceLastMoment < 3) {
      return { send: false, reason: 'Active user, extending grace period' };
    }

    return { send: true };
  }

  private async checkAIInsightConditions(
    userId: string, 
    rule: NotificationRule
  ): Promise<{ send: boolean; reason?: string }> {
    // Only send insights if user has enough data
    const [connections, moments] = await Promise.all([
      this.storage.getConnectionsByUserId(userId),
      this.storage.getMomentsByUserId(userId, 50)
    ]);

    if (connections.length === 0) {
      return { send: false, reason: 'No connections to analyze' };
    }

    if (moments.length < 5) {
      return { send: false, reason: 'Insufficient data for meaningful insights' };
    }

    // Check for recent activity to make insights relevant
    const recentMoments = moments.filter(m => 
      this.getDaysBetween(new Date(m.createdAt!), new Date()) <= 14
    );

    if (recentMoments.length === 0) {
      return { send: false, reason: 'No recent activity to analyze' };
    }

    return { send: true };
  }

  private async checkCycleReminderConditions(
    userId: string, 
    rule: NotificationRule
  ): Promise<{ send: boolean; reason?: string }> {
    // Check if user has cycle tracking enabled
    const cycles = await this.storage.getMenstrualCyclesByUserId(userId);
    if (cycles.length === 0) {
      return { send: false, reason: 'No cycle tracking data' };
    }

    // Only remind during relevant cycle phases
    const activeCycle = cycles.find(c => c.isActive);
    if (!activeCycle) {
      return { send: false, reason: 'No active cycle to track' };
    }

    // Calculate current cycle day and check if it's in the notification range
    const cycleStart = new Date(activeCycle.periodStartDate);
    const today = new Date();
    const cycleDay = this.getDaysBetween(cycleStart, today) + 1;

    const [minDay, maxDay] = rule.conditions.cycleDayRange || [1, 35];
    if (cycleDay < minDay || cycleDay > maxDay) {
      return { send: false, reason: 'Outside cycle notification window' };
    }

    return { send: true };
  }

  async getOptimalNotificationTypes(
    userId: string, 
    targetCount: number
  ): Promise<NotificationRule['type'][]> {
    const candidates: Array<{ type: NotificationRule['type']; priority: number }> = [];

    // Check each notification type
    for (const rule of this.rules) {
      const result = await this.shouldSendNotification(userId, rule.type);
      if (result.send) {
        candidates.push({ type: rule.type, priority: rule.priority });
      }
    }

    // Sort by priority (higher first) and return top N
    return candidates
      .sort((a, b) => b.priority - a.priority)
      .slice(0, targetCount)
      .map(c => c.type);
  }

  private async getRecentNotifications(
    userId: string, 
    type: string, 
    hours: number
  ): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    
    const allNotifications = await this.storage.getNotificationsByUserId(userId);
    return allNotifications.filter(n => 
      n.type === type && new Date(n.createdAt!) > cutoffDate
    );
  }

  private async getWeeklyNotificationCount(
    userId: string, 
    type: string
  ): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const allNotifications = await this.storage.getNotificationsByUserId(userId);
    return allNotifications.filter(n => 
      n.type === type && new Date(n.createdAt!) > weekAgo
    ).length;
  }

  private getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Generate contextual notification content
  async generateNotificationContent(
    userId: string, 
    type: NotificationRule['type']
  ): Promise<{ title: string; message: string }> {
    switch (type) {
      case 'moment_reminder':
        return await this.generateMomentReminder(userId);
      
      case 'ai_insight':
        return await this.generateAIInsight(userId);
      
      case 'quote_of_the_day':
        return { title: "Daily Wisdom", message: "Check out today's relationship insight!" };
      
      case 'cycle_reminder':
        return await this.generateCycleReminder(userId);
      
      default:
        return { title: "Kindra", message: "Time to connect with your relationships" };
    }
  }

  private async generateMomentReminder(userId: string): Promise<{ title: string; message: string }> {
    const connections = await this.storage.getConnectionsByUserId(userId);
    const allMoments = await this.storage.getMomentsByUserId(userId, 50);
    
    if (allMoments.length === 0) {
      return {
        title: "Welcome to Kindra",
        message: "Start building awareness by capturing moments that matter in your relationships."
      };
    }

    // Analyze patterns to provide valuable insights instead of simple reminders
    const recentWeek = allMoments.filter(m => 
      this.getDaysBetween(new Date(m.createdAt!), new Date()) <= 7
    );

    // Pattern 1: Weekend vs Weekday insights
    const weekendMoments = recentWeek.filter(m => {
      const day = new Date(m.createdAt!).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });

    if (weekendMoments.length > recentWeek.length * 0.6) {
      return {
        title: "Weekend Pattern Spotted",
        message: "Most of your meaningful moments happen on weekends. Consider scheduling quality time during weekdays too."
      };
    }

    // Pattern 2: Communication style insights
    const communicationMoments = allMoments.filter(m => 
      m.tags?.some(tag => ['Communication', 'Deep Talk', 'Conflict'].includes(tag))
    );

    if (communicationMoments.length >= 5) {
      const positiveComm = communicationMoments.filter(m => 
        m.tags?.includes('Deep Talk') || ['😊', '❤️', '🥰', '✨'].includes(m.emoji)
      );
      
      if (positiveComm.length > communicationMoments.length * 0.7) {
        return {
          title: "Communication Strength",
          message: "Your conversations tend to go well! This is a strong foundation for deeper connection."
        };
      }
    }

    // Pattern 3: Emotional intelligence insights
    const emotionalMoments = allMoments.filter(m => 
      ['💗', '😔', '🤗', '😍', '🔥'].includes(m.emoji)
    );

    if (emotionalMoments.length >= 3) {
      return {
        title: "Emotional Awareness",
        message: "You're great at recognizing emotional moments. This self-awareness strengthens relationships."
      };
    }

    // Pattern 4: Growth mindset insights for conflicts
    const resolvedConflicts = allMoments.filter(m => 
      m.isResolved && m.tags?.includes('Conflict')
    );

    if (resolvedConflicts.length > 0) {
      return {
        title: "Conflict Resolution Success",
        message: `You've successfully worked through ${resolvedConflicts.length} conflict${resolvedConflicts.length > 1 ? 's' : ''}. This shows healthy relationship skills.`
      };
    }

    // Default: Mix of gentle reminders and pattern recognition (30% reminder, 70% insights)
    const shouldShowReminder = Math.random() < 0.3;
    
    if (shouldShowReminder) {
      // Gentle logging reminder - less frequent but still present
      const daysSinceLastMoment = allMoments.length > 0 ? 
        this.getDaysBetween(new Date(allMoments[0].createdAt!), new Date()) : 999;
      
      if (daysSinceLastMoment > 7) {
        return {
          title: "Gentle Reminder",
          message: "How have your relationships been lately? Even small moments are worth capturing."
        };
      } else {
        return {
          title: "Moment Check-in",
          message: "Any meaningful interactions today? Capturing moments helps build awareness over time."
        };
      }
    }
    
    // Default insight-focused approach (70% of the time)
    return {
      title: "Relationship Intelligence",
      message: "Notice any patterns in your recent interactions? Small observations can lead to big insights."
    };
  }

  private async generateAIInsight(userId: string): Promise<{ title: string; message: string }> {
    const moments = await this.storage.getMomentsByUserId(userId, 50);
    const connections = await this.storage.getConnectionsByUserId(userId);
    
    // Advanced pattern analysis for valuable insights
    const intimacyMoments = moments.filter(m => m.isIntimate || m.intimacyRating !== null);
    const conflictMoments = moments.filter(m => m.tags?.includes('Conflict'));
    const communicationMoments = moments.filter(m => 
      m.tags?.some(tag => ['Communication', 'Deep Talk'].includes(tag))
    );

    // Timing pattern analysis
    const recentWeek = moments.filter(m => 
      this.getDaysBetween(new Date(m.createdAt!), new Date()) <= 7
    );
    
    const eveningMoments = recentWeek.filter(m => {
      const hour = new Date(m.createdAt!).getHours();
      return hour >= 18 && hour <= 23;
    });

    // Insight 1: Intimacy timing patterns
    if (intimacyMoments.length >= 5) {
      const weekendIntimacy = intimacyMoments.filter(m => {
        const day = new Date(m.createdAt!).getDay();
        return day === 0 || day === 6;
      });
      
      if (weekendIntimacy.length > intimacyMoments.length * 0.6) {
        return {
          title: "Intimacy Pattern Discovery",
          message: "Your intimate moments tend to happen on weekends. Weekday connection might deepen your bond further."
        };
      }
    }

    // Insight 2: Communication effectiveness
    if (communicationMoments.length >= 3 && conflictMoments.length >= 2) {
      const resolvedConflicts = conflictMoments.filter(m => m.isResolved);
      const ratio = resolvedConflicts.length / conflictMoments.length;
      
      if (ratio >= 0.7) {
        return {
          title: "Communication Mastery",
          message: `You resolve ${Math.round(ratio * 100)}% of conflicts positively. This shows excellent relationship skills.`
        };
      }
    }

    // Insight 3: Evening connection patterns
    if (eveningMoments.length > recentWeek.length * 0.5) {
      return {
        title: "Evening Connection Ritual",
        message: "You connect most in the evenings. Consider morning check-ins to balance relationship energy throughout the day."
      };
    }

    // Insight 4: Multi-connection analysis
    if (connections.length > 1 && moments.length >= 10) {
      const connectionMomentCounts = connections.map(conn => ({
        name: conn.name,
        count: moments.filter(m => m.connectionId === conn.id).length
      }));
      
      const mostActive = connectionMomentCounts.sort((a, b) => b.count - a.count)[0];
      const leastActive = connectionMomentCounts.sort((a, b) => a.count - b.count)[0];
      
      if (mostActive.count > leastActive.count * 3) {
        return {
          title: "Attention Distribution Insight",
          message: `${mostActive.name} gets 3x more attention than ${leastActive.name}. Balanced attention strengthens all relationships.`
        };
      }
    }

    // Insight 5: Emotional range analysis
    const emotionalEmojis = ['😍', '❤️', '😊', '🥰', '😔', '😤', '🤗', '✨'];
    const emotionalMoments = moments.filter(m => emotionalEmojis.includes(m.emoji));
    
    if (emotionalMoments.length >= 8) {
      const positiveEmojis = ['😍', '❤️', '😊', '🥰', '🤗', '✨'];
      const positiveRatio = emotionalMoments.filter(m => 
        positiveEmojis.includes(m.emoji)
      ).length / emotionalMoments.length;
      
      return {
        title: "Emotional Intelligence Score",
        message: `${Math.round(positiveRatio * 100)}% of your emotional moments are positive. You're building healthy relationship foundations.`
      };
    }

    // Default: Growth-focused insight
    return {
      title: "Relationship Growth Opportunity",
      message: "Small consistent actions build stronger connections. Notice what works best in your interactions."
    };
  }

  private async generateCycleReminder(userId: string): Promise<{ title: string; message: string }> {
    const cycles = await this.storage.getMenstrualCycles();
    const userCycles = cycles.filter(c => c.userId === userId);
    const activeCycle = userCycles.find(c => c.isActive);
    
    if (!activeCycle) {
      return {
        title: "Body-Mind Connection",
        message: "Understanding your natural rhythms can improve relationship timing and emotional awareness."
      };
    }

    const cycleStart = new Date(activeCycle.periodStartDate);
    const today = new Date();
    const cycleDay = this.getDaysBetween(cycleStart, today) + 1;
    const moments = await this.storage.getMomentsByUserId(userId, 30);

    // Analyze cycle-related relationship patterns
    const cycleMoments = moments.filter(m => m.relatedToMenstrualCycle);
    
    // Phase-specific insights and relationship guidance
    if (cycleDay <= 5) {
      // Menstrual phase insights
      const menstrualMoments = cycleMoments.filter(m => {
        const momentCycleDay = this.getDaysBetween(cycleStart, new Date(m.createdAt!)) + 1;
        return momentCycleDay <= 5;
      });
      
      if (menstrualMoments.length >= 2) {
        const conflictCount = menstrualMoments.filter(m => m.tags?.includes('Conflict')).length;
        if (conflictCount > 0) {
          return {
            title: "Menstrual Phase Pattern",
            message: "You tend to experience more conflicts during your period. Extra patience and self-care can help maintain harmony."
          };
        }
      }
      
      return {
        title: "Rest & Restore Phase",
        message: "Your body prioritizes rest now. Gentle communication and self-compassion strengthen relationships during this time."
      };
      
    } else if (cycleDay >= 12 && cycleDay <= 16) {
      // Fertile window insights
      const fertileMoments = cycleMoments.filter(m => {
        const momentCycleDay = this.getDaysBetween(cycleStart, new Date(m.createdAt!)) + 1;
        return momentCycleDay >= 12 && momentCycleDay <= 16;
      });
      
      if (fertileMoments.length >= 2) {
        const intimacyCount = fertileMoments.filter(m => m.isIntimate).length;
        if (intimacyCount > fertileMoments.length * 0.5) {
          return {
            title: "Fertile Window Connection",
            message: "Your intimate moments often align with your fertile window. This natural timing strengthens emotional bonds."
          };
        }
      }
      
      return {
        title: "Peak Connection Energy",
        message: "Your communication and connection energy peaks now. Perfect time for important conversations and deeper bonding."
      };
      
    } else if (cycleDay >= 17 && cycleDay <= 24) {
      // Luteal phase insights
      return {
        title: "Nesting Energy Phase",
        message: "You naturally crave stability and comfort now. Focus on creating cozy, intimate moments with your connections."
      };
      
    } else {
      // Follicular phase insights
      const recentMoments = moments.filter(m => 
        this.getDaysBetween(new Date(m.createdAt!), new Date()) <= 7
      );
      
      if (recentMoments.length >= 3) {
        return {
          title: "Rising Energy Phase",
          message: "Your energy is building for the month ahead. Great time to plan special activities and new relationship experiences."
        };
      }
      
      return {
        title: "Fresh Start Energy",
        message: "New cycle, fresh perspective. Your optimism and openness create opportunities for deeper connections."
      };
    }
    
    // Add gentle cycle tracking reminders (20% of the time)
    const shouldShowCycleReminder = Math.random() < 0.2;
    if (shouldShowCycleReminder && !activeCycle) {
      return {
        title: "Cycle Awareness",
        message: "How are you feeling today? Tracking your cycle can help you understand your relationship patterns better."
      };
    }
  }
}