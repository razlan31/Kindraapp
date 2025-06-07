import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts/auth-context";
import { ModalProvider } from "./contexts/modal-context";

// Global error handlers to catch JSON parsing issues
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', {
    reason: event.reason,
    stack: event.reason?.stack,
    message: event.reason?.message,
    type: typeof event.reason
  });
  
  // Check if it's a JSON parsing error
  if (event.reason?.message?.includes('JSON') || event.reason?.message?.includes('undefined')) {
    console.error('JSON Parsing Error Details:', event.reason);
  }
});

window.addEventListener('error', (event) => {
  console.error('Global Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});
createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="kindra-theme">
    <AuthProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </AuthProvider>
  </ThemeProvider>
);
