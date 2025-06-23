import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, X, Star } from "lucide-react";
import { PricingModal } from "./pricing-modal";
import { useSubscription } from "@/hooks/use-subscription";

export function SubscriptionBanner() {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { subscriptionStatus, isPremium, isTrialActive } = useSubscription();

  // Don't show banner if user is premium or banner is dismissed
  if (isPremium || isDismissed) {
    return null;
  }

  const { usage, features } = subscriptionStatus || {};
  const isNearLimit = usage && features && (
    (typeof features.connections === 'number' && usage.connectionsUsed >= features.connections) ||
    (typeof features.aiInsightsPerMonth === 'number' && usage.aiInsightsUsed >= features.aiInsightsPerMonth - 1) ||
    (typeof features.aiCoachingPerMonth === 'number' && usage.aiCoachingUsed >= features.aiCoachingPerMonth - 1)
  );

  return (
    <>
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 mx-4 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-purple-100 rounded-full">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">Unlock Premium Features</span>
                  {isNearLimit && (
                    <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs">
                      Near Limit
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {isNearLimit 
                    ? "You're reaching your monthly limits. Upgrade for unlimited access."
                    : "Get unlimited connections, AI insights, and advanced analytics."
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm"
                onClick={() => setShowPricingModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Star className="h-4 w-4 mr-1" />
                Try Free
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan="free"
        showTrialButton={!isTrialActive}
      />
    </>
  );
}