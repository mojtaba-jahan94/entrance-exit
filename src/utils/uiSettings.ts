import React from 'react';

export type GlassBlurLevel = 'heavy' | 'balanced' | 'subtle';
export type AccentColor = 'indigo' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple';
export type LayoutDensity = 'comfortable' | 'compact';
export type DashboardViewMode = 'full' | 'calendar' | 'charts';
export type VisualEffectsSetting = 'auto' | 'high' | 'low';

export interface UISettings {
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
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_UI_SETTINGS,
        ...parsed,
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
  root.setAttribute('data-glass-blur', settings.glassBlur);

  // Accent color
  root.setAttribute('data-accent', settings.accentColor);

  // Layout density
  root.setAttribute('data-density', settings.layoutDensity);

  // Theme (Dark or Light)
  if (settings.isLightMode) {
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark');
    root.classList.add('light');
    if (body) {
      body.setAttribute('data-theme', 'light');
      body.classList.remove('dark');
      body.classList.add('light');
    }
  } else {
    root.setAttribute('data-theme', 'dark');
    root.classList.remove('light');
    root.classList.add('dark');
    if (body) {
      body.setAttribute('data-theme', 'dark');
      body.classList.remove('light');
      body.classList.add('dark');
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
