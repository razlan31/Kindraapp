// PWA Service Worker Registration and Utilities

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered successfully:', registration.scope);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('PWA: New service worker available');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, notify user
                this.showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
      }
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.showInstallPrompt();
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully');
      this.isInstalled = true;
      this.deferredPrompt = null;
    });

    // Detect if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      console.log('PWA: Running as installed PWA');
      this.isInstalled = true;
      document.body.classList.add('pwa-mode');
    }
  }

  public async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA: Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted install prompt');
        this.deferredPrompt = null;
        return true;
      } else {
        console.log('PWA: User dismissed install prompt');
        return false;
      }
    } catch (error) {
      console.error('PWA: Install prompt failed:', error);
      return false;
    }
  }

  public get canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  public get isRunningAsPWA(): boolean {
    return this.isInstalled;
  }

  private showInstallPrompt() {
    // Show a subtle install banner for 5 seconds
    const banner = document.createElement('div');
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        padding: 12px 16px;
        font-size: 14px;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      ">
        <span>💝 Install Kindra for the best experience!</span>
        <div>
          <button onclick="window.pwaManager.installApp().then(() => this.parentElement.parentElement.remove())" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            margin-right: 8px;
            cursor: pointer;
            font-size: 12px;
          ">Install</button>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: transparent;
            border: none;
            color: white;
            padding: 6px 8px;
            cursor: pointer;
            font-size: 16px;
          ">×</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      if (banner.parentElement) {
        banner.remove();
      }
    }, 8000);
  }

  private showUpdateNotification() {
    // Show update notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        max-width: 300px;
        font-size: 14px;
      ">
        <div style="margin-bottom: 8px;">🔄 New version available!</div>
        <button onclick="window.location.reload()" style="
          background: #3b82f6;
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-right: 8px;
        ">Update</button>
        <button onclick="this.parentElement.remove()" style="
          background: transparent;
          border: 1px solid #6b7280;
          color: #9ca3af;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Later</button>
      </div>
    `;
    
    document.body.appendChild(notification);
  }

  // Offline functionality
  public async saveOfflineData(type: string, data: any): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cache = await caches.open('kindra-offline-data');
        const request = new Request(`/offline-${type}-${Date.now()}`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        const response = new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put(request, response);
        console.log('PWA: Saved offline data:', type);
      } catch (error) {
        console.error('PWA: Failed to save offline data:', error);
      }
    }
  }

  // Request notification permission
  public async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Handle URL shortcuts
  public handleShortcuts() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action) {
      // Remove the action parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Handle specific actions
      switch (action) {
        case 'add-moment':
          // Trigger moment modal
          setTimeout(() => {
            const event = new CustomEvent('pwa-shortcut-moment');
            window.dispatchEvent(event);
          }, 1000);
          break;
        case 'chat-luna':
          // Navigate to Luna AI
          setTimeout(() => {
            window.location.href = '/';
          }, 500);
          break;
        default:
          break;
      }
    }
  }
}

// Initialize PWA manager
export const pwaManager = new PWAManager();

// Make it available globally for install buttons
(window as any).pwaManager = pwaManager;

export default pwaManager;