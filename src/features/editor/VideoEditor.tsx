'use client';

import ClipList from './components/ClipList';
import ExportButton from './components/ExportButton';
import OutputSettings from './components/OutputSettings';
import TimeLine from './components/TimeLine';
import VideoPanel from './components/VideoPanel';
import VideoPlayer from './components/VideoPlayer';
import { useEditorStore } from './hooks/useEditorStore';

const VideoEditor = () => {
  const activeVideoId = useEditorStore((s) => s.activeVideoId);
  const duration = useEditorStore((s) => s.duration);
  const currentTime = useEditorStore((s) => s.currentTime);
  const playing = useEditorStore((s) => s.playing);

  return (
    <div className='flex flex-col gap-6 p-6 bg-zinc-50 dark:bg-black min-h-full'>
      <VideoPanel />

      <div className='flex flex-col flex-1'>
        <VideoPlayer />
        <TimeLine />
      </div>

      {activeVideoId && (
        <div className='mt-2 text-xs font-mono text-gray-500 flex gap-4'>
          <p>Duration: {duration.toFixed(3)}s</p>
          <p>Current time: {currentTime.toFixed(3)}</p>
          <p>Playing: {playing ? 'Yes' : 'No'}</p>
        </div>
      )}

      <OutputSettings />
      <ExportButton />
      <ClipList />
    </div>
  );
};

export default VideoEditor;
