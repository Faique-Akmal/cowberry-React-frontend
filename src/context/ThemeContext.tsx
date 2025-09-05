// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { defaultThemeConfig, themePresets, ThemeConfig, SectionTheme } from "../themes/Themes";

type ThemeName = keyof typeof themePresets;

interface ThemeContextType {
  themeConfig: ThemeConfig;
  updateSectionTheme: (section: keyof ThemeConfig, newConfig: Partial<SectionTheme>) => void;
  switchPreset: (presetName: ThemeName) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // load from localStorage
  const [customTheme, setCustomTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem("customTheme");
    return saved ? JSON.parse(saved) : defaultThemeConfig;
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(customTheme);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("isDarkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      setThemeConfig(themePresets.dark);
    } else {
      setThemeConfig(customTheme);
    }
  }, [isDarkMode, customTheme]);

  useEffect(() => {
    localStorage.setItem("customTheme", JSON.stringify(customTheme));
  }, [customTheme]);

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
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

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ themeConfig, updateSectionTheme, switchPreset, toggleTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
