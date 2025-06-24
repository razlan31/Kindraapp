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
    badges: "unlimited",
    storage: "5MB"
  };

  const premiumFeatures = {
    connections: "unlimited",
    aiInsightsPerMonth: "unlimited", 
    aiCoachingPerMonth: "unlimited",
    badges: "unlimited",
    storage: "1GB",
    prioritySupport: true,
    advancedAnalytics: true
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isPremium ? (
                  <><Crown className="h-5 w-5 text-yellow-500" /> Premium Plan</>
                ) : (
                  <><Star className="h-5 w-5 text-blue-500" /> Free Plan</>
                )}
              </CardTitle>
              <CardDescription>
                {isPremium 
                  ? "Unlock the full potential of relationship insights"
                  : "Perfect for exploring relationship tracking"
                }
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {isPremium ? "$4.99" : "$0"}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isPremium ? "per month" : "forever"}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Features</h4>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between">
                  <span>Connections</span>
                  <span className="font-medium">
                    {isPremium ? premiumFeatures.connections : freePlanFeatures.connections}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>AI Insights/month</span>
                  <span className="font-medium">
                    {isPremium ? premiumFeatures.aiInsightsPerMonth : freePlanFeatures.aiInsightsPerMonth}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>AI Coaching/month</span>
                  <span className="font-medium">
                    {isPremium ? premiumFeatures.aiCoachingPerMonth : freePlanFeatures.aiCoachingPerMonth}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Storage</span>
                  <span className="font-medium">
                    {isPremium ? premiumFeatures.storage : freePlanFeatures.storage}
                  </span>
                </li>
              </ul>
            </div>
            
            {isPremium && (
              <div className="space-y-2">
                <h4 className="font-medium">Premium Benefits</h4>
                <ul className="text-sm space-y-1 text-green-600 dark:text-green-400">
                  <li>✓ Priority Support</li>
                  <li>✓ Advanced Analytics</li>
                  <li>✓ Early Access Features</li>
                  <li>✓ Export Data</li>
                </ul>
              </div>
            )}
          </div>

          {/* Usage Tracking */}
          <div className="pt-4 border-t">
            <UsageIndicator />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {!isPremium && (
              <Button onClick={() => setShowPricingModal(true)} className="flex-1">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            )}
            
            {isPremium && (
              <Button variant="outline" className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            )}
          </div>

          {/* Trial Information */}
          {isTrialActive && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🎉 You're currently on a 5-day free trial of Premium features!
                Trial ends soon - upgrade to continue enjoying unlimited access.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PricingModal 
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
      />
    </div>
  );
}

// Support section component
function SupportSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendSupportMessage = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      return await apiRequest("/api/support/contact", "POST", {
        subject,
        message,
        userEmail: user?.email,
        userName: user?.displayName || user?.username,
        userId: user?.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      setSubject("");
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again or contact us directly at support@kindra.app",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Please fill in all fields",
        description: "Both subject and message are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await sendSupportMessage.mutateAsync({ subject, message });
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Need help? Send us a message and we'll get back to you within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your issue in detail..."
                className="min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !subject.trim() || !message.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle>Other Ways to Reach Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">Email Support</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">support@kindra.app</p>
          </div>
          <div>
            <p className="font-medium">Response Time</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Within 24 hours (usually much faster)</p>
          </div>
          <div>
            <p className="font-medium">Best Times to Contact</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monday - Friday, 9 AM - 6 PM EST</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("/api/user/update", "PATCH", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  // Clear all data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/user/clear-data", "DELETE");
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Data cleared",
        description: "All your data has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to clear data",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/user/export", {
        method: "GET",
        credentials: "include"
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kindra-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Data exported",
          description: "Your data has been downloaded successfully.",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm("Are you absolutely sure? This action cannot be undone and will permanently delete all your data.")) {
      clearDataMutation.mutate();
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
          </div>

          <Tabs defaultValue="account" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              {/* Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={user.username || ""} disabled />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email || ""} disabled />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input 
                      id="displayName" 
                      value={user.displayName || ""} 
                      onChange={(e) => updateUserMutation.mutate({ displayName: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Theme</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
                    </div>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Account Actions</CardTitle>
                  <CardDescription>Manage your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleLogout} variant="outline" className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-4">
              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications about your relationships</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Updates</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get weekly insights via email</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Badge Notifications</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when you earn new badges</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Data & Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Data & Privacy
                  </CardTitle>
                  <CardDescription>Control your data and privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleExportData}
                    variant="outline" 
                    className="w-full"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export My Data
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleClearAllData}
                    variant="destructive" 
                    className="w-full"
                    disabled={clearDataMutation.isPending}
                  >
                    {clearDataMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <BillingSection />
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support">
              <SupportSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}