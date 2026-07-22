import { randomUUID } from 'node:crypto';

class MediaRegistry {
  private readonly files = new Map<string, string>();

  register(path: string): string {
    for (const [id, filePath] of this.files) {
      if (filePath === path) {
        return id;
      }
    }

    const id = randomUUID();
    this.files.set(id, path);
    return id;
  }

  resolve(id: string): string | undefined {
    return this.files.get(id);
  }

  unregister(id: string): void {
    this.files.delete(id);
  }

  clear(): void {
    this.files.clear();
  }
}

export const mediaRegistry = new MediaRegistry();
