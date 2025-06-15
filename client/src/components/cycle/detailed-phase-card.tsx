import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Heart, Activity, Calendar } from 'lucide-react';

interface DetailedPhaseCardProps {
  phaseData: {
    phase: string;
    subPhase: string;
    color: string;
    description: string;
    emoji: string;
    dayRange: string;
    hormonalProfile: string;
    recommendations: string[];
  };
  currentDay: number;
  cycleLength: number;
  connectionName?: string;
}

export function DetailedPhaseCard({ phaseData, currentDay, cycleLength, connectionName }: DetailedPhaseCardProps) {
  const progressPercentage = (currentDay / cycleLength) * 100;
  
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'menstrual':
        return 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-800 dark:text-red-100';
      case 'follicular':
        return 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950/20 dark:border-green-800 dark:text-green-100';
      case 'fertile':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-100';
      case 'luteal':
        return 'bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-100';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900 dark:bg-gray-950/20 dark:border-gray-800 dark:text-gray-100';
    }
  };

  const getProgressColor = (phase: string) => {
    switch (phase) {
      case 'menstrual':
        return 'bg-red-500';
      case 'follicular':
        return 'bg-green-500';
      case 'fertile':
        return 'bg-yellow-500';
      case 'luteal':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={`${getPhaseColor(phaseData.phase)} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{phaseData.emoji}</span>
            <div>
              <div className="font-semibold">{phaseData.description}</div>
              {connectionName && (
                <div className="text-sm font-normal opacity-75">{connectionName}</div>
              )}
            </div>
          </CardTitle>
          <Badge variant="outline" className="bg-white/50 dark:bg-black/50">
            Day {currentDay}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cycle Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Cycle Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          <div className="text-xs opacity-75 flex justify-between">
            <span>{phaseData.dayRange}</span>
            <span>{cycleLength} day cycle</span>
          </div>
        </div>

        {/* Hormonal Profile */}
        <div className="flex items-start gap-2">
          <Activity className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-sm">Hormonal Profile</div>
            <div className="text-sm opacity-75">{phaseData.hormonalProfile}</div>
          </div>
        </div>

        {/* Phase-specific Recommendations */}
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="font-medium text-sm">Recommendations</div>
            <div className="grid grid-cols-1 gap-1">
              {phaseData.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="text-xs bg-white/30 dark:bg-black/30 rounded px-2 py-1">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-phase Badge */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Badge variant="secondary" className="text-xs">
            {phaseData.subPhase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Phase
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}