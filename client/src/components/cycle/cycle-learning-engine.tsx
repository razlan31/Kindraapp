import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Calendar, Activity } from 'lucide-react';

interface CycleLearningData {
  averageCycleLength: number;
  ovulationPattern: {
    predictedDay: number;
    confidence: number;
    historicalAccuracy: number;
  };
  symptoms: {
    phase: string;
    commonSymptoms: string[];
    severity: number;
  }[];
  moodPatterns: {
    phase: string;
    averageMood: string;
    consistency: number;
  }[];
  personalizedInsights: string[];
  cycleVariability: number;
  dataQuality: number;
}

interface CycleLearningEngineProps {
  learningData: CycleLearningData;
  connectionName: string;
  totalCycles: number;
}

// Helper function for relationship-focused AI insights
const getRelationshipInsights = (data: CycleLearningData, connectionName: string): string[] => {
  const insights = [];
  const isSelf = !connectionName || connectionName.toLowerCase() === 'you' || connectionName.toLowerCase() === 'self';
  const pronoun = isSelf ? 'Your' : `${connectionName}'s`;
  const reflexive = isSelf ? 'yourself' : 'her';
  const possessive = isSelf ? 'your' : 'her';
  
  // Cycle regularity insight for relationship planning
  if (data.cycleVariability < 0.1) {
    insights.push(isSelf 
      ? `Your highly regular cycles make it easier to plan special moments and anticipate your emotional needs with confidence.`
      : `${connectionName}'s highly regular cycles make it easier to plan special moments and anticipate her emotional needs with confidence.`);
  } else if (data.cycleVariability > 0.3) {
    insights.push(isSelf
      ? `Your cycles vary significantly - staying flexible and responsive to your changing needs will strengthen your self-awareness.`
      : `${connectionName}'s cycles vary significantly - staying flexible and responsive to her changing needs will strengthen your connection.`);
  }
  
  // Emotional pattern insights
  const moodConsistency = data.moodPatterns.reduce((avg, mood) => avg + mood.consistency, 0) / data.moodPatterns.length;
  if (moodConsistency > 0.7) {
    insights.push(isSelf
      ? `You show consistent emotional patterns - you can reliably anticipate when you might need extra support or feel most energetic.`
      : `${connectionName} shows consistent emotional patterns - you can reliably anticipate when she might need extra support or feel most energetic.`);
  } else {
    insights.push(isSelf
      ? `Your emotional patterns vary - focusing on daily self-check-ins and mindful awareness will help you stay connected to yourself.`
      : `${connectionName}'s emotional patterns vary - focusing on daily check-ins and open communication will help you stay connected.`);
  }
  
  // Relationship timing insights
  insights.push(isSelf
    ? `Based on your ${data.averageCycleLength}-day cycles, plan important conversations and decisions during your follicular and ovulation phases for best outcomes.`
    : `Based on her ${data.averageCycleLength}-day cycles, plan intimate conversations and important decisions during her follicular and ovulation phases for best reception.`);
  
  // Support strategy insight
  if (data.dataQuality > 0.8) {
    insights.push(isSelf
      ? `With ${Math.round(data.dataQuality * 100)}% data quality, you have reliable insights to support yourself more effectively throughout your cycle.`
      : `With ${Math.round(data.dataQuality * 100)}% data quality, you have reliable insights to support ${connectionName} more effectively throughout her cycle.`);
  }
  
  return insights.slice(0, 3); // Return top 3 insights
};

export function CycleLearningEngine({ learningData, connectionName, totalCycles }: CycleLearningEngineProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getVariabilityDescription = (variability: number) => {
    if (variability < 0.1) return 'Very Regular';
    if (variability < 0.2) return 'Regular';
    if (variability < 0.3) return 'Somewhat Variable';
    return 'Highly Variable';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>AI Cycle Learning</span>
          <Badge variant="outline" className="ml-auto">
            {totalCycles} cycles analyzed
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Ovulation Prediction Accuracy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ovulation Prediction
            </h4>
            <Badge className={getConfidenceColor(learningData.ovulationPattern.confidence)}>
              {Math.round(learningData.ovulationPattern.confidence * 100)}% confidence
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Predicted Day</div>
              <div className="font-medium">Day {learningData.ovulationPattern.predictedDay}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Historical Accuracy</div>
              <div className="font-medium">{Math.round(learningData.ovulationPattern.historicalAccuracy * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Cycle Regularity Analysis */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cycle Patterns
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Average Length</div>
              <div className="font-medium">{learningData.averageCycleLength} days</div>
            </div>
            <div>
              <div className="text-muted-foreground">Regularity</div>
              <div className="font-medium">{getVariabilityDescription(learningData.cycleVariability)}</div>
            </div>
          </div>
          <Progress 
            value={(1 - learningData.cycleVariability) * 100} 
            className="h-2"
          />
        </div>

        {/* Emotional Pattern Intelligence */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Emotional Pattern Intelligence
          </h4>
          <div className="space-y-2">
            {learningData.moodPatterns.map((moodData, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="capitalize">{moodData.phase} Phase</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {moodData.averageMood} energy
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" style={{ opacity: moodData.consistency }}></div>
                    <span className="text-xs text-muted-foreground">{Math.round(moodData.consistency * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Intelligence */}
        <div className="space-y-3">
          <h4 className="font-medium">Relationship Intelligence</h4>
          <div className="space-y-2">
            {getRelationshipInsights(learningData, connectionName).map((insight, index) => (
              <div key={index} className="text-sm bg-white/50 dark:bg-black/50 rounded p-2 border-l-2 border-purple-400">
                {insight}
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality Indicator */}
        <div className="pt-3 border-t border-purple-200 dark:border-purple-800">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Data Quality</span>
            <div className="flex items-center gap-2">
              <Progress 
                value={learningData.dataQuality * 100} 
                className="w-16 h-2"
              />
              <span className="font-medium">{Math.round(learningData.dataQuality * 100)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}