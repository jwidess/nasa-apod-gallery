export type OverlayMode = 'always' | 'hover' | 'none';
export type FitMode = 'cover' | 'contain';

export interface UrlParams {
  /** NASA API key — defaults to DEMO_KEY */
  apiKey: string;
  /** Auto-refresh interval in seconds. 0 = disabled. */
  refreshInterval: number;
  /** Controls when the info overlay is visible */
  overlay: OverlayMode;
  /** CSS object-fit for images */
  fit: FitMode;
  /**
   * localStorage cache TTL in seconds. 0 = caching disabled.
   * Defaults to 3600 (1 hour) when the parameter is absent.
   */
  cacheTtl: number;
  /**
   * Overlay text scale multiplier. 1.0 = default size.
   * Clamped to [0.5, 4.0].
   */
  textScale: number;
  /**
   * Number of grid columns. Defaults to 2.
   * Clamped to 1-100. Product cols*rows is capped at 100.
   */
  cols: number;
  /**
   * Number of grid rows. Defaults to 2.
   * Clamped to 1-100. Product cols*rows is capped at 100.
   */
  rows: number;
  /**
   * Whether to show the floating "NASA APOD Gallery" title badge.
   * Default: true
   */
  showTitle: boolean;
}

/**
 * Reads display/behaviour config from the page URL query string.
 *
 * Supported parameters:
 *   ?api_key=YOUR_KEY           — NASA API key (default: DEMO_KEY)
 *   &refresh=3600               — auto-refresh every N seconds (default: 0, off)
 *   &overlay=always|hover|none  — info overlay visibility (default: always)
 *   &fit=cover|contain          — image scaling (default: cover)
 *   &cache=3600                 — localStorage cache TTL in seconds (default: 3600, 0 = off)
 *   &text_scale=1.5             — overlay text size multiplier (default: 1.0, range 0.5–4.0)
 *   &cols=2                     — number of grid columns (default: 2, min 1, max 100, product capped at 100)
 *   &rows=2                     — number of grid rows (default: 2, min 1, max 100, product capped at 100)
 *   &show_title=1               — show floating "NASA APOD Gallery" title badge (default: shown) or 0 to hide
 *
 * Example:
 *   https://jwidess.github.io/nasa-apod-gallery/?api_key=ABC123&refresh=3600&overlay=hover&fit=cover
 */
export function useUrlParams(): UrlParams {
  const params = new URLSearchParams(window.location.search);

  const apiKey = params.get('api_key') || 'DEMO_KEY';

  const refreshRaw = params.get('refresh');
  const refreshParsed =
    refreshRaw !== null && !isNaN(Number(refreshRaw))
      ? parseInt(refreshRaw, 10)
      : 0;
  // 0 = disabled; any positive value is clamped to a minimum of 10s to avoid API spam
  const refreshInterval = refreshParsed === 0 ? 0 : Math.max(10, refreshParsed);

  const overlayRaw = params.get('overlay');
  const overlay: OverlayMode =
    overlayRaw === 'hover' || overlayRaw === 'none' || overlayRaw === 'always'
      ? overlayRaw
      : 'always';

  const fitRaw = params.get('fit');
  const fit: FitMode = fitRaw === 'contain' ? 'contain' : 'cover';

  const cacheRaw = params.get('cache');
  const cacheParsed =
    cacheRaw !== null && !isNaN(Number(cacheRaw))
      ? parseInt(cacheRaw, 10)
      : 3600;
  // 0 = disabled; any positive value is clamped to a minimum of 10s to avoid API spam
  const cacheTtl = cacheParsed === 0 ? 0 : Math.max(10, cacheParsed);

  const textScaleRaw = params.get('text_scale');
  const textScale =
    textScaleRaw !== null && !isNaN(Number(textScaleRaw))
      ? Math.min(4.0, Math.max(0.5, parseFloat(textScaleRaw)))
      : 1.0;

  const colsRaw = params.get('cols');
  let cols =
    colsRaw !== null && !isNaN(Number(colsRaw)) && Number.isInteger(Number(colsRaw))
      ? Math.min(100, Math.max(1, parseInt(colsRaw, 10)))
      : 2;

  const rowsRaw = params.get('rows');
  let rows =
    rowsRaw !== null && !isNaN(Number(rowsRaw)) && Number.isInteger(Number(rowsRaw))
      ? Math.min(100, Math.max(1, parseInt(rowsRaw, 10)))
      : 2;

  // Cap the total cell count at 100 (NASA APOD API limit)
  if (cols * rows > 100) {
    const originalRows = rows;
    rows = Math.floor(100 / cols);
    console.warn(
      `[APOD][useUrlParams] Grid size ${cols}x${originalRows} exceeds 100 cells; ` +
      `clamped to ${cols}x${rows}`
    );
  }

  // default to true when param absent
  const showTitle = params.get('show_title') !== '0';

  return { apiKey, refreshInterval, overlay, fit, cacheTtl, textScale, cols, rows, showTitle };
}
