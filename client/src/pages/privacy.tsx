import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
          
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: July 8, 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Privacy Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">Data Collection</h3>
              <p className="text-muted-foreground">
                Kindra collects only the information necessary to provide relationship insights and tracking features.
                This includes relationship moments, cycle data, and AI coaching interactions.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Data Security</h3>
              <p className="text-muted-foreground">
                All data is encrypted and stored securely. We use industry-standard security measures to protect your personal information.
                Your relationship data is private and never shared with third parties.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">AI Processing</h3>
              <p className="text-muted-foreground">
                AI insights are processed securely with anonymized data. Personal identifiers are removed before AI analysis.
                Your conversations with Luna AI are encrypted and private.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Contact</h3>
              <p className="text-muted-foreground">
                For privacy concerns, contact us through the Support section in Settings.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}