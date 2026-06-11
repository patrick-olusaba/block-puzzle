import type { BlockShape, CellColor, Grid, Cell } from './types';

export const GRID_SIZE = 8;

const COLORS: CellColor[] = [
  'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'pink'
];

const PIECE_TEMPLATES: boolean[][][] = [
  // 1x1
  [[true]],
  // 1x2
  [[true, true]],
  // 2x1
  [[true], [true]],
  // 1x3
  [[true, true, true]],
  // 3x1
  [[true], [true], [true]],
  // 1x4
  [[true, true, true, true]],
  // 4x1
  [[true], [true], [true], [true]],
  // 2x2 square
  [[true, true], [true, true]],
  // L-shape
  [[true, false], [true, false], [true, true]],
  // J-shape
  [[false, true], [false, true], [true, true]],
  // L-mirrored
  [[true, true], [true, false], [true, false]],
  // J-mirrored
  [[true, true], [false, true], [false, true]],
  // T-shape
  [[true, true, true], [false, true, false]],
  // T-shape down
  [[false, true, false], [true, true, true]],
  // T-shape right
  [[true, false], [true, true], [true, false]],
  // T-shape left
  [[false, true], [true, true], [false, true]],
  // S-shape
  [[false, true, true], [true, true, false]],
  // Z-shape
  [[true, true, false], [false, true, true]],
  // 2x3 rect
  [[true, true, true], [true, true, true]],
  // 3x2 rect
  [[true, true], [true, true], [true, true]],
  // 3x3 square
  [[true, true, true], [true, true, true], [true, true, true]],
  // Corner 2x2
  [[true, true], [true, false]],
  [[true, true], [false, true]],
  [[false, true], [true, true]],
  [[true, false], [true, true]],
  // 1x5
  [[true, true, true, true, true]],
  // Plus
  [[false, true, false], [true, true, true], [false, true, false]],
];

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, (): Cell => ({ filled: false, color: 'empty' }))
  );
}

export function randomPiece(): BlockShape {
  const shape = PIECE_TEMPLATES[Math.floor(Math.random() * PIECE_TEMPLATES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { shape, color };
}

export function generatePieces(): BlockShape[] {
  return [randomPiece(), randomPiece(), randomPiece()];
}

export function canPlace(grid: Grid, shape: boolean[][], row: number, col: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const gr = row + r;
      const gc = col + c;
      if (gr < 0 || gr >= GRID_SIZE || gc < 0 || gc >= GRID_SIZE) return false;
      if (grid[gr][gc].filled) return false;
    }
  }
  return true;
}

export function placePiece(grid: Grid, piece: BlockShape, row: number, col: number): Grid {
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      newGrid[row + r][col + c] = { filled: true, color: piece.color };
    }
  }
  return newGrid;
}

export interface ClearResult {
  newGrid: Grid;
  linesCleared: number;
  clearedRows: number[];
  clearedCols: number[];
}

export function clearLines(grid: Grid): ClearResult {
  let newGrid = grid.map(r => r.map(c => ({ ...c })));
  const clearedRows: number[] = [];
  const clearedCols: number[] = [];

  // Find full rows and cols
  for (let r = 0; r < GRID_SIZE; r++) {
    if (newGrid[r].every(c => c.filled)) clearedRows.push(r);
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    if (newGrid.every(row => row[c].filled)) clearedCols.push(c);
  }

  // Clear them
  for (const r of clearedRows) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[r][c] = { filled: false, color: 'empty' };
    }
  }
  for (const c of clearedCols) {
    for (let r = 0; r < GRID_SIZE; r++) {
      newGrid[r][c] = { filled: false, color: 'empty' };
    }
  }

  return {
    newGrid,
    linesCleared: clearedRows.length + clearedCols.length,
    clearedRows,
    clearedCols,
  };
}

export function calcScore(linesCleared: number, comboCount: number): number {
  if (linesCleared === 0) return 0;
  const base = linesCleared === 1 ? 100 : linesCleared === 2 ? 300 : linesCleared * 200;
  const combo = comboCount > 1 ? Math.floor(base * (comboCount - 1) * 0.5) : 0;
  return base + combo;
}

export function hasAnyValidMove(grid: Grid, pieces: (BlockShape | null)[]): boolean {
  for (const piece of pieces) {
    if (!piece) continue;
    for (let r = 0; r <= GRID_SIZE - piece.shape.length; r++) {
      for (let c = 0; c <= GRID_SIZE - piece.shape[0].length; c++) {
        if (canPlace(grid, piece.shape, r, c)) return true;
      }
    }
  }
  return false;
}

export function getPreviewCells(shape: boolean[][], row: number, col: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) cells.push([row + r, col + c]);
    }
  }
  return cells;
}
