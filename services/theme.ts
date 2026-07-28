import { UISettings } from '../types';

export const FONT_SIZES = [
  { label: 'Tiny', value: 13, desc: '13px • Ultra-dense statutory view' },
  { label: 'Compact', value: 14, desc: '14px • High data density' },
  { label: 'Balanced', value: 15, desc: '15px • Comfortable balance' },
  { label: 'Standard', value: 16, desc: '16px • Default studio size' },
  { label: 'Medium Plus', value: 17, desc: '17px • Enhanced legibility' },
  { label: 'Large', value: 18, desc: '18px • Spacious high-clarity' },
  { label: 'Extra Large', value: 20, desc: '20px • Maximum accessibility' },
  { label: 'Ultra Large', value: 22, desc: '22px • Ultra-large presentation' }
];

export const FONT_STYLES = [
  { id: 'sans', name: 'Modern Sans', fontClass: 'app-font-sans', family: 'ui-sans-serif, system-ui, sans-serif', sample: 'Clientify Practice Vault' },
  { id: 'serif', name: 'Executive Serif', fontClass: 'app-font-serif', family: 'ui-serif, Georgia, serif', sample: 'Clientify Practice Vault' },
  { id: 'mono', name: 'Statutory Mono', fontClass: 'app-font-mono', family: '"JetBrains Mono", monospace', sample: 'Clientify Practice Vault' },
  { id: 'rounded', name: 'Soft Rounded', fontClass: 'app-font-rounded', family: 'system-ui, "Quicksand", sans-serif', sample: 'Clientify Practice Vault' },
  { id: 'condensed', name: 'Compact Narrow', fontClass: 'app-font-condensed', family: '"Arial Narrow", "Roboto Condensed", sans-serif', sample: 'Clientify Practice Vault' },
  { id: 'slab', name: 'Slab Authoritative', fontClass: 'app-font-slab', family: '"Rockwell", Georgia, serif', sample: 'Clientify Practice Vault' }
] as const;

export const THEME_COLORS = [
  { id: 'indigo', name: 'Royal Indigo', primary: '#4f46e5', hover: '#4338ca', light: '#e0e7ff', text: '#4f46e5', ring: 'rgba(79, 70, 229, 0.25)', badgeBg: 'bg-indigo-600' },
  { id: 'emerald', name: 'Emerald Firm', primary: '#059669', hover: '#047857', light: '#d1fae5', text: '#059669', ring: 'rgba(5, 150, 105, 0.25)', badgeBg: 'bg-emerald-600' },
  { id: 'blue', name: 'Ocean Cobalt', primary: '#0284c7', hover: '#0369a1', light: '#e0f2fe', text: '#0284c7', ring: 'rgba(2, 132, 199, 0.25)', badgeBg: 'bg-sky-600' },
  { id: 'violet', name: 'Deep Violet', primary: '#7c3aed', hover: '#6d28d9', light: '#ede9fe', text: '#7c3aed', ring: 'rgba(124, 58, 237, 0.25)', badgeBg: 'bg-violet-600' },
  { id: 'slate', name: 'Corporate Slate', primary: '#334155', hover: '#1e293b', light: '#f1f5f9', text: '#334155', ring: 'rgba(51, 65, 85, 0.25)', badgeBg: 'bg-slate-700' },
  { id: 'amber', name: 'Warm Amber', primary: '#d97706', hover: '#b45309', light: '#fef3c7', text: '#d97706', ring: 'rgba(217, 119, 6, 0.25)', badgeBg: 'bg-amber-600' },
  { id: 'rose', name: 'Crimson Rose', primary: '#e11d48', hover: '#be123c', light: '#ffe4e6', text: '#e11d48', ring: 'rgba(225, 29, 72, 0.25)', badgeBg: 'bg-rose-600' },
  { id: 'teal', name: 'Teal Precision', primary: '#0d9488', hover: '#0f766e', light: '#ccfbf1', text: '#0d9488', ring: 'rgba(13, 148, 136, 0.25)', badgeBg: 'bg-teal-600' }
] as const;

export const THEME_MODES = [
  { id: 'light', name: 'Clean Studio Light', bg: '#fcfdfe', text: '#0f172a', cardBg: '#ffffff', desc: 'Crisp, high-contrast studio light theme' },
  { id: 'parchment', name: 'Parchment Executive', bg: '#faf8f5', text: '#1c1917', cardBg: '#f3efe6', desc: 'Soft paper tone designed for prolonged reading' },
  { id: 'dark', name: 'Midnight Dark', bg: '#090d16', text: '#f1f5f9', cardBg: '#111827', desc: 'Sleek dark canvas for night focus' }
] as const;

export const DEFAULT_UI_SETTINGS: UISettings = {
  fontSize: 16,
  fontStyle: 'sans',
  themeColor: 'indigo',
  themeMode: 'light',
  compactMode: false
};

export function getStoredUiSettings(): UISettings {
  try {
    const saved = localStorage.getItem('clientify_ui_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_UI_SETTINGS, ...parsed };
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_UI_SETTINGS;
}

export function applyUiSettings(settings: Partial<UISettings>): UISettings {
  const current = getStoredUiSettings();
  const finalSettings: UISettings = { ...current, ...settings };

  try {
    localStorage.setItem('clientify_ui_settings', JSON.stringify(finalSettings));
  } catch (e) {
    // ignore
  }

  if (typeof document !== 'undefined') {
    // 1. Apply font size
    document.documentElement.style.setProperty('--ui-font-size', `${finalSettings.fontSize}px`);

    // 2. Apply font style
    FONT_STYLES.forEach(s => {
      document.body.classList.remove(`app-font-${s.id}`);
    });
    document.body.classList.add(`app-font-${finalSettings.fontStyle}`);

    // 3. Apply theme color
    THEME_COLORS.forEach(c => {
      document.documentElement.classList.remove(`theme-color-${c.id}`);
    });
    document.documentElement.classList.add(`theme-color-${finalSettings.themeColor}`);

    const activeColorObj = THEME_COLORS.find(c => c.id === finalSettings.themeColor) || THEME_COLORS[0];
    document.documentElement.style.setProperty('--app-primary', activeColorObj.primary);
    document.documentElement.style.setProperty('--app-primary-hover', activeColorObj.hover);
    document.documentElement.style.setProperty('--app-primary-light', activeColorObj.light);
    document.documentElement.style.setProperty('--app-primary-text', activeColorObj.text);
    document.documentElement.style.setProperty('--app-primary-ring', activeColorObj.ring);

    // 4. Apply theme mode
    THEME_MODES.forEach(m => {
      document.documentElement.classList.remove(`theme-mode-${m.id}`);
    });
    document.documentElement.classList.add(`theme-mode-${finalSettings.themeMode}`);

    const activeModeObj = THEME_MODES.find(m => m.id === finalSettings.themeMode) || THEME_MODES[0];
    document.documentElement.style.setProperty('--app-bg', activeModeObj.bg);
    document.documentElement.style.setProperty('--app-text', activeModeObj.text);
    document.documentElement.style.setProperty('--app-card-bg', activeModeObj.cardBg);

    // Broadcast change
    window.dispatchEvent(new CustomEvent('clientify_ui_settings_changed', { detail: finalSettings }));
  }

  return finalSettings;
}
