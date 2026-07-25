import { z } from 'zod';
import { api } from '../api';

// ─── Schema ─────────────────────────────────────────

export const PlatformConfigSchema = z.object({
  gst_rate: z.number().optional().default(12),
  min_order_amount: z.number().optional().default(20000),
  shipping_threshold: z.number().optional().default(5000),
  shipping_fee: z.number().optional().default(250),
  default_moq: z.number().optional().default(1),
  max_order_qty: z.number().optional().default(100),
  comingSoonMode: z.boolean().optional().default(true),
  maintenanceMode: z.boolean().optional().default(false),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

// ─── Defaults ───────────────────────────────────────

const DEFAULT_CONFIG: PlatformConfig = {
  gst_rate: 12,
  min_order_amount: 20000,
  shipping_threshold: 5000,
  shipping_fee: 250,
  default_moq: 1,
  max_order_qty: 100,
  comingSoonMode: true,
  maintenanceMode: false,
};

// ─── In-memory cache ────────────────────────────────

let cachedConfig: PlatformConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds for quick updates

// ─── API ────────────────────────────────────────────

export async function getPlatformConfig(): Promise<PlatformConfig> {
  // Return cached if still fresh
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const { data } = await api.get('/config/platform');
    const rawData = data.data ?? data;
    const parsed = PlatformConfigSchema.parse(rawData);
    cachedConfig = parsed;
    cacheTimestamp = Date.now();
    return parsed;
  } catch (err) {
    console.warn('[config.api] Failed to fetch platform config, using defaults/cached', err);
    if (!cachedConfig) {
      cachedConfig = DEFAULT_CONFIG;
      cacheTimestamp = Date.now();
    }
    return cachedConfig;
  }
}

export async function getComingSoonStatus(): Promise<boolean> {
  try {
    const config = await getPlatformConfig();
    return Boolean(config.comingSoonMode);
  } catch {
    return true;
  }
}

export function invalidateConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

