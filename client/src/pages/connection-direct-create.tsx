import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { relationshipStages } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ArrowLeft } from "lucide-react";

export default function ConnectionDirectCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState("");
  const [relationshipStage, setRelationshipStage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !relationshipStage) {
      toast({
        title: "Error",
        description: "Name and relationship stage are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Direct server request with minimal data
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          relationshipStage,
        }),
        credentials: "include",
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Connection created successfully",
        });
        setLocation("/connections");
      } else {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        toast({
          title: "Error",
          description: "Failed to create connection. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating connection:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-xl mx-auto px-4 pt-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/connections")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Quick Add Connection</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name (Required)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stage">Relationship Stage (Required)</Label>
              <Select value={relationshipStage} onValueChange={setRelationshipStage} required>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Connection"}
            </Button>
          </form>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}