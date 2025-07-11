import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, TrendingUp, Calendar, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-neutral-900 dark:to-neutral-800 p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold mb-2">Welcome to Kindra</CardTitle>
            <CardDescription className="text-lg">
              Your AI-powered relationship and wellness companion
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-start space-x-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <Users className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Track Your Connections</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Build deeper relationships by understanding your interactions and patterns
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">AI-Powered Insights</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Get personalized coaching and insights to improve your relationships
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <Calendar className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Wellness Tracking</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Monitor cycles, moods, and patterns that affect your relationships
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <Shield className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Privacy First</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Your data is secure and private. You control what you share
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-4 pt-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Let's set up your profile to get personalized recommendations
            </p>
            <Button 
              onClick={() => setLocation("/onboarding/profile")}
              className="w-full"
              size="lg"
            >
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}