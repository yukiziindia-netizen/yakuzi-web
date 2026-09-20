import axios from "axios";
import toast from "react-hot-toast";
import { useAdminAuth } from "@/store";
import { readAccessToken, clearTokens } from "@yukizi/api-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

/**
 * A file upload gets much longer than a normal request.
 *
 * Every request shared one 30-second timeout, uploads included. A banner video
 * is allowed to be 40 MB; on a typical Indian broadband uplink that is well
 * over a minute, so axios aborted the request long before the file finished
 * going up. The admin saw a generic network error, the server never saw a
 * complete upload, and nothing in either log said "timeout" — which is why
 * this looked like uploads being broken rather than slow.
 *
 * Keyed on the payload being FormData rather than on the URL, so every upload
 * path is covered — banners, collection slideshows, product media, blog
 * images, order documents — including any added later.
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
    // readAccessToken() also migrates a session still stored under the
    // legacy pb_access_token / pb_token names, so the rename cannot log
    // an admin out mid-session.
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
        useAdminAuth.getState().logout();
        window.location.href = "/auth";
      }
    } else if (status === 403) {
      // Only for something the user actually did. Pages fetch data the signed-in
      // admin may not be granted (the dashboard reads platform settings, for
      // example); toasting those turns every page load into an error popup,
      // while the page itself already shows nothing for that section.
      const isRead = (error?.config?.method ?? "get").toLowerCase() === "get";
      if (!isRead) {
        toast.error(serverMsg || "You do not have permission to perform this action.");
      }
    } else if (status && status >= 500) {
      toast.error(serverMsg || "Something went wrong. Please try again.");
    } else if (!error?.response && error?.request) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);
