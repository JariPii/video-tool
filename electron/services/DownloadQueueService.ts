import { DownloadSelection } from '../../shared/models/DownloadSelection';
import { DownloadResult, downloadService } from './DownloadService';
import {
  DownloadCancelledEvent,
  DownloadCompletedEvent,
  DownloadFailedEvent,
  DownloadProgressEvent,
} from '../types/DownloadProgressEvent';
import { progressService } from './ProgressService';

type EventCallback<T> = (event: T) => void;

export interface QueueCallbacks {
  onProgress: EventCallback<DownloadProgressEvent>;
  onCompleted: EventCallback<DownloadCompletedEvent>;
  onCancelled: EventCallback<DownloadCancelledEvent>;
  onFailed: EventCallback<DownloadFailedEvent>;
}

interface QueueItem {
  selection: DownloadSelection;
  resolve: (result: DownloadResult) => void;
  reject: (error: unknown) => void;
}

export class DownloadQueueService {
  private readonly queue: QueueItem[] = [];

  private readonly active = new Set<string>();

  private readonly maxConcurrentDls = 1;

  private callbacks: QueueCallbacks | null = null;

  public registerCallbacks(callbacks: QueueCallbacks): void {
    this.callbacks = callbacks;
  }

  public start(selections: DownloadSelection[]): void {
    for (const selection of selections) {
      this.enqueue(selection);
    }
  }

  public enqueue(selection: DownloadSelection): Promise<DownloadResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        selection,
        resolve,
        reject,
      });

      this.startNext();
    });
  }

  public queueLength(): number {
    return this.queue.length;
  }

  public getActiveCount(): number {
    return this.active.size;
  }

  private startNext(): void {
    while (this.active.size < this.maxConcurrentDls && this.queue.length > 0) {
      const item = this.queue.shift();

      if (!item) {
        return;
      }

      this.active.add(item.selection.downloadId);

      void this.run(item);
    }
  }

  private async run(item: QueueItem): Promise<void> {
    const { selection } = item;

    try {
      const result = await downloadService.download(selection, (line) => {
        const progress = progressService.parse(line);

        if (!progress) {
          return;
        }

        this.callbacks?.onProgress({
          downloadId: selection.downloadId,
          ...progress,
        });
      });

      switch (result.status) {
        case 'completed':
          this.callbacks?.onCompleted({
            downloadId: selection.downloadId,
            outputPath: result.outputPath,
          });
          break;

        case 'cancelled':
          this.callbacks?.onCancelled({ downloadId: selection.downloadId });
          break;
      }

      item.resolve(result);
    } catch (error) {
      this.callbacks?.onFailed({
        downloadId: selection.downloadId,
        message:
          error instanceof Error ? error.message : 'Unkown download error',
      });

      item.reject(error);
    } finally {
      this.active.delete(selection.downloadId);
      this.startNext();
    }
  }
}

export const downloadQueueService = new DownloadQueueService();
