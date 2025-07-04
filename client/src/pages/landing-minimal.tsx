import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function LandingMinimal() {
  const [, navigate] = useLocation();

  console.log('🟢 MINIMAL LANDING: Component rendered successfully');

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to <span className="text-slate-600 dark:text-slate-400">Kindra</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Your AI-powered relationship intelligence platform
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}