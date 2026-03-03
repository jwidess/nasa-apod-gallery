import type { ApodItem } from '../types/apod';

const BASE_URL = 'https://api.nasa.gov/planetary/apod';
const CACHE_KEY = 'apod_gallery_cache';

interface CacheEntry {
  items: ApodItem[];
  /** Unix timestamp (ms) at which the entry was written. */
  timestamp: number;
  /** UTC date string (YYYY-MM-DD) when the entry was written. */
  utcDate: string;
}

/** Current UTC date as "YYYY-MM-DD". */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns cached ApodItems if the cache is valid, otherwise null.
 *
 * Invalidated when:
 *  - cacheTtl is 0 (disabled)
 *  - Entry is missing or unparseable
 *  - UTC date has rolled over (new day = new APOD available)
 *  - Age exceeds cacheTtl
 */
export function readApodCache(cacheTtl: number): ApodItem[] | null {
  if (cacheTtl <= 0) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (entry.utcDate !== todayUtc()) {
      console.log('[APOD][Cache] Miss — UTC date rolled over');
      return null;
    }
    const ageSeconds = (Date.now() - entry.timestamp) / 1000;
    if (ageSeconds > cacheTtl) {
      console.log(`[APOD][Cache] Miss — TTL expired (age ${ageSeconds.toFixed(0)}s > ${cacheTtl}s)`);
      return null;
    }
    console.log(`[APOD][Cache] Hit — age ${ageSeconds.toFixed(0)}s, ${entry.items.length} items`);
    return entry.items;
  } catch {
    return null;
  }
}

/** Persists fetched items to localStorage. */
export function writeApodCache(items: ApodItem[]): void {
  try {
    const entry: CacheEntry = {
      items,
      timestamp: Date.now(),
      utcDate: todayUtc(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    console.log(`[APOD][Cache] Written — ${items.length} items, TTL starts now`);
  } catch (e) {
    // localStorage may be unavailable (private browsing quota) — non-fatal.
    console.warn('[APOD][Cache] Write failed:', e);
  }
}

/**
 * Fetch today's APOD (single object response).
 */
export async function fetchTodayApod(apiKey: string): Promise<ApodItem> {
  const url = `${BASE_URL}?api_key=${encodeURIComponent(apiKey)}&thumbs=true`;
  console.log('[APOD] Fetching today\'s APOD →', url.replace(encodeURIComponent(apiKey), '<api_key>'));
  const t0 = performance.now();
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[APOD] fetchTodayApod failed', response.status, body || response.statusText);
    throw new Error(`APOD API ${response.status}: ${body || response.statusText}`);
  }
  const data = await response.json() as ApodItem;
  console.log(
    `[APOD] Today's APOD received in ${(performance.now() - t0).toFixed(0)}ms →`,
    `[${data.media_type}] ${data.date} — ${data.title}`,
  );
  return data;
}

/**
 * Fetch N randomly selected past APODs (array response).
 */
export async function fetchRandomApods(apiKey: string, count: number): Promise<ApodItem[]> {
  if (count <= 0) {
    console.log('[APOD] fetchRandomApods skipped (count <= 0)');
    return [];
  }

  const url = `${BASE_URL}?api_key=${encodeURIComponent(apiKey)}&count=${count}&thumbs=true`;
  console.log(`[APOD] Fetching ${count} random APODs →`, url.replace(encodeURIComponent(apiKey), '<api_key>'));
  const t0 = performance.now();
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[APOD] fetchRandomApods failed', response.status, body || response.statusText);
    throw new Error(`APOD API ${response.status}: ${body || response.statusText}`);
  }
  const data = await response.json() as ApodItem[];
  console.log(
    `[APOD] ${data.length} random APODs received in ${(performance.now() - t0).toFixed(0)}ms:`,
    data.map(d => `[${d.media_type}] ${d.date} — ${d.title}`),
  );
  return data;
}
