import { BrowserWindow, dialog, ipcMain } from 'electron';
import { ytDlpService } from '../services/YtDlpService';
import { downloadQueueService } from '../services/DownloadQueueService';
import { downloadService } from '../services/DownloadService';
import { ffmpegService } from '../services/FfmpegService';
import { settingsService } from '../services/SettingsService';
import { historyService } from '../services/HistoryService';
import { DownloadSelection } from '../../shared/models/DownloadSelection';
import { DownloadHistoryItem } from '../../shared/models/DownloadHistoryItem';

function broadcast(channel: string, payload: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload);
  }
}

export function registerDownloaderIpc(): void {
  downloadQueueService.registerCallbacks({
    onProgress: (event) => broadcast('downloader:ytdlp:progress', event),
    onCompleted: (event) => broadcast('downloader:ytdlp:completed', event),
    onCancelled: (event) => broadcast('downloader:ytdlp:cancelled', event),
    onFailed: (event) => broadcast('downloader:ytdlp:failed', event),
  });

  ipcMain.handle('downloader:dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('downloader:ytdlp:getVersion', () => {
    return ytDlpService.getVersion();
  });

  ipcMain.handle('downloader:ytdlp:getVideoInfo', (_event, url: string) => {
    return ytDlpService.getVideoInfo(url);
  });

  ipcMain.handle('downloader:ytdlp:getPlaylistInfo', (_event, url: string) => {
    return ytDlpService.getPlaylistInfo(url);
  });

  ipcMain.handle(
    'downloader:ytdlp:queue:start',
    (_event, selections: DownloadSelection[]) => {
      downloadQueueService.start(selections);
    },
  );

  ipcMain.handle('downloader:ytdlp:cancel', (_event, downloadId: string) => {
    downloadService.cancel(downloadId);
  });

  ipcMain.handle('downloader:ffmpeg:getVersion', () => {
    return ffmpegService.getVersion();
  });

  ipcMain.handle('downloader:ffmpeg:getProbeVersion', () => {
    return ffmpegService.getProbeVersion();
  });

  ipcMain.handle('downloader:settings:get', () => {
    return settingsService.get();
  });

  ipcMain.handle(
    'downloader:settings:setOutputFolder',
    (_event, outputFolder: string) => {
      settingsService.setOutputFolder(outputFolder);
    },
  );

  ipcMain.handle('downloader:history:get', async () => {
    return historyService.getAll();
  });

  ipcMain.handle(
    'downloader:history:add',
    async (_event, item: DownloadHistoryItem) => {
      await historyService.add(item);
    },
  );

  ipcMain.handle('downloader:history:clear', async () => {
    await historyService.clear();
  });

  ipcMain.handle('downloader:history:remove', async (_event, id: string) => {
    await historyService.remove(id);
  });
}
