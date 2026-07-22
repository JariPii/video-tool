'use client';

import { Button } from '@/components/ui/button';

interface DownloadPanelProps {
  outputFolder: string;
  onSelectFolder(): void;
}

const DownloadPanel = ({
  outputFolder,
  onSelectFolder,
}: DownloadPanelProps) => {
  return (
    <div className='p-4 flex flex-col-reverse gap-3'>
      <Button onClick={onSelectFolder} className='w-fit'>
        Choose folder
      </Button>
      <div className='p-2 border border-black rounded'>
        <p>{outputFolder || 'No folder selected'}</p>
      </div>
    </div>
  );
};

export default DownloadPanel;
