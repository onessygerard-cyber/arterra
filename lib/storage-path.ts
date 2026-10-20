const MARKER = '/storage/v1/object/public/artwork-images/';

export function artworkImagePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const i = url.indexOf(MARKER);
  if (i === -1) return null;
  try {
    return decodeURIComponent(url.slice(i + MARKER.length));
  } catch {
    return null;
  }
}