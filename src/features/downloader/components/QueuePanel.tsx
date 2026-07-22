'use client';

import { Button } from '@/components/ui/button';
import { DownloadJob } from '@/shared/models/DownloadJob';

interface QueuePanelProps {
  queuedJobs: DownloadJob[];
  activeJobs: DownloadJob[];
  onRemoveQueued(jobId: string): void;
  onClearQueued(): void;
  onStartDownloads(): void;
  onCancel(jobId: string): void;
  onRemoveActive(jobId: string): void;
}

const statusLabel: Record<string, string> = {
  downloading: 'Downloading',
  completed: 'Completed',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

const statusColor: Record<string, string> = {
  downloading: 'text-blue-600',
  completed: 'text-green-600',
  cancelled: 'text-gray-500',
  failed: 'text-red-600',
};

function formatFileSize(bytes?: number): string {
  if (!bytes) {
    return 'Unknown';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }

  return `${size.toFixed(1)} ${units[unit]}`;
}

const QueuePanel = ({
  queuedJobs,
  activeJobs,
  onCancel,
  onClearQueued,
  onRemoveActive,
  onRemoveQueued,
  onStartDownloads,
}: QueuePanelProps) => {
  if (queuedJobs.length === 0 && activeJobs.length === 0) {
    return null;
  }

  return (
    <div className='mt-8 border-2 border-black'>
      <h2>Downloads</h2>

      {queuedJobs.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3>Queued ({queuedJobs.length})</h3>
            <div className='flex gap-2'>
              <Button
                onClick={onStartDownloads}
                className='bg-green-600 hover:bg-green-700'
              >
                Start downloads
              </Button>
              <Button
                onClick={onClearQueued}
                variant='outline'
                className='border-red-300 text-red-600 hover:bg-red-50'
              >
                Clear queue
              </Button>
            </div>
          </div>

          {queuedJobs.map((job) => (
            <div key={job.id} className='border border-yellow-200 flex'>
              <div className='flex-1'>
                <div>{job.title}</div>
                <div>
                  {job.resolution} - {job.extension}
                  {formatFileSize(job.filesize)}
                </div>
              </div>
              <Button
                onClick={() => onRemoveQueued(job.id)}
                variant='destructive'
                size='sm'
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className='p-3 border'>
        {activeJobs.length > 0 && (
          <div>
            <h3>Active ({activeJobs.length})</h3>

            {activeJobs.map((job) => (
              <div key={job.id}>
                <div>
                  <div>{job.title}</div>
                  <div>
                    <span
                      className={`text-sm font-medium ${statusColor[job.status] ?? 'text-gray-500'}`}
                    >
                      {statusLabel[job.status] ?? job.status}
                    </span>
                    {job.status === 'downloading' && (
                      <Button
                        onClick={() => onCancel(job.id)}
                        variant='destructive'
                      >
                        Cancel
                      </Button>
                    )}
                    {(job.status === 'completed' ||
                      job.status === 'failed' ||
                      job.status === 'cancelled') && (
                      <Button
                        onClick={() => onRemoveActive(job.id)}
                        variant='outline'
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  {job.resolution} - {job.extension} -{' '}
                  {formatFileSize(job.filesize)}
                </div>

                {job.status === 'downloading' && (
                  <>
                    <div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                      <div
                        className='h-full rounded-full bg-blue-500 transition-all duration-150'
                        style={{ width: `${job.progress.percent}%` }}
                      />
                    </div>
                    <div>
                      <span>{job.progress.percent.toFixed(1)}%</span>
                      <span>{job.progress.speed}</span>
                      <span>ETA: {job.progress.eta}</span>
                    </div>
                  </>
                )}

                {job.status === 'completed' && (
                  <div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                    <div className='h-full w-full rounded-full bg-green-500' />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueuePanel;
