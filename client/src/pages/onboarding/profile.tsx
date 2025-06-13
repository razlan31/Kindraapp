import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
    zodiacSign: "",
    loveLanguages: [] as string[],
    personalNotes: ""
  });

  const handleContinue = () => {
    // Store data in localStorage for now, will be saved in final step
    localStorage.setItem("onboarding_profile", JSON.stringify(formData));
    setLocation("/onboarding/goals");
  };

  const handleLoveLanguageChange = (language: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      loveLanguages: checked 
        ? [...prev.loveLanguages, language]
        : prev.loveLanguages.filter(l => l !== language)
    }));
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
              <Label>Love Languages (select all that apply)</Label>
              <div className="grid grid-cols-1 gap-3">
                {loveLanguages.map((language) => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={language}
                      checked={formData.loveLanguages.includes(language)}
                      onCheckedChange={(checked) => handleLoveLanguageChange(language, checked as boolean)}
                    />
                    <Label htmlFor={language} className="text-sm font-normal cursor-pointer">
                      {language}
                    </Label>
                  </div>
                ))}
              </div>
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