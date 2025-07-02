import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Download, Smartphone } from 'lucide-react';
import { pwaManager } from '../../utils/pwa';

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function PWAInstallButton({ 
  variant = "default", 
  size = "default", 
  className = "" 
}: PWAInstallButtonProps) {
  console.log('🔍 PWA Install Button - Component initialized!');
  
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check install status
    const checkInstallStatus = () => {
      const canInstallValue = pwaManager.canInstall;
      const isInstalledValue = pwaManager.isRunningAsPWA;
      
      console.log('PWA Install Button - Status Check:', {
        canInstall: canInstallValue,
        isInstalled: isInstalledValue,
        hasServiceWorker: 'serviceWorker' in navigator,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches
      });
      
      setCanInstall(canInstallValue);
      setIsInstalled(isInstalledValue);
    };

    // Initial check
    checkInstallStatus();

    // Listen for install prompt events
    const handleBeforeInstallPrompt = () => {
      checkInstallStatus();
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setIsInstalling(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Periodic check for install status changes
    const interval = setInterval(checkInstallStatus, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(interval);
    };
  }, []);

  const handleInstall = async () => {
    if (!canInstall) return;

    setIsInstalling(true);
    try {
      const success = await pwaManager.installApp();
      if (success) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    } catch (error) {
      console.error('PWA Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Show different states based on installation status
  const getButtonContent = () => {
    if (isInstalling) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
          Installing...
        </>
      );
    }
    
    if (isInstalled) {
      return (
        <>
          <Smartphone className="h-4 w-4 mr-2" />
          App Installed ✓
        </>
      );
    }
    
    if (canInstall) {
      return (
        <>
          <Download className="h-4 w-4 mr-2" />
          Install App
        </>
      );
    }
    
    return (
      <>
        <Smartphone className="h-4 w-4 mr-2" />
        Install Not Available
      </>
    );
  };

  console.log('PWA Install Button - Rendering with state:', {
    canInstall,
    isInstalled,
    isInstalling
  });

  return (
    <Button
      onClick={canInstall ? handleInstall : undefined}
      disabled={isInstalling || !canInstall || isInstalled}
      variant={variant}
      size={size}
      className={`${className} transition-all duration-200`}
    >
      {getButtonContent()}
    </Button>
  );
}

// PWA Status Indicator Component
export function PWAStatusIndicator() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setIsInstalled(pwaManager.isRunningAsPWA);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isInstalled) return null;

  return (
    <div className="fixed top-2 right-2 z-50">
      <div className={`
        px-3 py-1 rounded-full text-xs font-medium
        ${isOnline 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }
      `}>
        {isOnline ? '🟢 Online' : '🔴 Offline'}
      </div>
    </div>
  );
}

export default PWAInstallButton;