'use client';

import { useEffect, useState } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { editorStore } from '../lib/editor.store';

type ThumbnailMap = Record<string, string>;

const VideoPanel = () => {
  const videos = useEditorStore((s) => s.videos);
  const activeVideoId = useEditorStore((s) => s.activeVideoId);
  const [thumbnails, setThumbnails] = useState<ThumbnailMap>({});

  useEffect(() => {
    for (const video of videos) {
      if (thumbnails[video.id]) continue;

      window.electron.editor.ffmpeg
        .thumbnail(video.id)
        .then((base64) => {
          setThumbnails((prev) => ({ ...prev, [video.id]: base64 }));
        })
        .catch(console.error);
    }
  }, [videos]);

  const handleOpen = async () => {
    const file = await window.electron.editor.dialog.openVideo();
    if (!file) return;
    editorStore.addVideo(file);
  };

  if (videos.length === 0) {
    return (
      <div className='flex flex-col gap-3 w-48'>
        <button
          className='border border-white px-3 py-2 rounded-lg hover:bg-gray-500 text-sm'
          onClick={handleOpen}
        >
          Open video
        </button>
      </div>
    );
  }

  return (
    <div className='flex gap-2 w-full'>
      {videos.map((video) => (
        <div
          key={video.id}
          className={`relative rounded-lg overflow-hidden cursor-pointer border ${activeVideoId === video.id ? 'border-blue-500' : 'border-transparent hover:border-gray-500'}`}
          onClick={() => editorStore.setActiveVideo(video.id)}
        >
          {thumbnails[video.id] ? (
            <img
              src={thumbnails[video.id]}
              alt={video.name}
              className='w-full object-cover'
            />
          ) : (
            <div className='w-full h-20 bg-neutral-800 flex items-center justify-center'>
              <span className='text-xs text-gray-500'>Loading...</span>
            </div>
          )}
          <div className='px-2 py-1 bg-neutral-900'>
            <p className='text-xs text-gray-300 truncate'>{video.name}</p>
          </div>

          <button
            className='absolute top-1 right-1 w-5 h-5 rounded-full bg-black bg-opacity-60 text-gray-400 hover:text-red-400 text-xs flex items-center justify-center'
            onClick={(e) => {
              e.stopPropagation();
              editorStore.removeVideo(video.id);
            }}
          >
            X
          </button>
        </div>
      ))}

      <button
        className='border border-dashed border-gray-600 px-3 py-2 rounded-lg hover:border-gray-400 text-xs text-gray-500 hover:text-gray-300'
        onClick={handleOpen}
      >
        Add video
      </button>
    </div>
  );
};

export default VideoPanel;
