// EMERGENCY REPLIT SCRIPT BLOCKING - Must be first thing that runs
(() => {
  // Block WebSocket constructor immediately
  if (typeof window !== 'undefined' && window.WebSocket) {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
      const urlString = url.toString();
      if (urlString.includes('replit.dev') || urlString.includes('localhost:undefined')) {
        // Silent fail to prevent console spam
        throw new Error('WebSocket connection blocked');
      }
      return new originalWebSocket(url, protocols);
    } as any;
  }

  // Block service worker registration immediately
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    const originalRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = function() {
      // Silent fail to prevent console spam
      return Promise.reject(new Error('Service worker registration blocked'));
    };
  }
})();

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

// Override console.error to filter Replit-generated errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args.join(' ');
  const isReplitError = message.includes('WebSocket') ||
                       message.includes('wss://') ||
                       message.includes('frame_ant') ||
                       message.includes('PWA:') ||
                       message.includes('Service Worker') ||
                       message.includes('AbortError') ||
                       message.includes('replit.dev') ||
                       message.includes('setupWebSocket') ||
                       message.includes('Failed to construct');
  
  if (!isReplitError) {
    originalConsoleError.apply(console, args);
  }
};

// Override console.log to filter PWA messages
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  const message = args.join(' ');
  const isReplitLog = message.includes('PWA:') ||
                     message.includes('Service Worker') ||
                     message.includes('registered successfully');
  
  if (!isReplitLog) {
    originalConsoleLog.apply(console, args);
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
                            errorStack.includes('frame_ant') ||
                            errorStack.includes('WebSocket') ||
                            errorStack.includes('wss://') ||
                            errorStack.includes('replit.dev') ||
                            errorStack.includes('PWA:') ||
                            errorStack.includes('Service Worker');
  
  // Detect JSON parsing errors
  const isJSONError = errorMessage.includes('JSON') || 
                     errorMessage.includes('undefined') ||
                     errorMessage.includes('not valid JSON') ||
                     errorMessage.includes('Unexpected token');
  
  const isReplitError = errorMessage.includes('WebSocket') ||
                       errorMessage.includes('wss://') ||
                       errorMessage.includes('AbortError') ||
                       errorMessage.includes('frame_ant') ||
                       errorMessage.includes('PWA:') ||
                       errorMessage.includes('Service Worker') ||
                       errorMessage.includes('setupWebSocket') ||
                       errorMessage.includes('Failed to construct') ||
                       errorMessage.includes('client:536');
  
  if (isBrowserExtension || isReplitError || (isJSONError && errorStack.includes('extension'))) {
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
                            event.filename?.includes('frame_ant') ||
                            event.filename?.includes('replit.dev') ||
                            event.filename?.includes('client:') ||
                            event.message?.includes('WebSocket') ||
                            event.message?.includes('PWA:') ||
                            event.message?.includes('Service Worker') ||
                            event.message?.includes('setupWebSocket') ||
                            event.message?.includes('Failed to construct');
  
  if (isBrowserExtension) {
    event.preventDefault(); // Suppress extension errors
    return;
  }
});

// Additional WebSocket blocking (redundant but ensures coverage)
if (typeof window !== 'undefined' && window.WebSocket) {
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
    const urlString = url.toString();
    if (urlString.includes('replit.dev') || urlString.includes('localhost:undefined')) {
      // Silent fail to prevent console spam
      throw new Error('WebSocket connection blocked');
    }
    return new originalWebSocket(url, protocols);
  } as any;
}

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
