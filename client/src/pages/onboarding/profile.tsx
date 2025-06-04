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

const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const loveLanguages = [
  "Words of Affirmation",
  "Quality Time", 
  "Physical Touch",
  "Acts of Service",
  "Receiving Gifts"
];

export default function ProfileOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    displayName: "",
    zodiacSign: "",
    loveLanguage: "",
    personalNotes: ""
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

    // Store data in localStorage for now, will be saved in final step
    localStorage.setItem("onboarding_profile", JSON.stringify(formData));
    setLocation("/onboarding/goals");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-neutral-900 dark:to-neutral-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tell us about yourself</CardTitle>
          <CardDescription>
            Help us personalize your experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="h-2 bg-primary rounded-full flex-1"></div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full flex-1"></div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full flex-1"></div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="How should we call you?"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zodiacSign">Zodiac Sign</Label>
              <Select value={formData.zodiacSign} onValueChange={(value) => setFormData(prev => ({ ...prev, zodiacSign: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your zodiac sign" />
                </SelectTrigger>
                <SelectContent>
                  {zodiacSigns.map((sign) => (
                    <SelectItem key={sign} value={sign}>{sign}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loveLanguage">Love Language</Label>
              <Select value={formData.loveLanguage} onValueChange={(value) => setFormData(prev => ({ ...prev, loveLanguage: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="How do you prefer to give/receive love?" />
                </SelectTrigger>
                <SelectContent>
                  {loveLanguages.map((language) => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalNotes">About You</Label>
              <Textarea
                id="personalNotes"
                placeholder="Tell us a bit about yourself... (optional)"
                value={formData.personalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, personalNotes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/onboarding/welcome")}
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