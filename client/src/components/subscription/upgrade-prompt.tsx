import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap } from "lucide-react";
import { PricingModal } from "./pricing-modal";

interface UpgradePromptProps {
  feature: string;
  message: string;
  currentUsage?: number;
  limit?: number;
  className?: string;
}

export function UpgradePrompt({ 
  feature, 
  message, 
  currentUsage, 
  limit, 
  className = "" 
}: UpgradePromptProps) {
  const [showPricingModal, setShowPricingModal] = useState(false);

  return (
    <>
      <Card className={`border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 ${className}`}>
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-purple-100 rounded-full">
              <Crown className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-lg">Upgrade to Premium</CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentUsage !== undefined && limit !== undefined && (
            <div className="text-center">
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                {currentUsage}/{limit} {feature} used this month
              </Badge>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Unlimited {feature.toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-blue-500" />
              <span>Advanced relationship analytics</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 text-purple-500" />
              <span>Ad-free experience</span>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowPricingModal(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Start 5-Day Free Trial
          </Button>
          
          <div className="text-center text-xs text-muted-foreground">
            Cancel anytime • No commitment required
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