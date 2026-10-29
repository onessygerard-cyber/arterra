const MAX_EDGE = 2000;
const QUALITY = 0.85;
const KEEP_BELOW = 700 * 1024;

export async function shrinkImage(file: File, maxEdge: number = MAX_EDGE): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return file;

    const scale = Math.min(1, maxEdge / Math.max(w, h));
    if (scale === 1 && file.size <= KEEP_BELOW) return file;

    const width = Math.max(1, Math.round(w * scale));
    const height = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    );
    if (!blob) return file;
    if (scale === 1 && blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}