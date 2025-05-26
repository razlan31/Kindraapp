import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Heart, Calendar as CalendarIcon, Plus, Eye } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useModal } from "@/contexts/modal-context";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import type { Moment, Connection } from "@shared/schema";

export default function Calendar() {
  const { user } = useAuth();
  const { openMomentModal, setSelectedConnection } = useModal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);

  // Fetch moments
  const { data: moments = [], isLoading: momentsLoading } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !!user,
  });

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get moments for a specific day
  const getMomentsForDay = (day: Date) => {
    const dayMoments = moments.filter(moment => 
      isSameDay(new Date(moment.createdAt || new Date()), day)
    );
    console.log(`Calendar Debug - Day: ${format(day, 'yyyy-MM-dd')}, Moments found: ${dayMoments.length}`, dayMoments);
    return dayMoments;
  };

  // Debug moments loading
  console.log('Calendar Debug - Total moments:', moments.length, moments);

  // Get moment color based on tags
  const getMomentColor = (moment: Moment) => {
    const tags = moment.tags || [];
    if (tags.some(tag => ["Green Flag", "Quality Time", "Growth", "Support"].includes(tag))) {
      return "bg-green-500";
    }
    if (tags.some(tag => ["Red Flag", "Conflict", "Disappointment", "Stress"].includes(tag))) {
      return "bg-red-500";
    }
    if (tags.some(tag => ["Intimacy", "Physical Touch"].includes(tag))) {
      return "bg-pink-500";
    }
    if (tags.some(tag => ["Communication", "Blue Flag"].includes(tag))) {
      return "bg-blue-500";
    }
    return "bg-gray-400";
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Handle day click
  const handleDayClick = (day: Date) => {
    const dayMoments = getMomentsForDay(day);
    
    if (dayMoments.length > 0) {
      // Show day details if there are moments
      setSelectedDay(day);
      setDayDetailOpen(true);
    } else {
      // Create new moment if no moments exist for this day
      if (connections.length > 0) {
        setSelectedConnection(connections[0].id, connections[0]);
      }
      openMomentModal();
    }
  };

  // Handle adding new moment from day detail
  const handleAddMomentFromDay = () => {
    setDayDetailOpen(false);
    if (connections.length > 0) {
      setSelectedConnection(connections[0].id, connections[0]);
    }
    openMomentModal();
  };

  // Get weekday names
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="pb-20 pt-16">
        {/* Header */}
        <section className="px-4 py-6 border-b border-border/40 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
              <p className="text-sm text-muted-foreground">
                Track your relationship moments over time
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-primary" />
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Legend */}
        <section className="px-4 py-4">
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Legend</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Positive Moments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Conflicts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span>Intimacy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Communication</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Calendar Grid */}
        <section className="px-4">
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: getDay(monthStart) }).map((_, index) => (
                <div key={`empty-${index}`} className="h-16"></div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map(day => {
                const dayMoments = getMomentsForDay(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`
                      h-16 p-1 border border-border/20 rounded-lg transition-colors hover:bg-accent/50
                      ${isToday ? 'bg-primary/10 border-primary/30' : 'bg-background/50'}
                      ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''}
                    `}
                  >
                    <div className="text-xs font-medium mb-1">
                      {format(day, 'd')}
                    </div>
                    
                    {/* Moment indicators */}
                    <div className="flex flex-wrap gap-0.5">
                      {dayMoments.slice(0, 3).map((moment, index) => (
                        <div
                          key={moment.id}
                          className={`w-2 h-2 rounded-full ${getMomentColor(moment)}`}
                          title={moment.content || moment.emoji}
                        />
                      ))}
                      {dayMoments.length > 3 && (
                        <div className="w-2 h-2 rounded-full bg-gray-300 text-[6px] flex items-center justify-center font-bold">
                          +
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        {/* Quick Stats */}
        <section className="px-4 py-4">
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            <h3 className="text-sm font-medium mb-3">This Month</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           (m.tags || []).some(tag => ["Green Flag", "Quality Time", "Growth"].includes(tag));
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Positive</div>
              </div>
              <div>
                <div className="text-lg font-bold text-pink-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           (m.tags || []).some(tag => ["Intimacy"].includes(tag));
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Intimacy</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           (m.tags || []).some(tag => ["Red Flag", "Conflict"].includes(tag));
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Conflicts</div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* Day Detail Modal */}
      <Dialog open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedDay && format(selectedDay, 'EEEE, MMMM d')}
              </span>
              <Button 
                size="sm" 
                onClick={handleAddMomentFromDay}
                className="ml-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Moment
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedDay && getMomentsForDay(selectedDay).map((moment) => {
              const connection = connections.find(c => c.id === moment.connectionId);
              return (
                <Card key={moment.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{moment.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {connection?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(moment.createdAt || new Date()), 'h:mm a')}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-3">{moment.content}</p>
                      
                      {moment.tags && moment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {moment.tags.map((tag, index) => (
                            <span
                              key={index}
                              className={`text-xs px-2 py-1 rounded-full ${
                                tag.includes('Green') || tag === 'Quality Time' || tag === 'Support'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : tag.includes('Red') || tag === 'Conflict'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : tag === 'Intimacy' || tag === 'Physical Touch'
                                  ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
                                : tag.includes('Blue') || tag === 'Communication' || tag === 'Growth'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}