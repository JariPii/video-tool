import { registerAppIpc } from './app';
import { logService } from '../services/LogService';
import { LogCategory } from '../enums/LogCategory';
import { registerDownloaderIpc } from './downloader';
import { registerEditorIpc } from './editor';

export function registerIpc(): void {
  logService.info(LogCategory.App, 'Registering IPC handlers');

  registerAppIpc();
  registerDownloaderIpc();
  registerEditorIpc();

  logService.info(LogCategory.App, 'IPC handlers registered');
}
