import { useEffect, useRef } from 'react';
import type { ApodItem } from '../types/apod';
import { getGridImageProps } from '../types/apod';
import type { OverlayMode, FitMode } from '../hooks/useUrlParams';
import './ApodCard.css';

interface ApodCardProps {
  item: ApodItem;
  overlay: OverlayMode;
  fit: FitMode;
  isPrimary?: boolean;
  onOpen: () => void;
}

/** Extract a YouTube video ID from embed, short, or watch URLs. */
function getYoutubeId(url: string): string | null {
  const embedMatch = url.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/);
  if (embedMatch) return embedMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return shortMatch[1];
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  return null;
}

/** Extract a Vimeo video ID from player or standard Vimeo URLs. */
function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/|)(\d+)/);
  return match ? match[1] : null;
}

/** True if the URL looks like a directly-hosted video file. */
function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export default function ApodCard({
  item,
  overlay,
  fit,
  isPrimary = false,
  onOpen,
}: ApodCardProps) {
  // Detect GIFs so we can restart them periodically (every 15s)
  const isGif = item.media_type === 'image' && /\.gif(\?.*)?$/i.test(item.url);
  const gifImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isGif) return;
    const id = setInterval(() => {
      const img = gifImgRef.current;
      if (!img) return;
      const src = img.src;
      img.src = '';
      img.src = src;
    }, 15_000);
    return () => clearInterval(id);
  }, [isGif]);
  const overlayClass =
    overlay === 'hover'
      ? 'overlay overlay--hover'
      : overlay === 'always'
      ? 'overlay overlay--always'
      : 'overlay overlay--none';

  const renderOverlay = () => (
    <div className={overlayClass}>
      {isPrimary && <span className="overlay__badge">Today</span>}
      <span className="overlay__title">{item.title}</span>
      <span className="overlay__date">{item.date}</span>
      {item.copyright && (
        <span className="overlay__copyright">© {item.copyright}</span>
      )}
    </div>
  );

  if (item.media_type === 'video') {
    const youtubeId = getYoutubeId(item.url);

    // ── YouTube embed ────────────────────────────────────────
    if (youtubeId) {
      const embedSrc =
        `https://www.youtube.com/embed/${youtubeId}` +
        `?autoplay=1&mute=1&loop=1&playlist=${youtubeId}` +
        `&controls=0&rel=0&modestbranding=1&playsinline=1`;

      return (
        <div className="apod-card apod-card--video apod-card--clickable" onClick={onOpen}>
          <iframe
            src={embedSrc}
            title={item.title}
            allow="autoplay; fullscreen; picture-in-picture"
            className="apod-video"
          />
          <div className="apod-card__click-shield" aria-hidden="true" />
          {renderOverlay()}
        </div>
      );
    }

    // ── Vimeo embed ─────────────────────────────────────────
    const vimeoId = getVimeoId(item.url);
    if (vimeoId) {
      // background=1 enables Vimeo's background mode: autoplay, muted, looping, no controls
      const embedSrc =
        `https://player.vimeo.com/video/${vimeoId}` +
        `?autoplay=1&autopause=0&muted=1&loop=1&background=1`;

      return (
        <div className="apod-card apod-card--video apod-card--clickable" onClick={onOpen}>
          <iframe
            src={embedSrc}
            title={item.title}
            allow="autoplay; fullscreen; picture-in-picture"
            className="apod-video"
          />
          <div className="apod-card__click-shield" aria-hidden="true" />
          {renderOverlay()}
        </div>
      );
    }

    // ── Direct video file (.mp4 / .webm / etc.) ───────────────
    if (isDirectVideoUrl(item.url)) {
      return (
        <div className="apod-card apod-card--video apod-card--clickable" onClick={onOpen}>
          <video
            className="apod-video apod-video--html5"
            src={item.url}
            autoPlay
            muted
            loop
            playsInline
            poster={item.thumbnail_url}
          />
          {renderOverlay()}
        </div>
      );
    }

    // ── Unrecognised video URL — show thumbnail/fallback ──────
    const fallbackSrc = item.thumbnail_url || item.url;
    return (
      <div className="apod-card apod-card--image apod-card--clickable" onClick={onOpen}>
        <img
          src={fallbackSrc}
          alt={item.title}
          className={`apod-image apod-image--${fit}`}
        />
        <div className="play-indicator" aria-hidden="true">▶</div>
        {renderOverlay()}
      </div>
    );
  }

  // ── Standard image (incl. GIFs) ─────────────────────────
  const { src: imgSrc, srcSet: imgSrcSet } = getGridImageProps(item);

  return (
    <div className="apod-card apod-card--image apod-card--clickable" onClick={onOpen}>
      <img
        ref={isGif ? gifImgRef : undefined}
        src={imgSrc}
        srcSet={imgSrcSet}
        alt={item.title}
        className={`apod-image apod-image--${fit}`}
        loading="lazy"
      />
      {renderOverlay()}
    </div>
  );
}
