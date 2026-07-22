// import { BrowserWindow, ipcMain } from 'electron';
// import { ytDlpService } from '../services/YtDlpService';
// import { downloadService } from '../services/DownloadService';
// import { DownloadSelection } from '../../shared/models/DownloadSelection';
// import { progressService } from '../services/ProgressService';
// import {
//   DownloadFailedEvent,
//   DownloadProgressEvent,
// } from '../types/DownloadProgressEvent';
// import { downloadQueueService } from '../services/DownloadQueueService';

// function broadcast(channel: string, payload: unknown): void {
//   for (const window of BrowserWindow.getAllWindows()) {
//     window.webContents.send(channel, payload);
//   }
// }

// export function registerYtDlpIpc(): void {
//   downloadQueueService.registerCallbacks({
//     onProgress: (event) => broadcast('ytdlp:progress', event),
//     onCompleted: (event) => broadcast('ytdlp:completed', event),
//     onCancelled: (event) => broadcast('ytdlp:cancelled', event),
//     onFailed: (event) => broadcast('ytdlp:failed', event),
//   });

//   ipcMain.handle('ytdlp:getVersion', () => {
//     return ytDlpService.getVersion();
//   });

//   ipcMain.handle('ytdlp:getVideoInfo', (_event, url: string) => {
//     return ytDlpService.getVideoInfo(url);
//   });

//   ipcMain.handle('ytdlp:getPlaylistInfo', (_event, url: string) => {
//     return ytDlpService.getPlaylistInfo(url);
//   });

//   ipcMain.handle(
//     'ytdlp:queue:start',
//     (_event, selections: DownloadSelection[]) => {
//       downloadQueueService.start(selections);
//     },
//   );

//   ipcMain.handle('ytdlp:cancel', (_event, downloadId: string) => {
//     downloadService.cancel(downloadId);
//   });
// }
