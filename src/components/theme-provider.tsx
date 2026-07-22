'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import React, { useEffect } from 'react';

type Props = {
  children: React.ReactNode;
};

function ThemeSync() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    async function initializeTheme() {
      const savedTheme = await window.electron.settings.getTheme();

      if (!cancelled && savedTheme !== theme) {
        setTheme(savedTheme);
      }
    }

    initializeTheme();

    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  useEffect(() => {
    const unsubscribe = window.electron.settings.onSystemThemeChange(() => {
      if (theme === 'system') {
        setTheme('system');
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [theme, setTheme]);
  return null;
}

const ThemeProvider = ({ children }: Props) => {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
