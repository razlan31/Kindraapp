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

// NUCLEAR SERVICE WORKER REMOVAL - Block ALL service worker functionality
if ('serviceWorker' in navigator) {
  // Unregister all existing service workers
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().then(() => {
        console.log('🔴 PWA REMOVED: Service worker unregistered');
      });
    });
  });
  
  // Block service worker registration by overriding the register method
  const originalRegister = navigator.serviceWorker.register;
  navigator.serviceWorker.register = function() {
    console.log('🔴 BLOCKED: Service worker registration attempt prevented');
    return Promise.reject(new Error('Service worker registration blocked'));
  };
  
  // Clear any service worker controlled state
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('CLEAR_CACHE');
  }
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </AuthProvider>
  </ThemeProvider>
);
