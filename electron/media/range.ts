export type ByteRange = {
  start: number;
  end: number;
};

export function parseRange(
  header: string | undefined,
  fileSize: number,
): ByteRange | null {
  if (!header) {
    return null;
  }

  if (!header.startsWith('bytes=')) {
    return null;
  }

  const [startString, endString] = header.substring(6).split('-');

  const start = Number(startString);

  if (Number.isNaN(start)) {
    return null;
  }

  const end = endString === '' ? fileSize - 1 : Number(endString);

  if (Number.isNaN(end)) {
    return null;
  }

  return {
    start,
    end: Math.min(end, fileSize - 1),
  };
}
