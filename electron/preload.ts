import { contextBridge, ipcRenderer } from 'electron';
import {
  DownloadProgressEvent,
  DownloadCancelledEvent,
  DownloadCompletedEvent,
  DownloadFailedEvent,
} from './types/DownloadProgressEvent';
import { VideoFile } from './shared/types';
import { DownloadSelection } from '../shared/models/DownloadSelection';
import { DownloadHistoryItem } from '../shared/models/DownloadHistoryItem';
import { ThemeSetting } from '@/shared/models/ThemeSettings';

function subscribe<T>(
  channel: string,
  callback: (event: T) => void,
): () => void {
  const listener = (_event: Electron.IpcRendererEvent, event: T) => {
    callback(event);
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),

    setOutputFolder: (outputFolder: string) =>
      ipcRenderer.invoke('settings:setOutputFolder', outputFolder),

    getTheme: () => ipcRenderer.invoke('settings:getTheme'),

    setTheme: (theme: ThemeSetting) =>
      ipcRenderer.invoke('settings:setTheme', theme),

    onSystemThemeChange: (callback: (theme: 'light' | 'dark') => void) => {
      return subscribe('system-theme-changed', callback);
    },
  },

  downloader: {
    dialog: {
      selectFolder: () => ipcRenderer.invoke('downloader:dialog:selectFolder'),
    },

    ytdlp: {
      getVersion: () => ipcRenderer.invoke('downloader:ytdlp:getVersion'),

      getVideoInfo: (url: string) =>
        ipcRenderer.invoke('downloader:ytdlp:getVideoInfo', url),

      getPlaylistInfo: (url: string) =>
        ipcRenderer.invoke('downloader:ytdlp:getPlaylistInfo', url),

      download: (selection: DownloadSelection) =>
        ipcRenderer.invoke('downloader:ytdlp:download', selection),

      startQueue: (selections: DownloadSelection[]) =>
        ipcRenderer.invoke('downloader:ytdlp:queue:start', selections),

      cancel: (downloadId: string) =>
        ipcRenderer.invoke('downloader:ytdlp:cancel', downloadId),

      onProgress: (callback: (progress: DownloadProgressEvent) => void) =>
        subscribe('downloader:ytdlp:progress', callback),

      onCompleted: (callback: (event: DownloadCompletedEvent) => void) =>
        subscribe('downloader:ytdlp:completed', callback),

      onCancelled: (callback: (event: DownloadCancelledEvent) => void) =>
        subscribe('downloader:ytdlp:cancelled', callback),

      onFailed: (callback: (event: DownloadFailedEvent) => void) =>
        subscribe('downloader:ytdlp:failed', callback),
    },

    ffmpeg: {
      getVersion: () => ipcRenderer.invoke('downloader:ffmpeg:getVersion'),

      getProbeVersion: () =>
        ipcRenderer.invoke('downloader:ffmpeg:getProbeVersion'),
    },

    // settings: {
    //   get: () => ipcRenderer.invoke('downloader:settings:get'),
    //   setOutputFolder: (outputFolder: string) =>
    //     ipcRenderer.invoke('downloader:settings:setOutputFolder', outputFolder),
    // },

    history: {
      get: () => ipcRenderer.invoke('downloader:history:get'),
      add: (item: DownloadHistoryItem) =>
        ipcRenderer.invoke('downloader:history:add', item),
      remove: (id: string) => ipcRenderer.invoke('history:remove', id),
      clear: () => ipcRenderer.invoke('history:clear'),
    },
  },

  editor: {
    dialog: {
      openVideo: () =>
        ipcRenderer.invoke(
          'editor:dialog:openVideo',
        ) as Promise<VideoFile | null>,
      // saveVideo: () =>
      //   ipcRenderer.invoke('editor:dialog:saveVideo' as Promise<string | null>),
    },

    media: {
      registerFile: (filePath: string) =>
        ipcRenderer.invoke(
          'editor:media:registerFile',
          filePath,
        ) as Promise<VideoFile>,
    },

    ffmpeg: {
      trim: (
        videoId: string,
        inPoint: number,
        outPoint: number,
        settings: {
          mode: 'copy' | 'recode';
          speed: number;
          quality: number;
          noAudio: boolean;
        },
      ) =>
        ipcRenderer.invoke(
          'editor:ffmpeg:trim',
          videoId,
          inPoint,
          outPoint,
          settings,
        ) as Promise<string | null>,

      concat: (
        clips: { videoId: string; inPoint: number; outPoint: number }[],
        noAudio: boolean,
      ) =>
        ipcRenderer.invoke('editor:ffmpeg:concat', clips, noAudio) as Promise<
          string | null
        >,

      thumbnail: (videoId: string) =>
        ipcRenderer.invoke(
          'editor:ffmpeg:thumbnail',
          videoId,
        ) as Promise<string>,

      onProgress: (callback: (percent: number) => void) => {
        const handler = (
          _event: Electron.IpcRendererEvent,
          percent: number,
        ) => {
          callback(percent);
        };

        ipcRenderer.on('editor:ffmpeg:progress', handler);

        return () => {
          ipcRenderer.removeListener('editor:ffmpeg:editor:progress', handler);
        };
      },
    },
  },
});
