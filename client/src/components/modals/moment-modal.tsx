import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/contexts/modal-context";
import { useAuth } from "@/contexts/auth-context";
import { Connection, momentSchema } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { TagSelector } from "@/components/ui/tag-selector";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function MomentModal() {
  const { momentModalOpen, closeMomentModal, selectedConnectionId } = useModal();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: momentModalOpen, // Always enabled since backend auto-authenticates
  });
  
  // Form schema
  const formSchema = z.object({
    connectionId: z.number({
      required_error: "Please select a connection",
    }),
    emoji: z.string({
      required_error: "Please select an emoji",
    }),
    content: z.string()
      .min(3, "Please enter at least 3 characters")
      .max(500, "Content cannot exceed 500 characters"),
    tags: z.array(z.string()).optional(),
    isPrivate: z.boolean().default(false),
    isIntimate: z.boolean().default(false),
    intimacyRating: z.string().optional(),
    relatedToMenstrualCycle: z.boolean().default(false),
    isMilestone: z.boolean().default(false),
    milestoneTitle: z.string().optional(),
    userId: z.number().optional(),
  });
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      connectionId: selectedConnectionId || 0,
      emoji: "😊",
      content: "",
      tags: [],
      isPrivate: false,
      isMilestone: false,
      milestoneTitle: "",
    },
  });
  
  // Update form when selected connection changes
  useEffect(() => {
    if (selectedConnectionId) {
      form.setValue("connectionId", selectedConnectionId);
    }
  }, [selectedConnectionId, form]);
  
  // Log moment mutation
  const { mutate: createMoment, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/moments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Moment logged successfully",
        description: "Your emotional moment has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/moments"] });
      closeMomentModal();
      form.reset({
        connectionId: 0,
        emoji: "😊",
        content: "",
        tags: [],
        isPrivate: false,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to log moment",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  // Milestone creation mutation
  const { mutate: createMilestone } = useMutation({
    mutationFn: async (milestoneData: any) => {
      return await apiRequest("POST", "/api/milestones", milestoneData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      toast({
        title: "Milestone created",
        description: "Your milestone has been added to your journey",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create milestone",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = useCallback((data: z.infer<typeof formSchema>) => {
    // Backend auto-authenticates, so we don't need to check user
    const momentData = {
      ...data,
      userId: 1 // Backend automatically sets this
    };
    
    // Create the moment
    createMoment(momentData);
    
    // If marked as milestone, also create a milestone entry
    if (data.isMilestone && data.milestoneTitle) {
      const milestoneData = {
        userId: user.id,
        connectionId: data.connectionId,
        title: data.milestoneTitle,
        description: data.content,
        date: new Date(),
        icon: "star", // Default icon for moments converted to milestones
        color: "#FBBF24", // Default amber color
        isAnniversary: false,
        isRecurring: false
      };
      
      createMilestone(milestoneData);
    }
  }, [user, createMoment, createMilestone]);
  
  return (
    <Dialog open={momentModalOpen} onOpenChange={(open) => !open && closeMomentModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold">Log a Moment</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="connectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>With who?</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a connection" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {connections.map((connection: Connection) => (
                        <SelectItem key={connection.id} value={connection.id.toString()}>
                          {connection.name}
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
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How are you feeling?</FormLabel>
                  <FormControl>
                    <EmojiPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What happened?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your moment..." 
                      className="resize-none" 
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag this moment:</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Flag explanation */}
                      <div className="bg-muted/30 rounded-lg p-3 mb-2">
                        <p className="text-xs font-medium mb-2">Flag Guide:</p>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded-full bg-greenFlag/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-greenFlag text-[10px] font-bold">G</span>
                            </span>
                            <span className="text-xs text-greenFlag">Green Flag: Positive moments</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded-full bg-redFlag/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-redFlag text-[10px] font-bold">R</span>
                            </span>
                            <span className="text-xs text-redFlag">Red Flag: Concerning moments</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">B</span>
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-400">Blue Flag: Growth opportunities</span>
                          </div>
                        </div>
                      </div>
                      <TagSelector 
                        selectedTags={field.value || []} 
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select at least one tag to categorize this moment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isIntimate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>This is an intimate moment</FormLabel>
                    <FormDescription>
                      Track intimate moments to identify patterns in your relationship
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch("isIntimate") && (
              <FormField
                control={form.control}
                name="intimacyRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intimacy Quality</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Rate the experience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Great">Great</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Neutral">Neutral</SelectItem>
                        <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This helps identify patterns in your intimate connection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="relatedToMenstrualCycle"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Related to menstrual cycle</FormLabel>
                    <FormDescription>
                      Track how your cycle may affect your mood and relationship
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isMilestone"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as milestone</FormLabel>
                    <FormDescription>
                      Important moments in your relationship journey (e.g., first date, anniversary)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch("isMilestone") && (
              <FormField
                control={form.control}
                name="milestoneTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="E.g., First Date, Anniversary, First Trip Together" 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Give your milestone a memorable title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Keep this moment private</FormLabel>
                    <FormDescription>
                      Private moments are only visible to you
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" className="w-full bg-primary text-white" disabled={isPending}>
                {isPending ? "Saving..." : "Save Moment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
