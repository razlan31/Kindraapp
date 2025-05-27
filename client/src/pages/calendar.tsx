import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Heart, Calendar as CalendarIcon, Plus, Eye } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useModal } from "@/contexts/modal-context";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import type { Moment, Connection } from "@shared/schema";
import { EntryDetailModal } from "@/components/modals/entry-detail-modal";

export default function Calendar() {
  const { user } = useAuth();
  const { openMomentModal, setSelectedConnection } = useModal();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  
  // Entry detail modal state
  const [selectedEntry, setSelectedEntry] = useState<Moment | null>(null);
  const [entryDetailOpen, setEntryDetailOpen] = useState(false);
  
  // Filter states for different entry types
  const [filters, setFilters] = useState({
    positive: true,
    negative: true,
    neutral: true,
    conflict: true,
    intimacy: true,
  });

  // Fetch moments (using exact same config as moments.tsx that works)
  const { data: allMoments = [], isLoading: momentsLoading, refetch: refetchMoments } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  // Filter moments based on selected filters
  const moments = allMoments.filter(moment => {
    if (moment.tags?.includes('Conflict') && !filters.conflict) return false;
    if (moment.tags?.includes('Intimacy') && !filters.intimacy) return false;
    
    // For regular moments, check emoji to determine type
    if (!moment.tags?.includes('Conflict') && !moment.tags?.includes('Intimacy')) {
      if ((moment.emoji === '😊' || moment.emoji === '😍' || moment.emoji === '❤️') && !filters.positive) return false;
      if ((moment.emoji === '😕' || moment.emoji === '😔') && !filters.negative) return false;
      if ((moment.emoji === '🌱' || moment.emoji === '🗣️') && !filters.neutral) return false;
    }
    
    return true;
  });

  // Force refresh when component mounts and listen for updates
  useEffect(() => {
    if (user) {
      console.log('Calendar - User authenticated, fetching moments...');
      refetchMoments();
    }
  }, [user, refetchMoments]);

  // Listen for moment creation and update events to refetch data immediately
  useEffect(() => {
    const handleMomentCreated = () => refetchMoments();
    const handleMomentUpdated = () => refetchMoments();
    
    window.addEventListener('momentCreated', handleMomentCreated);
    window.addEventListener('momentUpdated', handleMomentUpdated);
    
    return () => {
      window.removeEventListener('momentCreated', handleMomentCreated);
      window.removeEventListener('momentUpdated', handleMomentUpdated);
    };
  }, [refetchMoments]);

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
    const dayMoments = moments.filter(moment => {
      const momentDate = new Date(moment.createdAt || new Date());
      const same = isSameDay(momentDate, day);
      // Debug for today's date
      if (format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
        console.log(`Today ${format(day, 'yyyy-MM-dd')} - Moment ${moment.id}: ${format(momentDate, 'yyyy-MM-dd')} - Match: ${same}`, moment);
      }
      return same;
    });
    return dayMoments;
  };

  // Debug moments loading
  console.log('Calendar Debug - Total moments:', moments.length, moments);
  
  // Force refetch if no moments but user is authenticated
  useEffect(() => {
    if (user && moments.length === 0 && !momentsLoading) {
      console.log('Calendar - No moments found, refetching...');
      setTimeout(() => refetchMoments(), 100);
    }
  }, [user, moments.length, momentsLoading, refetchMoments]);



  // Get moment type and display info
  const getMomentDisplayInfo = (moment: Moment) => {
    const tags = moment.tags || [];
    
    // Check if it's a conflict
    if (tags.includes("Conflict")) {
      return { type: 'emoji', value: '⚡', color: 'text-red-500' };
    }
    
    // Check if it's intimacy
    if (moment.isIntimate || tags.includes("Intimacy")) {
      return { type: 'emoji', value: '💕', color: 'text-pink-500' };
    }
    
    // For regular moments, show colored circles based on type
    if (['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(moment.emoji)) {
      return { type: 'circle', value: '', color: 'bg-green-500' };
    } else if (['😕', '😢', '😠', '😞', '😤'].includes(moment.emoji)) {
      return { type: 'circle', value: '', color: 'bg-orange-500' };
    } else {
      return { type: 'circle', value: '', color: 'bg-blue-500' };
    }
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
    // Always set the selected day first
    setSelectedDay(day);
    setDayDetailOpen(true);
  };

  // Handle adding new moment from day detail
  const handleAddMomentFromDay = () => {
    console.log("Calendar button clicked - selectedDay:", selectedDay);
    setDayDetailOpen(false);
    if (connections.length > 0) {
      setSelectedConnection(connections[0].id, connections[0]);
    }
    // Pass the selected day as a Date object, not undefined
    openMomentModal('moment', undefined, selectedDay || new Date());
  };

  // Handle clicking on calendar entries to open details
  const handleEntryClick = (moment: Moment, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent day click
    setSelectedEntry(moment);
    setEntryDetailOpen(true);
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
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Negative Moments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Neutral Moments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <span>Conflicts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">💕</span>
                <span>Intimacy</span>
              </div>
            </div>
            
            {/* Filter Checkboxes */}
            <div className="mt-4 pt-3 border-t border-border/20">
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">Show on Calendar</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="positive"
                    checked={filters.positive}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, positive: !!checked }))
                    }
                  />
                  <label htmlFor="positive" className="text-xs cursor-pointer">Positive</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="negative"
                    checked={filters.negative}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, negative: !!checked }))
                    }
                  />
                  <label htmlFor="negative" className="text-xs cursor-pointer">Negative</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="neutral"
                    checked={filters.neutral}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, neutral: !!checked }))
                    }
                  />
                  <label htmlFor="neutral" className="text-xs cursor-pointer">Neutral</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="conflict"
                    checked={filters.conflict}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, conflict: !!checked }))
                    }
                  />
                  <label htmlFor="conflict" className="text-xs cursor-pointer">Conflicts</label>
                </div>
                <div className="flex items-center space-x-2 col-span-2">
                  <Checkbox
                    id="intimacy"
                    checked={filters.intimacy}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, intimacy: !!checked }))
                    }
                  />
                  <label htmlFor="intimacy" className="text-xs cursor-pointer">Intimacy</label>
                </div>
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
                    <div className="flex flex-wrap gap-0.5 items-center">
                      {dayMoments.slice(0, 3).map((moment, index) => {
                        const displayInfo = getMomentDisplayInfo(moment);
                        return displayInfo.type === 'emoji' ? (
                          <span
                            key={moment.id}
                            className={`text-[8px] ${displayInfo.color} cursor-pointer hover:scale-110 transition-transform`}
                            title={moment.content || moment.emoji}
                            onClick={(e) => handleEntryClick(moment, e)}
                          >
                            {displayInfo.value}
                          </span>
                        ) : (
                          <div
                            key={moment.id}
                            className={`w-2 h-2 rounded-full ${displayInfo.color} cursor-pointer hover:scale-110 transition-transform`}
                            title={moment.content || moment.emoji}
                            onClick={(e) => handleEntryClick(moment, e)}
                          />
                        );
                      })}
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
            <div className="grid grid-cols-5 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           !m.tags?.includes("Conflict") && !m.isIntimate &&
                           ['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥'].includes(m.emoji);
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Positive</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           !m.tags?.includes("Conflict") && !m.isIntimate &&
                           ['😕', '😢', '😠', '😞', '😤'].includes(m.emoji);
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Negative</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           !m.tags?.includes("Conflict") && !m.isIntimate &&
                           !['😊', '❤️', '😍', '🥰', '💖', '✨', '🔥', '😕', '😢', '😠', '😞', '😤'].includes(m.emoji);
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Neutral</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           m.tags?.includes("Conflict");
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Conflicts</div>
              </div>
              <div>
                <div className="text-lg font-bold text-pink-600">
                  {moments.filter(m => {
                    const momentDate = new Date(m.createdAt || new Date());
                    return isSameMonth(momentDate, currentDate) && 
                           (m.isIntimate || m.tags?.includes("Intimacy"));
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Intimacy</div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* Day Detail Modal */}
      <Dialog open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay, 'EEEE, MMMM d')}
            </DialogTitle>
          </DialogHeader>
          
          {/* Add Entry Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button 
              size="sm" 
              onClick={handleAddMomentFromDay}
              className="flex flex-col h-16 text-xs"
              variant="outline"
            >
              <div className="text-lg mb-1">😊</div>
              <span>Moment</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                console.log("Conflict button clicked - selectedDay:", selectedDay);
                openMomentModal('conflict', undefined, selectedDay || new Date());
                setDayDetailOpen(false);
              }}
              className="flex flex-col h-16 text-xs"
              variant="outline"
            >
              <div className="text-lg mb-1">⚡</div>
              <span>Conflict</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                console.log("Intimacy button clicked - selectedDay:", selectedDay);
                openMomentModal('intimacy', undefined, selectedDay || new Date());
                setDayDetailOpen(false);
              }}
              className="flex flex-col h-16 text-xs"
              variant="outline"
            >
              <div className="text-lg mb-1">💕</div>
              <span>Intimacy</span>
            </Button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedDay && getMomentsForDay(selectedDay).map((moment) => {
              const connection = connections.find(c => c.id === moment.connectionId);
              return (
                <Card 
                  key={moment.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedEntry(moment);
                    setEntryDetailOpen(true);
                    setDayDetailOpen(false);
                  }}
                >
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

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          isOpen={entryDetailOpen}
          onClose={async () => {
            setEntryDetailOpen(false);
            setSelectedEntry(null);
            // Force immediate refresh with multiple approaches
            await queryClient.invalidateQueries({ queryKey: ["/api/moments"] });
            await queryClient.refetchQueries({ queryKey: ["/api/moments"] });
            // Also trigger a component re-render by updating current date slightly
            setCurrentDate(new Date(currentDate.getTime()));
          }}
          moment={selectedEntry}
          connection={connections.find(c => c.id === selectedEntry.connectionId) || null}
        />
      )}

      <BottomNavigation />
    </div>
  );
}