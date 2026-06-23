import type { Grid, BlockShape } from '../types';
import { canPlace, GRID_SIZE } from './grid';

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
