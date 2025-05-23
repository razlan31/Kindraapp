import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { relationshipStages } from "@shared/schema";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

export default function SimpleConnectionForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [stage, setStage] = useState("Talking Stage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this connection",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          relationshipStage: stage
        }),
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Connection created:", data);
        
        toast({
          title: "Success!",
          description: "Connection has been created"
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
        setLocation("/connections");
      } else {
        const errorText = await response.text();
        console.error("Error creating connection:", errorText);
        
        toast({
          title: "Error",
          description: "Failed to create connection. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Exception:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/connections")}
            className="p-0 h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-center flex-1">Add Connection</h1>
          <div className="w-9"></div>
        </div>
        
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="w-full"
                autoFocus
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Relationship Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800"
              >
                {relationshipStages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Connection"}
            </Button>
          </form>
        </Card>
      </div>
      <BottomNavigation />
    </div>
  );
}