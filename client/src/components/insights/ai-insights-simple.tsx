import React, { useState, useEffect } from 'react';
import { TrendingUp, Heart, AlertCircle, Calendar, Users, Target, Loader2 } from 'lucide-react';
import type { Connection, Moment } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface AIInsightsProps {
  connections: Connection[];
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

export function AIInsights({ connections, moments, userData }: AIInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateInsights = async () => {
      if (connections.length === 0 && moments.length === 0) {
        setInsights(["Start tracking your relationships to unlock AI insights"]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest('POST', '/api/ai/mini-insight', {
          context: 'activities-overview',
          data: {
            connections,
            recentMoments: moments.slice(0, 10) // Latest 10 moments for context
          }
        });

        const result = await response.json();
        
        // Split the insight into sentences for multiple brief insights
        const sentences = result.insight
          .split(/[.!?]+/)
          .filter((s: string) => s.trim().length > 10)
          .map((s: string) => s.trim() + '.')
          .slice(0, 3); // Max 3 brief insights

        setInsights(sentences.length > 0 ? sentences : ["Keep tracking to unlock more insights"]);
      } catch (err) {
        console.error('Error generating insights:', err);
        setError('Unable to generate insights at the moment');
        setInsights(["Continue tracking moments for personalized insights"]);
      } finally {
        setLoading(false);
      }
    };

    generateInsights();
  }, [connections, moments]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
            <Loader2 className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
            Generating Insights
          </h3>
        </div>
        <p className="text-purple-700 dark:text-purple-300">
          Analyzing your relationship patterns...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
            Insights Unavailable
          </h3>
        </div>
        <p className="text-orange-700 dark:text-orange-300">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div
          key={index}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                {insight}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}