import { useState, useEffect, useCallback, useRef } from 'react';
import { useUrlParams } from './hooks/useUrlParams';
import { fetchTodayApod, fetchRandomApods, readTodayCache, writeTodayCache, readRandomsCache, writeRandomsCache } from './services/apod';
import type { ApodItem } from './types/apod';
import ApodGrid from './components/ApodGrid';
import ApodModal from './components/ApodModal';
import './App.css';

type LoadState = 'loading' | 'error' | 'ready';

export default function App() {
  const { apiKey, refreshInterval, overlay, fit, cacheTtl, textScale, cols, rows } = useUrlParams();

  // Inject overlay text scale as a CSS custom property on the root element
  useEffect(() => {
    document.documentElement.style.setProperty('--overlay-text-scale', String(textScale));
  }, [textScale]);

  const [items, setItems] = useState<ApodItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<ApodItem | null>(null);

  // Track previous items so we can log replacements
  const prevItemsRef = useRef<ApodItem[]>([]);

  const total = cols * rows;
  const randomsNeeded = total - 1;

  const loadApods = useCallback(async () => {
    // Only show the full loading screen on the very first load (no items yet).
    // On subsequent refreshes keep the existing grid visible.
    if (prevItemsRef.current.length === 0) {
      setLoadState('loading');
    }
    console.log('[APOD][App] loadApods triggered — apiKey suffix:', apiKey.slice(-4), '— cacheTtl:', cacheTtl);

    try {
      // ── Today's APOD — only re-fetched when the APOD date rolls over ────────
      let today: ApodItem | null = readTodayCache();
      if (!today) {
        today = await fetchTodayApod(apiKey);
        writeTodayCache(today);
      }

      if (randomsNeeded <= 0) {
        // 1x1 grid — only today's APOD needed
        console.log('[APOD][App] 1x1 grid, skipping randoms fetch');
        const next = [today];
        prevItemsRef.current = next;
        setItems(next);
        setLoadState('ready');
        return;
      }

      // ── Randoms — re-fetched on TTL expiry or APOD date rollover ────────────
      let randoms: ApodItem[] | null = readRandomsCache(randomsNeeded, cacheTtl);
      if (!randoms) {
        const candidates = await fetchRandomApods(apiKey, randomsNeeded);

        const seen = new Set([today.date]);
        randoms = [];
        for (const c of candidates) {
          if (!seen.has(c.date)) {
            seen.add(c.date);
            randoms.push(c);
          }
          if (randoms.length === randomsNeeded) break;
        }

        // If still short, today's date collided with a random, top up
        if (randoms.length < randomsNeeded) {
          console.warn(`[APOD][App] Deduplication collision — fetching ${randomsNeeded - randoms.length} extra APODs`);
          const extra = await fetchRandomApods(apiKey, randomsNeeded);
          for (const c of extra) {
            if (!seen.has(c.date)) {
              seen.add(c.date);
              randoms.push(c);
            }
            if (randoms.length === randomsNeeded) break;
          }
        }

        writeRandomsCache(randoms);
      }

      const next = [today, ...randoms];

      // Log any slots where the displayed item changed
      const prev = prevItemsRef.current;
      if (prev.length > 0) {
        next.forEach((item, i) => {
          if (prev[i] && prev[i].date !== item.date) {
            console.log(
              `[APOD][App] Grid slot ${i} replaced:`,
              `"${prev[i].title}" (${prev[i].date})`,
              '→',
              `"${item.title}" (${item.date})`,
            );
          }
        });
      }

      prevItemsRef.current = next;
      setItems(next);
      setLoadState('ready');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setLoadState('error');
    }
  }, [apiKey, cacheTtl, total]);

  // Initial load
  useEffect(() => {
    loadApods();
  }, [loadApods]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;
    console.log(`[APOD][App] Auto-refresh enabled every ${refreshInterval}s`);
    const id = setInterval(loadApods, refreshInterval * 1000);
    return () => clearInterval(id);
  }, [loadApods, refreshInterval]);

  // Show full loading screen only while initially loading (no items yet)
  if (loadState === 'loading' && items.length === 0) {
    return (
      <div className="status-screen">
        <div className="status-spinner" />
        <p className="status-text">Loading APOD&hellip;</p>
      </div>
    );
  }

  if (loadState === 'error' && items.length === 0) {
    return (
      <div className="status-screen">
        <p className="status-text status-text--error">Failed to load APOD</p>
        <p className="status-subtext">{errorMsg}</p>
        <button className="status-retry" onClick={loadApods}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <ApodGrid
        items={items}
        overlay={overlay}
        fit={fit}
        cols={cols}
        rows={rows}
        onCardClick={setSelectedItem}
      />
      {selectedItem && (
        <ApodModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
}
