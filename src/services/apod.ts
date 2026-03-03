import type { ApodItem } from '../types/apod';

const BASE_URL = 'https://api.nasa.gov/planetary/apod';

const TODAY_CACHE_KEY = 'apod_today_cache';
const RANDOMS_CACHE_KEY = 'apod_randoms_cache';

interface TodayCacheEntry {
  item: ApodItem;
  /** APOD date string (YYYY-MM-DD at UTC-4) when this was fetched. */
  apodDate: string;
}

interface RandomsCacheEntry {
  items: ApodItem[];
  /** Unix timestamp (ms) at which the entry was written. */
  timestamp: number;
  /** APOD date string (YYYY-MM-DD at UTC-4) when this was fetched. */
  apodDate: string;
}

/**
 * Current APOD calendar date as "YYYY-MM-DD".
 *
 * NASA publishes new APODs at 00:00 Eastern Time (UTC-4 standard/UTC-5 DST).
 * We use a fixed UTC-4 offset, screw DST!
 * https://github.com/nasa/apod-api/issues/26
 */
function apodDate(): string {
  const et = new Date(Date.now() - 4 * 60 * 60 * 1000);
  return et.toISOString().slice(0, 10);
}

// ── Today's APOD cache ────────────────────────────────────────────────────────

/**
 * Returns the cached today APOD if it is still valid, otherwise null.
 *
 * Today's APOD is immutable for the rest of its day, so no TTL is applied. 
 * The entry is only evicted when the APOD date rolls over.
 */
export function readTodayCache(): ApodItem | null {
  try {
    const raw = localStorage.getItem(TODAY_CACHE_KEY);
    if (!raw) return null;
    const entry: TodayCacheEntry = JSON.parse(raw);
    if (entry.apodDate !== apodDate()) {
      console.log('[APOD][Cache] Today miss — APOD date rolled over');
      return null;
    }
    console.log(`[APOD][Cache] Today hit — ${entry.item.date} "${entry.item.title}"`);
    return entry.item;
  } catch {
    return null;
  }
}

export function writeTodayCache(item: ApodItem): void {
  try {
    const entry: TodayCacheEntry = { item, apodDate: apodDate() };
    localStorage.setItem(TODAY_CACHE_KEY, JSON.stringify(entry));
    console.log(`[APOD][Cache] Today written — ${item.date} "${item.title}"`);
  } catch (e) {
    console.warn('[APOD][Cache] Today write failed:', e);
  }
}

// ── Randoms cache ─────────────────────────────────────────────────────────────

/**
 * Returns cached randoms if still valid, otherwise null.
 *
 * Invalidated when:
 *  - cacheTtl is 0 (disabled)
 *  - Entry is missing or unparseable
 *  - APOD date has rolled over (new day deserves fresh randoms too)
 *  - Age exceeds cacheTtl
 *  - Cached count doesn't match requested count (grid size changed)
 */
export function readRandomsCache(count: number, cacheTtl: number): ApodItem[] | null {
  if (cacheTtl <= 0) return null;
  try {
    const raw = localStorage.getItem(RANDOMS_CACHE_KEY);
    if (!raw) return null;
    const entry: RandomsCacheEntry = JSON.parse(raw);
    if (entry.apodDate !== apodDate()) {
      console.log('[APOD][Cache] Randoms miss — APOD date rolled over');
      return null;
    }
    const ageSeconds = (Date.now() - entry.timestamp) / 1000;
    if (ageSeconds > cacheTtl) {
      console.log(`[APOD][Cache] Randoms miss — TTL expired (age ${ageSeconds.toFixed(0)}s > ${cacheTtl}s)`);
      return null;
    }
    if (entry.items.length !== count) {
      console.log(`[APOD][Cache] Randoms miss — grid size changed (cached ${entry.items.length}, need ${count})`);
      return null;
    }
    console.log(`[APOD][Cache] Randoms hit — ${entry.items.length} items, age ${ageSeconds.toFixed(0)}s`);
    return entry.items;
  } catch {
    return null;
  }
}

export function writeRandomsCache(items: ApodItem[]): void {
  try {
    const entry: RandomsCacheEntry = { items, timestamp: Date.now(), apodDate: apodDate() };
    localStorage.setItem(RANDOMS_CACHE_KEY, JSON.stringify(entry));
    console.log(`[APOD][Cache] Randoms written — ${items.length} items, TTL starts now`);
  } catch (e) {
    console.warn('[APOD][Cache] Randoms write failed:', e);
  }
}

// ── API fetch helpers ─────────────────────────────────────────────────────────

/** Fetch today's APOD (single object response). */
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

/** Fetch N randomly selected past APODs (array response). */
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
