import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts/auth-context";
import { ModalProvider } from "./contexts/modal-context";
import { RelationshipFocusProvider } from "./contexts/relationship-focus-context";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="kindra-theme">
    <AuthProvider>
      <ModalProvider>
        <RelationshipFocusProvider>
          <App />
        </RelationshipFocusProvider>
      </ModalProvider>
    </AuthProvider>
  </ThemeProvider>
);
