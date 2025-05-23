import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { relationshipStages } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ArrowLeft } from "lucide-react";

export default function BasicConnectionForm() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [stage, setStage] = useState("Talking Stage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this connection"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Sending data:", { name: name.trim(), relationshipStage: stage });
      
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
        console.log("Connection created successfully:", data);
        
        toast({
          title: "Success!",
          description: "Connection created successfully"
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
        setLocation("/connections");
      } else {
        const errorData = await response.text();
        console.error("Error response:", errorData);
        
        toast({
          title: "Error",
          description: "Failed to create connection",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Exception:", error);
      
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-md mx-auto p-4">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/connections")}
            className="p-0 w-9 h-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold flex-1 text-center">Add Connection</h1>
          <div className="w-9"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="w-full"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Relationship Stage <span className="text-red-500">*</span>
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
              >
                {relationshipStages.map((s) => (
                  <option key={s} value={s}>{s}</option>
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
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}