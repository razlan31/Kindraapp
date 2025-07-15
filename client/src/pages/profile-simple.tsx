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
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Settings, Target, Camera, Shield, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile page debugging (remove excessive logging for performance)
  // console.log('Profile page render', { user: user ? user.email : 'null', loading });

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [loveLanguage, setLoveLanguage] = useState("");
  
  // New relationship-focused fields
  const [relationshipGoals, setRelationshipGoals] = useState("");
  const [currentFocus, setCurrentFocus] = useState("");
  const [relationshipStyle, setRelationshipStyle] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Update form fields when user data loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      setZodiacSign(user.zodiacSign || "");
      setLoveLanguage(user.loveLanguage || "");
    }
  }, [user]);

  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  const loveLanguages = [
    "Words of Affirmation", "Acts of Service", "Receiving Gifts", 
    "Quality Time", "Physical Touch"
  ];

  const relationshipStyles = [
    "Monogamous", "Polyamorous", "Open", "Exploring", "Casual Dating"
  ];

  const currentFocusOptions = [
    "Finding Love", "Building Intimacy", "Working on Communication", 
    "Exploring Sexuality", "Personal Growth", "Taking a Break"
  ];

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/users/${user?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateProfileMutation.mutate({ profileImage: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      displayName,
      email,
      zodiacSign,
      loveLanguage,
    });
  };

  const handleLogout = () => {
    console.log("🔴 PROFILE: Profile page logout button clicked");
    try {
      logout(); // Now synchronous
    } catch (error) {
      console.error("🔴 PROFILE: Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 dark:text-neutral-400">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center pt-6 pb-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Profile & Settings</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage your personal information and relationship preferences</p>
        </div>

        {/* Profile Picture Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-neutral-400" />
                )}
              </div>
              <div className="flex-1">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updateProfileMutation.isPending}
                >
                  Change Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zodiacSign">Zodiac Sign</Label>
                <Select value={zodiacSign} onValueChange={setZodiacSign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your sign" />
                  </SelectTrigger>
                  <SelectContent>
                    {zodiacSigns.map((sign) => (
                      <SelectItem key={sign} value={sign}>
                        {sign}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loveLanguage">Love Language</Label>
                <Select value={loveLanguage} onValueChange={setLoveLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your love language" />
                  </SelectTrigger>
                  <SelectContent>
                    {loveLanguages.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleSaveProfile} 
              disabled={updateProfileMutation.isPending}
              className="w-full"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentFocus">Current Focus</Label>
                <Select value={currentFocus} onValueChange={setCurrentFocus}>
                  <SelectTrigger>
                    <SelectValue placeholder="What are you focusing on?" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentFocusOptions.map((focus) => (
                      <SelectItem key={focus} value={focus}>
                        {focus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationshipStyle">Relationship Style</Label>
                <Select value={relationshipStyle} onValueChange={setRelationshipStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Your relationship style" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipStyles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationshipGoals">Relationship Goals</Label>
              <Textarea
                id="relationshipGoals"
                value={relationshipGoals}
                onChange={(e) => setRelationshipGoals(e.target.value)}
                placeholder="What are you looking for in relationships?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalNotes">Personal Notes</Label>
              <Textarea
                id="personalNotes"
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Any personal insights or notes about your journey..."
                rows={3}
              />
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Receive notifications for reminders and insights
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Private Mode</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Hide sensitive content from quick previews
                </p>
              </div>
              <Switch checked={privateMode} onCheckedChange={setPrivateMode} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Use dark theme throughout the app
                </p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}