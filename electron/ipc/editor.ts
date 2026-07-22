import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as dialogService from '../services/dialog.service';
import { mediaRegistry } from '../media/media.registry';
import path from 'node:path';
import { mediaServer } from '../media/media.sever';
import * as ffmpegService from '../services/ffmpeg.editor.service';
import { VideoFile } from '../shared/types';

export function registerEditorIpc(): void {
  ipcMain.handle('editor:dialog:openVideo', dialogService.openVideo);
  ipcMain.handle('editor:dialog:saveVideo', dialogService.saveVideo);

  ipcMain.handle(
    'editor:media:registerFile',
    (_event, filePath: string): VideoFile => {
      const id = mediaRegistry.register(filePath);
      return {
        id,
        name: path.basename(filePath),
        url: mediaServer.mediaUrl(id),
      };
    },
  );

  ipcMain.handle(
    'editor:ffmpeg:trim',
    async (
      event: IpcMainInvokeEvent,
      videoId: string,
      inPoint: number,
      outPoint: number,
      settings: {
        mode: 'copy' | 'recode';
        speed: number;
        quality: number;
        noAudio: boolean;
        encoder?: 'cpu' | 'gpu';
        interpolate?: boolean;
        fps?: number;
        resolution?: string;
      },
    ) => {
      const inputPath = mediaRegistry.resolve(videoId);

      if (!inputPath) {
        throw new Error(`No file found with id: ${videoId}`);
      }

      const outputPath = await dialogService.saveVideo();

      if (!outputPath) {
        return null;
      }

      await ffmpegService.trimVideo({
        inputPath,
        outputPath,
        inPoint,
        outPoint,
        ...settings,
        onProgress: (percent) => {
          if (!event.sender.isDestroyed()) {
            event.sender.send('editor:ffmpeg:progress', percent);
          }
        },
      });

      return outputPath;
    },
  );

  ipcMain.handle(
    'editor:ffmpeg:concat',
    async (
      event: IpcMainInvokeEvent,
      clipIds: {
        videoId: string;
        inPoint: number;
        outPoint: number;
      }[],
      noAudio: boolean,
    ) => {
      const clips = clipIds.map((c) => {
        const inputPath = mediaRegistry.resolve(c.videoId);
        if (!inputPath) throw new Error(`No file found for id ${c.videoId}`);
        return { inputPath, inPoint: c.inPoint, outPoint: c.outPoint };
      });

      const outputPath = await dialogService.saveVideo();
      if (!outputPath) return null;

      await ffmpegService.concatClips({
        clips,
        outputPath,
        noAudio,
        onProgress: (percent) => {
          if (!event.sender.isDestroyed()) {
            event.sender.send('editor:ffmepg:progress', percent);
          }
        },
      });

      return outputPath;
    },
  );

  ipcMain.handle(
    'editor:ffmpeg:thumbnail',
    async (_event: IpcMainInvokeEvent, videoId: string) => {
      const inputPath = mediaRegistry.resolve(videoId);

      if (!inputPath) throw new Error(`No file found for id ${videoId}`);

      return ffmpegService.extractThumbnail(inputPath);
    },
  );
}
