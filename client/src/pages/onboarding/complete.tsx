import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";

export default function CompleteOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      localStorage.removeItem("onboarding_profile");
      localStorage.removeItem("onboarding_data");
      toast({
        title: "Welcome to Kindra!",
        description: "Your profile has been set up successfully"
      });
      setLocation("/");
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
      toast({
        title: "Setup failed",
        description: "There was an error setting up your profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      const onboardingData = JSON.parse(localStorage.getItem("onboarding_data") || "{}");
      
      if (!onboardingData.displayName) {
        toast({
          title: "Missing information",
          description: "Please complete all onboarding steps",
          variant: "destructive"
        });
        setLocation("/onboarding/profile");
        return;
      }

      await updateProfileMutation.mutateAsync(onboardingData);
    } catch (error) {
      console.error("Onboarding completion failed:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Get onboarding data for preview
  const onboardingData = JSON.parse(localStorage.getItem("onboarding_data") || "{}");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-neutral-900 dark:to-neutral-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">You're all set!</CardTitle>
            <CardDescription>
              Ready to start your journey with personalized insights
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator - all complete */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="h-2 bg-primary rounded-full flex-1"></div>
            <div className="h-2 bg-primary rounded-full flex-1"></div>
            <div className="h-2 bg-primary rounded-full flex-1"></div>
          </div>

          {/* Profile summary */}
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Your Profile Summary
            </h3>
            
            <div className="space-y-2 text-sm">
              {onboardingData.displayName && (
                <div>
                  <span className="font-medium">Name:</span> {onboardingData.displayName}
                </div>
              )}
              {onboardingData.zodiacSign && (
                <div>
                  <span className="font-medium">Zodiac:</span> {onboardingData.zodiacSign}
                </div>
              )}
              {onboardingData.loveLanguage && (
                <div>
                  <span className="font-medium">Love Language:</span> {onboardingData.loveLanguage}
                </div>
              )}
              {onboardingData.relationshipGoals && (
                <div>
                  <span className="font-medium">Goals:</span> {onboardingData.relationshipGoals}
                </div>
              )}
              {onboardingData.relationshipStyle && (
                <div>
                  <span className="font-medium">Style:</span> {onboardingData.relationshipStyle}
                </div>
              )}
              {onboardingData.currentFocus && (
                <div>
                  <span className="font-medium">Focus:</span> {onboardingData.currentFocus}
                </div>
              )}
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What's Next?
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Add your first connection</li>
              <li>• Start tracking moments</li>
              <li>• Get personalized AI insights</li>
              <li>• Explore wellness tracking</li>
            </ul>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/onboarding/goals")}
              className="flex items-center gap-2"
              disabled={isCompleting}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Button 
              onClick={handleComplete} 
              className="flex items-center gap-2"
              disabled={isCompleting}
              size="lg"
            >
              {isCompleting ? "Setting up..." : "Start Using Kindra"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}