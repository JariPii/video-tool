'use client';

import { ExportMode, ExportResolution } from '@/electron/shared/types';
import { useEditorStore } from '../hooks/useEditorStore';
import { editorActions } from '../lib/editor.store';

const OutputSettings = () => {
  const settings = useEditorStore((s) => s.exportSettings);

  const isRecode = settings.mode === 'recode';

  return (
    <div className='mt-4 flex flex-col gap-3 text-xs text-gray-400'>
      <p className='text-gray-300 text-sm font-medium'>Export settings</p>

      <div className='flex flex-col gap-1'>
        <p className='text-gray-500'>Mode</p>

        <div className='flex gap-2'>
          {(['copy', 'recode'] as ExportMode[]).map((mode) => (
            <button
              key={mode}
              className={`px-3 py-1 rounded border text-xs ${settings.mode === mode ? 'border-white text-white' : 'border-gray-600 text-gray-500 hover:border-gray-400'} `}
              onClick={() => editorActions.setExportSettings({ mode })}
            >
              {mode === 'copy' ? 'Fast (copy)' : 'Advanced (libx264)'}
            </button>
          ))}
          <p className='text-gray-600'>
            {settings.mode === 'copy'
              ? 'Keeps the original quality. No effects possible'
              : 'Sets speed and quality adjustments. Takes longer time'}
          </p>
        </div>

        {isRecode && (
          <div className='flex flex-col gap-1'>
            <p className='text-gray-500'>Speed</p>
            <div className='flex gap-3'>
              {[0.25, 0.5, 1.0, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  className={`px-2 py-0.5 rounded border ${settings.speed === s ? 'border-white text-white' : 'border-gray-600 text-gray-500 hover:border-gray-400'}`}
                  onClick={() => editorActions.setExportSettings({ speed: s })}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        {isRecode && (
          <div className='flex flex-col gap-1'>
            <p className='text-gray-500'>Resolution</p>
            <div className='flex flex-wrap gap-2'>
              {(
                [
                  'source',
                  '2880x1440',
                  '1920x1080',
                  '1280x720',
                  '854x480',
                ] as ExportResolution[]
              ).map((res) => (
                <button
                  key={res}
                  className={`px-2 py-0.5 rounded border ${settings.resolution === res ? 'border-white text-white' : 'border-gray-600 text-gray-500 hover:border-gray-400'} `}
                  onClick={() =>
                    editorActions.setExportSettings({ resolution: res })
                  }
                >
                  {res === 'source'
                    ? 'Original'
                    : res === '2880x1440'
                      ? '1440p'
                      : res === '1920x1080'
                        ? '1080p'
                        : res === '1280x720'
                          ? '720p'
                          : '480p'}
                </button>
              ))}
            </div>
          </div>
        )}

        {isRecode && (
          <div className='flex flex-col gap-1'>
            <p>Quality (CRF: {settings.quality})</p>
            <label>
              <input
                type='range'
                min={0}
                max={51}
                value={settings.quality}
                onChange={(e) =>
                  editorActions.setExportSettings({
                    quality: Number(e.target.value),
                  })
                }
                className='w-full accent-white'
              />
              <div className='flex justify-between text-gray-600'>
                <span>Best (large file)</span>
                <span>Worst (small file)</span>
              </div>
            </label>
          </div>
        )}

        {isRecode && settings.speed < 1.0 && (
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={settings.interpolate ?? false}
              onChange={(e) =>
                editorActions.setExportSettings({
                  interpolate: e.target.checked,
                })
              }
            />
            <span>Frame interpolation (smoother but slower)</span>
          </label>
        )}

        {isRecode && settings.speed < 1.0 && settings.interpolate && (
          <div className='flex flex-col gap-1'>
            <p className='text-gray-500'>FPS</p>
            <div className='flex gap-3'>
              {[30, 60, 120].map((fps) => (
                <button
                  key={fps}
                  className={`px-2 py-0.5 rounded border ${settings.fps === fps ? 'border-white' : 'border-gray-600 text-gray-500 hover:border-gray-400'} `}
                  onClick={() => editorActions.setExportSettings({ fps })}
                >
                  {fps}fps
                </button>
              ))}
            </div>
            <p className='text-gray-600'>
              Higher FPS = smoother but longer export. Limited by your screens
              refresh rate
            </p>
          </div>
        )}

        <label className='flex items-center gap-3 cursor-pointer'>
          <input
            type='checkbox'
            checked={settings.noAudio}
            onChange={(e) =>
              editorActions.setExportSettings({ noAudio: e.target.checked })
            }
          />
          Export without sound
        </label>
      </div>
    </div>
  );
};

export default OutputSettings;
