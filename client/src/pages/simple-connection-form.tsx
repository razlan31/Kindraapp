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
  const [zodiacSign, setZodiacSign] = useState("");
  const [loveLanguage, setLoveLanguage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
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
      // Create a simple data object with just the required fields
      const connectionData = {
        name: name.trim(),
        relationshipStage: stage
      };
      
      // Only add optional fields if they have values
      if (zodiacSign) connectionData['zodiacSign'] = zodiacSign;
      if (loveLanguage) connectionData['loveLanguage'] = loveLanguage;
      if (isPrivate) connectionData['isPrivate'] = true;
      
      console.log("Sending connection data:", connectionData);
      
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(connectionData),
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
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">When did you start talking or dating?</p>
            </div>
            
            <div className="pt-4 space-y-4 border-t">
              <h3 className="text-sm font-medium">Optional Details</h3>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Zodiac Sign
                </label>
                <select
                  value={zodiacSign}
                  onChange={(e) => setZodiacSign(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800"
                >
                  <option value="">Select zodiac sign</option>
                  <option value="Aries">Aries</option>
                  <option value="Taurus">Taurus</option>
                  <option value="Gemini">Gemini</option>
                  <option value="Cancer">Cancer</option>
                  <option value="Leo">Leo</option>
                  <option value="Virgo">Virgo</option>
                  <option value="Libra">Libra</option>
                  <option value="Scorpio">Scorpio</option>
                  <option value="Sagittarius">Sagittarius</option>
                  <option value="Capricorn">Capricorn</option>
                  <option value="Aquarius">Aquarius</option>
                  <option value="Pisces">Pisces</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Love Language
                </label>
                <select
                  value={loveLanguage}
                  onChange={(e) => setLoveLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800"
                >
                  <option value="">Select love language</option>
                  <option value="Words of Affirmation">Words of Affirmation</option>
                  <option value="Quality Time">Quality Time</option>
                  <option value="Physical Touch">Physical Touch</option>
                  <option value="Acts of Service">Acts of Service</option>
                  <option value="Receiving Gifts">Receiving Gifts</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="private" className="text-sm text-gray-700 dark:text-gray-300">
                  Keep this connection private
                </label>
              </div>
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