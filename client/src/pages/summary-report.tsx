import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Moment, Connection, Badge, UserBadge } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Brain, Calendar, Download, Flag, Heart, Star, ChevronDown } from "lucide-react";
import { FlagExplanation } from "@/components/ui/flag-explanation";

type ReportPeriod = "week" | "month" | "all";

export default function SummaryReport() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [selectedConnections, setSelectedConnections] = useState<number[]>([]);
  
  // Fetch user data
  const { data: moments = [], isLoading: momentsLoading } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !!user,
  });

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
    enabled: !!user,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["/api/user-badges"],
    enabled: !!user,
  });

  // Calculate date ranges based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch(period) {
      case "week":
        return { 
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
          title: `Week of ${format(startOfWeek(now, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(now, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
        };
      case "month":
        return { 
          start: startOfMonth(now),
          end: endOfMonth(now),
          title: format(now, 'MMMM yyyy')
        };
      case "all":
      default:
        return { 
          start: new Date(0), // beginning of time
          end: now,
          title: "All Time"
        };
    }
  }, [period]);

  // Filter moments based on period and selected connection
  const filteredMoments = useMemo(() => {
    return moments.filter(moment => {
      const momentDate = new Date(moment.createdAt);
      const isInDateRange = period === "all" ? true : isWithinInterval(momentDate, {
        start: dateRange.start,
        end: dateRange.end
      });
      const isSelectedConnection = selectedConnection ? moment.connectionId === selectedConnection : true;
      
      return isInDateRange && isSelectedConnection;
    });
  }, [moments, dateRange, period, selectedConnection]);

  // Calculate tag statistics for visualization
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    
    filteredMoments.forEach(moment => {
      if (moment.tags && moment.tags.length > 0) {
        moment.tags.forEach(tag => {
          stats[tag] = (stats[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredMoments]);

  // Categorize tags by flag type for visualization
  const flagCategoryCounts = useMemo(() => {
    const greenFlagTags = ["Green Flag", "Intimacy", "Affection", "Support", "Growth", "Trust", "Celebration"];
    const redFlagTags = ["Red Flag", "Conflict", "Jealousy", "Stress", "Disconnection"];
    const blueFlagTags = ["Blue Flag", "Life Goals", "Career", "Future Planning", "Vulnerability", "Communication"];
    
    let greenCount = 0;
    let redCount = 0;
    let blueCount = 0;
    let otherCount = 0;
    
    filteredMoments.forEach(moment => {
      if (moment.tags && moment.tags.length > 0) {
        moment.tags.forEach(tag => {
          if (greenFlagTags.includes(tag)) greenCount++;
          else if (redFlagTags.includes(tag)) redCount++;
          else if (blueFlagTags.includes(tag)) blueCount++;
          else otherCount++;
        });
      }
    });
    
    return [
      { name: "Green (Positive)", value: greenCount, color: "#4caf50" },
      { name: "Red (Concerning)", value: redCount, color: "#f44336" },
      { name: "Blue (Growth)", value: blueCount, color: "#2196f3" },
      { name: "Other", value: otherCount, color: "#9e9e9e" }
    ].filter(item => item.value > 0);
  }, [filteredMoments]);

  // Calculate mood distribution by day
  const moodByDay = useMemo(() => {
    if (period === "all") return [];
    
    const days = [];
    const daysMap: Record<string, {positive: number, negative: number, growth: number, date: Date}> = {};
    
    filteredMoments.forEach(moment => {
      const day = format(new Date(moment.createdAt), 'yyyy-MM-dd');
      if (!daysMap[day]) {
        daysMap[day] = {
          positive: 0,
          negative: 0,
          growth: 0,
          date: new Date(moment.createdAt)
        };
      }
      
      if (moment.tags && moment.tags.length > 0) {
        if (moment.tags.includes("Green Flag") || moment.tags.some(tag => ["Intimacy", "Affection", "Support", "Growth", "Trust", "Celebration"].includes(tag))) {
          daysMap[day].positive++;
        }
        if (moment.tags.includes("Red Flag") || moment.tags.some(tag => ["Conflict", "Jealousy", "Stress", "Disconnection"].includes(tag))) {
          daysMap[day].negative++;
        }
        if (moment.tags.includes("Blue Flag") || moment.tags.some(tag => ["Life Goals", "Career", "Future Planning", "Vulnerability", "Communication"].includes(tag))) {
          daysMap[day].growth++;
        }
      }
    });
    
    // Convert to array and sort by date
    for (const [day, counts] of Object.entries(daysMap)) {
      days.push({
        day: format(counts.date, 'd'),
        positive: counts.positive,
        negative: counts.negative,
        growth: counts.growth,
        date: counts.date
      });
    }
    
    return days.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredMoments, period]);

  // Generate AI insights based on the data
  const aiInsights = useMemo(() => {
    const insights = [];
    
    // Insight 1: Flag balance
    if (flagCategoryCounts.length > 0) {
      const totalFlags = flagCategoryCounts.reduce((sum, item) => sum + item.value, 0);
      const greenPercentage = flagCategoryCounts.find(item => item.name === "Green (Positive)")?.value || 0;
      const redPercentage = flagCategoryCounts.find(item => item.name === "Red (Concerning)")?.value || 0;
      const bluePercentage = flagCategoryCounts.find(item => item.name === "Blue (Growth)")?.value || 0;
      
      if (totalFlags > 0) {
        const greenRatio = Math.round((greenPercentage / totalFlags) * 100);
        const redRatio = Math.round((redPercentage / totalFlags) * 100);
        const blueRatio = Math.round((bluePercentage / totalFlags) * 100);
        
        if (greenRatio > 60) {
          insights.push({
            type: "positive",
            text: `Your emotions have been ${greenRatio}% positive during this period. This shows great emotional health in your relationships!`,
            icon: <Heart className="h-5 w-5 text-green-500" />
          });
        } else if (redRatio > 40) {
          insights.push({
            type: "concerning",
            text: `You've experienced ${redRatio}% concerning moments. Consider reflecting on these patterns and discussing them with trusted friends.`,
            icon: <Flag className="h-5 w-5 text-red-500" />
          });
        } else if (blueRatio > 30) {
          insights.push({
            type: "growth",
            text: `${blueRatio}% of your moments show growth opportunity. You're in a period of relationship development with potential for deeper connection.`,
            icon: <Brain className="h-5 w-5 text-blue-500" />
          });
        }
      }
    }
    
    // Insight 2: Connection-specific patterns
    if (selectedConnection && filteredMoments.length > 0) {
      const connectionName = connections.find(c => c.id === selectedConnection)?.name || "This connection";
      const connectionMoments = filteredMoments.filter(m => m.connectionId === selectedConnection);
      
      if (connectionMoments.length >= 3) {
        const hasGreenFlags = connectionMoments.some(m => m.tags?.includes("Green Flag"));
        const hasRedFlags = connectionMoments.some(m => m.tags?.includes("Red Flag"));
        const hasBlueFlags = connectionMoments.some(m => m.tags?.includes("Blue Flag"));
        
        if (hasGreenFlags && !hasRedFlags) {
          insights.push({
            type: "connection",
            text: `Your relationship with ${connectionName} shows healthy signs. Keep nurturing this positive connection!`,
            icon: <Heart className="h-5 w-5 text-green-500" />
          });
        } else if (hasRedFlags && !hasGreenFlags) {
          insights.push({
            type: "connection",
            text: `Your relationship with ${connectionName} shows some concerning patterns. Consider reflecting on these challenges.`,
            icon: <Flag className="h-5 w-5 text-red-500" />
          });
        } else if (hasBlueFlags) {
          insights.push({
            type: "connection",
            text: `You've logged several Blue Flag moments with ${connectionName} about growth areas. Perhaps set aside time to align your visions and plan together - these moments can strengthen your connection with patience and communication.`,
            icon: <Brain className="h-5 w-5 text-blue-500" />
          });
        }
      }
    }
    
    // Insight 3: General patterns
    if (filteredMoments.length > 0) {
      const periodText = period === "week" ? "this week" : period === "month" ? "this month" : "overall";
      insights.push({
        type: "general",
        text: `You've logged ${filteredMoments.length} emotional moments ${periodText}. Consistent tracking helps build emotional awareness and relationship growth.`,
        icon: <Calendar className="h-5 w-5 text-primary" />
      });
    } else {
      insights.push({
        type: "general",
        text: `You haven't logged any moments during this period. Start tracking your emotional moments to receive personalized insights!`,
        icon: <Calendar className="h-5 w-5 text-primary" />
      });
    }
    
    // Insight 4: Growth opportunities (Blue Flag focus)
    const blueTagMoments = filteredMoments.filter(m => 
      m.tags && (m.tags.includes("Blue Flag") || 
      m.tags.some(tag => ["Life Goals", "Career", "Future Planning", "Vulnerability", "Communication"].includes(tag)))
    );
    
    if (blueTagMoments.length >= 2) {
      insights.push({
        type: "growth",
        text: `You've logged ${blueTagMoments.length} blue flag moments showing growth opportunities. These are not problems but areas where patience and communication can strengthen your connections.`,
        icon: <Brain className="h-5 w-5 text-blue-500" />
      });
    }
    
    // Insight 5: Earned badges
    const recentBadges = Array.isArray(userBadges) ? userBadges
      .filter((ub: any) => {
        if (!ub.unlockedAt) return false;
        const badgeDate = new Date(ub.unlockedAt);
        return period === "all" ? true : isWithinInterval(badgeDate, {
          start: dateRange.start,
          end: dateRange.end
        });
      })
      .slice(0, 2) : [];
    
    if (recentBadges.length > 0) {
      const periodTxt = period === "week" ? "this week" : period === "month" ? "this month" : "overall";
      insights.push({
        type: "achievement",
        text: `You've earned ${recentBadges.length} badge${recentBadges.length > 1 ? 's' : ''} ${periodTxt}! Keep tracking your relationship moments to unlock more achievements.`,
        icon: <Star className="h-5 w-5 text-yellow-500" />
      });
    }
    
    return insights;
  }, [filteredMoments, flagCategoryCounts, selectedConnection, connections, period, dateRange, userBadges]);

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Title Section */}
        <section className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-semibold">Summary Report</h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Your relationship insights and patterns
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </section>

        {/* Filter controls */}
        <section className="px-4 pb-4">
          <div className="flex gap-2 items-center">
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as ReportPeriod)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedConnection ? selectedConnection.toString() : "all"}
              onValueChange={(value) => setSelectedConnection(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All connections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">All</span>
                    </div>
                    <span>All connections</span>
                  </div>
                </SelectItem>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id.toString()}>
                    <div className="flex items-center gap-2">
                      {connection.profileImage ? (
                        <img 
                          src={connection.profileImage} 
                          alt={connection.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {connection.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span>{connection.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Report period banner */}
        <section className="px-4 mb-4">
          <div className="bg-secondary/10 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                <span className="font-medium">{dateRange.title}</span>
              </div>
              <span className="text-sm">{filteredMoments.length} moments</span>
            </div>
          </div>
        </section>

        <Tabs defaultValue="insights" className="w-full">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="flags">Flags</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="insights" className="px-4 py-3">
            {/* AI Insights section */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">AI Insights</CardTitle>
                <CardDescription>
                  Personalized reflections based on your tracked moments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiInsights.length > 0 ? (
                  <div className="space-y-4">
                    {aiInsights.map((insight, index) => (
                      <div key={index} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                        <div className="flex gap-3 items-start">
                          <div className="bg-primary/10 p-2 rounded-full">
                            {insight.icon}
                          </div>
                          <p className="text-sm">{insight.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center py-6">
                    Log more moments to receive personalized insights
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent achievements */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Achievements</CardTitle>
                <CardDescription>
                  Badges and milestones you've reached
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userBadges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {userBadges.slice(0, 4).map((userBadge: any) => {
                      const badge = badges.find(b => b.id === userBadge.badgeId);
                      if (!badge) return null;
                      
                      return (
                        <div key={userBadge.id} className="border rounded-lg p-3 flex flex-col items-center text-center">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <span className="text-xl">{badge.icon}</span>
                          </div>
                          <h4 className="font-medium text-sm mb-1">{badge.name}</h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {format(new Date(userBadge.unlockedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center py-6">
                    You haven't earned any badges yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="px-4 py-3">
            {/* Tag frequency chart */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Emotional Tags</CardTitle>
                <CardDescription>
                  Most frequent tags in your tracked moments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tagStats.length > 0 ? (
                  <>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={tagStats.slice(0, 7)}
                          layout="vertical"
                          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={80} 
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value} moments`, 'Frequency']}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="#8884d8" 
                            barSize={16}
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-2">
                      Based on {tagStats.reduce((sum, item) => sum + item.value, 0)} tags across {filteredMoments.length} moments
                    </div>
                  </>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center py-12">
                    Not enough tagged moments in this period
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Mood by day chart */}
            {moodByDay.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Daily Mood Patterns</CardTitle>
                  <CardDescription>
                    Your emotional patterns by day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={moodByDay}
                        margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
                      >
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => {
                            const nameMap: Record<string, string> = {
                              positive: "Positive moments",
                              negative: "Concerning moments",
                              growth: "Growth moments"
                            };
                            return [value, nameMap[name] || name];
                          }}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                          itemStyle={{ padding: 2 }}
                        />
                        <Legend
                          formatter={(value) => {
                            const nameMap: Record<string, string> = {
                              positive: "Positive",
                              negative: "Concerning",
                              growth: "Growth"
                            };
                            return nameMap[value] || value;
                          }}
                        />
                        <Bar dataKey="positive" name="positive" fill="#4caf50" stackId="a" />
                        <Bar dataKey="negative" name="negative" fill="#f44336" stackId="a" />
                        <Bar dataKey="growth" name="growth" fill="#2196f3" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="flags" className="px-4 py-3">
            {/* Flag explanation */}
            <FlagExplanation />
            
            {/* Flag distribution pie chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Flag Distribution</CardTitle>
                <CardDescription>
                  Breakdown of your relationship flag patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flagCategoryCounts.length > 0 ? (
                  <>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={flagCategoryCounts}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {flagCategoryCounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} moments`, 'Count']}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {flagCategoryCounts.map((category, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-xs">
                            {category.name}: {category.value} moment{category.value !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center py-12">
                    No flag moments recorded in this period
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
}