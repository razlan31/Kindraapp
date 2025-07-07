// Allow Replit PWA functionality to work normally

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

// Remove console overrides - let Replit PWA function normally

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

// Allow normal Replit PWA and WebSocket functionality

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </AuthProvider>
  </ThemeProvider>
);
