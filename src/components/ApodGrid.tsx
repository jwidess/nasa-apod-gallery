import React from 'react';
import type { ApodItem } from '../types/apod';
import type { OverlayMode, FitMode } from '../hooks/useUrlParams';
import ApodCard from './ApodCard';
import './ApodGrid.css';

interface ApodGridProps {
  items: ApodItem[];
  overlay: OverlayMode;
  fit: FitMode;
  cols: number;
  rows: number;
  onCardClick: (item: ApodItem) => void;
}

export default function ApodGrid({ items, overlay, fit, cols, rows, onCardClick }: ApodGridProps) {
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  };

  return (
    <div className="apod-grid" style={gridStyle}>
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
