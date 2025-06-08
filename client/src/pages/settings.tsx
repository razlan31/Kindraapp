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
  Save,
  CreditCard,
  RotateCcw,
  Archive
} from "lucide-react";

// Billing component that connects to real Stripe data
function BillingSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription data from Stripe
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/billing/subscription'],
  });

  // Fetch billing invoices
  const { data: invoicesData } = useQuery({
    queryKey: ['/api/billing/invoices'],
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/billing/cancel-subscription"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current billing period",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  // Open Stripe customer portal
  const openCustomerPortal = async () => {
    try {
      const response = await apiRequest("POST", "/api/billing/create-customer-portal");
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  const subscription = subscriptionData?.subscription;
  const invoices = invoicesData?.invoices || [];

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">No active subscription found</p>
        <Button variant="outline">
          Subscribe to Premium
        </Button>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getSubscriptionStatus = () => {
    if (subscription.cancel_at_period_end) {
      return { text: "Cancelling", color: "text-orange-600 dark:text-orange-400" };
    }
    if (subscription.status === 'active') {
      return { text: "Active", color: "text-green-600 dark:text-green-400" };
    }
    if (subscription.status === 'past_due') {
      return { text: "Past Due", color: "text-red-600 dark:text-red-400" };
    }
    return { text: subscription.status, color: "text-neutral-600 dark:text-neutral-400" };
  };

  const status = getSubscriptionStatus();

  return (
    <>
      <div className="space-y-2">
        <Label>Current Plan</Label>
        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <div>
            <p className="font-medium">Premium Plan</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              ${(subscription.items.data[0]?.price?.unit_amount / 100).toFixed(2)}/
              {subscription.items.data[0]?.price?.recurring?.interval}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${status.color}`}>{status.text}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {subscription.cancel_at_period_end 
                ? `Ends ${formatDate(subscription.current_period_end)}`
                : `Renews ${formatDate(subscription.current_period_end)}`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Payment Method</Label>
        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4" />
            <div>
              {subscription.default_payment_method ? (
                <>
                  <p className="font-medium">
                    •••• •••• •••• {subscription.default_payment_method.card?.last4}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Expires {subscription.default_payment_method.card?.exp_month}/
                    {subscription.default_payment_method.card?.exp_year}
                  </p>
                </>
              ) : (
                <p className="font-medium">No payment method</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openCustomerPortal}>
            Update
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <Label>Billing History</Label>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            View past invoices and payments ({invoices.length} invoices)
          </p>
        </div>
        <Button variant="outline" onClick={openCustomerPortal}>
          <Download className="h-4 w-4 mr-2" />
          View History
        </Button>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-red-600 dark:text-red-400">Cancel Subscription</Label>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {subscription.cancel_at_period_end 
              ? "Subscription will end at current billing period"
              : "End your subscription and lose premium features"
            }
          </p>
        </div>
        {!subscription.cancel_at_period_end && (
          <Button 
            variant="destructive" 
            onClick={() => {
              if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
                cancelSubscriptionMutation.mutate();
              }
            }}
            disabled={cancelSubscriptionMutation.isPending}
          >
            {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Plan"}
          </Button>
        )}
      </div>
    </>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for settings
  const [settings, setSettings] = useState({
    notifications: {
      pushEnabled: true,
      globalFrequency: "daily" as "daily" | "twice-daily" | "3-times-daily" | "weekly" | "every-2-weeks" | "monthly",
      momentReminders: true,
      insightAlerts: true,
      quoteOfTheDay: true,
      cycleReminders: true,
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

  // Fetch archived connections
  const { data: archivedConnections = [] } = useQuery<any[]>({
    queryKey: ["/api/connections/archived"],
    enabled: !!user,
  });

  // Restore connection mutation
  const restoreConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      return await apiRequest(`/api/connections/${connectionId}`, "PATCH", {
        isArchived: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/archived"] });
      toast({
        title: "Connection Restored",
        description: "Connection has been restored to your active connections.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore connection",
        variant: "destructive",
      });
    },
  });

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
      
      <main className="flex-1 overflow-y-auto pb-20 px-3 pt-4">
        <div className="flex justify-between items-center mb-4">
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
            <CardContent className="space-y-6">
              {/* Master toggle for all notifications */}
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

              {settings.notifications.pushEnabled && (
                <>
                  <Separator />

                  {/* Global notification frequency */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Notification Frequency</Label>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">How often you want to receive notifications (randomly distributed throughout the day)</p>
                    </div>
                    <Select 
                      value={settings.notifications.globalFrequency} 
                      onValueChange={(value) => updateNotificationSetting('globalFrequency', value as any)}
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
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Notification types - toggles only */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Notification Types</Label>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                        Notifications will be randomly distributed throughout the day based on your frequency setting. 
                        Only scheduled plans and events will notify at specific times.
                      </p>
                    </div>
                    
                    {/* Moment Reminders */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="momentReminders">Moment Reminders</Label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Prompts to log relationship moments</p>
                      </div>
                      <Switch
                        id="momentReminders"
                        checked={settings.notifications.momentReminders}
                        onCheckedChange={(checked) => updateNotificationSetting('momentReminders', checked)}
                      />
                    </div>

                    {/* Insight Alerts */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="insightAlerts">AI Insights</Label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Relationship pattern insights</p>
                      </div>
                      <Switch
                        id="insightAlerts"
                        checked={settings.notifications.insightAlerts}
                        onCheckedChange={(checked) => updateNotificationSetting('insightAlerts', checked)}
                      />
                    </div>

                    {/* Quote of the Day */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="quoteOfTheDay">Quote of the Day</Label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Daily relationship wisdom</p>
                      </div>
                      <Switch
                        id="quoteOfTheDay"
                        checked={settings.notifications.quoteOfTheDay}
                        onCheckedChange={(checked) => updateNotificationSetting('quoteOfTheDay', checked)}
                      />
                    </div>

                    {/* Cycle Reminders */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="cycleReminders">Cycle Reminders</Label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Menstrual cycle tracking reminders</p>
                      </div>
                      <Switch
                        id="cycleReminders"
                        checked={settings.notifications.cycleReminders}
                        onCheckedChange={(checked) => updateNotificationSetting('cycleReminders', checked)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Notification Sound */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="soundEnabled">Notification Sound</Label>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Play sound with notifications</p>
                    </div>
                    <Switch
                      id="soundEnabled"
                      checked={settings.notifications.soundEnabled}
                      onCheckedChange={(checked) => updateNotificationSetting('soundEnabled', checked)}
                    />
                  </div>
                </>
              )}
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

          {/* Privacy, Security & Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy, Security & Account
              </CardTitle>
              <CardDescription>
                Control your data privacy, security, and account settings
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

              <Separator />

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

          {/* Archived Connections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Archived Connections
              </CardTitle>
              <CardDescription>
                Restore archived connections back to your active list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {archivedConnections.length === 0 ? (
                <div className="text-center py-6">
                  <Archive className="h-12 w-12 mx-auto text-neutral-400 mb-3" />
                  <p className="text-neutral-600 dark:text-neutral-400">No archived connections</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">
                    Connections you archive will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedConnections.map((connection: any) => (
                    <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-neutral-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                          {connection.profileImage ? (
                            <img 
                              src={connection.profileImage} 
                              alt={connection.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                              {connection.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{connection.name}</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {connection.relationshipStage}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => restoreConnectionMutation.mutate(connection.id)}
                        disabled={restoreConnectionMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {restoreConnectionMutation.isPending ? "Restoring..." : "Restore"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BillingSection />
            </CardContent>
          </Card>


        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}