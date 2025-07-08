import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: July 8, 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">Service Description</h3>
              <p className="text-muted-foreground">
                Kindra provides relationship tracking, AI coaching, and personal insights to help users understand their relationships better.
                The service includes cycle tracking, moment logging, and AI-powered relationship advice.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">User Responsibilities</h3>
              <p className="text-muted-foreground">
                Users are responsible for the accuracy of data entered and for maintaining account security.
                Kindra should be used as a tool for reflection and insight, not as a substitute for professional counseling.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">AI Disclaimer</h3>
              <p className="text-muted-foreground">
                Luna AI provides general relationship insights and should not be considered professional therapy or medical advice.
                For serious relationship or mental health concerns, please consult qualified professionals.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Subscription Terms</h3>
              <p className="text-muted-foreground">
                Premium features require an active subscription. Subscriptions auto-renew unless cancelled.
                Free trial periods are available for new users.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Contact</h3>
              <p className="text-muted-foreground">
                For questions about these terms, contact us through the Support section in Settings.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}