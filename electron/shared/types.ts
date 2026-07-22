export type VideoFile = {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
};

export type Clip = {
  id: string;
  videoId: string;
  inPoint: number;
  outPoint: number;
};

export type Track = {
  id: string;
  clips: Clip[];
};

export type ExportMode = 'copy' | 'recode';

export type ExportResolution =
  | '2880x1440'
  | '1920x1080'
  | '1280x720'
  | '854x480'
  | 'source';

export type ExportSettings = {
  mode: ExportMode;
  speed: number;
  quality: number;
  noAudio: boolean;
  interpolate?: boolean;
  fps?: number;
  resolution: ExportResolution;
  encoder: 'cpu' | 'gpu';
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  mode: 'copy',
  speed: 1.0,
  quality: 18,
  noAudio: false,
  interpolate: false,
  fps: 60,
  resolution: 'source',
  encoder: 'cpu',
};
