import { apiClient } from "@/lib/apiClient";

export interface InstagramStatus {
  connected: boolean;
  username: string | null;
  postCount: number;
  error: string | null;
}

/**
 * Whether the saved token still works, and whose account it points at.
 *
 * This calls Instagram rather than reporting that a string is stored: tokens
 * expire after 60 days, and an expired one is still a stored string.
 */
export async function getInstagramStatus(): Promise<InstagramStatus> {
  const { data } = await apiClient.get<{ data: InstagramStatus }>("/admin/instagram/status");
  return data.data;
}

/** Exchange the saved long-lived token for another 60 days. */
export async function refreshInstagramToken(): Promise<{ refreshed: boolean; error: string | null }> {
  const { data } = await apiClient.post<{ data: { refreshed: boolean; error: string | null } }>(
    "/admin/instagram/refresh",
  );
  return data.data;
}
