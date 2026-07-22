import { Button } from '@/components/ui/button';
import HistoryList from './components/HistoryList';
import PlaylistPreview from './components/PlaylistPreview';
import QueuePanel from './components/QueuePanel';
import VideoInfoCard from './components/VideoInfoCard';
import DownloadPanel from './components/DownloadPanel';
import PlaylistFormatSelector from './components/PlaylistFormatSelector';
import { formatService } from '@/shared/services/FormatService';
import FormatSelector from './components/FormatSelector';
import FormatSelectorSkeleton from './components/skeletons/FormatSelectorSkeleton';
import UrlForm from './components/UrlForm';
import { DownloadHistoryItem } from '@/shared/models/DownloadHistoryItem';
import { VideoInfo } from '@/shared/models/VideoInfo';
import { useEffect, useState } from 'react';
import { PlaylistQuality } from '@/shared/models/PlaylistQuality';
import { PlaylistInfo } from '@/shared/models/PlaylistInfo';
import { useDownloadQueue } from './hooks/useDownloadQueue';
import { urlService } from '@/electron/services/UrlService';
import { DownloadSelection } from '@/shared/models/DownloadSelection';
import { VideoFormat } from '@/shared/models/VideoFormat';

const DownloaderPage = () => {
  const [outputFolder, setOutputFolder] = useState('');
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  // const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [playlistQuality, setPlaylistQuality] =
    useState<PlaylistQuality>('best');
  // const [playlistItems, setPlaylistItems] = useState<PlaylistPreviewItem[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  // const { jobs, addJob, setCompleted, setFailed } = useDownloadQueue();
  const { jobs, addJob, removeJob, clearQueuedJobs } = useDownloadQueue();

  const queuedJobs = jobs.filter((job) => job.status === 'queued');
  const activeJobs = jobs.filter(
    (job) =>
      job.status === 'downloading' ||
      job.status === 'completed' ||
      job.status === 'cancelled' ||
      job.status === 'failed',
  );

  useEffect(() => {
    async function loadSettings() {
      const settings = await window.electron.downloader.settings.get();

      setOutputFolder(settings.outputFolder);

      const history = await window.electron.downloader.history.get();

      setHistory(history);
    }

    void loadSettings();
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.downloader.ytdlp.onCompleted(
      async () => {
        const updatedHistory = await window.electron.downloader.history.get();
        setHistory(updatedHistory);
      },
    );

    return () => unsubscribe();
  }, []);

  async function handleGetVideoInfo() {
    if (!url.trim()) {
      return;
    }

    try {
      setLoading(true);

      if (urlService.isPlaylist(url)) {
        const playlist =
          await window.electron.downloader.ytdlp.getPlaylistInfo(url);

        const duplicateIds = playlist.videos.filter(
          (video, index, array) =>
            array.findIndex((v) => v.id === video.id) !== index,
        );

        setPlaylist(playlist);
        setVideoInfo(null);
        setSelectedFormatId('');

        return;
      }

      const info = await window.electron.downloader.ytdlp.getVideoInfo(url);
      setPlaylist(null);
      setVideoInfo(info as VideoInfo);
      setSelectedFormatId('');
    } catch (error) {
      const raw =
        error instanceof Error ? error.message : 'Ett okänt fel uppstod';
      // Plocka bort Electrons IPC-prefix
      const message = raw.replace(
        /^Error invoking remote method '[^']+': \w*Error: /,
        '',
      );
      window.alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectFolder() {
    const folder = await window.electron.downloader.dialog.selectFolder();

    if (!folder) {
      return;
    }

    setOutputFolder(folder);
    await window.electron.downloader.settings.setOutputFolder(folder);
  }

  function buildSelection(
    video: VideoInfo,
    formatId: string,
    outputFolder: string,
  ): { selection: DownloadSelection; format: VideoFormat } {
    const selectedFormat = formatService.findById(video.formats, formatId);

    if (!selectedFormat) {
      throw new Error('Selected format was not found');
    }

    const selection: DownloadSelection = {
      downloadId: crypto.randomUUID(),
      url: video.webpageUrl,
      formatId,
      outputFolder,
      formats: video.formats,
      title: video.title,
      uploader: video.uploader,
      thumbnail: video.thumbnail,
      duration: video.duration,
    };

    return { selection, format: selectedFormat };
  }

  async function addVideoToQueue(
    video: VideoInfo,
    formatId: string,
    outputFolder: string,
  ) {
    const { selection, format: selectedFormat } = buildSelection(
      video,
      formatId,
      outputFolder,
    );

    addJob({
      id: selection.downloadId,
      title: video.title,
      extension: selectedFormat.extension,
      resolution: selectedFormat.resolution,
      filesize: selectedFormat.filesize,
      outputFolder,
      status: 'queued',
      progress: { percent: 0, speed: '', eta: '' },
      selection,
    });
  }

  async function handleAddToQueue() {
    if (!videoInfo || !selectedFormatId || !outputFolder) {
      return;
    }

    try {
      await addVideoToQueue(videoInfo, selectedFormatId, outputFolder);
      setUrl('');
      setVideoInfo(null);
      setSelectedFormatId('');
    } catch (error) {
      console.error('Failed to add to queue: ', error);
      window.alert('Failed to add to queue');
    }
  }

  async function handleAddToPlaylistQueue() {
    if (!playlist || selectedVideos.size === 0 || !outputFolder) {
      window.alert('Please select atleast on video');
      return;
    }

    const seen = new Set<string>();

    const videosToDownload = playlist.videos.filter((video) => {
      if (!selectedVideos.has(video.id) || seen.has(video.id)) {
        return false;
      }

      seen.add(video.id);
      return true;
    });

    try {
      for (const item of videosToDownload) {
        const info = (await window.electron.downloader.ytdlp.getVideoInfo(
          item.url,
        )) as VideoInfo;
        const format = formatService.findBestPlaylistFormat(
          info.formats,
          playlistQuality,
        );

        if (!format) {
          console.warn(`No suitable format found for ${item.title}`);
          continue;
        }

        await addVideoToQueue(info, format.id, outputFolder);
      }

      setUrl('');
      setPlaylist(null);
      setSelectedVideos(new Set());
    } catch (error) {
      console.error('Failed to add playlist to queue: ', error);
      window.alert('Failed to add playlist to queue');
    }
  }

  async function handleAddToQueueUniversal() {
    if (!outputFolder) {
      window.alert('Please select an output folder');
      return;
    }

    if (videoInfo && selectedFormatId) {
      await handleAddToQueue();
      return;
    }

    if (playlist && selectedVideos.size > 0) {
      await handleAddToPlaylistQueue();
      return;
    }
  }

  async function handleStartDownloads() {
    if (queuedJobs.length === 0) {
      return;
    }

    const selections = queuedJobs.map((job) => job.selection);
    await window.electron.downloader.ytdlp.startQueue(selections);
  }

  async function handleCancel(downloadId: string) {
    await window.electron.downloader.ytdlp.cancel(downloadId);
  }

  async function handleDownloadAgain(item: DownloadHistoryItem) {
    try {
      const info = (await window.electron.downloader.ytdlp.getVideoInfo(
        item.url,
      )) as VideoInfo;

      const formatExists = formatService.findById(info.formats, item.formatId);

      if (!formatExists) {
        window.alert(
          [
            'The saved format is no longer available',
            '',
            'The video has probably been updated since it was downloaded.',
            'Please select a new format and download it manually',
          ].join('\n'),
        );

        return;
      }

      await addVideoToQueue(info, item.formatId, item.outputFolder);
    } catch (error) {
      console.error(error);
      window.alert('Failed to retrieve the latest information for this video.');
    }
  }

  async function handleRemoveFromHistory(id: string) {
    await window.electron.downloader.history.remove(id);

    const history = await window.electron.downloader.history.get();

    setHistory(history);
  }

  async function handleClearHistory() {
    const confirmed = window.confirm(
      'Are you sure you want to clear the download history?',
    );

    if (!confirmed) {
      return;
    }
    await window.electron.downloader.history.clear();

    setHistory([]);
  }

  function togglePlaylistVideo(id: string) {
    setSelectedVideos((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else next.add(id);

      return next;
    });
  }

  const canAddToQueue =
    !!outputFolder &&
    ((!!videoInfo && !!selectedFormatId) ||
      (!!playlist && selectedVideos.size > 0));

  function selectAllVideos() {
    if (!playlist) {
      return;
    }

    setSelectedVideos(new Set(playlist.videos.map((video) => video.id)));
  }

  function clearSelectedVideos() {
    setSelectedVideos(new Set());
  }

  return (
    <div className='min-h-screen bg-gray-100 p-10'>
      <main className=''>
        <div className=''>
          <div className='flex gap-2'>
            <div className='w-1/2 h-fit p-6 divide-y'>
              <UrlForm
                url={url}
                loading={loading}
                onUrlChange={setUrl}
                onSubmit={handleGetVideoInfo}
              />
              {!playlist && !videoInfo && <FormatSelectorSkeleton />}
              {videoInfo && (
                <FormatSelector
                  combinedFormats={formatService.getCombinedFormats(
                    videoInfo.formats,
                  )}
                  videoFormats={formatService.getVideoFormats(
                    videoInfo.formats,
                  )}
                  audioFormats={formatService.getAudioFormats(
                    videoInfo.formats,
                  )}
                  selectedFormatId={selectedFormatId}
                  onChange={setSelectedFormatId}
                />
              )}

              {playlist && (
                <PlaylistFormatSelector
                  value={playlistQuality}
                  onChange={setPlaylistQuality}
                />
              )}
              <DownloadPanel
                outputFolder={outputFolder}
                onSelectFolder={handleSelectFolder}
              />

              <Button
                onClick={handleAddToQueueUniversal}
                disabled={!canAddToQueue}
              >
                Add to queue
              </Button>
            </div>

            <div>
              {videoInfo && <VideoInfoCard videoInfo={videoInfo} />}

              {playlist && (
                <PlaylistPreview
                  playlist={playlist}
                  selectedVideos={selectedVideos}
                  onToggle={togglePlaylistVideo}
                />
              )}
            </div>
          </div>
        </div>

        <QueuePanel
          queuedJobs={queuedJobs}
          activeJobs={activeJobs}
          onRemoveQueued={removeJob}
          onClearQueued={clearQueuedJobs}
          onStartDownloads={handleStartDownloads}
          onCancel={handleCancel}
          onRemoveActive={removeJob}
        />

        <HistoryList
          items={history}
          onDownloadAgain={handleDownloadAgain}
          onRemove={handleRemoveFromHistory}
          onClear={handleClearHistory}
        />
      </main>
    </div>
  );
};

export default DownloaderPage;
