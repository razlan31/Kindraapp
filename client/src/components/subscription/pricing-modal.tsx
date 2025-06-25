import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Star, Zap } from "lucide-react";
import { subscriptionPlans } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  showTrialButton?: boolean;
}

export function PricingModal({ isOpen, onClose, currentPlan = 'free', showTrialButton = true }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/subscription/start-trial', 'POST');
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Free trial started!", description: "Enjoy 5 days of premium features." });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start trial. Please try again.", variant: "destructive" });
    }
  });

  const subscribeMutation = useMutation({
    mutationFn: async (plan: string) => {
      console.log("Creating subscription for plan:", plan);
      const response = await apiRequest('/api/subscription/create-checkout', 'POST', { plan });
      const data = await response.json();
      console.log("Subscription response:", data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log("Subscription success:", data);
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: "No checkout URL received", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      console.error("Subscription error:", error);
      toast({ title: "Error", description: "Failed to start subscription. Please try again.", variant: "destructive" });
    }
  });

  const planData = [
    {
      key: 'free',
      icon: <Star className="h-5 w-5" />,
      color: 'bg-gray-100 text-gray-800',
      popular: false
    },
    {
      key: 'weekly',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-800',
      popular: false
    },
    {
      key: 'monthly',
      icon: <Crown className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-800',
      popular: true
    },
    {
      key: 'annual',
      icon: <Crown className="h-5 w-5" />,
      color: 'bg-green-100 text-green-800',
      popular: false,
      savings: "Save 37%"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Kindra Plan
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Unlock deeper relationship insights and unlimited tracking
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {planData.map((planInfo) => {
            const plan = subscriptionPlans[planInfo.key as keyof typeof subscriptionPlans];
            const isCurrentPlan = currentPlan === planInfo.key;
            const isSelected = selectedPlan === planInfo.key;
            
            return (
              <Card 
                key={planInfo.key}
                className={`relative cursor-pointer transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-md'
                } ${isCurrentPlan ? 'border-green-500' : ''}`}
                onClick={() => setSelectedPlan(planInfo.key)}
              >
                {planInfo.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                    Most Popular
                  </Badge>
                )}
                
                {planInfo.savings && (
                  <Badge className="absolute -top-2 right-2 bg-green-600">
                    {planInfo.savings}
                  </Badge>
                )}

                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-full ${planInfo.color} flex items-center justify-center mx-auto mb-2`}>
                    {planInfo.icon}
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    {plan.interval && <span className="text-sm text-muted-foreground">/{plan.interval}</span>}
                  </div>
                  {planInfo.key === 'weekly' && (
                    <div className="text-sm text-muted-foreground">~$8.67/month</div>
                  )}
                  {planInfo.key === 'annual' && (
                    <div className="text-sm text-muted-foreground">~$3.33/month</div>
                  )}
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {typeof plan.features.connections === 'number' 
                        ? `${plan.features.connections} connection${plan.features.connections !== 1 ? 's' : ''}`
                        : 'Unlimited connections'
                      }
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {typeof plan.features.aiInsightsPerMonth === 'number'
                        ? `${plan.features.aiInsightsPerMonth} AI insights/month`
                        : 'Unlimited AI insights'
                      }
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {typeof plan.features.aiCoachingPerMonth === 'number'
                        ? `${plan.features.aiCoachingPerMonth} AI coaching/month`
                        : 'Unlimited AI coaching'
                      }
                    </div>

                    {plan.features.advancedAnalytics && (
                      <div className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Advanced analytics
                      </div>
                    )}

                    {plan.features.cycleTracking === 'advanced' && (
                      <div className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Advanced cycle tracking
                      </div>
                    )}

                    {plan.features.dataExport && (
                      <div className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Data export
                      </div>
                    )}

                    {plan.features.adFree && (
                      <div className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Ad-free experience
                      </div>
                    )}

                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Unlimited badges
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 mt-6">
          {showTrialButton && currentPlan === 'free' && (
            <Button 
              onClick={() => startTrialMutation.mutate()}
              disabled={startTrialMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              {startTrialMutation.isPending ? "Starting Trial..." : "Start 5-Day Free Trial"}
            </Button>
          )}

          {selectedPlan !== 'free' && selectedPlan !== currentPlan && (
            <Button 
              onClick={() => subscribeMutation.mutate(selectedPlan)}
              disabled={subscribeMutation.isPending}
              className="w-full"
              size="lg"
            >
              {subscribeMutation.isPending ? "Processing..." : `Subscribe to ${subscriptionPlans[selectedPlan as keyof typeof subscriptionPlans].name}`}
            </Button>
          )}

          <Button variant="outline" onClick={onClose} className="w-full">
            Maybe Later
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>All plans include unlimited moment tracking and relationship insights.</p>
          <p>Cancel anytime. Prices in USD.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}