import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { logService } from './LogService';
import { LogLevel } from '../enums/LogLevel';
import { LogCategory } from '../enums/LogCategory';
import { ThemeSetting } from '@/shared/models/ThemeSettings';

export interface AppSettings {
  outputFolder: string;
  theme: ThemeSetting;
}

export class SettingsService {
  private readonly settingsPath = path.join(
    app.getPath('userData'),
    'settings.json',
  );

  public get(): AppSettings {
    if (!existsSync(this.settingsPath)) {
      const settings = this.getDefaultSettings();

      this.set(settings);

      logService.log(
        LogLevel.Info,
        LogCategory.Settings,
        'Using default settings',
        {
          settingsPath: this.settingsPath,
          outputFolder: settings.outputFolder,
          theme: settings.theme,
        },
      );

      return settings;
    }
    try {
      const json = readFileSync(this.settingsPath, 'utf-8');

      return {
        ...this.getDefaultSettings(),
        ...JSON.parse(json),
      };
    } catch (error) {
      logService.log(
        LogLevel.Error,
        LogCategory.Settings,
        'Failed to read settings. Using defaults.',
        {
          error,
          settingsPath: this.settingsPath,
        },
      );

      const settings = this.getDefaultSettings();

      this.set(settings);

      return settings;
    }
  }

  public set(settings: AppSettings): void {
    const directory = path.dirname(this.settingsPath);

    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    logService.log(LogLevel.Info, LogCategory.Settings, 'Settings saved', {
      outputFolder: settings.outputFolder,
      theme: settings.theme,
    });
  }

  public update(partial: Partial<AppSettings>): void {
    const settings = this.get();

    this.set({
      ...settings,
      ...partial,
    });
  }

  public setOutputFolder(outputFolder: string): void {
    this.update({ outputFolder });
  }

  public getTheme(): ThemeSetting {
    return this.get().theme;
  }

  public setTheme(theme: ThemeSetting): void {
    this.update({ theme });
  }

  private getDefaultSettings(): AppSettings {
    return {
      outputFolder: app.getPath('downloads'),
      theme: 'system',
    };
  }
}

export const settingsService = new SettingsService();
