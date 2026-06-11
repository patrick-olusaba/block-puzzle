import React, { useRef, useCallback } from 'react';
import type { Grid, BlockShape, ClearedCellInfo, CellColor } from '../types';
import { canPlace, getPreviewCells, GRID_SIZE } from '../gameLogic';
import './Grid.css';

interface GridProps {
  grid: Grid;
  draggingPiece: BlockShape | null;
  hoverRow: number | null;
  hoverCol: number | null;
  onDrop: (row: number, col: number) => void;
  onHover: (row: number | null, col: number | null) => void;
  clearedRows: number[];
  clearedCols: number[];
  clearedCells: ClearedCellInfo[];
  justPlacedCells: ClearedCellInfo[];
  comboCount: number;
}

const PARTICLE_COLORS: Record<CellColor, string> = {
  empty: '#fff',
  red: '#ff6060',
  blue: '#60a5fa',
  green: '#4ade80',
  yellow: '#fbbf24',
  purple: '#c084fc',
  orange: '#fb923c',
  cyan: '#22d3ee',
  pink: '#f472b6',
};

function generateParticles(color: CellColor, countBoost = 0): Array<{ x: number; y: number; size: number; delay: number; color: string }> {
  const baseCount = 8 + countBoost;
  const count = baseCount + Math.floor(Math.random() * 6);
  const particles: Array<{ x: number; y: number; size: number; delay: number; color: string }> = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const dist = 20 + Math.random() * 32;
    particles.push({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 0.12,
      color: PARTICLE_COLORS[color] || '#fff',
    });
  }
  return particles;
}

