import OpenAI from 'openai';
import { User, Connection, Moment } from '@shared/schema';

interface ReflectionData {
  relationship_stage: string;
  connection_name: string;
  love_language: string;
  connection_health: number;
  connection_health_delta: number;
  positive_count: number;
  negative_count: number;
  top_activities: string[];
  emotion_trend_summary: string;
  last_milestone?: string;
  days_since_milestone?: number;
  logging_consistency_summary: string;
}

interface PersonalizedReflection {
  insights: string[];
  timestamp: Date;
  connectionId: number;
}

export class AIReflectionEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generatePersonalizedReflection(
    user: User,
    connection: Connection,
    recentMoments: Moment[],
    connectionHealthScore: number,
    previousHealthScore: number
  ): Promise<PersonalizedReflection> {
    const reflectionData = this.prepareReflectionData(
      user,
      connection,
      recentMoments,
      connectionHealthScore,
      previousHealthScore
    );

    const prompt = this.createReflectionPrompt(reflectionData);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const insights = this.parseInsights(content);

      return {
        insights,
        timestamp: new Date(),
        connectionId: connection.id
      };
    } catch (error) {
      console.error('Error generating personalized reflection:', error);
      throw new Error('Failed to generate reflection');
    }
  }

  private prepareReflectionData(
    user: User,
    connection: Connection,
    recentMoments: Moment[],
    connectionHealthScore: number,
    previousHealthScore: number
  ): ReflectionData {
    const pastWeekMoments = recentMoments.filter(moment => {
      const momentDate = new Date(moment.createdAt || new Date());
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return momentDate >= weekAgo;
    });

    const positiveCount = pastWeekMoments.filter(moment => 
      ['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(moment.emoji) ||
      moment.tags?.some(tag => ['Green Flag', 'Intimacy', 'Affection', 'Support', 'Growth', 'Trust', 'Celebration'].includes(tag))
    ).length;

    const negativeCount = pastWeekMoments.filter(moment => 
      ['😢', '😠', '😞', '😤', '😕'].includes(moment.emoji) ||
      moment.tags?.some(tag => ['Red Flag', 'Conflict', 'Jealousy', 'Stress', 'Disconnection'].includes(tag))
    ).length;

    const topActivities = this.extractTopActivities(pastWeekMoments);
    const emotionTrendSummary = this.generateEmotionTrendSummary(pastWeekMoments);
    const lastMilestone = this.findLastMilestone(recentMoments);
    const loggingConsistency = this.calculateLoggingConsistency(pastWeekMoments);

    return {
      relationship_stage: connection.relationshipStage || 'Dating',
      connection_name: connection.name,
      love_language: user.loveLanguage || 'Quality Time',
      connection_health: connectionHealthScore,
      connection_health_delta: connectionHealthScore - previousHealthScore,
      positive_count: positiveCount,
      negative_count: negativeCount,
      top_activities: topActivities,
      emotion_trend_summary: emotionTrendSummary,
      last_milestone: lastMilestone?.milestone,
      days_since_milestone: lastMilestone?.daysSince,
      logging_consistency_summary: loggingConsistency
    };
  }

  private getSystemPrompt(): string {
    return `You are Kindra's AI relationship coach - a warm, empathetic friend who provides personalized relationship insights. Your role is to:

1. Analyze relationship data and provide 2-3 short, meaningful insights
2. Write in a natural, supportive tone (like a caring friend, not a therapist)
3. Celebrate positive patterns and gently surface areas for growth
4. Always mention the connection's name naturally in your insights
5. End with a simple, actionable suggestion that feels encouraging
6. Keep insights concise (1-2 sentences each)
7. Be emotionally intelligent and context-aware

TONE GUIDELINES:
- Warm and encouraging, never clinical or robotic
- Use "you" and "your" to make it personal
- Acknowledge both progress and challenges with balance
- Avoid over-analyzing or being too serious
- Make suggestions feel doable and positive`;
  }

  private createReflectionPrompt(data: ReflectionData): string {
    return `Generate personalized relationship insights based on this data:

**Relationship Context:**
- Stage: ${data.relationship_stage}
- Connection: ${data.connection_name}
- Your Love Language: ${data.love_language}

**Recent Health & Activity:**
- Connection Health Score: ${data.connection_health}/100
- Health Change (7 days): ${data.connection_health_delta > 0 ? '+' : ''}${data.connection_health_delta}
- Positive moments this week: ${data.positive_count}
- Challenging moments this week: ${data.negative_count}
- Top activities: ${data.top_activities.join(', ') || 'None tracked'}

**Emotional Trends:**
- ${data.emotion_trend_summary}

**Milestone Context:**
${data.last_milestone ? `- Last milestone: ${data.last_milestone} (${data.days_since_milestone} days ago)` : '- No recent milestones'}

**Tracking Habits:**
- ${data.logging_consistency_summary}

Please provide 2-3 warm, personalized insights that celebrate wins, acknowledge any concerns, and end with an encouraging suggestion.`;
  }

  private parseInsights(content: string): string[] {
    // Split by common delimiters and clean up
    const insights = content
      .split(/\n\n|\n(?=\d\.|\*|\-)|(?<=\.)\s+(?=[A-Z])/g)
      .map(insight => insight.trim())
      .filter(insight => insight.length > 10)
      .map(insight => insight.replace(/^(\d+\.|[\*\-])\s*/, ''))
      .slice(0, 3); // Limit to 3 insights

    return insights.length > 0 ? insights : [content.trim()];
  }

  private extractTopActivities(moments: Moment[]): string[] {
    const activities = moments
      .map(moment => moment.title || moment.content)
      .filter(Boolean)
      .map(text => text!.toLowerCase())
      .filter(text => text.length > 0);

    // Simple frequency counting
    const activityCount: { [key: string]: number } = {};
    activities.forEach(activity => {
      activityCount[activity] = (activityCount[activity] || 0) + 1;
    });

    return Object.entries(activityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([activity]) => activity);
  }

  private generateEmotionTrendSummary(moments: Moment[]): string {
    if (moments.length === 0) return "No recent emotional data to analyze";

    const emotions = moments.map(m => m.emoji);
    const tags = moments.flatMap(m => m.tags || []);

    const positiveEmotions = emotions.filter(e => ['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(e)).length;
    const negativeEmotions = emotions.filter(e => ['😢', '😠', '😞', '😤', '😕'].includes(e)).length;
    
    const trustMoments = tags.filter(tag => tag === 'Trust').length;
    const conflictMoments = tags.filter(tag => tag === 'Conflict').length;

    let summary = '';
    if (positiveEmotions > negativeEmotions) {
      summary = 'Overall positive emotional trend';
    } else if (negativeEmotions > positiveEmotions) {
      summary = 'Some emotional challenges this week';
    } else {
      summary = 'Balanced emotional experiences';
    }

    if (trustMoments > 0) summary += ', increased trust';
    if (conflictMoments > 0) summary += ', some conflicts to resolve';

    return summary;
  }

  private findLastMilestone(moments: Moment[]): { milestone: string; daysSince: number } | null {
    const milestones = moments
      .filter(moment => moment.tags?.includes('Milestone'))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    if (milestones.length === 0) return null;

    const lastMilestone = milestones[0];
    const daysSince = Math.floor(
      (Date.now() - new Date(lastMilestone.createdAt || 0).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      milestone: lastMilestone.title || lastMilestone.content || 'Recent milestone',
      daysSince
    };
  }

  private calculateLoggingConsistency(pastWeekMoments: Moment[]): string {
    const daysWithLogs = new Set(
      pastWeekMoments.map(moment => 
        new Date(moment.createdAt || new Date()).toDateString()
      )
    ).size;

    if (daysWithLogs >= 5) return "Great job staying consistent with logging moments";
    if (daysWithLogs >= 3) return "Good consistency with tracking your relationship";
    if (daysWithLogs >= 1) return "You've been tracking some moments this week";
    return "Consider logging more moments to get better insights";
  }
}

export const aiReflectionEngine = new AIReflectionEngine();