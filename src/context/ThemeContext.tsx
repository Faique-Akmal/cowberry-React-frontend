// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { defaultThemeConfig, themePresets, ThemeConfig, SectionTheme } from "../themes/Themes";
import { runWaterFlowTransition } from "../utils/waterFlowTransition";

type ThemeName = keyof typeof themePresets;

export interface ThemeContextType {
  themeConfig: ThemeConfig;
  updateSectionTheme: (section: keyof ThemeConfig, newConfig: Partial<SectionTheme>) => void;
  switchPreset: (presetName: ThemeName) => void;
  toggleTheme: (event?: React.MouseEvent | { clientX: number; clientY: number }) => void;
  setTheme: (theme: "light" | "dark") => void;
  isDarkMode: boolean;
  theme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load custom section configuration if any
  const [customTheme, setCustomTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem("customTheme");
      return saved ? JSON.parse(saved) : defaultThemeConfig;
    } catch {
      return defaultThemeConfig;
    }
  });

  // Determine initial dark mode state (defaults to false / Light Mode for first-time visitors)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedDark = localStorage.getItem("isDarkMode");
      const savedTheme = localStorage.getItem("theme");
      if (savedDark !== null) {
        return JSON.parse(savedDark);
      }
      if (savedTheme !== null) {
        return savedTheme === "dark";
      }
      return false; // Default to Light Mode as per specification
    } catch {
      return false;
    }
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(
    isDarkMode ? themePresets.dark : customTheme
  );

  // Synchronize document classes and CSS theme config
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      setThemeConfig(themePresets.dark);
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      setThemeConfig(customTheme);
    }
  }, [isDarkMode, customTheme]);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem("customTheme", JSON.stringify(customTheme));
    } catch (e) {
      console.warn("Could not save customTheme to localStorage", e);
    }
  }, [customTheme]);

  useEffect(() => {
    try {
      localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    } catch (e) {
      console.warn("Could not save theme state to localStorage", e);
    }
  }, [isDarkMode]);

  const updateSectionTheme = (section: keyof ThemeConfig, newConfig: Partial<SectionTheme>) => {
    setCustomTheme((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...newConfig },
    }));
  };

  const switchPreset = (presetName: ThemeName) => {
    if (themePresets[presetName]) {
      setCustomTheme(themePresets[presetName]);
    }
  };

  // Water-Flow Theme Toggle with corner-to-corner fluid transition
  const toggleTheme = useCallback(
    (event?: React.MouseEvent | { clientX: number; clientY: number }) => {
      // Default to top-right corner where header theme button sits
      let x = typeof window !== "undefined" ? window.innerWidth - 60 : 1000;
      let y = 30;

      if (event && "clientX" in event && typeof event.clientX === "number" && event.clientX > 0) {
        x = event.clientX;
        y = event.clientY;
      } else if (event && "currentTarget" in event && event.currentTarget) {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      const nextIsDark = !isDarkMode;

      runWaterFlowTransition({
        x,
        y,
        toDark: nextIsDark,
        duration: 1100,
        onThemeSwitch: () => {
          setIsDarkMode(nextIsDark);
          if (nextIsDark) {
            document.documentElement.classList.add("dark");
            document.body.classList.add("dark");
            setThemeConfig(themePresets.dark);
          } else {
            document.documentElement.classList.remove("dark");
            document.body.classList.remove("dark");
            setThemeConfig(customTheme);
          }
          queueMicrotask(() => {
            try {
              localStorage.setItem("isDarkMode", JSON.stringify(nextIsDark));
              localStorage.setItem("theme", nextIsDark ? "dark" : "light");
            } catch (e) {
              console.warn("Could not save theme state to localStorage", e);
            }
          });
        },
      });
    },
    [isDarkMode, customTheme]
  );

  const setTheme = useCallback(
    (targetTheme: "light" | "dark") => {
      const nextIsDark = targetTheme === "dark";
      if (nextIsDark === isDarkMode) return;
      toggleTheme();
    },
    [isDarkMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider
      value={{
        themeConfig,
        updateSectionTheme,
        switchPreset,
        toggleTheme,
        setTheme,
        isDarkMode,
        theme: isDarkMode ? "dark" : "light",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
