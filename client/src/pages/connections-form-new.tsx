import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Connection } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Camera, ArrowLeft, Loader2 as Spinner } from "lucide-react";
import { relationshipStages } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

// Predefined options
const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const loveLanguages = [
  "Words of Affirmation",
  "Quality Time", 
  "Physical Touch",
  "Acts of Service",
  "Receiving Gifts",
  "Gift Giving",
  "Touch",
  "Time Together",
  "Verbal Appreciation",
  "Helpful Actions",
  "Not Specified"
];

export default function ConnectionsFormNew() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [relationshipStage, setRelationshipStage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [selectedLoveLanguages, setSelectedLoveLanguages] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Create connection mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending data to server:", data);
      try {
        const response = await fetch("/api/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(errorText || "Failed to create connection");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error creating connection:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Connection created",
        description: "Your new connection has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      setLocation("/connections");
    },
    onError: (error: any) => {
      toast({
        title: "Error creating connection",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setProfileImage("");
    setRelationshipStage("");
    setStartDate("");
    setZodiacSign("");
    setSelectedLoveLanguages([]);
    setIsPrivate(false);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!relationshipStage) {
      newErrors.relationshipStage = "Relationship stage is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;
    
    // Prepare the data in the exact format expected by the server
    const connectionData = {
      name,
      profileImage: profileImage || null,
      relationshipStage,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      zodiacSign: zodiacSign === "none" ? null : zodiacSign,
      loveLanguage: selectedLoveLanguages.length > 0 ? selectedLoveLanguages.join(", ") : null,
      isPrivate,
    };
    
    console.log("Submitting connection data:", connectionData);
    
    try {
      // Direct API call to avoid any issues with the mutation
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectionData),
        credentials: "include"
      });
      
      if (response.ok) {
        toast({
          title: "Connection created",
          description: "Your new connection has been created successfully."
        });
        
        // Manually refresh connections data
        queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
        
        // Redirect to connections page
        setLocation("/connections");
      } else {
        const errorData = await response.text();
        console.error("Error creating connection:", errorData);
        toast({
          title: "Error creating connection",
          description: "There was a problem creating your connection. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Exception creating connection:", error);
      toast({
        title: "Error creating connection",
        description: "There was a problem creating your connection. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-xl mx-auto">
        <div className="p-4 border-b sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/connections")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Add New Connection</h1>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex flex-col items-center gap-3">
                <div className="h-20 w-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neutral-200 dark:border-neutral-700">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-neutral-400" />
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <Input
                    type="url"
                    placeholder="Enter image URL"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    className="max-w-[180px] text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    type="button"
                    onClick={() => setProfileImage("")}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="grid grid-cols-4 gap-2 w-full max-w-[240px] mx-auto">
                  {["https://randomuser.me/api/portraits/women/32.jpg", 
                    "https://randomuser.me/api/portraits/men/32.jpg",
                    "https://randomuser.me/api/portraits/women/68.jpg",
                    "https://randomuser.me/api/portraits/men/68.jpg"].map((url, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      className="p-1 h-auto aspect-square"
                      type="button"
                      onClick={() => setProfileImage(url)}
                    >
                      <img 
                        src={url} 
                        alt={`Avatar option ${i+1}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stage">Relationship Stage</Label>
              <Select value={relationshipStage} onValueChange={setRelationshipStage}>
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
              {errors.relationshipStage && <p className="text-sm text-red-500">{errors.relationshipStage}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zodiac" className="text-xs text-neutral-500">Zodiac Sign</Label>
              <Select value={zodiacSign} onValueChange={setZodiacSign}>
                <SelectTrigger id="zodiac">
                  <SelectValue placeholder="Select zodiac sign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {zodiacSigns.map((sign) => (
                    <SelectItem key={sign} value={sign}>
                      {sign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">Love Languages (Select up to 3)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {loveLanguages.map((language) => {
                  const isSelected = selectedLoveLanguages.includes(language);
                  const canSelect = isSelected || selectedLoveLanguages.length < 3;
                  
                  return (
                    <Button
                      key={language}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full text-xs ${!canSelect && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedLoveLanguages(selectedLoveLanguages.filter(l => l !== language));
                        } else if (canSelect) {
                          setSelectedLoveLanguages([...selectedLoveLanguages, language]);
                        }
                      }}
                      disabled={!canSelect && !isSelected}
                    >
                      {language}
                    </Button>
                  );
                })}
              </div>
              {selectedLoveLanguages.length > 0 && (
                <p className="text-xs text-neutral-500 mt-2">
                  Selected: {selectedLoveLanguages.join(", ")}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
            <Checkbox
              id="private"
              checked={isPrivate}
              onCheckedChange={(checked) => 
                setIsPrivate(checked as boolean)
              }
            />
            <div className="space-y-1 leading-none">
              <label
                htmlFor="private"
                className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Private Connection
              </label>
              <p className="text-xs text-neutral-500">
                Only visible to you, won't appear in shared data
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation("/connections")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Connection"
              )}
            </Button>
          </div>
        </form>
      </div>
      <BottomNavigation />
    </div>
  );
}