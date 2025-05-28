import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Moment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  moment: Moment | null;
}

export function ConflictResolutionModal({ isOpen, onClose, moment }: ConflictResolutionModalProps) {
  const [isResolved, setIsResolved] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvedDate, setResolvedDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (moment && isOpen) {
      setIsResolved(moment.isResolved || false);
      setResolutionNotes(moment.resolutionNotes || "");
      setResolvedDate(moment.resolvedAt ? new Date(moment.resolvedAt) : undefined);
    }
  }, [moment, isOpen]);

  const handleSubmit = async () => {
    if (!moment) return;
    
    setIsSubmitting(true);
    try {
      const updateData = {
        ...moment,
        isResolved,
        resolutionNotes: resolutionNotes.trim() !== "" ? resolutionNotes : null,
        resolvedAt: resolvedDate ? resolvedDate.toISOString() : null,
      };

      await apiRequest(`/api/moments/${moment.id}`, 'PATCH', updateData);

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/moments'] });
      
      toast({
        title: isResolved ? "Conflict Resolved" : "Resolution Status Updated",
        description: isResolved ? "Resolution notes saved successfully" : "Conflict marked as unresolved",
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update conflict resolution:', error);
      toast({
        title: "Error",
        description: "Failed to update conflict resolution",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!moment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            Conflict Resolution
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium">{moment.title}</p>
            <p>{moment.content}</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Resolution Status</label>
            <Button
              type="button"
              variant={isResolved ? "default" : "outline"}
              size="sm"
              onClick={() => setIsResolved(!isResolved)}
              className={cn(
                "px-4 py-2",
                isResolved ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-gray-50"
              )}
            >
              {isResolved ? "✓ Resolved" : "Mark as Resolved"}
            </Button>
          </div>

          {isResolved && (
            <div className="space-y-4 pl-4 border-l-2 border-green-200">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Resolution Notes</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="How was this conflict resolved? What was the outcome?"
                  className="min-h-[100px] border-green-200 focus:border-green-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Resolution Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-green-200",
                        !resolvedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {resolvedDate ? format(resolvedDate, "PPP") : <span>Pick resolution date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={resolvedDate}
                      onSelect={(date) => {
                        if (date) {
                          setResolvedDate(date);
                          document.body.click();
                        }
                      }}
                      initialFocus
                    />
                    <div className="flex justify-between p-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.body.click()}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setResolvedDate(new Date());
                          document.body.click();
                        }}
                      >
                        Today
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}