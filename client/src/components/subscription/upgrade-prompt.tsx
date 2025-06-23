import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, ArrowUp } from "lucide-react";
import { PricingModal } from "./pricing-modal";

interface UpgradePromptProps {
  feature: string;
  message: string;
  currentUsage?: number;
  limit?: number;
}

export function UpgradePrompt({ feature, message, currentUsage, limit }: UpgradePromptProps) {
  const [showPricingModal, setShowPricingModal] = useState(false);

  return (
    <>
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            {feature} Limit Reached
          </CardTitle>
          {currentUsage !== undefined && limit !== undefined && (
            <Badge variant="outline" className="border-orange-500 text-orange-600 mx-auto">
              {currentUsage}/{limit} used this month
            </Badge>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => setShowPricingModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Star className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
            
            <p className="text-sm text-gray-500">
              Get unlimited access to all features with our premium plans starting at $1.99/week
            </p>
          </div>
        </CardContent>
      </Card>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan="free"
        showTrialButton={true}
      />
    </>
  );
}