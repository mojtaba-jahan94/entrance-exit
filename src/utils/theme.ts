export type AppTheme = 'obsidian' | 'emerald' | 'sunset' | 'espresso' | 'light';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  persianName: string;
  description: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  isDark: boolean;
}

export const APP_THEMES: ThemeConfig[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Aurora',
    persianName: 'شفق نوکتورن (پیش‌فرض)',
    description: 'تم لوکس تیره با هاله‌های سرمه‌ای و اکسنت‌های فیروزه‌ای و نیلی',
    previewBg: '#090b14',
    previewCard: '#121526',
    previewAccent: '#6366f1',
    isDark: true,
  },
  {
    id: 'emerald',
    name: 'Nordic Forest',
    persianName: 'زمرد نوردیک',
    description: 'تم آرامش‌بخش جنگلی با رنگ سبز زمردی و نعنایی متالیک',
    previewBg: '#06130d',
    previewCard: '#0d1e16',
    previewAccent: '#10b981',
    isDark: true,
  },
  {
    id: 'sunset',
    name: 'Cyber Sunset',
    persianName: 'غروب سایبر',
    description: 'تم نئونی و پرانرژی با گرادیان نارنجی و بنفش مخملی',
    previewBg: '#120b10',
    previewCard: '#1d121b',
    previewAccent: '#f97316',
    isDark: true,
  },
  {
    id: 'espresso',
    name: 'Warm Espresso',
    persianName: 'اسپرسو و کهربا',
    description: 'تم گرم چوب و قهوه با هایلایت‌های کهربایی کلاسیک',
    previewBg: '#120d09',
    previewCard: '#1c1510',
    previewAccent: '#f59e0b',
    isDark: true,
  },
  {
    id: 'light',
    name: 'Alabaster Light',
    persianName: 'سفید عاجی و اداری',
    description: 'تم روشن مدرن و شفاف، مناسب برای محیط‌های پرنور اداری',
    previewBg: '#f8fafc',
    previewCard: '#ffffff',
    previewAccent: '#4f46e5',
    isDark: false,
  },
];

const THEME_STORAGE_KEY = 'entrance_exit_app_theme';

export function getStoredTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && APP_THEMES.some((t) => t.id === saved)) {
      return saved as AppTheme;
    }
  } catch {
    // Ignore storage errors
  }
  return 'obsidian';
}

export function saveStoredTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyThemeToDOM(theme);
  } catch {
    // Ignore storage errors
  }
}

export function applyThemeToDOM(theme: AppTheme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (document.body) {
    document.body.setAttribute('data-theme', theme);
  }
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.setAttribute('data-theme', theme);
  }
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    if (document.body) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    if (document.body) {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
  }
}
