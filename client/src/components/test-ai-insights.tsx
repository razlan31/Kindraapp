import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { PersonalizedReflection } from "@/components/insights/personalized-reflection";

interface TestAIInsightsProps {
  connectionId: number;
  connectionName: string;
}

export function TestAIInsights({ connectionId, connectionName }: TestAIInsightsProps) {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Relationship Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PersonalizedReflection
          connectionId={connectionId}
          connectionName={connectionName}
          connectionHealthScore={85}
        />
      </CardContent>
    </Card>
  );
}