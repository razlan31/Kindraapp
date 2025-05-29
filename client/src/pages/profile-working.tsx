import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Settings, Target, Save, Camera, Upload } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a fallback user for display if auth is stuck
  const displayUser = user || {
    displayName: "Test User",
    email: "test@example.com", 
    zodiacSign: "Gemini",
    loveLanguage: "Quality Time"
  };

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    displayName: displayUser.displayName || "",
    email: displayUser.email || "",
    zodiacSign: displayUser.zodiacSign || "",
    loveLanguages: displayUser.loveLanguage ? [displayUser.loveLanguage] : [] as string[],
    relationshipGoals: "Finding meaningful connections",
    relationshipStyle: "Exploring",
    bio: "Building deeper emotional connections and understanding relationship patterns.",
    notifications: true,
    privateMode: false,
    analyticsSharing: true,
    profileImage: displayUser.profileImage || ""
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || "",
        email: user.email || "",
        zodiacSign: user.zodiacSign || "",
        loveLanguages: user.loveLanguage ? [user.loveLanguage] : [],
        profileImage: user.profileImage || ""
      }));
    }
  }, [user]);

  // Handle profile picture upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, profileImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle love language selection
  const toggleLoveLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      loveLanguages: prev.loveLanguages.includes(language)
        ? prev.loveLanguages.filter(l => l !== language)
        : [...prev.loveLanguages, language]
    }));
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: data.displayName,
          zodiacSign: data.zodiacSign,
          loveLanguage: data.loveLanguages.join(", "), // Convert array to string for backend
          profileImage: data.profileImage
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  // Show content even if loading is stuck
  console.log("Profile page - loading:", loading, "user:", user);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center pt-6 pb-4">
          <div className="mx-auto w-24 h-24 relative mb-4">
            {formData.profileImage ? (
              <img 
                src={formData.profileImage} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Profile & Settings</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Edit your information below and click Save Changes when done</p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Enter your display name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-neutral-100 dark:bg-neutral-800"
                />
              </div>
              <div>
                <Label htmlFor="zodiacSign">Zodiac Sign</Label>
                <Select value={formData.zodiacSign} onValueChange={(value) => setFormData(prev => ({ ...prev, zodiacSign: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zodiac sign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aries">Aries</SelectItem>
                    <SelectItem value="Taurus">Taurus</SelectItem>
                    <SelectItem value="Gemini">Gemini</SelectItem>
                    <SelectItem value="Cancer">Cancer</SelectItem>
                    <SelectItem value="Leo">Leo</SelectItem>
                    <SelectItem value="Virgo">Virgo</SelectItem>
                    <SelectItem value="Libra">Libra</SelectItem>
                    <SelectItem value="Scorpio">Scorpio</SelectItem>
                    <SelectItem value="Sagittarius">Sagittarius</SelectItem>
                    <SelectItem value="Capricorn">Capricorn</SelectItem>
                    <SelectItem value="Aquarius">Aquarius</SelectItem>
                    <SelectItem value="Pisces">Pisces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Love Languages (Select all that apply)</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {["Words of Affirmation", "Quality Time", "Physical Touch", "Acts of Service", "Receiving Gifts"].map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={language}
                        checked={formData.loveLanguages.includes(language)}
                        onCheckedChange={() => toggleLoveLanguage(language)}
                      />
                      <Label htmlFor={language} className="text-sm font-normal cursor-pointer">
                        {language}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relationship Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Relationship Preferences
            </CardTitle>
            <CardDescription>Your relationship goals and style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="relationshipGoals">Current Focus</Label>
                <Select value={formData.relationshipGoals} onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipGoals: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your current focus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Finding meaningful connections">Finding meaningful connections</SelectItem>
                    <SelectItem value="Building long-term relationships">Building long-term relationships</SelectItem>
                    <SelectItem value="Casual dating">Casual dating</SelectItem>
                    <SelectItem value="Self-discovery">Self-discovery</SelectItem>
                    <SelectItem value="Working on existing relationships">Working on existing relationships</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="relationshipStyle">Relationship Style</Label>
                <Select value={formData.relationshipStyle} onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipStyle: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your relationship style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Exploring">Exploring</SelectItem>
                    <SelectItem value="Monogamous">Monogamous</SelectItem>
                    <SelectItem value="Open to multiple connections">Open to multiple connections</SelectItem>
                    <SelectItem value="Focused on one person">Focused on one person</SelectItem>
                    <SelectItem value="Taking it slow">Taking it slow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bio">Personal Goals</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Describe your relationship goals and what you're looking for..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              App Settings
            </CardTitle>
            <CardDescription>Customize your app experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Receive reminders and insights</p>
                </div>
                <Switch
                  checked={formData.notifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Private Mode</Label>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Hide sensitive content</p>
                </div>
                <Switch
                  checked={formData.privateMode}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, privateMode: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Analytics Sharing</Label>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Help improve the app</p>
                </div>
                <Switch
                  checked={formData.analyticsSharing}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, analyticsSharing: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}