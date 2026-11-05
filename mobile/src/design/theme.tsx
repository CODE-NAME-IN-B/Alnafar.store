/**
 * theme.tsx — مزوّد السمة (ThemeProvider) + استهلاك الرموز
 *
 * - الثلاثة أنماط معتمدة من PLAN §3: فاتح / داكن / النظام (النظام هو الافتراضي).
 * - الحفظ عبر lib/storage (نفس أسلوب stores/app.ts) — قيمة بسيطة لا تستحق SecureStore.
 * - نفس أسماء الرموز في الثيمين؛ الشاشات لا ترى سوى Palette.
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { jsonGet, jsonSet } from '../lib/storage';
import { DARK, LIGHT, type Palette } from './tokens';

export type ThemeModeName = 'light' | 'dark' | 'system';

const THEME_KEY = 'themeMode';

interface ThemeState {
  mode: ThemeModeName;
  setMode: (mode: ThemeModeName) => void;
  hydrate: () => Promise<void>;
}

export const useThemeMode = create<ThemeState>((set) => ({
  mode: 'system',
  setMode: (mode) => {
    void jsonSet(THEME_KEY, mode);
    set({ mode });
  },
  hydrate: async () => {
    const saved = await jsonGet<ThemeModeName | null>(THEME_KEY, null);
    const mode: ThemeModeName =
      saved === 'light' || saved === 'dark' ? saved : 'system';
    set({ mode });
  },
}));

const ThemeCtx = createContext<Palette>(LIGHT);
const ThemeNameCtx = createContext<'light' | 'dark'>('light');

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeMode((s) => s.mode);
  const system = useColorScheme();

  useEffect(() => {
    void useThemeMode.getState().hydrate();
  }, []);

  const resolved: 'light' | 'dark' =
    mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const palette = useMemo(
    () => (resolved === 'dark' ? DARK : LIGHT),
    [resolved],
  );

  return (
    <ThemeCtx.Provider value={palette}>
      <ThemeNameCtx.Provider value={resolved}>{children}</ThemeNameCtx.Provider>
    </ThemeCtx.Provider>
  );
}

/** الرموز الدلالية للثيم الحالي — هذا هو المدخل الوحيد للألوان في الشاشات */
export const usePalette = () => useContext(ThemeCtx);

/** اسم الثيم المحلول (لأيقونات/غلاف صور/سلوكيات تحسم بالسمة) */
export const useThemeName = () => useContext(ThemeNameCtx);
