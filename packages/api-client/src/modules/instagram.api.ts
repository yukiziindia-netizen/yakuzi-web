import { api } from '../api';

export interface InstagramPost {
  id: string;
  caption: string | null;
  /** IMAGE | VIDEO | CAROUSEL_ALBUM */
  mediaType: string;
  /** Already resolved to a still for videos, so this is always displayable. */
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  timestamp: string | null;
}

/**
 * Recent posts for the storefront rail.
 *
 * The access token lives on the API and is never sent to a browser — this
 * returns posts only. Admin's connect/refresh calls are authenticated and go
 * through admin's own apiClient instead.
 */
export async function getInstagramFeed(limit = 8): Promise<InstagramPost[]> {
  const { data } = await api.get('/instagram/feed', { params: { limit } });
  return Array.isArray(data?.data) ? data.data : [];
}
