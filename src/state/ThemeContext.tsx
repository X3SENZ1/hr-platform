import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ThemeName, ThemePreference } from '../types';

const THEME_KEY = 'osnova_theme_preference';
const ACCENT_KEY = 'osnova_accent_color';
export const DEFAULT_ACCENT = '#1d4ed8';
export const ACCENT_PRESETS = ['#1d4ed8', '#0f766e', '#7c3aed', '#be123c', '#b45309'];

interface ThemeContextValue {
  preference: ThemePreference;
  theme: ThemeName;
  accent: string;
  setPreference: (preference: ThemePreference) => void;
  setAccent: (accent: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
}

function channelToHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

export function shiftHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `#${channelToHex(r + amount)}${channelToHex(g + amount)}${channelToHex(b + amount)}`;
}

export function contrastOn(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.52 ? '#111827' : '#ffffff';
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'contrast' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage can be unavailable in private mode.
  }
  return 'system';
}

function readAccent(): string {
  try {
    const stored = localStorage.getItem(ACCENT_KEY);
    if (stored && /^#[0-9a-fA-F]{6}$/.test(stored)) return stored;
  } catch {
    // Ignore storage errors.
  }
  return DEFAULT_ACCENT;
}

function getSystemTheme(): ThemeName {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeName, accent: string) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-rgb', hexToRgb(accent).join(', '));
  root.style.setProperty('--accent-hover', shiftHex(accent, theme === 'dark' ? 24 : -24));
  root.style.setProperty('--accent-contrast', contrastOn(accent));
  root.style.setProperty('--accent-soft', `rgba(${hexToRgb(accent).join(', ')}, 0.12)`);
  root.style.setProperty('--accent-border', `rgba(${hexToRgb(accent).join(', ')}, 0.38)`);
  root.style.setProperty(
    '--accent-text',
    theme === 'light' ? accent : shiftHex(accent, theme === 'contrast' ? 150 : 110),
  );

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content =
      theme === 'light' ? '#f4f5f7' : theme === 'dark' ? '#0b1120' : '#000000';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [accent, setAccentState] = useState<string>(readAccent);
  const [systemTheme, setSystemTheme] = useState<ThemeName>(getSystemTheme);

  const theme: ThemeName = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    applyTheme(theme, accent);
  }, [theme, accent]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };
    setSystemTheme(media.matches ? 'dark' : 'light');
    if (preference === 'system') {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
    return undefined;
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const setAccent = useCallback((next: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(next)) return;
    setAccentState(next.toLowerCase());
    try {
      localStorage.setItem(ACCENT_KEY, next.toLowerCase());
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const value = useMemo(
    () => ({ preference, theme, accent, setPreference, setAccent }),
    [preference, theme, accent, setPreference, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
