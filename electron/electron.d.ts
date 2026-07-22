import { DownloadResult } from '@/electron/services/DownloadService';
import {
  DownloadCancelledEvent,
  DownloadCompletedEvent,
  DownloadFailedEvent,
  DownloadProgressEvent,
} from '@/electron/types/DownloadProgressEvent';
import { DownloadHistoryItem } from '../shared/models/DownloadHistoryItem';
import { DownloadSelection } from '../shared/models/DownloadSelection';
import { PlaylistInfo } from '../shared/models/PlaylistInfo';
import { VideoFile } from '@/src/features/editor/shared/types';
import { ThemeSetting } from '@/shared/models/ThemeSettings';

export {};

declare global {
  interface Window {
    electron: {
      app: {
        getVersion(): Promise<string>;
      };

      settings: {
        get(): Promise<{
          outputFolder: string;
          theme: ThemeSetting;
        }>;

        setOutputFolder(outputFolder: string): Promise<void>;

        getTheme(): Promise<ThemeSetting>;

        setTheme(theme: ThemeSetting): Promise<void>;

        onSystemThemeChange(
          callback: (theme: 'light' | 'dark') => void,
        ): () => void;
      };

      downloader: {
        dialog: {
          selectFolder(): Promise<string | null>;
        };

        ytdlp: {
          getVersion(): Promise<string>;
          getVideoInfo(url: string): Promise<unknown>;
          getPlaylistInfo(url: string): Promise<PlaylistInfo>;
          download(selection: DownloadSelection): Promise<DownloadResult>;
          startQueue(slections: DownloadSelection[]): Promise<void>;
          cancel(downloadId: string): Promise<void>;
          onProgress(
            callback: (progress: DownloadProgressEvent) => void,
          ): () => void;
          onCompleted(
            callback: (event: DownloadCompletedEvent) => void,
          ): () => void;
          onCancelled(
            callback: (event: DownloadCancelledEvent) => void,
          ): () => void;
          onFailed(callback: (event: DownloadFailedEvent) => void): () => void;
        };

        ffmpeg: {
          getVersion(): Promise<string>;
          getProbeVersion(): Promise<string>;
        };

        // settings: {
        //   get(): Promise<{
        //     outputFolder: string;
        //   }>;
        //   setOutputFolder(outputFolder: string): Promise<void>;
        // };

        history: {
          get: () => Promise<DownloadHistoryItem[]>;
          add: (item: DownloadHistoryItem) => Promise<void>;
          remove: (id: string) => Promise<void>;
          clear: () => Promise<void>;
        };
      };

      editor: {
        dialog: {
          openVideo(): Promise<VideoFile | null>;
          saveVideo(): Promise<string | null>;
        };

        media: {
          registerFile(filePath: string): Promise<VideoFile>;
        };

        ffmpeg: {
          trim(
            videoId: string,
            inPoint: number,
            outPoint: number,
            settings: {
              mode: 'copy' | 'recode';
              speed: number;
              quality: number;
              noAudio: boolean;
              encode?: 'cpu' | 'gpu';
              interpolate?: boolean;
              fps?: number;
              resolution?: string;
            },
          ): Promise<string | null>;
          concat(
            clips: { videoId: string; inPoint: number; outPoint: number }[],
            noAudio,
          ): Promise<string | null>;
          thumbnail(videoId: string): Promise<string>;
          onProgress(callback: (percent: number) => void): () => void;
        };
      };
    };
  }
}
