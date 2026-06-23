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

export interface ClearedCellInfo {
  r: number;
  c: number;
  color: CellColor;
}
