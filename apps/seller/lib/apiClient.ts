import axios from "axios";
import toast from "react-hot-toast";
import { useSellerAuth } from "@/store";
import { readAccessToken, clearTokens } from "./tokenStorage";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

/**
 * A file upload gets much longer than a normal request.
 *
 * Every request shared one 30-second timeout, uploads included. Product media
 * and banner videos are allowed to be 40 MB; on a typical Indian broadband
 * uplink that is well over a minute, so axios aborted the request long before
 * the file finished going up. The seller saw a generic network error, the
 * server never saw a complete upload, and nothing in either log said
 * "timeout" — which is why this looked like uploads being broken rather than
 * slow.
 *
 * Keyed on the payload being FormData rather than on the URL, so every upload
 * path is covered, including any added later.
 *
 * Reads and writes keep the 30 seconds. A slow JSON request is a problem worth
 * surfacing quickly; a slow upload is just a big file.
 */
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
});

apiClient.interceptors.request.use((config: any) => {
  // See UPLOAD_TIMEOUT_MS above: uploads are slow by nature, reads are not.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.timeout = UPLOAD_TIMEOUT_MS;
  }

  if (typeof window !== "undefined") {
    // readAccessToken() migrates a session still stored under the legacy
    // pb_access_token / pb_token names, so the rename cannot sign a
    // seller out mid-session.
    const token = readAccessToken();
    if (token && config.headers) {
      const cleanToken = token.replace(/^(Bearer\s+)+/i, "");
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (res: any) => res,
  (error: any) => {
    const status = error?.response?.status;
    const serverMsg = error?.response?.data?.message || error?.response?.data?.error;

    if (status === 401) {
      if (typeof window !== "undefined") {
        clearTokens();
        useSellerAuth.getState().logout();
        window.location.href = "/auth";
      }
    } else if (status === 403) {
      toast.error(serverMsg || "You do not have permission to perform this action.");
    } else if (status && status >= 500) {
      toast.error(serverMsg || "Something went wrong. Please try again.");
    } else if (!error?.response && error?.request) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);
