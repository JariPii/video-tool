import http from 'node:http';
import fs from 'node:fs';
import { mediaRegistry } from './media.registry';
import { parseRange } from './range';
import { getMimeType } from './mime';

export class MediaServer {
  constructor(private readonly port = 39127) {}

  get url() {
    return `http://127.0.0.1:${this.port}`;
  }

  mediaUrl(id: string): string {
    return `${this.url}/media/${id}`;
  }

  start(): void {
    const server = http.createServer((req, res) => {
      if (!req.url?.startsWith('/media/')) {
        res.writeHead(404);
        res.end();
        return;
      }

      const id = req.url.substring('/media/'.length);
      const file = mediaRegistry.resolve(id);

      if (file === undefined) {
        res.writeHead(404);
        res.end();
        return;
      }

      const stat = fs.statSync(file);
      const range = parseRange(req.headers.range, stat.size);

      if (range === null) {
        res.writeHead(200, {
          'Content-Type': getMimeType(file),
          'Content-Length': stat.size,
          'Accept-Ranges': 'bytes',
        });

        const stream = fs.createReadStream(file);
        stream.on('error', console.error);
        stream.pipe(res);
        return;
      }

      const { start, end } = range;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Type': getMimeType(file),
        'Content-Length': chunkSize,
        'Content-Range': `bytes ${start} - ${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
      });

      const stream = fs.createReadStream(file, { start, end });
      stream.on('error', console.error);
      stream.pipe(res);
    });

    server.listen(this.port, () => {
      console.log(`Media server listening on port ${this.port}`);
    });
  }
}

export const mediaServer = new MediaServer();