const ParticleBurst: React.FC<{ color: CellColor; boost: boolean; index: number; total: number }> = ({ color, boost, index, total }) => {
  const particles = React.useMemo(() => generateParticles(color, boost ? 6 : 0), [color, boost]);
  const stagger = (index / Math.max(total, 1)) * 0.12;

  return (
    <div className={`particle-burst ${boost ? 'boosted' : ''}`} style={{ animationDelay: `${stagger}s` }}>
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            '--px': `${p.x}px`,
            '--py': `${p.y}px`,
            '--ps': `${p.size}px`,
            '--pd': `${p.delay}s`,
            backgroundColor: p.color,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

const GridComponent: React.FC<GridProps> = ({
  grid,
  draggingPiece,
  hoverRow,
  hoverCol,
  onDrop,
  onHover,
  clearedRows,
  clearedCols,
  clearedCells,
  justPlacedCells,
  comboCount,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const clearedSet = React.useMemo(
    () => new Set(clearedCells.map(c => `${c.r},${c.c}`)),
    [clearedCells]
  );
  const justPlacedSet = React.useMemo(
    () => new Set(justPlacedCells.map(c => `${c.r},${c.c}`)),
    [justPlacedCells]
  );

  // Cross-clear: cells that are in BOTH a full row AND full column
  const crossClearSet = React.useMemo(() => {
    if (clearedRows.length === 0 || clearedCols.length === 0) return new Set<string>();
    const s = new Set<string>();
    for (const r of clearedRows) {
      for (const c of clearedCols) {
        s.add(`${r},${c}`);
      }
    }
    return s;
  }, [clearedRows, clearedCols]);

  const previewCells = React.useMemo(() => {
    if (!draggingPiece || hoverRow === null || hoverCol === null) return new Set<string>();
    const cells = getPreviewCells(draggingPiece.shape, hoverRow, hoverCol);
    const inBounds = cells.every(([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE);
    if (!inBounds) return new Set<string>();
    return new Set(cells.map(([r, c]) => `${r},${c}`));
  }, [draggingPiece, hoverRow, hoverCol]);

  const isValidDrop = React.useMemo(() => {
    if (!draggingPiece || hoverRow === null || hoverCol === null) return false;
    return canPlace(grid, draggingPiece.shape, hoverRow, hoverCol);
  }, [draggingPiece, hoverRow, hoverCol, grid]);

  // Calculate grid cell from client coordinates using the grid's bounding rect
  const cellFromPoint = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const el = gridRef.current;
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const padX = parseFloat(style.paddingLeft) || 0;
    const padY = parseFloat(style.paddingTop) || 0;
    const gap = parseFloat(style.gap) || 0;

    // Available area inside padding
    const innerW = rect.width - padX * 2;
    const innerH = rect.height - padY * 2;

    // Cell size = (inner - gaps) / GRID_SIZE
    const cellW = (innerW - gap * (GRID_SIZE - 1)) / GRID_SIZE;
    const cellH = (innerH - gap * (GRID_SIZE - 1)) / GRID_SIZE;

    // Relative position inside the grid (from padding edge)
    const relX = clientX - rect.left - padX;
    const relY = clientY - rect.top - padY;

    // Which logical cell does this fall into?
    // Each cell takes cellW + gap, but the gap is between cells
    const col = Math.floor(relX / (cellW + gap));
    const row = Math.floor(relY / (cellH + gap));

    // Also check if the point is within the actual cell (not in the gap)
    const xInCell = relX % (cellW + gap);
    const yInCell = relY % (cellH + gap);

    if (xInCell > cellW || yInCell > cellH) {
      // Cursor is in a gap — find the nearest cell
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    }

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      return [row, col];
    }
    return null;
  }, []);

  // Unified dragOver on the grid container (not individual cells)
  const handleGridDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) {
      onHover(cell[0], cell[1]);
    }
  }, [cellFromPoint, onHover]);

  const handleGridDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) {
      onDrop(cell[0], cell[1]);
    } else {
      onHover(null, null);
    }
  }, [cellFromPoint, onDrop, onHover]);

  const handleGridDragLeave = useCallback((e: React.DragEvent) => {
    const el = gridRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom
    ) {
      onHover(null, null);
    }
  }, [onHover]);

  // Expose cellFromPoint for touch handling via a data attribute or global
  // We store it on the DOM element so the document-level touch handler can use it
  React.useEffect(() => {
    const el = gridRef.current;
    if (el) {
      (el as any).__cellFromPoint = cellFromPoint;
    }
  }, [cellFromPoint]);

  const isClearing = clearedCells.length > 0;
  const comboHeat = Math.min(comboCount, 8);

  return (
    <div className="grid-wrapper">
      <div
        ref={gridRef}
        className={`grid ${isClearing ? 'grid-clearing' : ''} combo-heat-${comboHeat}`}
        onDragOver={handleGridDragOver}
        onDrop={handleGridDrop}
        onDragLeave={handleGridDragLeave}
      >
        {/* Animated border ring */}
        <div className={`grid-border-glow ${isClearing ? 'border-clearing' : ''}`} />

        {Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE }, (_, col) => {
            const cell = grid[row][col];
            const cellKey = `${row},${col}`;
            const isPreview = previewCells.has(cellKey);
            const isCleared = clearedSet.has(cellKey);
            const isCrossClear = crossClearSet.has(cellKey);
            const isJustPlaced = justPlacedSet.has(cellKey);
            const isInClearedRow = clearedRows.includes(row);
            const isInClearedCol = clearedCols.includes(col);
            const isInClearedLine = isInClearedRow || isInClearedCol;

            const clearedInfo = clearedCells.find(c => c.r === row && c.c === col);

            let cellClass = 'cell';
            if (cell.filled) cellClass += ` filled color-${cell.color}`;
            else if (isCleared) cellClass += ' cleared-gone';
            if (isPreview) cellClass += isValidDrop ? ' preview-valid' : ' preview-invalid';
            if (isCleared) cellClass += ' clearing-explode';
            if (isCrossClear) cellClass += ' cross-clear';
            if (isJustPlaced) cellClass += ' just-placed';
            if (isInClearedLine && !isCleared && cell.filled) cellClass += ' clearing-flash';

            const staggerDelay = clearedCells.findIndex(c => c.r === row && c.c === col);

            let style: React.CSSProperties = {};
            if (isCleared) {
              style.animationDelay = `${staggerDelay * 0.025}s`;
            } else if (isJustPlaced) {
              const placeIdx = justPlacedCells.findIndex(c => c.r === row && c.c === col);
              style.animationDelay = `${placeIdx * 0.03}s`;
            }

            return (
              <div
                key={cellKey}
                className={cellClass}
                data-row={row}
                data-col={col}
                style={style}
              >
                {isCleared && clearedInfo && (
                  <ParticleBurst
                    color={clearedInfo.color}
                    boost={isCrossClear}
                    index={staggerDelay}
                    total={clearedCells.length}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GridComponent;
