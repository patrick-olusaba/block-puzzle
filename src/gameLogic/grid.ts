import type { Cell, Grid } from '../types';
import type { ClearResult } from '../types';

export const GRID_SIZE = 8;

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, (): Cell => ({ filled: false, color: 'empty' }))
  );
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

export function placePiece(grid: Grid, piece: { shape: boolean[][]; color: Cell['color'] }, row: number, col: number): Grid {
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      newGrid[row + r][col + c] = { filled: true, color: piece.color };
    }
  }
  return newGrid;
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
