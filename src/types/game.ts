import type { Grid, ClearedCellInfo } from './grid';
import type { BlockShape } from './block';

export interface DragState {
  pieceIndex: number;
  offsetX: number;
  offsetY: number;
  currentCol: number | null;
  currentRow: number | null;
}

export interface ClearResult {
  newGrid: Grid;
  linesCleared: number;
  clearedRows: number[];
  clearedCols: number[];
}

export interface GameState {
  grid: Grid;
  pieces: (BlockShape | null)[];
  score: number;
  bestScore: number;
  gameOver: boolean;
  lastClearedLines: number;
  comboCount: number;
  clearedRows: number[];
  clearedCols: number[];
  clearedCells: ClearedCellInfo[];
  justPlacedCells: ClearedCellInfo[];
  lastScoreGained: number;
}
