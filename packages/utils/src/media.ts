/**
 * Is this banner slot holding a video rather than a picture?
 *
 * Decided from the URL rather than from a column, deliberately. Every banner is
 * stored as a plain URL — hero desktop, hero mobile, and each slide of a
 * collection slideshow — and a stored "type" would have to be kept in step with
 * four of them per banner. It would also be a lie the moment somebody replaced
 * one file with the other kind. The upload path always ends in a real
 * extension (`storage.service.ts` builds keys as `<folder>/<uuid>.<ext>`), so
 * the URL already carries the answer.
 *
 * Query strings and fragments are ignored, so CDN URLs with cache-busting
 * parameters still resolve correctly.
 */
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  // A data: URL carries its type up front instead of at the end.
  if (url.startsWith('data:')) return url.startsWith('data:video/');

  const withoutQuery = url.split(/[?#]/)[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => withoutQuery.endsWith(ext));
}

/** The same question about a File the admin has just picked, before upload. */
export function isVideoFile(file: { type?: string; name?: string } | null | undefined): boolean {
  if (!file) return false;
  if (file.type?.startsWith('video/')) return true;
  return isVideoUrl(file.name);
}

/** What the banner file pickers accept. Keep in step with the API's allow-list. */
export const BANNER_ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime';

/**
 * The server's ceilings, restated so the browser can refuse a file before
 * spending two minutes uploading it.
 *
 * These MUST match StorageService.MAX_FILE_SIZE and MAX_VIDEO_SIZE in the API.
 * Being stricter here would reject files the server would have taken; being
 * looser just moves the rejection to the end of a long upload, which is the
 * problem this exists to avoid.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

function megabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * Checks a picked banner file before it is uploaded.
 *
 * Returns a message to show the admin, or null when the file is fine.
 *
 * Worth doing in the browser even though the API validates too: a 60 MB video
 * would otherwise upload for a minute or more on a typical Indian connection
 * and only then come back rejected. Told immediately, they can pick a smaller
 * file instead of watching a progress bar go nowhere.
 */
export function checkBannerFile(
  file: { size?: number; type?: string; name?: string } | null | undefined,
): string | null {
  if (!file) return null;

  const video = isVideoFile(file);
  const type = (file.type ?? '').toLowerCase();

  // An empty type happens with some odd file pickers; fall back to the name.
  const looksLikeImage = type.startsWith('image/');
  if (!video && !looksLikeImage && type) {
    return `${type} is not a supported banner file. Use a JPG, PNG or WebP image, or an MP4, WebM or MOV video.`;
  }

  const limit = video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  const size = file.size ?? 0;
  if (size > limit) {
    return `This ${video ? 'video' : 'image'} is ${megabytes(size)}. The limit is ${megabytes(limit)}${
      video ? '' : ' for images'
    } — please compress it or choose a smaller file.`;
  }

  return null;
}
