import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { MenstrualCycle } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CycleTrackerProps {
  cycles: MenstrualCycle[];
}

export function CycleTracker({ cycles }: CycleTrackerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create cycle mutation
  const { mutate: createCycle, isPending } = useMutation({
    mutationFn: async (data: { startDate: Date; endDate?: Date; notes?: string }) => {
      const response = await apiRequest("POST", "/api/menstrual-cycles", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cycle tracked successfully",
        description: "Your menstrual cycle has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menstrual-cycles"] });
      setShowAddForm(false);
      setSelectedDate(undefined);
      setEndDate(undefined);
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Failed to track cycle",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Get cycle dates for highlighting in calendar
  const cycleDates = cycles.reduce<Record<string, 'start' | 'end' | 'active'>>(
    (dates, cycle) => {
      // Convert the ISO strings to Date objects for manipulation
      const startDate = new Date(cycle.startDate);
      const endDate = cycle.endDate ? new Date(cycle.endDate) : null;
      
      // Format the start date as a string for our dates object
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      dates[formattedStartDate] = 'start';
      
      // If there's an end date, format it and add to our dates object
      if (endDate) {
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        dates[formattedEndDate] = 'end';
        
        // Mark all days between start and end as 'active'
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1); // Start from day after start
        
        while (currentDate < endDate) {
          const formattedDate = format(currentDate, 'yyyy-MM-dd');
          dates[formattedDate] = 'active';
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      return dates;
    },
    {}
  );

  // Handle adding a new cycle
  const handleAddCycle = () => {
    if (!selectedDate) {
      toast({
        title: "Start date required",
        description: "Please select a start date for your cycle.",
        variant: "destructive",
      });
      return;
    }
    
    createCycle({
      startDate: selectedDate,
      endDate: endDate,
      notes: notes.trim() || undefined,
    });
  };

  // Custom day rendering to highlight cycle days
  const renderDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const cycleType = cycleDates[dateStr];
    
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center",
          cycleType === 'start' && "bg-primary/20 rounded-l-full",
          cycleType === 'end' && "bg-primary/20 rounded-r-full", 
          cycleType === 'active' && "bg-primary/20",
        )}
      >
        {day.getDate()}
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Menstrual Cycle Tracker</CardTitle>
            <CardDescription>Track your cycles and associated emotions</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1"
          >
            {showAddForm ? "Cancel" : <>
              <Plus className="h-4 w-4" /> Add Cycle
            </>}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm ? (
          <div className="space-y-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span className="text-muted-foreground">Select start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span className="text-muted-foreground">Select end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => 
                      selectedDate ? date < selectedDate : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea 
                placeholder="Physical and emotional symptoms, flow intensity, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none mt-1"
                rows={3}
              />
            </div>

            <Button 
              onClick={handleAddCycle} 
              className="w-full" 
              disabled={isPending || !selectedDate}
            >
              {isPending ? "Saving..." : "Save Cycle"}
            </Button>
          </div>
        ) : (
          <div>
            <Calendar 
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border mx-auto"
              components={{
                Day: ({ date, ...props }) => (
                  <button {...props}>
                    {renderDay(date)}
                  </button>
                ),
              }}
            />
            
            {/* Cycle Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-primary/20 mr-2"></div>
                <span>Period Days</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-secondary/20 mr-2"></div>
                <span>Fertile Window</span>
              </div>
            </div>
            
            {/* Display most recent cycle info */}
            {cycles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Recent Cycle</h4>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Start Date:</span>
                    <span className="text-sm">{format(new Date(cycles[0].startDate), 'PPP')}</span>
                  </div>
                  {cycles[0].endDate && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">End Date:</span>
                      <span className="text-sm">{format(new Date(cycles[0].endDate), 'PPP')}</span>
                    </div>
                  )}
                  {cycles[0].notes && (
                    <div className="mt-2">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">{cycles[0].notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}