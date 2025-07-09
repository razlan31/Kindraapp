// Cache buster for production deployment
export const CACHE_VERSION = '2025-01-09-v4-final';
export const DEPLOYMENT_TIMESTAMP = Date.now();

// Clear all caches on load
if (typeof window !== 'undefined') {
  console.log('🔥 CACHE BUSTER ACTIVE:', CACHE_VERSION);
  
  // Clear service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
}