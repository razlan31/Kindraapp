import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const relationshipGoals = [
  "Finding meaningful connections",
  "Improving current relationships", 
  "Understanding relationship patterns",
  "Building emotional intelligence",
  "Preparing for marriage",
  "Healing from past relationships",
  "Exploring dating and relationships",
  "Strengthening family bonds",
  "Building friendships",
  "Personal growth and self-discovery"
];

const relationshipStyles = [
  "Exploring", 
  "Committed",
  "Casual",
  "Focused on one person",
  "Open to possibilities",
  "Taking a break",
  "Healing and growing",
  "Focused on friendships"
];

const currentFocusAreas = [
  "Communication skills",
  "Emotional awareness", 
  "Conflict resolution",
  "Trust and vulnerability",
  "Setting boundaries",
  "Understanding love languages",
  "Managing expectations",
  "Personal healing",
  "Building confidence",
  "Understanding attachment styles"
];

export default function GoalsOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    displayName: "",
    relationshipGoals: "",
    relationshipStyle: "",
    currentFocus: ""
  });

  const handleContinue = () => {
    if (!formData.displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter how you'd like to be called",
        variant: "destructive"
      });
      return;
    }

    if (!formData.relationshipGoals) {
      toast({
        title: "Please select your relationship goals",
        description: "This helps us provide better insights",
        variant: "destructive"
      });
      return;
    }

    // Combine with previous data
    const profileData = JSON.parse(localStorage.getItem("onboarding_profile") || "{}");
    const combinedData = { ...profileData, ...formData };
    localStorage.setItem("onboarding_data", JSON.stringify(combinedData));
    setLocation("/onboarding/complete");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-neutral-900 dark:to-neutral-800 p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Your Relationship Goals</CardTitle>
          <CardDescription>
            Help us understand what you're looking to achieve
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="h-2 bg-primary rounded-full flex-1"></div>
            <div className="h-2 bg-primary rounded-full flex-1"></div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full flex-1"></div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="How should we call you?"
                value={formData.displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationshipGoals">What are your main relationship goals? *</Label>
              <Select value={formData.relationshipGoals} onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipGoals: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your primary goal" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipGoals.map((goal) => (
                    <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationshipStyle">How would you describe your current approach?</Label>
              <Select value={formData.relationshipStyle} onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipStyle: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your relationship style" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipStyles.map((style) => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentFocus">What area would you like to focus on?</Label>
              <Select value={formData.currentFocus} onValueChange={(value) => setFormData(prev => ({ ...prev, currentFocus: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an area to improve" />
                </SelectTrigger>
                <SelectContent>
                  {currentFocusAreas.map((focus) => (
                    <SelectItem key={focus} value={focus}>{focus}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/onboarding/profile")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Button onClick={handleContinue} className="flex items-center gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}