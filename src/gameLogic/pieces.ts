import type { CellColor, BlockShape } from '../types';

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

export function randomPiece(): BlockShape {
  const shape = PIECE_TEMPLATES[Math.floor(Math.random() * PIECE_TEMPLATES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { shape, color };
}

export function generatePieces(): BlockShape[] {
  return [randomPiece(), randomPiece(), randomPiece()];
}

export function rotateShape(shape: boolean[][]): boolean[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: boolean[][] = Array.from({ length: cols }, () => Array(rows).fill(false));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
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
