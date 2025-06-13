import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote, RefreshCw, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Connection, Moment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface QuoteOfTheDayProps {
  connections: Connection[];
  moments: Moment[];
  userData: {
    zodiacSign?: string;
    loveLanguage?: string;
  };
}

interface DailyQuote {
  quote: string;
  type: 'personalized' | 'general';
  context?: string;
}

export function QuoteOfTheDay({ connections, moments, userData }: QuoteOfTheDayProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get today's date as a string to use as cache key
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch daily quote
  const { data: quote, isLoading, refetch } = useQuery<DailyQuote>({
    queryKey: ['/api/quote-of-the-day', today],
    enabled: connections.length > 0 || moments.length > 0,
    staleTime: 1000 * 60 * 60 * 12, // 12 hours - so it refreshes twice a day
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fallback quotes for when AI is not available
  const fallbackQuotes = [
    {
      quote: "The greatest relationships are built on understanding, patience, and genuine care for each other's growth.",
      type: 'general' as const
    },
    {
      quote: "Love is not about finding someone perfect, but about seeing someone perfectly despite their imperfections.",
      type: 'general' as const
    },
    {
      quote: "Strong relationships require daily effort, open communication, and the courage to be vulnerable with each other.",
      type: 'general' as const
    },
    {
      quote: "Quality time isn't measured in hours spent together, but in the depth of connection shared in those moments.",
      type: 'general' as const
    }
  ];

  // Get a fallback quote based on user's love language or general
  const getFallbackQuote = () => {
    if (userData.loveLanguage === "Quality Time") {
      return fallbackQuotes[3];
    }
    return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
  };

  const displayQuote = quote || getFallbackQuote();

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Quote className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Quote of the Day
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Daily wisdom for your relationships
            </p>
          </div>
        </div>
        
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Quote className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Quote of the Day
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {displayQuote.type === 'personalized' ? 'Personalized wisdom' : 'Daily wisdom'} for your relationships
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-3">
        <blockquote className="text-lg font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
          "{displayQuote.quote}"
        </blockquote>
        
        {displayQuote.context && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
            {displayQuote.context}
          </p>
        )}
        
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Heart className="h-3 w-3" />
          <span>
            {displayQuote.type === 'personalized' 
              ? 'Tailored for your relationship journey' 
              : 'Universal relationship wisdom'
            }
          </span>
        </div>
      </div>
    </div>
  );
}