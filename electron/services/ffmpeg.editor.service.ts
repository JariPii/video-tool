import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { binaryService } from './BinaryService';

export type TrimOptions = {
  inputPath: string;
  outputPath: string;
  inPoint: number;
  outPoint: number;
  mode: 'copy' | 'recode';
  encoder?: 'cpu' | 'gpu';
  speed?: number;
  quality?: number;
  noAudio?: boolean;
  interpolate?: boolean;
  fps?: number;
  resolution?: string;
  onProgress?: (percent: number) => void;
};

export type ConcatClip = {
  inputPath: string;
  inPoint: number;
  outPoint: number;
};

export type ConcatOptions = {
  clips: ConcatClip[];
  outputPath: string;
  noAudio?: boolean;
  onProgress?: (percent: number) => void;
};

function parseProgress(stderr: string, durationSeconds: number): number | null {
  const match = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
  if (!match) return null;

  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const s = parseInt(match[3]);
  const cs = parseInt(match[4]);

  const currentSeconds = h * 3600 + m * 60 + s + cs / 100;
  const percent = Math.min(
    100,
    Math.round((currentSeconds / durationSeconds) * 100),
  );

  return percent;
}

export async function trimVideo(options: TrimOptions): Promise<void> {
  const {
    inputPath,
    outputPath,
    inPoint,
    outPoint,
    mode,
    speed = 1.0,
    quality = 18,
    noAudio,
    onProgress,
    resolution = 'source',
  } = options;

  const duration = outPoint - inPoint;
  const ffmepgPath = binaryService.getFfmpegPath();
  const targetFps = options.fps ?? 60;

  return new Promise((res, rej) => {
    let args: string[];

    if (mode === 'copy') {
      args = [
        '-y',
        '-ss',
        String(inPoint),
        '-t',
        String(duration),
        '-i',
        inputPath,
        '-c',
        'copy',
        ...(noAudio ? ['-an'] : []),
        outputPath,
      ];
    } else {
      const videoFilters: string[] = [];

      if (resolution !== 'source') {
        const [w, h] = resolution.split('x');
        videoFilters.push(
          `scale=${w}:${h}:force_original_aspect_ratio=decrease`,
        );
      }

      if (speed !== 1.0) {
        videoFilters.push(`setpts=${1 / speed}*PTS`);
      }

      if (options.interpolate && speed < 1.0) {
        videoFilters.push(
          `minterpolate=fps=${targetFps}:mi_mode=blend:mc_mode=aobmc`,
        );
      }

      args = [
        '-y',
        '-ss',
        String(inPoint),
        '-t',
        String(duration),
        '-i',
        inputPath,
      ];

      if (videoFilters.length > 0) {
        args.push('-vf', videoFilters.join(','));
      }

      if (options.encoder === 'gpu') {
        args.push(
          '-c:v',
          'h264_nvenc',
          '-rc',
          'vbr',
          '-cq',
          String(quality),
          '-b:v',
          '0',
          '-pix_fmt',
          'yuv420p',
        );
      } else {
        args.push(
          '-c:v',
          'libx264',
          '-preset',
          'slow',
          '-crf',
          String(quality),
          '-pix_fmt',
          'yuv420p',
        );
      }

      args.push(
        ...(noAudio
          ? ['-an']
          : [
              '-filter:a',
              `atempo=${Math.max(0.5, Math.min(2.0, speed))}`,
              '-c:a',
              'aac',
            ]),
        outputPath,
      );
    }

    const proc = spawn(ffmepgPath, args);
    const outputDuration = mode === 'recode' ? duration / speed : duration;
    let stderrBuffer = '';

    proc.stderr.on('data', (data: Buffer) => {
      stderrBuffer += data.toString();

      const lines = stderrBuffer.split(/[\r\n]+/);
      stderrBuffer = lines.pop() ?? '';

      for (const line of lines) {
        if (onProgress) {
          const percent = parseProgress(line, outputDuration);

          if (percent !== null) {
            onProgress(percent);
          }
        }
      }
    });

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        onProgress?.(100);
        res();
      } else {
        rej(new Error(`Ffmpeg closed with code ${code}`));
      }
    });

    proc.on('error', rej);
  });
}

export async function concatClips(options: ConcatOptions): Promise<void> {
  const { clips, outputPath, noAudio, onProgress } = options;
  const ffmepgPath = binaryService.getFfmpegPath();

  const totalDuration = clips.reduce(
    (sum, c) => sum + (c.outPoint - c.inPoint),
    0,
  );

  const listContent = clips
    .map((c) =>
      [
        `file ${c.inputPath.replace(/'/g, "'\\''")}`,
        `inpoint ${c.inPoint}`,
        `outpoint ${c.outPoint}`,
      ].join('\n'),
    )
    .join('\n');

  const listPath = path.join(os.tmpdir(), `ffmpeg-concat-${Date.now()}.txt`);
  fs.writeFileSync(listPath, listContent, 'utf-8');

  return new Promise((res, rej) => {
    const args = [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-c',
      'copy',
      ...(noAudio ? ['-an'] : []),
      outputPath,
    ];

    const proc = spawn(ffmepgPath, args);

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      if (onProgress) {
        const percent = parseProgress(text, totalDuration);
        if (percent !== null) onProgress(percent);
      }
    });

    proc.on('close', (code: number | null) => {
      fs.unlink(listPath, () => {});

      if (code === 0) {
        onProgress?.(100);
        res();
      } else rej(new Error(`Ffmpeg concat ended with code ${code}`));
    });

    proc.on('error', (err) => {
      fs.unlink(listPath, () => {});
      rej(err);
    });
  });
}

export async function extractThumbnail(inputPath: string): Promise<string> {
  const ffmepgPath = binaryService.getFfmpegPath();

  return new Promise((res, rej) => {
    const args = [
      '-ss',
      '0',
      '-i',
      inputPath,
      '-frames:v',
      '1',
      '-f',
      'image2pipe',
      '-vcodec',
      'png',
      '-vf',
      'scale=160:-1',
      'pipe:1',
    ];

    const proc = spawn(ffmepgPath, args);

    const chunks: Buffer[] = [];
    proc.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        const buffer = Buffer.concat(chunks);
        const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
        res(base64);
      } else rej(new Error(`Ffmpeg thumbnail ended with code ${code}`));
    });

    proc.on('error', rej);
  });
}
