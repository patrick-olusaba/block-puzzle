export type CellColor =
  | 'empty'
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'cyan'
  | 'pink';

export interface Cell {
  filled: boolean;
  color: CellColor;
}

export type Grid = Cell[][];

export interface BlockShape {
  shape: boolean[][];
  color: CellColor;
}

export interface DragState {
  pieceIndex: number;
  offsetX: number;
  offsetY: number;
  currentCol: number | null;
  currentRow: number | null;
}

export interface ClearedCellInfo {
  r: number;
  c: number;
  color: CellColor;
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
