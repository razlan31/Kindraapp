import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function NotFound() {
  const [, setLocation] = useLocation();

  console.log('🚨 NOT-FOUND: NotFound component is rendering - this means routes are not matching!');
  console.log('🚨 NOT-FOUND: Current pathname:', window.location.pathname);
  console.log('🚨 NOT-FOUND: Expected this should NOT be showing for "/" or "/login"');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl font-bold text-slate-400 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Page Not Found</h1>
        <p className="text-slate-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation('/')}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
