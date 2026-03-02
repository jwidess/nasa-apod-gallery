import { useEffect } from 'react';
import type { ApodItem } from '../types/apod';
import { getImageSrc, getMediaFormat } from '../types/apod';
import './ApodModal.css';

interface ApodModalProps {
  item: ApodItem;
  onClose: () => void;
}

/** Convert "YYYY-MM-DD" → "https://apod.nasa.gov/apod/apYYMMDD.html" */
function getApodPageUrl(date: string): string {
  const [year, month, day] = date.split('-');
  return `https://apod.nasa.gov/apod/ap${year.slice(2)}${month}${day}.html`;
}

/** YouTube embed URL → regular watch URL for the "Watch on YouTube" link */
function embedToWatchUrl(url: string): string {
  const match = url.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/);
  return match ? `https://www.youtube.com/watch?v=${match[1]}` : url;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export default function ApodModal({ item, onClose }: ApodModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const apodPageUrl = getApodPageUrl(item.date);
  const isVideo = item.media_type === 'video';
  const isDirectVid = isDirectVideoUrl(item.url);
  const isGif = /\.gif(\?.*)?$/i.test(item.url);
  const mediaFormat = getMediaFormat(item);

  const renderModalMedia = () => {
    if (isVideo) {
      if (isDirectVid) {
        return (
          <video
            className="modal-media__video"
            src={item.url}
            controls
            autoPlay
            muted
            loop
            playsInline
            poster={item.thumbnail_url}
          />
        );
      }
      // YouTube — show thumbnail; link opens YouTube
      const thumb = item.thumbnail_url ?? `https://img.youtube.com/vi/${getYTId(item.url)}/hqdefault.jpg`;
      return (
        <a
          href={embedToWatchUrl(item.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="modal-media__yt-link"
          title="Watch on YouTube"
        >
          <img src={thumb} alt={item.title} className="modal-media__img" />
          <span className="modal-media__play-btn" aria-hidden="true">▶</span>
        </a>
      );
    }
    // Use the same src as the grid card — guaranteed browser cache hit, and
    // correctly uses url (not hdurl) for GIFs to preserve animation.
    return (
      <img
        src={getImageSrc(item)}
        alt={item.title}
        className="modal-media__img"
      />
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Media preview */}
        <div className="modal-media">
          {renderModalMedia()}
        </div>

        {/* Info body */}
        <div className="modal-body">
          <div className="modal-header">
            <h2 className="modal-title">{item.title}</h2>
            <div className="modal-header__meta">
              <span className="modal-format-badge">{mediaFormat}</span>
              <span className="modal-date">{item.date}</span>
            </div>
          </div>

          <p className="modal-explanation">{item.explanation}</p>

          {/* Action links */}
          <div className="modal-links">
            <a
              href={apodPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-link"
            >
              View on NASA APOD ↗
            </a>

            {!isVideo && item.hdurl && !isGif && (
              <a
                href={item.hdurl}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-link"
              >
                Full Resolution ↗
              </a>
            )}

            {isVideo && !isDirectVid && (
              <a
                href={embedToWatchUrl(item.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-link"
              >
                Watch on YouTube ↗
              </a>
            )}

            {isVideo && isDirectVid && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-link"
              >
                Open Video ↗
              </a>
            )}
          </div>

          {item.copyright && (
            <p className="modal-copyright">© {item.copyright}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function getYTId(url: string): string {
  const m = url.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/);
  return m ? m[1] : '';
}
