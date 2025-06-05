import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Heart, TrendingUp, TrendingDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PersonalizedReflection {
  insights: string[];
  timestamp: Date;
  connectionId: number;
}

interface PersonalizedReflectionProps {
  connectionId: number;
  connectionName: string;
  connectionHealthScore?: number;
  onClose?: () => void;
}

export function PersonalizedReflection({ 
  connectionId, 
  connectionName, 
  connectionHealthScore,
  onClose 
}: PersonalizedReflectionProps) {
  const [reflection, setReflection] = useState<PersonalizedReflection | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateReflectionMutation = useMutation({
    mutationFn: async (): Promise<PersonalizedReflection> => {
      const response = await fetch(`/api/connections/${connectionId}/reflection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate reflection');
      }
      
      return response.json();
    },
    onSuccess: (data: PersonalizedReflection) => {
      setReflection(data);
      toast({
        title: "AI Reflection Generated",
        description: `Personalized insights for ${connectionName} are ready`,
      });
    },
    onError: (error: any) => {
      console.error('Error generating reflection:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate reflection",
        variant: "destructive",
      });
    },
  });

  const getHealthScoreColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthScoreIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 75) return <TrendingUp className="h-4 w-4" />;
    if (score >= 50) return <Heart className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Insights for {connectionName}
          </CardTitle>
          {connectionHealthScore && (
            <Badge variant="outline" className={`flex items-center gap-1 ${getHealthScoreColor(connectionHealthScore)}`}>
              {getHealthScoreIcon(connectionHealthScore)}
              {connectionHealthScore}/100
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!reflection ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Generate Personalized Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Get AI-powered insights about your relationship with {connectionName} based on your tracked moments, emotional trends, and connection patterns.
              </p>
            </div>
            <Button
              onClick={() => generateReflectionMutation.mutate()}
              disabled={generateReflectionMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generateReflectionMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Your Personalized Insights
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateReflectionMutation.mutate()}
                  disabled={generateReflectionMutation.isPending}
                >
                  {generateReflectionMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                {onClose && (
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    Close
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {reflection.insights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {insight}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
              Generated on {new Date(reflection.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}