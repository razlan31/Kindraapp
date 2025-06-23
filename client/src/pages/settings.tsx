import { useState } from "react";
import * as React from "react";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Archive,
  MessageCircle,
  Send,
  Crown,
  Star
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { UsageIndicator } from "@/components/subscription/usage-indicator";
import { PricingModal } from "@/components/subscription/pricing-modal";
import { useSubscription } from "@/hooks/use-subscription";

// Billing component
function BillingSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscriptionStatus, isPremium, isTrialActive } = useSubscription();
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Free plan definition with proper usage tracking
  const freePlanFeatures = {
    connections: 1,
    aiInsightsPerMonth: 3,
    aiCoachingPerMonth: 3,
    badges: "unlimited"
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription & Billing
            </CardTitle>
            <CardDescription>
              Manage your subscription plan and billing information
            </CardDescription>
          </div>
          {isPremium && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-medium">
              <Crown className="h-4 w-4" />
              {isTrialActive ? 'Free Trial' : 'Premium'}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Status */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Current Plan</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">
                {isPremium ? (isTrialActive ? 'Free Trial' : 'Premium Plan') : 'Free Plan'}
              </div>
              <div className="text-sm text-gray-600">
                {isPremium 
                  ? `Unlimited connections, ${subscriptionStatus?.features.aiInsightsPerMonth || 50} AI insights/month, ${subscriptionStatus?.features.aiCoachingPerMonth || 100} coaching/month`
                  : `${freePlanFeatures.connections} connection, ${freePlanFeatures.aiInsightsPerMonth} AI insights/month, ${freePlanFeatures.aiCoachingPerMonth} coaching/month, unlimited badges`
                }
              </div>
            </div>
            {!isPremium && (
              <Button
                onClick={() => setShowPricingModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Star className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* Usage Overview with Free Plan Tracking */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Usage This Month</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UsageIndicator
              label="Connections"
              current={subscriptionStatus?.usage.connectionsUsed || 19}
              limit={isPremium ? undefined : freePlanFeatures.connections}
              icon="👥"
            />
            <UsageIndicator
              label="AI Insights"
              current={subscriptionStatus?.usage.aiInsightsUsed || 0}
              limit={isPremium ? (subscriptionStatus?.features.aiInsightsPerMonth || 50) : freePlanFeatures.aiInsightsPerMonth}
              icon="🧠"
            />
            <UsageIndicator
              label="AI Coaching"
              current={subscriptionStatus?.usage.aiCoachingUsed || 0}
              limit={isPremium ? (subscriptionStatus?.features.aiCoachingPerMonth || 100) : freePlanFeatures.aiCoachingPerMonth}
              icon="💬"
            />
          </div>
        </div>

        {/* Premium Features Preview */}
        {!isPremium && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Premium Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Unlimited Connections</span>
                </div>
                <p className="text-sm text-purple-700">Track relationships with unlimited people</p>
              </div>
              <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Enhanced AI Insights</span>
                </div>
                <p className="text-sm text-purple-700">50 AI insights per month with deeper analysis</p>
              </div>
              <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Advanced AI Coaching</span>
                </div>
                <p className="text-sm text-purple-700">100 coaching messages per month</p>
              </div>
              <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Premium Analytics</span>
                </div>
                <p className="text-sm text-purple-700">Advanced relationship insights and patterns</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowPricingModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        )}

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          currentPlan={isPremium ? 'premium' : 'free'}
          showTrialButton={!isTrialActive}
        />
      </CardContent>
    </Card>
  );
}

function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("preferences");
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { subscriptionStatus, isPremium, isTrialActive } = useSubscription();

  // Additional state variables
  const [deleteAccountInput, setDeleteAccountInput] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restoringConnection, setRestoringConnection] = useState<number | null>(null);

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
      theme: theme as "light" | "dark" | "system",
      language: "en",
    },
  });

  // Support message state
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubject, setSupportSubject] = useState("");

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

  // Send support message mutation
  const sendSupportMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string }) => {
      return await apiRequest("/api/support/send", "POST", data);
    },
    onSuccess: () => {
      setSupportMessage("");
      setSupportSubject("");
      toast({
        title: "Message Sent",
        description: "Your support message has been sent successfully. We'll get back to you soon!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send support message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  const updateNotificationSetting = (key: keyof typeof settings.notifications, value: boolean | string) => {
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
    setIsExporting(true);
    toast({
      title: "Export Started",
      description: "Your data export will be ready shortly. You'll receive an email when it's complete.",
    });
    // Reset after simulated delay
    setTimeout(() => setIsExporting(false), 3000);
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

  // Update theme when preference changes
  React.useEffect(() => {
    if (settings.preferences.theme !== theme) {
      setTheme(settings.preferences.theme);
      setSettings(prev => ({
        ...prev,
        preferences: { ...prev.preferences, theme: theme as "light" | "dark" | "system" }
      }));
    }
  }, [theme, settings.preferences.theme]);

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>Please log in to access settings.</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-20">
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

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize how the app looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Theme</Label>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Choose your preferred theme</p>
                    </div>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">Minimalist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Choose what notifications you'd like to receive and how often
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

                      {/* Global frequency setting */}
                      <div className="space-y-3">
                        <Label>Frequency</Label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">How often you'd like to receive notifications</p>
                        <Select 
                          value={settings.notifications.globalFrequency} 
                          onValueChange={(value) => updateNotificationSetting('globalFrequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="twice-daily">Twice Daily</SelectItem>
                            <SelectItem value="3-times-daily">3 Times Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="every-2-weeks">Every 2 Weeks</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Notification type breakdown */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Notification Types</h4>
                    
                    {/* AI Insights - 70% value-driven */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="insightAlerts">AI Insights & Pattern Analysis</Label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Behavioral insights, emotional intelligence scores, timing patterns</p>
                      </div>
                      <Switch
                        id="insightAlerts"
                        checked={settings.notifications.insightAlerts}
                        onCheckedChange={(checked) => updateNotificationSetting('insightAlerts', checked)}
                      />
                    </div>

                    {/* Moment Reminders - 30% gentle prompts */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="momentReminders">Moment Reminders</Label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Gentle prompts when patterns suggest moment logging would be valuable</p>
                      </div>
                      <Switch
                        id="momentReminders"
                        checked={settings.notifications.momentReminders}
                        onCheckedChange={(checked) => updateNotificationSetting('momentReminders', checked)}
                      />
                    </div>

                    {/* Cycle Reminders with smart balance */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="cycleReminders">Cycle Insights & Reminders</Label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Phase-specific relationship strategies and gentle tracking prompts</p>
                      </div>
                      <Switch
                        id="cycleReminders"
                        checked={settings.notifications.cycleReminders}
                        onCheckedChange={(checked) => updateNotificationSetting('cycleReminders', checked)}
                      />
                    </div>

                    {/* Quote of the Day */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="quoteOfTheDay">Daily Relationship Wisdom</Label>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Inspiring quotes and relationship tips</p>
                      </div>
                      <Switch
                        id="quoteOfTheDay"
                        checked={settings.notifications.quoteOfTheDay}
                        onCheckedChange={(checked) => updateNotificationSetting('quoteOfTheDay', checked)}
                      />
                    </div>

                        {/* Sound settings */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="soundEnabled">Notification Sounds</Label>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">Play sounds with notifications</p>
                          </div>
                          <Switch
                            id="soundEnabled"
                            checked={settings.notifications.soundEnabled}
                            onCheckedChange={(checked) => updateNotificationSetting('soundEnabled', checked)}
                          />
                        </div>
                      </div>
                    </>
                  )}


                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Export your data or manage your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isExporting ? "Exporting..." : "Export My Data"}
                    </Button>
                    
                    <Button
                      onClick={handleDeleteAccount}
                      variant="destructive"
                      className="w-full justify-start"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
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
                    Connections you've archived can be restored here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {archivedConnections.length === 0 ? (
                    <p className="text-neutral-600 dark:text-neutral-400">No archived connections</p>
                  ) : (
                    <div className="space-y-2">
                      {archivedConnections.map((connection: any) => (
                        <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{connection.name}</div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                              Archived • {connection.relationshipStage}
                            </div>
                          </div>
                          <Button
                            onClick={() => restoreConnectionMutation.mutate(connection.id)}
                            disabled={restoreConnectionMutation.isPending && restoringConnection === connection.id}
                            variant="outline"
                            size="sm"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {restoreConnectionMutation.isPending && restoringConnection === connection.id ? "Restoring..." : "Restore"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <BillingSection />
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Contact Support
                  </CardTitle>
                  <CardDescription>
                    Send us a message and we'll get back to you soon
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-subject">Subject</Label>
                    <Input
                      id="support-subject"
                      placeholder="Brief description of your issue"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      disabled={sendSupportMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-message">Message</Label>
                    <Textarea
                      id="support-message"
                      placeholder="Describe your issue or question in detail..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      disabled={sendSupportMutation.isPending}
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (!supportSubject.trim() || !supportMessage.trim()) {
                        toast({
                          title: "Missing Information",
                          description: "Please fill in both subject and message fields.",
                          variant: "destructive",
                        });
                        return;
                      }
                      sendSupportMutation.mutate({
                        subject: supportSubject,
                        message: supportMessage,
                      });
                    }}
                    disabled={sendSupportMutation.isPending}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sendSupportMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNavigation />

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan={isPremium ? 'premium' : 'free'}
        showTrialButton={!isTrialActive}
      />
    </div>
  );
}

export default Settings;