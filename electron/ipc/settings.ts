import { ipcMain, nativeTheme } from 'electron';
import { settingsService } from '../services/SettingsService';
import { ThemeSetting } from '@/shared/models/ThemeSettings';

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => {
    return settingsService.get();
  });

  ipcMain.handle('settings:setOutputFolder', (_event, outputFolder: string) => {
    settingsService.setOutputFolder(outputFolder);
  });

  ipcMain.handle('settings:getTheme', () => {
    return settingsService.getTheme();
  });

  ipcMain.handle('settings:setTheme', (_event, theme: ThemeSetting) => {
    nativeTheme.themeSource = theme;

    settingsService.setTheme(theme);

    return settingsService.getTheme();
  });
}
