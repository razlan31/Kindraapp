
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { MenstrualCycle } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CycleTracker } from "@/components/menstrual-cycle/cycle-tracker";
import { Button } from "@/components/ui/button";
import { Calendar, CircleHelp, DropletIcon, LineChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CycleTracking() {
  const { user } = useAuth();

  // Fetch menstrual cycles
  const { data: cycles = [], isLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ["/api/menstrual-cycles"],
    enabled: !!user,
  });

  // Fetch moments for cycle-emotion correlation
  const { data: moments = [] } = useQuery({
    queryKey: ["/api/moments"],
    enabled: !!user,
  });

  // Calculate average cycle length
  const averageCycleLength = (() => {
    if (cycles.length < 2) return "Not enough data";
    
    let totalDays = 0;
    let count = 0;
    
    for (let i = 0; i < cycles.length - 1; i++) {
      const currentCycleStart = new Date(cycles[i].startDate);
      const nextCycleStart = new Date(cycles[i + 1].startDate);
      const daysBetween = Math.round((nextCycleStart.getTime() - currentCycleStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBetween > 0 && daysBetween < 45) { // Filter out potentially incorrect data
        totalDays += daysBetween;
        count++;
      }
    }
    
    return count > 0 ? `~${Math.round(totalDays / count)} days` : "Not enough data";
  })();

  // Calculate average period length
  const averagePeriodLength = (() => {
    const cyclesWithEndDate = cycles.filter(cycle => cycle.endDate);
    if (cyclesWithEndDate.length === 0) return "Not enough data";
    
    let totalDays = 0;
    
    for (const cycle of cyclesWithEndDate) {
      const startDate = new Date(cycle.startDate);
      const endDate = new Date(cycle.endDate!);
      const daysBetween = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (daysBetween > 0 && daysBetween < 15) { // Filter out potentially incorrect data
        totalDays += daysBetween;
      }
    }
    
    return cyclesWithEndDate.length > 0 ? `~${Math.round(totalDays / cyclesWithEndDate.length)} days` : "Not enough data";
  })();

  // Extract emotional insights around menstrual periods
  const emotionalInsights = (() => {
    if (cycles.length === 0 || moments.length === 0) return [];
    
    const insights: {title: string; description: string}[] = [];
    
    // Look for emotional patterns during period days
    const periodMoments = moments.filter(moment => {
      const momentDate = new Date(moment.createdAt);
      
      // Check if this moment occurred during any tracked period
      return cycles.some(cycle => {
        const periodStart = new Date(cycle.startDate);
        const periodEnd = cycle.endDate ? new Date(cycle.endDate) : 
          // If no end date, assume a 5-day period
          new Date(new Date(cycle.startDate).setDate(new Date(cycle.startDate).getDate() + 4));
        
        return momentDate >= periodStart && momentDate <= periodEnd;
      });
    });
    
    // Count emotions during period
    if (periodMoments.length > 0) {
      const emotionCounts: Record<string, number> = {};
      periodMoments.forEach(moment => {
        if (!emotionCounts[moment.emoji]) {
          emotionCounts[moment.emoji] = 0;
        }
        emotionCounts[moment.emoji]++;
      });
      
      // Find most common emotion
      const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b] ? a : b
      );
      
      insights.push({
        title: "Period Mood Pattern",
        description: `During your period, you frequently experience ${mostCommonEmotion} emotions. Being aware of this pattern can help you prepare and manage your emotional wellbeing.`
      });
    }
    
    // Check for pre-period emotions (3 days before)
    const prePeriodMoments = moments.filter(moment => {
      const momentDate = new Date(moment.createdAt);
      
      // Check if this moment occurred 1-3 days before any tracked period
      return cycles.some(cycle => {
        const periodStart = new Date(cycle.startDate);
        const threeDaysBefore = new Date(new Date(cycle.startDate).setDate(new Date(cycle.startDate).getDate() - 3));
        
        return momentDate >= threeDaysBefore && momentDate < periodStart;
      });
    });
    
    if (prePeriodMoments.length > 0) {
      // Check if there are more negative emotions before period
      const negativeEmotions = prePeriodMoments.filter(m => 
        ['😕', '😢', '😠'].includes(m.emoji)
      ).length;
      
      const percentNegative = negativeEmotions / prePeriodMoments.length;
      
      if (percentNegative > 0.4) {
        insights.push({
          title: "Pre-Period Sensitivity",
          description: "You tend to experience more challenging emotions in the days leading up to your period. This is common due to hormonal fluctuations."
        });
      }
    }
    
    // Add generic insight if we don't have enough data
    if (insights.length === 0) {
      insights.push({
        title: "Keep Tracking",
        description: "Continue logging both your cycles and your emotions to receive personalized insights about how your menstrual cycle may affect your relationships."
      });
    }
    
    return insights;
  })();

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-heading font-semibold">Menstrual Cycle Tracking</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Monitor your cycle and emotional patterns
            </p>
          </div>
          <Button variant="ghost" size="icon">
            <CircleHelp className="h-5 w-5 text-neutral-500" />
          </Button>
        </div>
        
        <Tabs defaultValue="tracker" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="tracker">
              <Calendar className="h-4 w-4 mr-1" /> Tracker
            </TabsTrigger>
            <TabsTrigger value="insights">
              <LineChart className="h-4 w-4 mr-1" /> Insights
            </TabsTrigger>
            <TabsTrigger value="emotions">
              <DropletIcon className="h-4 w-4 mr-1" /> Emotions
            </TabsTrigger>
          </TabsList>

          {/* Tracker Tab */}
          <TabsContent value="tracker">
            <CycleTracker cycles={cycles} />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Cycle Stats</CardTitle>
                <CardDescription>Your cycle patterns and averages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm font-medium">Average Cycle Length:</span>
                    <span className="text-sm">{averageCycleLength}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm font-medium">Average Period Length:</span>
                    <span className="text-sm">{averagePeriodLength}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm font-medium">Cycles Tracked:</span>
                    <span className="text-sm">{cycles.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Last Period:</span>
                    <span className="text-sm">
                      {cycles.length > 0 
                        ? new Date(cycles[0].startDate).toLocaleDateString() 
                        : "None tracked"
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emotions Tab */}
          <TabsContent value="emotions">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Emotional Patterns</CardTitle>
                <CardDescription>How your cycle may influence your emotions</CardDescription>
              </CardHeader>
              <CardContent>
                {emotionalInsights.length > 0 ? (
                  <div className="space-y-4">
                    {emotionalInsights.map((insight, index) => (
                      <div key={index} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <p className="mb-2">Not enough data to generate emotional insights</p>
                    <p className="text-sm">Track your cycles and log emotional moments to see patterns</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Connect with Moments</CardTitle>
                <CardDescription>Tag moments related to your cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  When logging emotional moments, use the "Menstrual" tag to connect them with your cycle for better insights.
                </p>
                <Button className="w-full" onClick={() => window.location.href = "/moments"}>
                  Log a Cycle-Related Moment
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
}