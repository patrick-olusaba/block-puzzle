import React from 'react';
import type { BlockShape } from '../types';
import './PieceTray.css';

const CELL_SIZE = 26;

interface PieceTrayProps {
  pieces: (BlockShape | null)[];
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  draggingIndex: number | null;
  onTouchStart: (e: React.TouchEvent, index: number) => void;
}

export const PiecePreview: React.FC<{ piece: BlockShape }> = ({ piece }) => {
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;

  return (
    <div
      className="piece-preview"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
        gap: '2px',
      }}
    >
      {piece.shape.map((row, r) =>
        row.map((filled, c) => (
          <div
            key={`${r}-${c}`}
            className={`piece-cell ${filled ? `filled color-${piece.color}` : 'ghost'}`}
          />
        ))
      )}
    </div>
  );
};

const PieceTray: React.FC<PieceTrayProps> = ({
  pieces,
  onDragStart,
  onDragEnd,
  draggingIndex,
  onTouchStart,
}) => {
  return (
    <div className="piece-tray">
      {pieces.map((piece, i) => (
        <div
          key={i}
          className={`tray-slot ${piece ? 'has-piece' : 'empty-slot'} ${draggingIndex === i ? 'dragging' : ''}`}
          draggable={!!piece}
          onDragStart={piece ? (e) => onDragStart(e, i) : undefined}
          onDragEnd={onDragEnd}
          onTouchStart={piece ? (e) => onTouchStart(e, i) : undefined}
        >
          {piece ? <PiecePreview piece={piece} /> : null}
        </div>
      ))}
    </div>
  );
};

export default PieceTray;
