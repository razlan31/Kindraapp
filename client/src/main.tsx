import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./contexts/theme-context";
import { AuthProvider } from "./contexts/auth-context";
import { ModalProvider } from "./contexts/modal-context";

// Override JSON.parse globally to prevent extension errors
const originalJSONParse = JSON.parse;
JSON.parse = function(text: string, reviver?: any) {
  try {
    return originalJSONParse.call(this, text, reviver);
  } catch (error) {
    // Check if the error is from a browser extension
    const stack = new Error().stack;
    if (stack && stack.includes('chrome-extension://')) {
      console.warn('Prevented JSON parse error from browser extension');
      return null; // Return null instead of throwing
    }
    throw error; // Re-throw for application errors
  }
};

// Comprehensive error suppression for extensions
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || '';
  const errorStack = event.reason?.stack || '';
  
  // Detect browser extensions
  const isBrowserExtension = errorStack.includes('chrome-extension://') || 
                            errorStack.includes('moz-extension://') ||
                            errorStack.includes('safari-extension://') ||
                            errorStack.includes('frame_ant');
  
  // Detect JSON parsing errors
  const isJSONError = errorMessage.includes('JSON') || 
                     errorMessage.includes('undefined') ||
                     errorMessage.includes('not valid JSON') ||
                     errorMessage.includes('Unexpected token');
  
  if (isBrowserExtension || (isJSONError && errorStack.includes('extension'))) {
    event.preventDefault(); // Completely suppress the error
    return;
  }
  
  // Allow application errors to proceed normally
  console.error('Application Error:', {
    message: errorMessage,
    stack: errorStack
  });
});

window.addEventListener('error', (event) => {
  const isBrowserExtension = event.filename?.includes('extension://') ||
                            event.filename?.includes('frame_ant');
  
  if (isBrowserExtension) {
    event.preventDefault(); // Suppress extension errors
    return;
  }
});

// DISABLED: Service worker registration to prevent routing cache interference
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/sw.js', { 
//     scope: '/',
//     updateViaCache: 'none' // Prevent service worker caching
//   }).then((registration) => {
//     console.log('Custom SW registered, preventing routing cache');
//     // Force update immediately
//     registration.update();
//   }).catch((error) => {
//     console.log('SW registration failed:', error);
//   });
// }

// Unregister existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('🔴 STARTUP: Unregistered service worker');
    });
  });
}

// Global logout interceptor to catch any logout attempts
window.addEventListener('beforeunload', () => {
  console.log('🔴 GLOBAL: Page unloading detected');
});

// Intercept all navigation to "/" to detect logout redirects
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  console.log('🔴 GLOBAL: pushState called with:', args[2]);
  return originalPushState.apply(this, args);
};

history.replaceState = function(...args) {
  console.log('🔴 GLOBAL: replaceState called with:', args[2]);
  return originalReplaceState.apply(this, args);
};

window.addEventListener('popstate', (event) => {
  console.log('🔴 GLOBAL: popstate event:', window.location.pathname);
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </AuthProvider>
  </ThemeProvider>
);
