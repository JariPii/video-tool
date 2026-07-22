import { DownloadProgress } from '@/electron/types/DownloadProgress';
import { DownloadSelection } from './DownloadSelection';

export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface DownloadJob {
  id: string;
  title: string;
  extension: string;
  resolution: string;
  filesize?: number;
  outputFolder: string;
  progress: DownloadProgress;
  status: DownloadStatus;
  selection: DownloadSelection;
}
