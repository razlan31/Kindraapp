import { useState } from "react";
import * as React from "react";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Shield, 
  Moon, 
  Download, 
  Trash2, 
  LogOut,
  Lock,
  Eye,
  Save
} from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for settings
  const [settings, setSettings] = useState({
    notifications: {
      pushEnabled: true,
      momentReminders: true,
      cycleReminders: true,
      insightAlerts: true,
      emailDigest: false,
    },
    privacy: {
      profileVisible: false,
      shareAnalytics: true,
      dataRetention: "1year", // 3months, 6months, 1year, 2years
    },
    preferences: {
      theme: "system", // light, dark, system
      defaultTab: "dashboard", // dashboard, connections, calendar, activities
      autoSave: true,
    }
  });

  // Load settings from backend
  const { data: backendSettings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  // Update local settings when backend data loads
  React.useEffect(() => {
    if (backendSettings && typeof backendSettings === 'object') {
      setSettings(backendSettings as typeof settings);
    }
  }, [backendSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: typeof settings) => {
      const response = await apiRequest("PUT", "/api/settings", settingsData);
      if (!response.ok) {
        throw new Error("Failed to save settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  const updateNotificationSetting = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const updatePrivacySetting = (key: keyof typeof settings.privacy, value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }));
  };

  const updatePreferenceSetting = (key: keyof typeof settings.preferences, value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value }
    }));
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-heading font-semibold">Settings</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Manage your app preferences and privacy
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Choose what notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushEnabled">Push Notifications</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Enable all push notifications</p>
                </div>
                <Switch
                  id="pushEnabled"
                  checked={settings.notifications.pushEnabled}
                  onCheckedChange={(checked) => updateNotificationSetting('pushEnabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="momentReminders">Moment Reminders</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Daily reminders to log moments</p>
                </div>
                <Switch
                  id="momentReminders"
                  checked={settings.notifications.momentReminders}
                  onCheckedChange={(checked) => updateNotificationSetting('momentReminders', checked)}
                  disabled={!settings.notifications.pushEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cycleReminders">Cycle Tracking</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Reminders for menstrual cycle tracking</p>
                </div>
                <Switch
                  id="cycleReminders"
                  checked={settings.notifications.cycleReminders}
                  onCheckedChange={(checked) => updateNotificationSetting('cycleReminders', checked)}
                  disabled={!settings.notifications.pushEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="insightAlerts">Insights & Tips</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Weekly relationship insights</p>
                </div>
                <Switch
                  id="insightAlerts"
                  checked={settings.notifications.insightAlerts}
                  onCheckedChange={(checked) => updateNotificationSetting('insightAlerts', checked)}
                  disabled={!settings.notifications.pushEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailDigest">Email Digest</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Weekly summary via email</p>
                </div>
                <Switch
                  id="emailDigest"
                  checked={settings.notifications.emailDigest}
                  onCheckedChange={(checked) => updateNotificationSetting('emailDigest', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your data privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profileVisible">Public Profile</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Make your profile discoverable by others</p>
                </div>
                <Switch
                  id="profileVisible"
                  checked={settings.privacy.profileVisible}
                  onCheckedChange={(checked) => updatePrivacySetting('profileVisible', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shareAnalytics">Analytics Sharing</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Help improve the app with usage data</p>
                </div>
                <Switch
                  id="shareAnalytics"
                  checked={settings.privacy.shareAnalytics}
                  onCheckedChange={(checked) => updatePrivacySetting('shareAnalytics', checked)}
                />
              </div>

              <div>
                <Label htmlFor="dataRetention">Data Retention</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">How long to keep your data</p>
                <Select value={settings.privacy.dataRetention} onValueChange={(value) => updatePrivacySetting('dataRetention', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="2years">2 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                App Preferences
              </CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Choose your preferred theme</p>
                <Select value={settings.preferences.theme} onValueChange={(value) => updatePreferenceSetting('theme', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="defaultTab">Default Page</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Page to open when launching the app</p>
                <Select value={settings.preferences.defaultTab} onValueChange={(value) => updatePreferenceSetting('defaultTab', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="connections">Connections</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                    <SelectItem value="activities">Activities</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSave">Auto-save</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Automatically save changes while typing</p>
                </div>
                <Switch
                  id="autoSave"
                  checked={settings.preferences.autoSave}
                  onCheckedChange={(checked) => updatePreferenceSetting('autoSave', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export or delete your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export My Data
              </Button>
              
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>

              <Button
                variant="outline"
                onClick={logout}
                className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="pt-4 pb-8">
            <Button 
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
              className="w-full flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}