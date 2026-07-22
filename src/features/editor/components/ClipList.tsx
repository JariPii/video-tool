'use client';
import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { editorStore } from '../lib/editor.store';

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

type ExportState =
  | { status: 'idle' }
  | { status: 'exporting'; percent: number }
  | { status: 'done'; path: string }
  | { status: 'error'; message: string };

const ClipList = () => {
  const clips = useEditorStore((s) => s.track.clips);
  const inPoint = useEditorStore((s) => s.inPoint);
  const outPoint = useEditorStore((s) => s.outPoint);
  const exportSettings = useEditorStore((s) => s.exportSettings);

  const [exportState, setExportState] = useState<ExportState>({
    status: 'idle',
  });
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const canAddClip = inPoint !== null && outPoint !== null;
  const canExport = clips.length > 0 && exportState.status !== 'exporting';

  const handleExportAll = async () => {
    if (!canExport) return;

    setExportState({ status: 'exporting', percent: 0 });

    cleanupRef.current = window.electron.editor.ffmpeg.onProgress((percent) => {
      setExportState({ status: 'exporting', percent });
    });

    try {
      const outputPath = await window.electron.editor.ffmpeg.concat(
        clips.map((c) => ({
          videoId: c.videoId,
          inPoint: c.inPoint,
          outPoint: c.outPoint,
        })),
        exportSettings.noAudio,
      );

      if (outputPath) {
        setExportState({ status: 'done', path: outputPath });
      } else {
        setExportState({ status: 'idle' });
      }
    } catch (err) {
      setExportState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      cleanupRef.current?.();
      cleanupRef.current = null;
    }
  };

  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between mb-2'>
        <h2 className='text-sm font-medium text-gray-300'>Clip</h2>
        <button
          className='text-xs border border-white px-3 py-1 rounded-lg hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed'
          disabled={!canAddClip}
          onClick={() => editorStore.addClip()}
        >
          Add clip
        </button>
      </div>

      {clips.length === 0 ? (
        <p className='text-xs text-gray-600'>No clips added yet</p>
      ) : (
        <>
          <ul className='flex flex-col gap-1'>
            {clips.map((clip, index) => (
              <li
                key={clip.id}
                className='flex items-center justify-between bg-neutral-800 rounded-lg px-3 py-2 text-xs font-mono'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-gray-500 w-4'>{index + 1}</span>

                  <span className='text-green-400'>
                    {formatTime(clip.inPoint)}
                  </span>
                  <span className='text-gray-600'>-</span>
                  <span className='text-red-400'>
                    {formatTime(clip.outPoint)}
                  </span>

                  <span className='text-gray-500'>
                    ({formatTime(clip.outPoint - clip.inPoint)})
                  </span>
                </div>

                <div className='flex items-center gap-2'>
                  <button
                    className='text-gray-500 hover:text-white disabled:opacity-20'
                    disabled={index === 0}
                    onClick={() => editorStore.reorderClips(index, index - 1)}
                  >
                    UP
                  </button>
                  <button
                    className='text-gray-500 hover:text-white disabled:opacity-20'
                    disabled={index === clips.length - 1}
                    onClick={() => editorStore.reorderClips(index, index + 1)}
                  >
                    DOWN
                  </button>

                  <button
                    className='text-gray-500 hover:text-red-400'
                    onClick={() => editorStore.removeClip(clip.id)}
                  >
                    X
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className='mt-3'>
            <button
              className='w-full text-xs border border-white px-3 py-2 rounded-lg
            hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed'
              disabled={!canExport}
              onClick={handleExportAll}
            >
              {exportState.status === 'exporting'
                ? `Exporting... ${exportState.percent}%`
                : `Export ${clips.length} clip as a file`}
            </button>

            {exportState.status === 'exporting' && (
              <div className='mt-2 h-1.5 w-full rounded bg-neutral-700'>
                <div
                  className='h-full rounded bg-blue-500 transition-all duration-300'
                  style={{ width: `${exportState.percent}%` }}
                />
              </div>
            )}

            {exportState.status === 'done' && (
              <p className='mt-2 text-xs text-green-400'>
                Saved: {exportState.path}
              </p>
            )}

            {exportState.status === 'error' && (
              <p className='mt-2 text-xs text-red-400'>{exportState.message}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClipList;
