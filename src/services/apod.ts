import type { ApodItem } from '../types/apod';

const BASE_URL = 'https://api.nasa.gov/planetary/apod';

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
