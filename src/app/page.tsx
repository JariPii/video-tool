'use client';

import { useEffect, useState } from 'react';
import { editorStore } from '../features/editor/lib/editor.store';
import DownloaderPage from '../features/downloader/DownloaderPage';
import VideoEditor from '../features/editor/VideoEditor';

type Tab = 'downloader' | 'editor';

const Home = () => {
  const [activeTab, setActiveTab] = useState<Tab>('downloader');

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col'>
      <nav className='border-b bg-white dark:bg-zinc-950 sticky top-0 z-50 shadow-sm'>
        <div className='px-4 py-3 flex gap-3 items-center'>
          <button
            onClick={() => setActiveTab('downloader')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'downloader'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            Downloader
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'editor'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            Editor
          </button>
          <div className='ml-auto text-xs text-gray-500 dark:text-gray-400'>
            {activeTab === 'downloader'
              ? 'Download videos from URL'
              : 'Edit and export videos'}
          </div>
        </div>
      </nav>
      <main className='flex-1'>
        {activeTab === 'downloader' && <DownloaderPage />}
        {activeTab === 'editor' && <VideoEditor />}
      </main>
    </div>
  );
};

export default Home;
