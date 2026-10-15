import React from 'react';

export type GlassBlurLevel = 'heavy' | 'balanced' | 'subtle';
export type AccentColor = 'indigo' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple';
export type LayoutDensity = 'comfortable' | 'compact';
export type DashboardViewMode = 'full' | 'calendar' | 'charts';
export type VisualEffectsSetting = 'auto' | 'high' | 'low';
export type ThemeMode = 'auto' | 'dark' | 'light';

export interface UISettings {
  themeMode: ThemeMode;
  visualEffects: VisualEffectsSetting;
  glassBlur: GlassBlurLevel;
  accentColor: AccentColor;
  isLightMode: boolean;
  layoutDensity: LayoutDensity;
  defaultDashboardView: DashboardViewMode;
  showChartsWidget: boolean;
  showStatsWidget: boolean;
  showRecentActivityWidget: boolean;
}

export const DEFAULT_UI_SETTINGS: UISettings = {
  themeMode: 'auto',
  visualEffects: 'auto',
  glassBlur: 'balanced',
  accentColor: 'purple',
  isLightMode: false,
  layoutDensity: 'comfortable',
  defaultDashboardView: 'full',
  showChartsWidget: true,
  showStatsWidget: true,
  showRecentActivityWidget: true,
};

const UI_SETTINGS_KEY = 'entrance_exit_ui_settings_v2';
const LEGACY_THEME_KEY = 'entrance_exit_app_theme';

export function isSystemDarkPreferred(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveEffectiveTheme(mode: ThemeMode = 'auto'): 'dark' | 'light' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  return isSystemDarkPreferred() ? 'dark' : 'light';
}

export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as any;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) {
    return true;
  }
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) {
    return true;
  }
  return false;
}

export function resolveEffectiveEffects(setting: VisualEffectsSetting = 'auto'): 'high' | 'low' {
  if (setting === 'low') return 'low';
  if (setting === 'high') return 'high';
  // 'auto': check prefers-reduced-motion or low-end hardware
  if (isReducedMotionPreferred() || isLowEndDevice()) {
    return 'low';
  }
  return 'high';
}

export function getStoredUISettings(): UISettings {
  try {
    // Clean up old theme key safely if present
    if (localStorage.getItem(LEGACY_THEME_KEY)) {
      localStorage.removeItem(LEGACY_THEME_KEY);
    }

    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure themeMode is valid ('auto', 'dark', or 'light')
      let themeMode: ThemeMode = 'auto';
      if (parsed.themeMode === 'dark' || parsed.themeMode === 'light' || parsed.themeMode === 'auto') {
        themeMode = parsed.themeMode;
      } else if (parsed.isLightMode !== undefined) {
        themeMode = parsed.isLightMode ? 'light' : 'dark';
      }

      return {
        ...DEFAULT_UI_SETTINGS,
        ...parsed,
        themeMode,
      };
    }
  } catch (e) {
    console.warn('Error reading stored UI settings:', e);
  }
  return DEFAULT_UI_SETTINGS;
}

export function getEffectiveVisualEffects(): 'high' | 'low' {
  const current = getStoredUISettings();
  return resolveEffectiveEffects(current.visualEffects);
}

export function getEffectiveTheme(): 'dark' | 'light' {
  const current = getStoredUISettings();
  return resolveEffectiveTheme(current.themeMode);
}

export function saveStoredUISettings(settings: UISettings): void {
  try {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
    applyUISettingsToDOM(settings);
    window.dispatchEvent(new CustomEvent('app-ui-settings-changed', { detail: settings }));
  } catch (e) {
    console.warn('Error saving UI settings:', e);
  }
}

export function applyUISettingsToDOM(settings: UISettings): void {
  const root = document.documentElement;
  const body = document.body;

  // Visual Effects Mode
  const effectiveEffects = resolveEffectiveEffects(settings.visualEffects);
  root.setAttribute('data-effects-setting', settings.visualEffects || 'auto');
  root.setAttribute('data-effects', effectiveEffects);
  if (body) {
    body.setAttribute('data-effects', effectiveEffects);
  }

  // Glass blur level
  root.setAttribute('data-glass-blur', settings.glassBlur || 'balanced');

  // Accent color
  root.setAttribute('data-accent', settings.accentColor || 'purple');

  // Layout density
  root.setAttribute('data-density', settings.layoutDensity || 'comfortable');

  // Theme resolution (Dark or Light)
  const effectiveTheme = resolveEffectiveTheme(settings.themeMode || 'auto');
  root.setAttribute('data-theme', effectiveTheme);
  root.style.colorScheme = effectiveTheme;
  if (effectiveTheme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    if (body) {
      body.setAttribute('data-theme', 'light');
      body.classList.remove('dark');
      body.classList.add('light');
      body.style.colorScheme = 'light';
    }
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    if (body) {
      body.setAttribute('data-theme', 'dark');
      body.classList.remove('light');
      body.classList.add('dark');
      body.style.colorScheme = 'dark';
    }
  }
}

/**
 * Hook to reactively subscribe to effective visual effects changes
 */
export function useVisualEffects(): 'high' | 'low' {
  const [effects, setEffects] = React.useState<'high' | 'low'>(getEffectiveVisualEffects);

  React.useEffect(() => {
    // Initial DOM synchronization
    applyUISettingsToDOM(getStoredUISettings());

    const handleUpdate = () => {
      setEffects(getEffectiveVisualEffects());
    };

    window.addEventListener('app-ui-settings-changed', handleUpdate);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleUpdate);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleUpdate);
    }

    return () => {
      window.removeEventListener('app-ui-settings-changed', handleUpdate);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleUpdate);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleUpdate);
      }
    };
  }, []);

  return effects;
}

/**
 * Hook to reactively subscribe to effective theme ('dark' | 'light') changes
 */
export function useEffectiveTheme(): 'dark' | 'light' {
  const [theme, setTheme] = React.useState<'dark' | 'light'>(getEffectiveTheme);

  React.useEffect(() => {
    applyUISettingsToDOM(getStoredUISettings());

    const handleUpdate = () => {
      setTheme(getEffectiveTheme());
    };

    window.addEventListener('app-ui-settings-changed', handleUpdate);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleUpdate);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleUpdate);
    }

    return () => {
      window.removeEventListener('app-ui-settings-changed', handleUpdate);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleUpdate);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleUpdate);
      }
    };
  }, []);

  return theme;
}
