// ============================================================
// Theme Configuration — Configurable Per-Client Theming
// ============================================================

export interface ThemeConfig {
  name: string;
  primary: string;       // Main brand color
  primaryLight: string;  // Lighter variant for backgrounds
  accent: string;        // Accent/highlight color
  accentLight: string;   // Light accent for hover states
  background: string;    // Page background
  surface: string;       // Card/section background
  border: string;        // Border color
  textPrimary: string;   // Main text
  textSecondary: string; // Muted text
  textOnPrimary: string; // Text on primary-colored backgrounds
  textOnAccent: string;  // Text on accent-colored backgrounds
}

export const themes: Record<string, ThemeConfig> = {
  gullstack: {
    name: 'GullStack',
    primary: '#1B4D3E',       // Deep green
    primaryLight: '#1E5A48',
    accent: '#C9A84C',        // Gold
    accentLight: '#D4B65E',
    background: '#0B1121',
    surface: '#0F1D15',
    border: '#1E3D30',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textOnAccent: '#1B4D3E',
  },
  capitalwealth: {
    name: 'CapitalWealth',
    primary: '#0A1628',       // Navy
    primaryLight: '#1A2A44',
    accent: '#C9A84C',        // Gold
    accentLight: '#D4B65E',
    background: '#0B1121',
    surface: '#0A1628',
    border: '#1E2D45',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textOnAccent: '#0A1628',
  },
};

// Default theme — change this to swap branding globally
export const ACTIVE_THEME = 'gullstack';

export function getTheme(name?: string): ThemeConfig {
  return themes[name || ACTIVE_THEME] || themes.gullstack;
}

// Generate CSS custom properties from a theme
export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    '--theme-primary': theme.primary,
    '--theme-primary-light': theme.primaryLight,
    '--theme-accent': theme.accent,
    '--theme-accent-light': theme.accentLight,
    '--theme-background': theme.background,
    '--theme-surface': theme.surface,
    '--theme-border': theme.border,
    '--theme-text-primary': theme.textPrimary,
    '--theme-text-secondary': theme.textSecondary,
    '--theme-text-on-primary': theme.textOnPrimary,
    '--theme-text-on-accent': theme.textOnAccent,
  };
}
