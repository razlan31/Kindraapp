import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Camera, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ProfileCleanPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user data directly
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/me'],
    staleTime: 5 * 60 * 1000
  });

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    zodiacSign: "",
    loveLanguage: ""
  });

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        zodiacSign: user.zodiacSign || "",
        loveLanguage: user.loveLanguage || ""
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/me', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setIsEditing(false);
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
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        zodiacSign: user.zodiacSign || "",
        loveLanguage: user.loveLanguage || ""
      });
    }
    setIsEditing(false);
  };

  if (isLoading || !user) {
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
      <div className="max-w-2xl mx-auto p-4 space-y-6">
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
              onClick={() => setIsEditing(true)}
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
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-primary">
                      {(user.displayName || user.username).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{user.displayName || user.username}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{user.email}</p>
              </div>
            </div>

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
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {user.email}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
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

              <div>
                <Label htmlFor="loveLanguage">Love Language</Label>
                {isEditing ? (
                  <Select value={formData.loveLanguage} onValueChange={(value) => setFormData(prev => ({ ...prev, loveLanguage: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your love language" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Words of Affirmation", "Quality Time", "Receiving Gifts", "Acts of Service", "Physical Touch"].map(language => (
                        <SelectItem key={language} value={language}>{language}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                    {user.loveLanguage || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons - Only show when editing */}
        {isEditing && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updateProfileMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}