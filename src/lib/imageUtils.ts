/**
 * Compresses a base64 data-URL image by:
 *   1. Resizing to fit within maxPx × maxPx (preserving aspect ratio)
 *   2. Re-encoding as JPEG at the given quality (0–1)
 *
 * This keeps stored blobs small enough for Supabase's free-tier statement
 * timeout and prevents the "canceling statement due to statement timeout"
 * (code 57014) error when photos are large phone shots.
 *
 * Typical output: 60–150 KB per photo (vs 3–8 MB raw).
 */
export function compressImage(
  dataUrl: string,
  maxPx = 900,
  quality = 0.78,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxPx / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement('canvas');
      canvas.width  = cw;
      canvas.height = ch;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Canvas not available — fall back to original
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, cw, ch);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = (e) => reject(new Error(`Failed to load image for compression: ${e}`));
    img.src = dataUrl;
  });
}
