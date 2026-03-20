# NASA APOD Gallery

A full page gallery of NASA [Astronomy Picture of the Day](https://apod.nasa.gov/apod/astropix.html) images. This was designed for unattended display on TVs, digital signage (e.g. Yodeck, Screenly, etc.), or as a browser wallpaper.

**NEW!** - This project now uses the phenomenal [ellanan/apod-api](https://github.com/ellanan/apod-api) for faster requests, more reliable responses, built-in caching, and no API key required! Thanks to ellanan for providing this fantastic service. You can read more about the API and its features here: [How I Built a Faster and More Reliable APOD API](https://www.freecodecamp.org/news/building-a-faster-and-more-reliable-apod-api/)

- **Top-left cell** shows today's APOD
- **Other cells** show randomly selected past APODs
- Configured grid size scales dynamically to any display size or aspect ratio
- Videos play muted and looping
- Configurable via URL parameters

![React 19](https://img.shields.io/badge/React-19.2-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Vite](https://img.shields.io/badge/Vite-7.3-purple)



> [!NOTE]
> **View the live page here:** [https://jwidess.github.io/nasa-apod-gallery/](https://jwidess.github.io/nasa-apod-gallery/)

## Example
![Example gallery animation](example.gif)

## URL Parameters

All parameters are optional.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `refresh` | `0` (off) | Auto-refresh interval in **seconds**. `0` disables auto-refresh. Minimum `10` when non-zero. Note: if `cache` TTL is longer than this interval, refreshes will serve the cached data until the TTL expires. |
| `overlay` | `always` | Text info overlay visibility: `always`, `hover`, or `none` |
| `fit` | `cover` | Image scaling: `cover` (fill cell, may crop) or `contain` (full image, black bars) |
| `cache` | `3600` | localStorage cache TTL in **seconds**. Skips API calls on page reload if the cache is fresh. `0` disables caching. Minimum `10` when non-zero. Cache is also invalidated when the UTC date changes (new day = new APOD). |
| `text_scale` | `1.0` | Overlay text size multiplier. `1.5` = 50% larger, `2.0` = double size, etc. Clamped to `0.5`–`4.0`. Useful for large TVs or high DPI displays. |
| `cols` | `2` | Number of grid columns. Min 1, max 100; total cells (cols*rows) capped at 100. |
| `rows` | `2` | Number of grid rows. Min 1, max 100; total cells (cols*rows) capped at 100. |
| `show_title` | `1` | Show floating "NASA APOD Gallery" badge (set to `0` to hide). |

### Example URLs

```
# Refresh every hour, 3x2 grid
https://jwidess.github.io/nasa-apod-gallery/?refresh=3600&cols=3&rows=2

# TV wallpaper - no overlay, refresh every 30 minutes
https://jwidess.github.io/nasa-apod-gallery/?refresh=1800&cache=1800&overlay=none

# Contain mode to see full images without cropping
https://jwidess.github.io/nasa-apod-gallery/?fit=contain
```

## API Source

This app uses ellanan's APOD API at [https://apod.ellanan.com/api](https://apod.ellanan.com/api). More info can be found in their repo here: [ellanan/apod-api](https://github.com/ellanan/apod-api)

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 7](https://vite.dev/)
- ellanan's [apod-api](https://github.com/ellanan/apod-api)

## AI Disclaimer: 
This project was developed with significant work from AI code generation tools, as I am still new to web development. However, I have done much testing across multiple machines and displays of different resolutions and DPI to verify that the gallery functions and renders appropriately.

## License

GNU Affero General Public License v3.0 
