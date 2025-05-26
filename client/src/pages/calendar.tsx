import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Heart, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useModal } from "@/contexts/modal-context";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import type { Moment, Connection } from "@shared/schema";

export default function Calendar() {
  const { user } = useAuth();
  const { openMomentModal, setSelectedConnection } = useModal();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch moments
  const { data: moments = [] } = useQuery<Moment[]>({
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
    return moments.filter(moment => 
      isSameDay(new Date(moment.createdAt || new Date()), day)
    );
  };

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
    // Set the first connection as selected for moment creation
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

      <BottomNavigation />
    </div>
  );
}