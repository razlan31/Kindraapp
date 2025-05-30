import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "aesthetic";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "light";
  });

  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove("light", "dark", "aesthetic");
    
    let effectiveTheme: "light" | "dark";
    
    if (theme === "aesthetic") {
      root.classList.add("aesthetic");
      effectiveTheme = "dark"; // aesthetic is based on dark theme
    } else {
      effectiveTheme = theme as "light" | "dark";
      root.classList.add(effectiveTheme);
    }
    
    setActualTheme(effectiveTheme);
    
    // Store theme preference
    localStorage.setItem("theme", theme);
  }, [theme]);



  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}