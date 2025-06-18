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
    const recentMoments = await this.storage.getMomentsByUserId(userId, 5);
    
    if (recentMoments.length === 0) {
      return {
        title: "Capture Your First Moment",
        message: "Start your relationship journey by logging your first meaningful interaction!"
      };
    }

    // Find connection with least recent activity
    const connectionActivity = connections.map(conn => {
      const lastMoment = recentMoments.find(m => m.connectionId === conn.id);
      const daysSince = lastMoment ? 
        this.getDaysBetween(new Date(lastMoment.createdAt!), new Date()) : 999;
      return { connection: conn, daysSince };
    });

    const leastActive = connectionActivity.sort((a, b) => b.daysSince - a.daysSince)[0];
    
    if (leastActive.daysSince > 7) {
      return {
        title: "Missing Moments",
        message: `It's been a while since you connected with ${leastActive.connection.name}. How are things going?`
      };
    }

    return {
      title: "Reflect & Connect",
      message: "Any meaningful moments with your relationships today? Even small interactions matter!"
    };
  }

  private async generateAIInsight(userId: string): Promise<{ title: string; message: string }> {
    const moments = await this.storage.getMomentsByUserId(userId, 20);
    const recentMoments = moments.filter(m => 
      this.getDaysBetween(new Date(m.createdAt!), new Date()) <= 7
    );

    if (recentMoments.length >= 3) {
      return {
        title: "Pattern Detected",
        message: "You've been actively nurturing your relationships this week. Check your insights for patterns!"
      };
    }

    const positiveEmojis = ['😍', '❤️', '😊', '🥰', '💖', '✨', '🔥', '💕'];
    const recentPositive = recentMoments.filter(m => positiveEmojis.includes(m.emoji));

    if (recentPositive.length > 0) {
      return {
        title: "Positive Momentum",
        message: "Your relationships are thriving! See what's contributing to these positive moments."
      };
    }

    return {
      title: "Relationship Insights",
      message: "Ready to discover patterns in your relationships? New insights are available!"
    };
  }

  private async generateCycleReminder(userId: string): Promise<{ title: string; message: string }> {
    const cycles = await this.storage.getMenstrualCyclesByUserId(userId);
    const activeCycle = cycles.find(c => c.isActive);
    
    if (!activeCycle) {
      return {
        title: "Cycle Check-in",
        message: "How are you feeling today? Track your cycle for better relationship insights."
      };
    }

    const cycleStart = new Date(activeCycle.periodStartDate);
    const today = new Date();
    const cycleDay = this.getDaysBetween(cycleStart, today) + 1;

    // Phase-specific reminders
    if (cycleDay <= 5) {
      return {
        title: "Cycle Support",
        message: "You're in your menstrual phase. Remember to be gentle with yourself and your relationships."
      };
    } else if (cycleDay >= 12 && cycleDay <= 16) {
      return {
        title: "Energy Peak",
        message: "You're approaching your fertile window. Great time for meaningful conversations!"
      };
    } else {
      return {
        title: "Cycle Awareness",
        message: `Day ${cycleDay} of your cycle. How are your energy and mood affecting your relationships?`
      };
    }
  }
}