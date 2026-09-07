import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * ThemeProvider
 * -------------
 * Three modes:
 *  - 'dark'   → forces dark (slate-950 base, emerald accents)
 *  - 'light'  → forces light (slate-50 base, emerald-600 accents)
 *  - 'system' → follows prefers-color-scheme
 *
 * Persistence: localStorage key = 'jstu-theme'
 * Bootstrapping: applies the saved theme BEFORE React mounts via an
 * inline <script> in index.html (see ThemeBootstrap). This prevents
 * the white flash when a dark-mode user reloads.
 *
 * Tailwind v4: drives `dark:` via the `.dark` class on <html>.
 */

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: 'dark' | 'light'; // what is actually applied
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'jstu-theme';

function getSystemPref(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function readSavedMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
  // The app is designed light-first; dark is opt-in.
  return 'light';
}

function applyTheme(resolved: 'dark' | 'light') {
  const root = document.documentElement;
  if (resolved === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  // Helps native UI (form controls, scrollbars) match.
  root.style.colorScheme = resolved;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<ThemeMode>(() => readSavedMode());

  const resolvedTheme: 'dark' | 'light' =
    mode === 'system' ? getSystemPref() : mode;

  // Apply the class whenever the resolved theme changes.
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // React to OS preference changes when in 'system' mode.
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(getSystemPref());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    // Cycles: dark → light → system → dark
    const next: ThemeMode =
      mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark';
    setMode(next);
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}

/**
 * Inline <script> to inject before React mounts. Stops the white flash
 * on reload for dark-mode users. Mount via React 19's
 * `<script>` tag, or drop the raw HTML in index.html.
 */
export const ThemeBootstrapScript: React.FC = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
(function(){try{
  var k='jstu-theme';
  var saved=localStorage.getItem(k);
  var m=(saved==='dark'||saved==='light'||saved==='system')?saved:'dark';
  var resolved=(m==='system')
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')
    : m;
  if(resolved==='dark'){document.documentElement.classList.add('dark');}
  else{document.documentElement.classList.remove('dark');}
  document.documentElement.style.colorScheme=resolved;
}catch(e){}})();
      `.trim(),
    }}
  />
);

export default ThemeProvider;
