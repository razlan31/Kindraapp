import { useEffect } from 'react';

export default function LogoutPage() {
  useEffect(() => {
    // Clear all client-side data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear service workers and cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Server logout in background
    fetch("/api/logout", { 
      method: "POST", 
      credentials: "include" 
    }).finally(() => {
      // Force complete page reload after server cleanup
      window.location.replace("/login");
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Logging out...</p>
      </div>
    </div>
  );
}