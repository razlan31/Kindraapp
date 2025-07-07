import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote, RefreshCw, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Connection, Moment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";

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
  style?: string;
  context?: string;
}

export function QuoteOfTheDay({ connections, moments, userData }: QuoteOfTheDayProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();

  // Get today's date as a string to use as cache key
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch daily quote
  const { data: quote, isLoading, refetch } = useQuery<DailyQuote>({
    queryKey: ['/api/quote-of-the-day', today],
    enabled: isAuthenticated && (connections.length > 0 || moments.length > 0),
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

  // Fallback quotes for when AI is not available - now with variety
  const fallbackQuotes = [
    // Beautiful/Inspirational quotes
    {
      quote: "The greatest relationships are built on understanding, patience, and genuine care for each other's growth.",
      type: 'general' as const,
      style: 'beautiful'
    },
    {
      quote: "Love is not about finding someone perfect, but about seeing someone perfectly despite their imperfections.",
      type: 'general' as const,
      style: 'beautiful'
    },
    {
      quote: "Quality time isn't measured in hours spent together, but in the depth of connection shared in those moments.",
      type: 'general' as const,
      style: 'beautiful'
    },
    
    // Simple/Direct quotes
    {
      quote: "Good relationships need two things: trust and effort.",
      type: 'general' as const,
      style: 'simple'
    },
    {
      quote: "Listen more. Judge less. Love harder.",
      type: 'general' as const,
      style: 'simple'
    },
    {
      quote: "Be honest. Be kind. Show up.",
      type: 'general' as const,
      style: 'simple'
    },
    {
      quote: "Actions speak louder than promises.",
      type: 'general' as const,
      style: 'simple'
    },
    {
      quote: "Love is a choice you make daily.",
      type: 'general' as const,
      style: 'simple'
    },
    
    // Edgy/Real quotes
    {
      quote: "If they wanted to, they would. Stop making excuses for people.",
      type: 'general' as const,
      style: 'edgy'
    },
    {
      quote: "You can't love someone into loving you back.",
      type: 'general' as const,
      style: 'edgy'
    },
    {
      quote: "Red flags look like regular flags when you're wearing rose-colored glasses.",
      type: 'general' as const,
      style: 'edgy'
    },
    {
      quote: "Stop trying to fix people who don't think they're broken.",
      type: 'general' as const,
      style: 'edgy'
    },
    {
      quote: "You deserve someone who chooses you every day, not just when it's convenient.",
      type: 'general' as const,
      style: 'edgy'
    },
    {
      quote: "Don't settle for being someone's option when you could be someone else's priority.",
      type: 'general' as const,
      style: 'edgy'
    }
  ];

  // Get a fallback quote with variety - cycle through different styles
  const getFallbackQuote = () => {
    const today = new Date().toISOString().split('T')[0];
    const dayHash = today.split('-').reduce((a, b) => parseInt(a) + parseInt(b), 0);
    
    // Determine style based on day (ensures variety over time)
    const styleIndex = dayHash % 3;
    const styles = ['beautiful', 'simple', 'edgy'];
    const selectedStyle = styles[styleIndex];
    
    // Filter quotes by style
    const styleQuotes = fallbackQuotes.filter(q => q.style === selectedStyle);
    const randomIndex = dayHash % styleQuotes.length;
    
    return styleQuotes[randomIndex] || fallbackQuotes[0];
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