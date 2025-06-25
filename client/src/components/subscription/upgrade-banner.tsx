import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { PricingModal } from "./pricing-modal";

interface UpgradeBannerProps {
  message: string;
  description?: string;
  variant?: "default" | "compact";
}

export function UpgradeBanner({ 
  message, 
  description, 
  variant = "default" 
}: UpgradeBannerProps) {
  const { isPremium } = useSubscription();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner for premium users or if dismissed
  if (isPremium || isDismissed) {
    return null;
  }

  if (variant === "compact") {
    return (
      <>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{message}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowPricingModal(true)}
              >
                Upgrade
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="h-6 w-6 p-0 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          currentPlan="free"
          showTrialButton={true}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-blue-900 font-semibold">{message}</h3>
              {description && (
                <p className="text-blue-700 text-sm mt-1">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowPricingModal(true)}
            >
              Upgrade
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan="free"
        showTrialButton={true}
      />
    </>
  );
}