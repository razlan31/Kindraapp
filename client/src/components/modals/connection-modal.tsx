import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/contexts/modal-context";
import { useAuth } from "@/contexts/auth-context";
import { relationshipStages } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Camera, X } from "lucide-react";

export function ConnectionModal() {
  const { connectionModalOpen, closeConnectionModal } = useModal();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    setShowModal(connectionModalOpen);
  }, [connectionModalOpen]);
  
  // Form state
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [relationshipStage, setRelationshipStage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [loveLanguages, setLoveLanguages] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Create connection mutation
  const { mutate: createConnection, isPending } = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending data to server:", data);
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", response.status, errorText);
        throw new Error("Failed to create connection");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Connection created successfully:", data);
      
      // Check if any new badges were earned
      if (data.badges && data.badges.length > 0) {
        console.log("New badges earned from connection creation:", data.badges);
        
        // Show summary toast
        toast({
          title: `🎉 ${data.badges.length} New Badges Unlocked!`,
          description: "Check the Badges tab to see your achievements!",
          duration: 6000,
        });
        
        // Show individual badge notifications with delays
        data.badges.forEach((badge: any, index: number) => {
          setTimeout(() => {
            console.log(`Showing badge ${index + 1}:`, badge);
            toast({
              title: "🎉 Badge Unlocked!",
              description: `${badge.icon} ${badge.name}`,
              duration: 4000,
            });
          }, (index + 1) * 1000);
        });
      }
      
      toast({
        title: "Connection added successfully",
        description: "Your new connection has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      handleClose();
      resetForm();
    },
    onError: (error) => {
      console.error("Error creating connection:", error);
      toast({
        title: "Failed to add connection",
        description: "Please try again later.",
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
    setLoveLanguages([]);
    setIsPrivate(false);
    setErrors({});
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!relationshipStage) {
      newErrors.relationshipStage = "Please select a relationship stage";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted with data:", { name, relationshipStage, user: !!user, authLoading });
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    // Skip auth check since the user can access the modal, they're authenticated
    
    const data = {
      name,
      profileImage: profileImage || null,
      relationshipStage,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      zodiacSign: zodiacSign || null,
      loveLanguage: loveLanguages.length > 0 ? loveLanguages.join(', ') : null,
      isPrivate,
    };
    
    console.log("Submitting connection data:", data);
    createConnection(data);
  };
  
  const handleClose = () => {
    setShowModal(false);
    closeConnectionModal();
  };
  
  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  
  const loveLanguageOptions = [
    "Words of Affirmation", "Quality Time", "Physical Touch",
    "Acts of Service", "Receiving Gifts", "Not Specified"
  ];
  
  if (!showModal) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-heading font-semibold text-lg">Add New Connection</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name"
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name" 
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <Button 
              type="button"
              variant="outline"
              className="w-full border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 flex flex-col items-center h-auto"
              onClick={() => {
                setProfileImage("https://randomuser.me/api/portraits/men/32.jpg");
              }}
            >
              <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <Camera className="h-6 w-6 text-neutral-400" />
                )}
              </div>
              <span className="text-sm text-primary font-medium">Upload Photo</span>
            </Button>
            <p className="text-sm text-gray-500">Choose a profile photo for this connection</p>
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
            <Label htmlFor="startDate">Started talking/dating</Label>
            <Input 
              id="startDate"
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          
          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-sm font-medium">Optional Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="zodiac" className="text-xs text-neutral-500">Zodiac Sign</Label>
              <Select value={zodiacSign} onValueChange={setZodiacSign}>
                <SelectTrigger id="zodiac">
                  <SelectValue placeholder="Select sign" />
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
              <Label className="text-xs text-neutral-500">Love Languages</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {loveLanguageOptions.map((language) => {
                  const isSelected = loveLanguages.includes(language);
                  const hasNotSpecified = loveLanguages.includes("Not Specified");
                  const isNotSpecified = language === "Not Specified";
                  const isDisabled = (hasNotSpecified && !isNotSpecified) || (!hasNotSpecified && isNotSpecified && loveLanguages.length > 0);
                  
                  return (
                    <Button
                      key={language}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isSelected) {
                          setLoveLanguages(loveLanguages.filter(l => l !== language));
                        } else {
                          if (isNotSpecified) {
                            // If selecting "Not Specified", clear all others
                            setLoveLanguages(["Not Specified"]);
                          } else {
                            // If selecting any other, remove "Not Specified" and add this one
                            const filteredLanguages = loveLanguages.filter(l => l !== "Not Specified");
                            setLoveLanguages([...filteredLanguages, language]);
                          }
                        }
                      }}
                    >
                      {language}
                    </Button>
                  );
                })}
              </div>
              {loveLanguages.length > 0 && (
                <p className="text-xs text-neutral-500 mt-2">
                  Selected: {loveLanguages.join(", ")}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
            <Checkbox
              id="private"
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(checked === true)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="private">Keep this connection private</Label>
              <p className="text-sm text-gray-500">
                Private connections are only visible to you
              </p>
            </div>
          </div>
          
          <div className="pt-2">
            <Button type="submit" className="w-full bg-primary text-white" disabled={isPending}>
              {isPending ? "Adding..." : "Add Connection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
