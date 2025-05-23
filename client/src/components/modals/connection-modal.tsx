import { useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/contexts/modal-context";
import { useAuth } from "@/contexts/auth-context";
import { connectionSchema, relationshipStages } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Camera } from "lucide-react";

export function ConnectionModal() {
  const { connectionModalOpen, closeConnectionModal } = useModal();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form schema
  const formSchema = connectionSchema.extend({
    name: z.string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),
    relationshipStage: z.string({
      required_error: "Please select a relationship stage",
    }),
    startDate: z.string().optional(),
    zodiacSign: z.string().optional(),
    loveLanguage: z.string().optional(),
    isPrivate: z.boolean().default(false),
  }).omit({ userId: true, id: true, createdAt: true });
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      profileImage: "",
      relationshipStage: "",
      startDate: new Date().toISOString().split('T')[0],
      zodiacSign: "",
      loveLanguage: "",
      isPrivate: false,
    },
  });
  
  // Create connection mutation
  const { mutate: createConnection, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/connections", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection added successfully",
        description: "Your new connection has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      closeConnectionModal();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add connection",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = useCallback((data: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    // Convert date string to ISO format if provided
    const formattedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
    };
    
    createConnection(formattedData);
  }, [user, createConnection]);
  
  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  
  const loveLanguages = [
    "Words of Affirmation", "Quality Time", "Physical Touch",
    "Acts of Service", "Receiving Gifts"
  ];
  
  return (
    <Dialog open={connectionModalOpen} onOpenChange={(open) => !open && closeConnectionModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold">Add New Connection</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="profileImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Photo</FormLabel>
                  <FormControl>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 flex flex-col items-center h-auto"
                      onClick={() => {
                        // For now just set a placeholder image URL
                        // In a real implementation, this would open a file picker
                        field.onChange("https://randomuser.me/api/portraits/men/32.jpg");
                      }}
                    >
                      <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2">
                        {field.value ? (
                          <img 
                            src={field.value} 
                            alt="Profile" 
                            className="h-full w-full object-cover rounded-full"
                          />
                        ) : (
                          <Camera className="h-6 w-6 text-neutral-400" />
                        )}
                      </div>
                      <span className="text-sm text-primary font-medium">Upload Photo</span>
                    </Button>
                  </FormControl>
                  <FormDescription>
                    Choose a profile photo for this connection
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="relationshipStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relationshipStages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
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
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Started talking/dating</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
              <h3 className="text-sm font-medium">Optional Details</h3>
              
              <FormField
                control={form.control}
                name="zodiacSign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-neutral-500">Zodiac Sign</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sign" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {zodiacSigns.map((sign) => (
                          <SelectItem key={sign} value={sign}>
                            {sign}
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
                name="loveLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-neutral-500">Love Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select love language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {loveLanguages.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                    <FormLabel>Keep this connection private</FormLabel>
                    <FormDescription>
                      Private connections are only visible to you
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" className="w-full bg-primary text-white" disabled={isPending}>
                {isPending ? "Adding..." : "Add Connection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
