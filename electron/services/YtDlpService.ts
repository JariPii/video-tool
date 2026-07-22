import { YtDlpVideoInfo } from '../types/YtDlpVideoInfo';
import { binaryService } from './BinaryService';
import { processService } from './ProcessService';
import { videoMapper } from '../mappers/VideoMapper';
import { ytDlpArgumentService } from './YtDlpArgumentService';
import { retryService } from './RetryService';
import { DownloadError } from '../errors/DownloadError';
import { downloadErrorMapper } from '../mappers/DownloadErrorMapper';
import { DownloadErrorCode } from '../enums/DownloadErrorCode';
import { PlaylistInfo } from '../../shared/models/PlaylistInfo';
import { YtDlpPlaylistInfo } from '../types/YtDlpPlaylistInfo';
import { playlistMapper } from '../mappers/PlaylistMapper';

export class YtDlpService {
  public async getVersion(): Promise<string> {
    const executable = binaryService.getYtDlpPath();

    const result = await processService.run(executable, ['--version']);

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

    return result.stdout.trim();
  }

  public async getVideoInfo(url: string) {
    const browsers = ['firefox', 'chrome', 'edge', 'brave'];

    try {
      return await this.runInfo(ytDlpArgumentService.buildInfoArguments(url));
    } catch (error) {
      if (
        !(error instanceof DownloadError) ||
        error.code !== DownloadErrorCode.AuthenticationRequired
      ) {
        throw error;
      }
    }

    for (const browser of browsers) {
      try {
        return await this.runInfo(
          ytDlpArgumentService.buildInfoArgumentsWithCookies(url, browser),
        );
      } catch (error) {
        if (
          error instanceof DownloadError &&
          error.code === DownloadErrorCode.AuthenticationRequired
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new DownloadError(
      DownloadErrorCode.AuthenticationRequired,
      'Kunde inte verifiera dig mot tjänsten. Tips: logga in på youtube.com i Firefox och försök igen.',
      false,
    );
  }

  public async getPlaylistInfo(url: string): Promise<PlaylistInfo> {
    const json = (await this.runJson(
      ytDlpArgumentService.buildPlaylistArguments(url),
    )) as YtDlpPlaylistInfo;

    console.log('entries', json.entries.length);

    const duplicateEntries = json.entries.filter(
      (entry, index, array) =>
        array.findIndex((e) => e.id === entry.id) !== index,
    );

    console.log('duplicate entries', duplicateEntries.length);

    return playlistMapper.map(json);
  }

  private async runJson(args: string[]) {
    const executable = binaryService.getYtDlpPath();

    try {
      return await retryService.execute(
        async () => {
          const result = await processService.run(executable, args);

          if (result.exitCode !== 0) {
            throw downloadErrorMapper.map(result.stderr);
          }

          return JSON.parse(result.stdout);
        },
        1,
        2000,
        (error) => error instanceof DownloadError && error.retryable,
      );
    } catch (error) {
      if (error instanceof DownloadError) {
        throw error;
      }

      if (error instanceof Error) {
        throw downloadErrorMapper.map(error.message);
      }

      throw error;
    }
  }

  private async runInfo(args: string[]) {
    const json = (await this.runJson(args)) as YtDlpVideoInfo;

    return videoMapper.map(json);
  }
}

export const ytDlpService = new YtDlpService();
