import type { ApodItem } from '../types/apod';
import type { OverlayMode, FitMode } from '../hooks/useUrlParams';
import ApodCard from './ApodCard';
import './ApodGrid.css';

interface ApodGridProps {
  items: ApodItem[];
  overlay: OverlayMode;
  fit: FitMode;
  onCardClick: (item: ApodItem) => void;
}

export default function ApodGrid({ items, overlay, fit, onCardClick }: ApodGridProps) {
  return (
    <div className="apod-grid">
      {items.map((item, index) => (
        <ApodCard
          key={`${item.date}-${item.url}`}
          item={item}
          overlay={overlay}
          fit={fit}
          isPrimary={index === 0}
          onOpen={() => onCardClick(item)}
        />
      ))}
    </div>
  );
}
