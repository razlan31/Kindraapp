import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, CakeIcon, HeartIcon, StarIcon } from 'lucide-react';
import { milestoneSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRelationshipFocus } from '@/contexts/relationship-focus-context';
import { useToast } from '@/hooks/use-toast';
import { Connection } from '@shared/schema';

type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

// Extend the milestoneSchema to add validation rules
const milestoneFormSchema = milestoneSchema
  .omit({ id: true, userId: true })
  .extend({
    date: z.date({
      required_error: "A date is required",
    }),
  });

type MilestoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedConnection?: Connection;
  existingMilestone?: any; // The milestone to edit if in edit mode
};

const iconOptions = [
  { value: 'cake', label: 'Cake', icon: <CakeIcon className="h-4 w-4 mr-2" /> },
  { value: 'heart', label: 'Heart', icon: <HeartIcon className="h-4 w-4 mr-2" /> },
  { value: 'star', label: 'Star', icon: <StarIcon className="h-4 w-4 mr-2" /> },
];

const colorOptions = [
  { value: '#C084FC', label: 'Purple', className: 'bg-purple-400' },
  { value: '#FB7185', label: 'Red', className: 'bg-red-400' },
  { value: '#60A5FA', label: 'Blue', className: 'bg-blue-400' },
  { value: '#4ADE80', label: 'Green', className: 'bg-green-400' },
  { value: '#FBBF24', label: 'Yellow', className: 'bg-yellow-400' },
  { value: '#F472B6', label: 'Pink', className: 'bg-pink-400' },
];

export function MilestoneModal({ isOpen, onClose, selectedDate, selectedConnection, existingMilestone }: MilestoneModalProps) {
  const { mainFocusConnection } = useRelationshipFocus();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Use the provided selectedConnection if available, otherwise fall back to mainFocusConnection
  const connection = selectedConnection || mainFocusConnection;
  
  const isEditMode = !!existingMilestone;
  
  // Set up form with default values
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: existingMilestone ? {
      ...existingMilestone,
      date: new Date(existingMilestone.date),
    } : {
      connectionId: connection?.id || 0,
      title: '',
      description: '',
      date: selectedDate,
      isAnniversary: false,
      isRecurring: false,
      color: '#C084FC',
      icon: 'cake',
    }
  });
  
  const createMilestoneMutation = useMutation({
    mutationFn: (data: MilestoneFormValues) => {
      return apiRequest('/api/milestones', {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Milestone created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create milestone',
        variant: 'destructive',
      });
    }
  });
  
  const updateMilestoneMutation = useMutation({
    mutationFn: (data: MilestoneFormValues & { id: number }) => {
      return apiRequest(`/api/milestones/${data.id}`, {
        method: 'PUT',
        data
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Milestone updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update milestone',
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: MilestoneFormValues) => {
    if (!connection) {
      toast({
        title: 'No connection selected',
        description: 'Please select a connection to add a milestone',
        variant: 'destructive',
      });
      return;
    }
    
    if (isEditMode) {
      updateMilestoneMutation.mutate({
        ...data,
        id: existingMilestone.id,
      });
    } else {
      createMilestoneMutation.mutate({
        ...data,
        connectionId: connection.id,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="First date, Anniversary..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add details about this milestone..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center">
                              {option.icon}
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-full mr-2 ${option.className}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isAnniversary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Anniversary</FormLabel>
                      <FormDescription>Mark as yearly anniversary</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Recurring</FormLabel>
                      <FormDescription>Show in future years</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMilestoneMutation.isPending || updateMilestoneMutation.isPending}
              >
                {isEditMode ? 'Update' : 'Add'} Milestone
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}