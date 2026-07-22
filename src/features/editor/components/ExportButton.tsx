'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { editorActions } from '../lib/editor.store';

type ExportState =
  | { status: 'idle' }
  | { status: 'exporting'; percent: number }
  | { status: 'done'; path: string }
  | { status: 'error'; message: string };

const ExportButton = () => {
  const activeVideoId = useEditorStore((s) => s.activeVideoId);
  const inPoint = useEditorStore((s) => s.inPoint);
  const outPoint = useEditorStore((s) => s.outPoint);
  const exportSettings = useEditorStore((s) => s.exportSettings);

  const [state, setState] = useState<ExportState>({ status: 'idle' });

  const [encoder, setEncoder] = useState<'cpu' | 'gpu'>('cpu');

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const canExport =
    activeVideoId &&
    inPoint !== null &&
    outPoint !== null &&
    state.status !== 'exporting';

  const handleExport = async () => {
    if (!canExport) return;

    setState({ status: 'exporting', percent: 0 });

    cleanupRef.current = window.electron.editor.ffmpeg.onProgress((percent) => {
      setState({ status: 'exporting', percent });
    });

    try {
      const outputPath = await window.electron.editor.ffmpeg.trim(
        activeVideoId,
        inPoint,
        outPoint,
        exportSettings,
      );

      if (outputPath) {
        setState({ status: 'done', path: outputPath });
      } else {
        setState({ status: 'idle' });
      }
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      cleanupRef.current?.();
      cleanupRef.current = null;
    }
  };

  return (
    <div className='mt-4 flex flex-col gap-2'>
      <div>
        <label htmlFor=''>Rendering type</label>
        <select
          value={exportSettings.encoder}
          onChange={(e) =>
            editorActions.setExportSettings({
              encoder: e.target.value as 'cpu' | 'gpu',
            })
          }
          disabled={state.status === 'exporting'}
          name=''
          id=''
        >
          <option value='cpu'>Standard (CPU - Saves battery)</option>
          <option value='gpu'>Fast (GPU acceleration)</option>
        </select>
      </div>

      <button
        className='border border-white px-4 py-2 rounded-lg hover:bg-gray-500
    disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
        onClick={handleExport}
        disabled={!canExport}
      >
        {state.status === 'exporting'
          ? `Exporting... ${state.percent}%`
          : 'Export clip'}
      </button>

      {state.status === 'exporting' && (
        <div className='h-1.5 w-full rounded bg-neutral-700'>
          <div
            className='h-full rounded bg-blue-500 transition-all duration-300'
            style={{ width: `${state.percent}%` }}
          />
        </div>
      )}

      {state.status === 'done' && (
        <p className='text-sm text-green-400'>Saved: {state.path}</p>
      )}

      {state.status === 'error' && (
        <p className='text-sm text-red-400'>{state.message}</p>
      )}

      {state.status === 'idle' &&
        activeVideoId &&
        (inPoint === null || outPoint === null) && (
          <p className='text-xs text-gray-500'>
            Press I and O to set in and out points.
          </p>
        )}
    </div>
  );
};

export default ExportButton;
