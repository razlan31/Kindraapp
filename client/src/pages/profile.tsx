import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Camera, Save, Edit, Shield, LogOut } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProfilePage() {
  const { logout, refreshUser } = useAuth();
  
  // Use React Query to fetch user data directly
  const { data: user, isLoading: loading } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => fetch('/api/me').then(res => res.json())
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit mode state - always start in view mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      console.log("Initializing form data with user:", user);
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
        zodiacSign: user.zodiacSign || "",
        loveLanguages: user.loveLanguage ? user.loveLanguage.split(", ").filter((lang, index, arr) => arr.indexOf(lang) === index) : [],
        relationshipGoals: user.relationshipGoals || "",
        relationshipStyle: user.relationshipStyle || "",
        bio: user.personalNotes || "",
        notifications: true,
        privateMode: false,
        analyticsSharing: true,
        profileImage: user.profileImage || ""
      });
    }
  }, [user]);

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    zodiacSign: "",
    loveLanguages: [] as string[],
    relationshipGoals: "",
    relationshipStyle: "",
    bio: "",
    notifications: true,
    privateMode: false,
    analyticsSharing: true,
    profileImage: ""
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      // Optimistic update - update cache immediately
      queryClient.setQueryData(['/api/me'], (oldData: any) => ({
        ...oldData,
        ...Object.fromEntries(
          Object.entries(formData).filter(([_, value]) => value !== undefined && value !== null)
        )
      }));
      await refreshUser(); // Refresh the auth context user data
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      displayName: formData.displayName,
      email: formData.email,
      zodiacSign: formData.zodiacSign,
      loveLanguage: formData.loveLanguages.join(", "),
      profileImage: formData.profileImage,
    });
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
        zodiacSign: user.zodiacSign || "",
        loveLanguages: user.loveLanguage ? user.loveLanguage.split(", ").filter((lang, index, arr) => arr.indexOf(lang) === index) : [],
        relationshipGoals: user.relationshipGoals || "",
        relationshipStyle: user.relationshipStyle || "",
        bio: user.personalNotes || "",
        notifications: true,
        privateMode: false,
        analyticsSharing: true,
        profileImage: user.profileImage || ""
      });
    }
    setIsEditing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Compress and resize the image for better performance
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to 200x200 for profile images
        canvas.width = 200;
        canvas.height = 200;
        
        // Calculate aspect ratio to center the image
        const aspectRatio = img.width / img.height;
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        
        if (aspectRatio > 1) {
          // Image is wider - crop from center
          sourceWidth = img.height;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Image is taller - crop from center
          sourceHeight = img.width;
          sourceY = (img.height - sourceHeight) / 2;
        }
        
        // Draw the cropped and resized image
        ctx?.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 200, 200);
        
        // Convert to base64 with reduced quality for faster uploads
        const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, profileImage: compressedImage }));
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoveLanguageToggle = (language: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      loveLanguages: checked 
        ? [...prev.loveLanguages, language]
        : prev.loveLanguages.filter(l => l !== language)
    }));
  };

  console.log("Profile page - loading:", loading, "user:", user, "isEditing:", isEditing);

  // Show loading while auth is loading or user is not available
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto p-3 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Profile & Settings</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {isEditing ? "Edit your information below" : "View and manage your profile"}
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => {
                // Initialize form data when entering edit mode
                if (user) {
                  const currentLoveLanguages = user.loveLanguage ? user.loveLanguage.split(", ").filter((lang: string, index: number, arr: string[]) => arr.indexOf(lang) === index) : [];
                  setFormData({
                    displayName: user.displayName || "",
                    email: user.email || "",
                    zodiacSign: user.zodiacSign || "",
                    loveLanguages: currentLoveLanguages,
                    relationshipGoals: user.relationshipGoals || "",
                    relationshipStyle: user.relationshipStyle || "",
                    bio: user.personalNotes || "",
                    notifications: true,
                    privateMode: false,
                    analyticsSharing: true,
                    profileImage: user.profileImage || ""
                  });
                }
                setIsEditing(true);
              }}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {(isEditing ? formData.profileImage : user.profileImage) ? (
                    <img 
                      src={isEditing ? formData.profileImage : user.profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-primary">
                      {user.displayName?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{user.displayName || user.username}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{user.email}</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your display name"
                  />
                ) : (
                  <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                    {user.displayName || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                    {user.email}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="zodiacSign">Zodiac Sign</Label>
                {isEditing ? (
                  <Select value={formData.zodiacSign} onValueChange={(value) => setFormData(prev => ({ ...prev, zodiacSign: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your sign" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"].map(sign => (
                        <SelectItem key={sign} value={sign}>{sign}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                    {user.zodiacSign || "Not set"}
                  </p>
                )}
              </div>
            </div>

            {/* Love Languages */}
            <div>
              <Label>Love Languages</Label>
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  {["Words of Affirmation", "Acts of Service", "Receiving Gifts", "Quality Time", "Physical Touch"].map(language => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={language}
                        checked={formData.loveLanguages.includes(language)}
                        onCheckedChange={(checked) => handleLoveLanguageToggle(language, checked as boolean)}
                      />
                      <Label htmlFor={language} className="text-sm">{language}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                  {user.loveLanguage || "Not set"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Relationship Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Relationship Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="relationshipGoals">Relationship Goals</Label>
              {isEditing ? (
                <Select value={formData.relationshipGoals} onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipGoals: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casual dating">Casual dating</SelectItem>
                    <SelectItem value="Finding meaningful connections">Finding meaningful connections</SelectItem>
                    <SelectItem value="Long-term relationship">Long-term relationship</SelectItem>
                    <SelectItem value="Marriage">Marriage</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                  {formData.relationshipGoals}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="relationshipStyle">Relationship Style</Label>
              {isEditing ? (
                <Select value={formData.relationshipStyle} onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipStyle: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monogamous">Monogamous</SelectItem>
                    <SelectItem value="Exploring">Exploring</SelectItem>
                    <SelectItem value="Polyamorous">Polyamorous</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                  {formData.relationshipStyle}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">About Me</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                  {formData.bio}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Receive notifications about moments and insights</p>
              </div>
              <Switch
                id="notifications"
                checked={formData.notifications}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications: checked }))}
                disabled={!isEditing}
              />
            </div>

            <Separator />



            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analyticsSharing">Analytics Sharing</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Help improve the app with anonymous usage data</p>
              </div>
              <Switch
                id="analyticsSharing"
                checked={formData.analyticsSharing}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, analyticsSharing: checked }))}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={logout}
              className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons - Only show when editing */}
        {isEditing && (
          <div className="flex gap-3 pt-4 pb-8">
            <Button 
              variant="outline"
              onClick={handleCancel}
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
        )}
      </div>
    </div>
  );
}