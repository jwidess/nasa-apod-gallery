import './GalleryTitle.css';

import logoUrl from '/NASA_logo.svg';

export default function GalleryTitle() {
  return (
    <div className="gallery-title" aria-label="NASA APOD Gallery">
      <span className="gallery-title__logo-wrapper">
        <img
          src={logoUrl}
          alt="NASA"
          className="gallery-title__logo"
          draggable={false}
        />
        <span className="gallery-title__orbit-dot" aria-hidden="true" />
      </span>
      <span className="gallery-title__text">NASA APOD Gallery</span>
    </div>
  );
}
