import {
  Clip,
  DEFAULT_EXPORT_SETTINGS,
  ExportSettings,
  Track,
  VideoFile,
} from '@/electron/shared/types';

function uuid(): string {
  return crypto.randomUUID();
}

export type EditorState = {
  videos: VideoFile[];
  activeVideoId: string | null;
  duration: number;
  currentTime: number;
  playing: boolean;
  inPoint: number | null;
  outPoint: number | null;
  track: Track;
  zoom: number;
  scrollLeft: number;
  exportSettings: ExportSettings;
};

export interface PlayerController {
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  getCurrentTime(): number;
}

class EditorStore {
  #state: EditorState = {
    videos: [],
    activeVideoId: null,
    duration: 0,
    currentTime: 0,
    playing: false,
    inPoint: null,
    outPoint: null,
    track: { id: uuid(), clips: [] },
    zoom: 1,
    scrollLeft: 0,
    exportSettings: DEFAULT_EXPORT_SETTINGS,
  };

  #player: PlayerController | null = null;
  #listeners = new Set<() => void>();

  public registerPlayer = (player: PlayerController) => {
    this.#player = player;
  };

  public unregisterPlayer = () => {
    this.#player = null;
  };

  public get player(): PlayerController | null {
    return this.#player;
  }

  public getState = () => {
    return this.#state;
  };

  public subscribe = (listener: () => void) => {
    this.#listeners.add(listener);

    return () => {
      this.#listeners.delete(listener);
    };
  };

  private notify = () => {
    for (const listener of this.#listeners) {
      listener();
    }
  };

  private update = (state: Partial<EditorState>) => {
    this.#state = {
      ...this.#state,
      ...state,
    };

    this.notify();
  };

  public addVideo = (video: VideoFile) => {
    const { videos } = this.#state;

    if (videos.find((v) => v.id === video.id)) return;

    this.update({
      videos: [...videos, video],
      activeVideoId: video.id,
      inPoint: null,
      outPoint: null,
      currentTime: 0,
      // duration: 0,
    });
  };

  public removeVideo = (videoId: string) => {
    const { videos, activeVideoId } = this.#state;
    const remaining = videos.filter((v) => v.id !== videoId);

    const newActiveId =
      activeVideoId === videoId ? (remaining[0]?.id ?? null) : activeVideoId;
    this.update({
      videos: remaining,
      activeVideoId: newActiveId,
      inPoint: null,
      outPoint: null,
      currentTime: 0,
      // duration: 0,
    });
  };

  public setActiveVideo = (videoId: string) => {
    this.update({
      activeVideoId: videoId,
      inPoint: null,
      outPoint: null,
      currentTime: 0,
      duration: 0,
    });
  };

  public setDuration = (duration: number) => {
    this.update({ duration });
  };

  public setCurrentTime = (currentTime: number) => {
    this.update({ currentTime });
  };

  public setPlaying = (playing: boolean) => {
    this.update({ playing });
  };

  public setInPoint = (time: number | null) => {
    if (time === null) return this.update({ inPoint: null });

    const { duration, outPoint } = this.#state;

    const maxLimit = outPoint !== null ? outPoint : duration;
    const clamped = Math.max(0, Math.min(time, maxLimit));

    this.update({ inPoint: clamped });
  };

  public setOutPoint = (time: number | null) => {
    if (time === null) return this.update({ outPoint: null });

    const { duration, inPoint } = this.#state;

    const minLimit = inPoint !== null ? inPoint : 0;
    const clamped = Math.max(minLimit ?? 0, Math.min(time, duration));

    this.update({ outPoint: clamped });
  };

  public addClip = () => {
    const { activeVideoId, inPoint, outPoint, track } = this.#state;

    if (!activeVideoId || inPoint === null || outPoint === null) return;

    const clip: Clip = {
      id: uuid(),
      videoId: activeVideoId,
      inPoint,
      outPoint,
    };

    this.update({
      track: {
        ...track,
        clips: [...track.clips, clip],
      },
    });
  };

  public removeClip = (clipId: string) => {
    const { track } = this.#state;
    this.update({
      track: {
        ...track,
        clips: track.clips.filter((c) => c.id !== clipId),
      },
    });
  };

  public setExportSettings = (settings: Partial<ExportSettings>) => {
    this.update({
      exportSettings: { ...this.#state.exportSettings, ...settings },
    });
  };

  public reorderClips = (fromIndex: number, toIndex: number) => {
    const { track } = this.#state;
    const clips = [...track.clips];
    const [moved] = clips.splice(fromIndex, 1);
    clips.splice(toIndex, 0, moved);
    this.update({ track: { ...track, clips } });
  };

  public setZoom = (zoom: number) => {
    const clamped = Math.max(0.01, Math.min(20, zoom));
    this.update({ zoom: clamped });
  };

  public setScrollLeft = (scrollLeft: number) => {
    const clamped = Math.max(0, scrollLeft);
    this.update({ scrollLeft: clamped });
  };
}

export const editorStore = new EditorStore();

export const editorActions = {
  addVideo: editorStore.addVideo,
  removeVideo: editorStore.removeVideo,
  setCurrentTime: editorStore.setCurrentTime,
  setDuration: editorStore.setDuration,
  setPlaying: editorStore.setPlaying,
  setInPoint: editorStore.setInPoint,
  setOutPoint: editorStore.setOutPoint,
  addClip: editorStore.addClip,
  removeClip: editorStore.removeClip,
  reorderClips: editorStore.reorderClips,
  setZoom: editorStore.setZoom,
  setScrollLeft: editorStore.setScrollLeft,
  setExportSettings: editorStore.setExportSettings,
};
