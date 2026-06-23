import type { CellColor } from './grid';

export interface BlockShape {
  shape: boolean[][];
  color: CellColor;
}
