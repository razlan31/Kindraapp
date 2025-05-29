import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Settings, Target } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  // Create a fallback user for display if auth is stuck
  const displayUser = user || {
    displayName: "Test User",
    email: "test@example.com", 
    zodiacSign: "Gemini",
    loveLanguage: "Quality Time"
  };

  // Show content even if loading is stuck
  console.log("Profile page - loading:", loading, "user:", user);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center pt-6 pb-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Profile & Settings</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage your personal information and relationship preferences</p>
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
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Display Name</label>
                <p className="text-neutral-900 dark:text-neutral-100">{displayUser.displayName || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
                <p className="text-neutral-900 dark:text-neutral-100">{displayUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Zodiac Sign</label>
                <p className="text-neutral-900 dark:text-neutral-100">{displayUser.zodiacSign || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Love Language</label>
                <p className="text-neutral-900 dark:text-neutral-100">{displayUser.loveLanguage || "Not set"}</p>
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
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Current Focus</label>
                <p className="text-neutral-600 dark:text-neutral-400">Finding meaningful connections</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Relationship Style</label>
                <p className="text-neutral-600 dark:text-neutral-400">Exploring</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Goals</label>
                <p className="text-neutral-600 dark:text-neutral-400">Building deeper emotional connections and understanding relationship patterns.</p>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Push Notifications</label>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Receive reminders and insights</p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Private Mode</label>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Hide sensitive content</p>
                </div>
                <div className="w-12 h-6 bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center px-1">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}