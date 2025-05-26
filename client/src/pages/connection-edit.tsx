import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Connection } from "@shared/schema";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { relationshipStages } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ConnectionEdit() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const connectionId = parseInt(id as string);
  
  // Form state
  const [name, setName] = useState("");
  const [stage, setStage] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [zodiacSign, setZodiacSign] = useState("");
  const [loveLanguages, setLoveLanguages] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState("");
  const [birthday, setBirthday] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch connection details
  const { data: connection, isLoading, error } = useQuery({
    queryKey: ['/api/connections', connectionId],
    queryFn: async () => {
      const response = await fetch(`/api/connections/${connectionId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch connection details');
      }
      
      return response.json() as Promise<Connection>;
    },
    enabled: !isNaN(connectionId),
  });
  
  // Initialize form with connection data
  useEffect(() => {
    if (connection) {
      setName(connection.name);
      setStage(connection.relationshipStage);
      setZodiacSign(connection.zodiacSign || "");
      
      // Format and set start date if available
      if (connection.startDate) {
        const date = new Date(connection.startDate);
        setStartDate(format(date, 'yyyy-MM-dd'));
      }
      
      // Handle love languages (they are stored as comma-separated string)
      if (connection.loveLanguage) {
        setLoveLanguages(connection.loveLanguage.split(', ').map(l => l.trim()));
      }
      
      setProfileImage(connection.profileImage || "");
      
      // Handle birthday if available
      if (connection.birthday) {
        const date = new Date(connection.birthday);
        setBirthday(format(date, 'yyyy-MM-dd'));
      }
    }
  }, [connection]);
  
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
      // Create connection data object
      const connectionData: any = {
        name: name.trim(),
        relationshipStage: stage
      };
      
      // Add optional fields if selected
      if (zodiacSign) {
        connectionData.zodiacSign = zodiacSign;
      }
      
      // Add start date if provided
      if (startDate) {
        connectionData.startDate = new Date(startDate);
      }
      
      if (loveLanguages.length > 0) {
        // Store multiple love languages as a comma-separated string
        connectionData.loveLanguage = loveLanguages.join(', ');
      }
      
      if (profileImage) {
        connectionData.profileImage = profileImage;
      }
      
      // Add birthday if provided
      if (birthday) {
        connectionData.birthday = new Date(birthday);
      }
      
      console.log("Sending update data:", connectionData);
      
      const response = await fetch(`/api/connections/${connectionId}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(connectionData),
        credentials: "include"
      });
      
      if (response.ok) {
        // Don't try to parse JSON if the response might be empty
        let data = null;
        try {
          const text = await response.text();
          if (text) {
            data = JSON.parse(text);
          }
        } catch (e) {
          // Response might be empty, which is fine for an update
        }
        
        console.log("Connection updated successfully:", data);
        
        toast({
          title: "Success!",
          description: "Connection updated successfully"
        });
        
        // Invalidate and redirect
        queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
        queryClient.invalidateQueries({ queryKey: ['/api/connections', connectionId] });
        setLocation(`/connections/${connectionId}`);
      } else {
        const errorData = await response.text();
        console.error("Error response:", errorData);
        
        toast({
          title: "Error",
          description: "Failed to update connection",
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading connection details...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  if (error || !connection) {
    return (
      <div className="min-h-screen pb-16 p-4">
        <div className="max-w-md mx-auto text-center mt-12">
          <h2 className="text-xl font-semibold mb-2">Connection not found</h2>
          <p className="text-neutral-500 mb-4">The connection you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => setLocation('/connections')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Connections
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b px-4 py-3 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation(`/connections/${connectionId}`)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Edit Connection</h1>
        </div>
        
        <div className="p-4">
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
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="date"
                  value={startDate || ''}
                  onChange={(e) => setStartDate(e.target.value || null)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Track when you first connected with this person
              </p>
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
                Birthday
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="Select birthday"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-neutral-500 mt-1">Optional: Track birthdays and anniversaries</p>
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
            
            <div className="pt-2 flex gap-3">
              <Button 
                type="button" 
                variant="outline"
                className="flex-1" 
                onClick={() => setLocation(`/connections/${connectionId}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}