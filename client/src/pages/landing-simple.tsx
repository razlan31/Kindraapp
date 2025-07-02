import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Calendar, Star, Check, ArrowRight, Shield, Zap, Bell } from 'lucide-react';
import { useLocation } from 'wouter';
import { PricingModal } from '@/components/subscription/pricing-modal';

// PWA Download Card Component
function PWADownloadCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  React.useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      const result = await deferredPrompt.prompt();
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA install failed:', error);
    }
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return (
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">On iPhone/iPad:</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p>1. Tap the <strong>Share button</strong> (□↗) in Safari</p>
            <p>2. Select <strong>"Add to Home Screen"</strong></p>
            <p>3. Tap <strong>"Add"</strong> to install</p>
          </div>
        </div>
      );
    }
    if (userAgent.includes('android')) {
      return (
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">On Android:</p>
          <div className="bg-green-50 p-4 rounded-lg">
            <p>1. Tap the <strong>menu</strong> (⋮) in your browser</p>
            <p>2. Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></p>
            <p>3. Tap <strong>"Install"</strong></p>
          </div>
        </div>
      );
    }
    return (
      <div className="text-center space-y-3">
        <p className="text-lg font-semibold">On Desktop:</p>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p>Look for an <strong>"Install"</strong> or <strong>"Add to Home Screen"</strong> option in your browser menu</p>
        </div>
      </div>
    );
  };

  if (isInstalled) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-2">App Installed!</h3>
            <p className="text-green-600">Kindra is now installed on your device</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (canInstall) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer" onClick={handleInstallClick}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-800 mb-2">Install Kindra App</h3>
            <p className="text-blue-600 mb-4">Tap to install as a mobile app</p>
            <div className="bg-blue-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-blue-700">One-click installation available!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardContent className="p-6">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-purple-800 mb-4">Install Kindra App</h3>
          {getInstallInstructions()}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SimpleLandingPage() {
  const [, setLocation] = useLocation();
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleGetStarted = () => {
    setLocation("/login");
  };

  const handlePremiumSignup = () => {
    setShowPricingModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-100">
            <Heart className="h-4 w-4 mr-1" />
            AI-Powered Relationship Intelligence
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Transform Your{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Relationships
            </span>{" "}
            with AI
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Meet Kindra - the smart relationship companion that helps you understand patterns, 
            improve communication, and build deeper connections through AI-powered insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 rounded-xl"
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowPricingModal(true)}
              className="border-purple-200 text-purple-600 hover:bg-purple-50 text-lg px-8 py-6 rounded-xl"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* PWA Download Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="border-0 shadow-2xl bg-white">
              <CardContent className="p-12">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    📱 Get the Kindra Mobile App
                  </h2>
                  <p className="text-xl text-gray-600 mb-6">
                    Install Kindra on your phone for the best experience - faster, offline access, and push notifications
                  </p>
                </div>

                <PWADownloadCard />

                <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span>Lightning Fast</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Works Offline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-purple-500" />
                    <span>Push Notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Home Screen Icon</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Relationship Growth
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful AI-driven insights, intuitive tracking, and personalized guidance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 text-white">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Luna AI Coach</h3>
                <p className="text-gray-600">Your personal relationship expert powered by advanced AI</p>
              </CardContent>
            </Card>

            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 text-white">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Cycle Tracking</h3>
                <p className="text-gray-600">Understand how your cycle affects emotions and relationships</p>
              </CardContent>
            </Card>

            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 text-white">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Moment Tracking</h3>
                <p className="text-gray-600">Capture and analyze relationship moments to identify patterns</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Transform Your Relationships?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of users who have already discovered the power of AI-driven relationship intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-white text-purple-700 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl"
                >
                  Start Your Free Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handlePremiumSignup}
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl"
                >
                  View Premium Features
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Kindra
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Support</a>
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t border-gray-100">
            <p className="text-gray-500">
              © 2025 Kindra. All rights reserved. Built with ❤️ for better relationships.
            </p>
          </div>
        </div>
      </footer>

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
    </div>
  );
}