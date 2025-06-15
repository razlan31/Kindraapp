import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Info, TrendingUp, Zap, Heart } from 'lucide-react';

interface PhaseVisualizerProps {
  currentPhase: {
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
  connectionName: string;
  nextPhaseInfo?: {
    phase: string;
    daysUntil: number;
    emoji: string;
  };
}

export function EnhancedPhaseVisualizer({ 
  currentPhase, 
  currentDay, 
  cycleLength, 
  connectionName,
  nextPhaseInfo 
}: PhaseVisualizerProps) {
  const progressPercentage = (currentDay / cycleLength) * 100;
  
  const getPhaseIntensity = (subPhase: string) => {
    const intensities = {
      'heavy_flow': { intensity: 'High', color: 'bg-red-500' },
      'light_flow': { intensity: 'Moderate', color: 'bg-red-400' },
      'early_follicular': { intensity: 'Rising', color: 'bg-green-400' },
      'late_follicular': { intensity: 'Peak', color: 'bg-green-500' },
      'pre_ovulation': { intensity: 'Building', color: 'bg-yellow-400' },
      'ovulation': { intensity: 'Maximum', color: 'bg-pink-500' },
      'post_ovulation': { intensity: 'Declining', color: 'bg-yellow-500' },
      'early_luteal': { intensity: 'Stable', color: 'bg-purple-400' },
      'mid_luteal': { intensity: 'Peak', color: 'bg-purple-500' },
      'pre_menstrual': { intensity: 'Dropping', color: 'bg-orange-500' }
    };
    return intensities[subPhase as keyof typeof intensities] || { intensity: 'Normal', color: 'bg-gray-400' };
  };

  const phaseIntensity = getPhaseIntensity(currentPhase.subPhase);

  return (
    <div className="space-y-4">
      {/* Main Phase Card */}
      <Card className={`${currentPhase.color} border-2 overflow-hidden`}>
        <div className="relative">
          {/* Progress bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/10">
            <div 
              className="h-full bg-black/30 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <CardHeader className="pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <span className="text-3xl">{currentPhase.emoji}</span>
                <div>
                  <div className="text-xl font-bold">{currentPhase.description}</div>
                  <div className="text-sm opacity-75">{connectionName}</div>
                </div>
              </CardTitle>
              <div className="text-right">
                <Badge variant="outline" className="bg-white/70 dark:bg-black/70 mb-1">
                  Day {currentDay} of {cycleLength}
                </Badge>
                <div className="text-xs opacity-75">{currentPhase.dayRange}</div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Phase Intensity Indicator */}
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Hormonal Intensity</span>
                  <span className="font-medium">{phaseIntensity.intensity}</span>
                </div>
                <div className="h-2 bg-white/30 dark:bg-black/30 rounded-full overflow-hidden">
                  <div className={`h-full ${phaseIntensity.color} rounded-full transition-all duration-300`} 
                       style={{ width: `${(currentDay / cycleLength) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Hormonal Profile */}
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-sm mb-1">Current Hormonal State</div>
                <div className="text-sm opacity-90 bg-white/20 dark:bg-black/20 rounded p-2">
                  {currentPhase.hormonalProfile}
                </div>
              </div>
            </div>

            {/* Top Recommendations */}
            <div className="flex items-start gap-2">
              <Heart className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-sm mb-2">Personalized Recommendations</div>
                <div className="grid gap-2">
                  {currentPhase.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="text-xs bg-white/30 dark:bg-black/30 rounded-md px-3 py-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-current rounded-full opacity-70" />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Next Phase Preview */}
      {nextPhaseInfo && (
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl opacity-60">{nextPhaseInfo.emoji}</span>
                <div>
                  <div className="font-medium text-sm">Next Phase</div>
                  <div className="text-xs opacity-75 capitalize">{nextPhaseInfo.phase} Phase</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {nextPhaseInfo.daysUntil} days
                </div>
                <div className="text-xs opacity-75">remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold">{Math.round(progressPercentage)}%</div>
            <div className="text-xs opacity-75">Cycle Complete</div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold capitalize">{currentPhase.subPhase.replace('_', ' ')}</div>
            <div className="text-xs opacity-75">Sub-Phase</div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold">{cycleLength - currentDay}</div>
            <div className="text-xs opacity-75">Days Left</div>
          </div>
        </Card>
      </div>
    </div>
  );
}