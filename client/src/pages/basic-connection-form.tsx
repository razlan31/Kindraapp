import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { relationshipStages } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ArrowLeft, Camera, LinkIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BasicConnectionForm() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [stage, setStage] = useState("Talking Stage");
  const [startDate, setStartDate] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [loveLanguages, setLoveLanguages] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState("");
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
      // Create connection data object
      const connectionData = {
        name: name.trim(),
        relationshipStage: stage
      };
      
      // Add optional fields if selected
      if (startDate) {
        connectionData['startDate'] = startDate;
      }
      
      if (zodiacSign) {
        connectionData['zodiacSign'] = zodiacSign;
      }
      
      if (loveLanguages.length > 0) {
        // Store multiple love languages as a comma-separated string
        connectionData['loveLanguage'] = loveLanguages.join(', ');
      }
      
      if (profileImage) {
        connectionData['profileImage'] = profileImage;
      }
      
      console.log("Sending data:", connectionData);
      
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
            
            <div>
              <label className="block text-sm font-medium mb-2">
                When did you start this connection?
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Select the date you started connecting"
                className="w-full"
              />
              <p className="text-xs text-neutral-500 mt-1">Track when you first connected with this person</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Profile Image
              </label>
              <div className="mb-4">
                <div className="flex items-center justify-center mb-3">
                  <Avatar className="h-20 w-20 border-2 border-blue-100 dark:border-blue-900">
                    {profileImage ? (
                      <AvatarImage src={profileImage} alt="Profile preview" />
                    ) : (
                      <AvatarFallback className="bg-blue-50 dark:bg-blue-950 text-blue-500">
                        <Camera className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                
                <Tabs defaultValue="presets" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-2">
                    <TabsTrigger value="presets">Presets</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="presets" className="mt-0">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        "https://randomuser.me/api/portraits/women/32.jpg",
                        "https://randomuser.me/api/portraits/men/22.jpg",
                        "https://randomuser.me/api/portraits/women/44.jpg",
                        "https://randomuser.me/api/portraits/men/42.jpg",
                        "https://randomuser.me/api/portraits/women/68.jpg",
                        "https://randomuser.me/api/portraits/men/91.jpg",
                        "https://randomuser.me/api/portraits/women/17.jpg",
                        "https://randomuser.me/api/portraits/men/54.jpg"
                      ].map((src, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setProfileImage(src)}
                          className={`p-1 rounded-md ${
                            profileImage === src ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <img 
                            src={src} 
                            alt={`Preset avatar ${index + 1}`} 
                            className="w-full aspect-square rounded-md object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="mt-0">
                    <div className="space-y-2">
                      <div className="flex">
                        <Input
                          placeholder="Enter image URL"
                          value={profileImage}
                          onChange={(e) => setProfileImage(e.target.value)}
                          className="flex-1"
                        />
                        {profileImage && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setProfileImage("")}
                            className="ml-1"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">
                        Enter a direct URL to an image (JPG, PNG, etc.)
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Zodiac Sign
              </label>
              <select
                value={zodiacSign}
                onChange={(e) => setZodiacSign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
              >
                <option value="">Select zodiac sign (optional)</option>
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
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Love Languages (select up to 3)
              </label>
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 mb-2">
                  Choose one or more love languages that matter to this person
                </p>
                
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Words of Affirmation",
                    "Physical Touch",
                    "Quality Time",
                    "Acts of Service",
                    "Receiving Gifts",
                    "Not Specified"
                  ].map((language) => {
                    const isSelected = loveLanguages.includes(language);
                    
                    const hasNotSpecified = loveLanguages.includes("Not Specified");
                    const isNotSpecified = language === "Not Specified";
                    const isDisabled = (hasNotSpecified && !isNotSpecified) || (!hasNotSpecified && isNotSpecified && loveLanguages.length > 0);
                    
                    const toggleLanguage = () => {
                      if (isSelected) {
                        // Remove if already selected
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
                    };
                    
                    return (
                      <Button
                        key={language}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`justify-start ${isSelected ? "bg-primary text-white" : ""} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isDisabled}
                        onClick={toggleLanguage}
                      >
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center mr-2 ${
                          isSelected ? "bg-white" : "bg-transparent"
                        }`}>
                          {isSelected && (
                            <div className="w-3 h-3 bg-primary rounded-sm" />
                          )}
                        </div>
                        <span>{language}</span>
                      </Button>
                    );
                  })}
                </div>
                
                {loveLanguages.length > 0 && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Selected:</span> {loveLanguages.join(", ")}
                  </div>
                )}
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
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}