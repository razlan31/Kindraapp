import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "minimalist";

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
    root.classList.remove("light", "dark", "minimalist");
    
    let effectiveTheme: "light" | "dark";
    
    if (theme === "minimalist") {
      root.classList.add("minimalist");
      effectiveTheme = "light"; // minimalist is based on light theme
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