import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsageIndicator } from "@/components/subscription/usage-indicator";
import { PricingModal } from "@/components/subscription/pricing-modal";
import { Crown, Star, Calendar, BarChart3, Heart, Zap, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function SubscriptionPage() {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [, setLocation] = useLocation();

  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['/api/subscription/status'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const { isPremium, isTrialActive, plan, features, usage, limits } = subscriptionStatus || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/settings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Your Kindra Plan</h1>
          <p className="text-gray-600">Manage your subscription and track your usage</p>
        </div>

        {/* Current Plan Status */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isPremium ? (
                <Crown className="h-6 w-6 text-purple-600" />
              ) : (
                <Star className="h-6 w-6 text-gray-600" />
              )}
              <CardTitle className="text-2xl">
                {plan === 'free' ? 'Free Plan' : `Premium ${plan?.charAt(0).toUpperCase() + plan?.slice(1)}`}
              </CardTitle>
            </div>
            
            <div className="flex justify-center gap-2">
              {isPremium && (
                <Badge className="bg-purple-100 text-purple-800">
                  {isTrialActive ? 'Free Trial' : 'Premium'}
                </Badge>
              )}
              {plan === 'free' && (
                <Badge variant="outline">Free Tier</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Usage Tracking */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Current Usage</h3>
              
              <UsageIndicator
                label="Connections"
                current={usage?.connectionsUsed || 0}
                limit={features?.connections || 1}
                isPremium={isPremium}
                showUpgrade={!isPremium}
                onUpgrade={() => setShowPricingModal(true)}
              />

              <UsageIndicator
                label="AI Insights"
                current={usage?.aiInsightsUsed || 0}
                limit={features?.aiInsightsPerMonth || 3}
                isPremium={isPremium}
                showUpgrade={!isPremium}
                onUpgrade={() => setShowPricingModal(true)}
              />

              <UsageIndicator
                label="AI Coaching"
                current={usage?.aiCoachingUsed || 0}
                limit={features?.aiCoachingPerMonth || 3}
                isPremium={isPremium}
                showUpgrade={!isPremium}
                onUpgrade={() => setShowPricingModal(true)}
              />
            </div>

            {/* Feature List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Your Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-medium">Connections</div>
                    <div className="text-sm text-gray-600">
                      {typeof features?.connections === 'number' 
                        ? `${features.connections} connection${features.connections !== 1 ? 's' : ''}`
                        : 'Unlimited connections'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">AI Insights</div>
                    <div className="text-sm text-gray-600">
                      {typeof features?.aiInsightsPerMonth === 'number'
                        ? `${features.aiInsightsPerMonth} per month`
                        : 'Unlimited insights'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Advanced Analytics</div>
                    <div className="text-sm text-gray-600">
                      {features?.advancedAnalytics ? 'Included' : 'Not available'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Cycle Tracking</div>
                    <div className="text-sm text-gray-600">
                      {features?.cycleTracking === 'advanced' ? 'Advanced' : 'Basic'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {!isPremium && (
                <Button 
                  onClick={() => setShowPricingModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                </Button>
              )}

              {isPremium && isTrialActive && (
                <Button 
                  onClick={() => setShowPricingModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  Subscribe Now - Trial Ending Soon
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={() => setShowPricingModal(true)}
                className="w-full"
              >
                View All Plans
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Modal */}
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          currentPlan={plan}
          showTrialButton={!isPremium && !isTrialActive}
        />
      </div>
    </div>
  );
}