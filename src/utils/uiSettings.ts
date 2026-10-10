export type GlassBlurLevel = 'heavy' | 'balanced' | 'subtle';
export type AccentColor = 'indigo' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple';
export type LayoutDensity = 'comfortable' | 'compact';
export type DashboardViewMode = 'full' | 'calendar' | 'charts';

export interface UISettings {
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
