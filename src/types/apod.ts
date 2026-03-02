export interface ApodItem {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  copyright?: string;
  service_version?: string;
}

/**
 * Formats whose file extension browsers cannot natively render in <img>.
 * For these, `hdurl` is skipped and we use the web-friendly `url` instead.
 */
const UNSUPPORTED_IMG_EXTS = /\.(tif|tiff|fits?|fts|cr2|nef|arw|psd)(\?.*)?$/i;

/**
 * Returns the URL that should be used to display an APOD image, used by both
 * the grid card and the detail modal so they always request the same URL and
 * the browser cache is hit on modal open.
 *
 * Rules:
 *  - GIFs: always use `url` — `hdurl` for a GIF entry is a static JPEG
 *    snapshot and would break the animation.
 *  - Browser-incompatible formats (TIFF, FITS, raw, etc.): `hdurl` can be
 *    one of these even when `url` is a JPEG — always fall back to `url`.
 *  - Everything else: prefer `hdurl` (higher resolution) with `url` fallback.
 */
export function getImageSrc(item: ApodItem): string {
  if (/\.gif(\?.*)?$/i.test(item.url)) {
    return item.url;
  }
  if (item.hdurl && UNSUPPORTED_IMG_EXTS.test(item.hdurl)) {
    return item.url;
  }
  return item.hdurl ?? item.url;
}

/** Returns a short uppercase format label for the modal badge, e.g. "JPEG", "GIF", "MP4", "YouTube". */
export function getMediaFormat(item: ApodItem): string {
  if (item.media_type === 'video') {
    if (/youtube\.com|youtu\.be/i.test(item.url)) return 'YouTube';
    const vidMatch = item.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);
    return vidMatch ? vidMatch[1].toUpperCase() : 'Video';
  }
  // Image: report the format of the src we actually use
  const src = getImageSrc(item);
  const imgMatch = src.match(/\.(jpe?g|png|gif|webp|tiff?|fits?|bmp|svg)(\?.*)?$/i);
  if (!imgMatch) return 'Image';
  const ext = imgMatch[1].toLowerCase();
  if (ext === 'jpeg' || ext === 'jpg') return 'JPEG';
  if (ext === 'tiff' || ext === 'tif') return 'TIFF';
  if (ext === 'fits' || ext === 'fit') return 'FITS';
  return ext.toUpperCase();
}
