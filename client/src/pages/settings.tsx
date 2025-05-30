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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
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
  Save
} from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for settings
  const [settings, setSettings] = useState({
    notifications: {
      pushEnabled: true,
      momentReminders: true,
      momentReminderFrequency: "daily" as "daily" | "twice-daily" | "3-times-daily" | "weekly" | "every-2-weeks" | "monthly" | "custom",
      momentReminderCustomHour: "9",
      insightAlerts: true,
      insightAlertFrequency: "weekly" as "daily" | "twice-daily" | "3-times-daily" | "weekly" | "every-2-weeks" | "monthly" | "custom",
      insightAlertCustomHour: "18",
      cycleReminders: true,
      cycleReminderFrequency: "daily" as "daily" | "twice-daily" | "3-times-daily" | "weekly" | "every-2-weeks" | "monthly" | "custom",
      cycleReminderCustomHour: "8",
      soundEnabled: true,
    },
    privacy: {
      shareAnalytics: true,
    },
    preferences: {
      theme: "light" as "light" | "dark" | "minimalist", // light, dark, minimalist
      defaultTab: "dashboard" as const, // dashboard, connections, calendar, activities
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

  // Sync theme with settings
  React.useEffect(() => {
    if (settings.preferences.theme !== theme) {
      setSettings(prev => ({
        ...prev,
        preferences: { ...prev.preferences, theme }
      }));
    }
  }, [theme, settings.preferences.theme]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: typeof settings) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsData),
      });
      if (!response.ok) {
        throw new Error("Failed to save settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings saved successfully!",
      });
    },
    onError: (error: any) => {
      console.error("Settings save error:", error);
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

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your data export will be ready shortly. You'll receive an email when it's complete.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive",
    });
  };

  const handleChangePassword = () => {
    toast({
      title: "Password Change",
      description: "Password change functionality will be available soon.",
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-heading font-semibold">Settings</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage your preferences</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saveSettingsMutation.isPending ? "Saving..." : "Save"}
          </Button>
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="momentReminders">Moment Reminders</Label>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Prompts to log moments</p>
                  </div>
                  <Switch
                    id="momentReminders"
                    checked={settings.notifications.momentReminders}
                    onCheckedChange={(checked) => updateNotificationSetting('momentReminders', checked)}
                    disabled={!settings.notifications.pushEnabled}
                  />
                </div>
                
                {settings.notifications.momentReminders && (
                  <div className="ml-4 space-y-2">
                    <Label className="text-sm">Frequency</Label>
                    <Select 
                      value={settings.notifications.momentReminderFrequency} 
                      onValueChange={(value) => updateNotificationSetting('momentReminderFrequency', value as any)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="twice-daily">Twice a Day</SelectItem>
                        <SelectItem value="3-times-daily">3 Times a Day</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="every-2-weeks">Every Two Weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom Time</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {settings.notifications.momentReminderFrequency === 'custom' && (
                      <div className="space-y-1">
                        <Label className="text-xs text-neutral-600 dark:text-neutral-400">Hour (0-23)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={settings.notifications.momentReminderCustomHour}
                          onChange={(e) => updateNotificationSetting('momentReminderCustomHour', e.target.value)}
                          className="w-full"
                          placeholder="9"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cycleReminders">Cycle Reminders</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Menstrual cycle notifications</p>
                </div>
                <Switch
                  id="cycleReminders"
                  checked={settings.notifications.cycleReminders}
                  onCheckedChange={(checked) => updateNotificationSetting('cycleReminders', checked)}
                  disabled={!settings.notifications.pushEnabled}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="insightAlerts">Insight Alerts</Label>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">AI-powered relationship insights</p>
                  </div>
                  <Switch
                    id="insightAlerts"
                    checked={settings.notifications.insightAlerts}
                    onCheckedChange={(checked) => updateNotificationSetting('insightAlerts', checked)}
                    disabled={!settings.notifications.pushEnabled}
                  />
                </div>
                
                {settings.notifications.insightAlerts && (
                  <div className="ml-4 space-y-2">
                    <Label className="text-sm">Frequency</Label>
                    <Select 
                      value={settings.notifications.insightAlertFrequency} 
                      onValueChange={(value) => updateNotificationSetting('insightAlertFrequency', value as any)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="twice-daily">Twice a Day</SelectItem>
                        <SelectItem value="3-times-daily">3 Times a Day</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="every-2-weeks">Every Two Weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom Time</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {settings.notifications.insightAlertFrequency === 'custom' && (
                      <div className="space-y-1">
                        <Label className="text-xs text-neutral-600 dark:text-neutral-400">Hour (0-23)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={settings.notifications.insightAlertCustomHour}
                          onChange={(e) => updateNotificationSetting('insightAlertCustomHour', e.target.value)}
                          className="w-full"
                          placeholder="18"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="cycleReminders">Cycle Reminders</Label>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Menstrual cycle notifications</p>
                  </div>
                  <Switch
                    id="cycleReminders"
                    checked={settings.notifications.cycleReminders}
                    onCheckedChange={(checked) => updateNotificationSetting('cycleReminders', checked)}
                    disabled={!settings.notifications.pushEnabled}
                  />
                </div>
                
                {settings.notifications.cycleReminders && (
                  <div className="ml-4 space-y-2">
                    <Label className="text-sm">Frequency</Label>
                    <Select 
                      value={settings.notifications.cycleReminderFrequency} 
                      onValueChange={(value) => updateNotificationSetting('cycleReminderFrequency', value as any)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="twice-daily">Twice a Day</SelectItem>
                        <SelectItem value="3-times-daily">3 Times a Day</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="every-2-weeks">Every Two Weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom Time</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {settings.notifications.cycleReminderFrequency === 'custom' && (
                      <div className="space-y-1">
                        <Label className="text-xs text-neutral-600 dark:text-neutral-400">Hour (0-23)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={settings.notifications.cycleReminderCustomHour}
                          onChange={(e) => updateNotificationSetting('cycleReminderCustomHour', e.target.value)}
                          className="w-full"
                          placeholder="8"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="soundEnabled">Notification Sound</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Play sound with notifications</p>
                </div>
                <Switch
                  id="soundEnabled"
                  checked={settings.notifications.soundEnabled}
                  onCheckedChange={(checked) => updateNotificationSetting('soundEnabled', checked)}
                  disabled={!settings.notifications.pushEnabled}
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
                  <Label htmlFor="shareAnalytics">Analytics Sharing</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Help improve the app with usage data</p>
                </div>
                <Switch
                  id="shareAnalytics"
                  checked={settings.privacy.shareAnalytics}
                  onCheckedChange={(checked) => updatePrivacySetting('shareAnalytics', checked)}
                />
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
                <Select 
                  value={theme} 
                  onValueChange={(value) => {
                    setTheme(value as "light" | "dark" | "minimalist");
                    updatePreferenceSetting('theme', value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="defaultTab">Default Page</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Page to open when launching the app</p>
                <Select 
                  value={settings.preferences.defaultTab} 
                  onValueChange={(value) => updatePreferenceSetting('defaultTab', value)}
                >
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
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Automatically save changes</p>
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Export Data</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Download all your data</p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-red-600 dark:text-red-400">Delete Account</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Permanently delete your account</p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Actions
              </CardTitle>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Change Password</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Update your account password</p>
                </div>
                <Button variant="outline" onClick={handleChangePassword}>
                  <Lock className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Sign Out</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Sign out of your account</p>
                </div>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}