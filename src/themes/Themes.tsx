// src/themes/themes.tsx

export interface SectionTheme {
  background: string;
  text: string;
}

export interface ThemeConfig {
  header: SectionTheme;
  sidebar: SectionTheme;
  footer: SectionTheme;
  content: SectionTheme;
}

// Presets first, so we can set default from one of them
export const themePresets = {
  default: {
    header: { background: "#ffffff", text: "#000000" },
    sidebar: { background: "#f5f5f5", text: "#333333" },
    footer:  { background: "#1e1e1e", text: "#ffffff" },
    content: { background: "#fafafa", text: "#000000" },
  },
  light: {
    header: { background: "#ffffff", text: "#000000" },
    sidebar: { background: "#f5f5f5", text: "#333333" },
    footer:  { background: "#e5e5e5", text: "#111111" },
    content: { background: "#fafafa", text: "#000000" },
  },
  dark: {
    header: { background: "#1e1e1e", text: "#ffffff" },
    sidebar: { background: "#2c2c2c", text: "#dddddd" },
    footer:  { background: "#111111", text: "#ffffff" },
    content: { background: "#121212", text: "#ffffff" },
  },
  blue: {
    header: { background: "#1e3a8a", text: "#ffffff" },
    sidebar: { background: "#3b82f6", text: "#ffffff" },
    footer:  { background: "#1e40af", text: "#ffffff" },
    content: { background: "#e0f2fe", text: "#000000" },
  },
} satisfies Record<string, ThemeConfig>;

// Narrow the preset name type to the actual keys
export type ThemeName = keyof typeof themePresets;

// Use one of the presets as the default
export const defaultThemeConfig: ThemeConfig = themePresets.light;
