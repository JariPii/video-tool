import { ThemeSetting } from '@/shared/models/ThemeSettings';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';

export function useAppTheme() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const setAppTheme = useCallback(
    async (newTheme: ThemeSetting) => {
      if (theme === newTheme) {
        return;
      }

      await window.electron.settings.setTheme(newTheme);

      setTheme(newTheme);
    },
    [theme, setTheme],
  );

  return {
    theme: theme as ThemeSetting,
    resolvedTheme,
    setAppTheme,
  };
}
