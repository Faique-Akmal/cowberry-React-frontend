// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { defaultThemeConfig, themePresets, ThemeConfig, SectionTheme } from "../themes/Themes";


interface ThemeContextType {
  themeConfig: ThemeConfig;
  updateSectionTheme: (section: keyof ThemeConfig, newConfig: Partial<SectionTheme>) => void;
  switchPreset: (presetName: ThemeName) => void;
  toggleTheme: () => void;   // ✅ add toggleTheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem("themeConfig");
    return saved ? JSON.parse(saved) : defaultThemeConfig;
  });

  useEffect(() => {
    localStorage.setItem("themeConfig", JSON.stringify(themeConfig));
  }, [themeConfig]);

  const updateSectionTheme = (section: keyof ThemeConfig, newConfig: Partial<SectionTheme>) => {
    setThemeConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...newConfig },
    }));
  };

  const switchPreset = (presetName: ThemeName) => {
    if (themePresets[presetName]) {
      setThemeConfig(themePresets[presetName]);
    }
  };

  // ✅ Toggle between light & dark
  const toggleTheme = () => {
    setThemeConfig((prev) => {
      const isDark = prev.header.background === themePresets.dark.header.background;
      return isDark ? themePresets.light : themePresets.dark;
    });
  };

  return (
    <ThemeContext.Provider value={{ themeConfig, updateSectionTheme, switchPreset, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
