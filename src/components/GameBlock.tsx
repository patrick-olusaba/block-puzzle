import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import type { BlockShape, GameState } from '../types';
import {
  createEmptyGrid,
  generatePieces,
  canPlace,
  placePiece,
  clearLines,
  calcScore,
  hasAnyValidMove,
  rotateShape,
} from '../gameLogic';
import GridComponent from './Grid';
import PieceTray from './PieceTray';
import ScoreBoard from './ScoreBoard';
import GameOver from './GameOver';
import { unlockAudio, sfxPlace, sfxClear, sfxCombo, sfxGameOver, sfxNewBest } from '../sounds';
import '../App.css';

// ─── Reducer ───────────────────────────────────────────────

type Action =
  | { type: 'PLACE_PIECE'; pieceIndex: number; row: number; col: number }
  | { type: 'ROTATE_PIECE'; pieceIndex: number }
  | { type: 'RESTART' }
  | { type: 'CLEAR_ANIMATION' };

function initState(bestScore = 0): GameState {
  return {
    grid: createEmptyGrid(),
    pieces: generatePieces(),
    score: 0,
    bestScore,
    gameOver: false,
    lastClearedLines: 0,
    comboCount: 0,
    clearedRows: [],
    clearedCols: [],
    clearedCells: [],
    justPlacedCells: [],
    lastScoreGained: 0,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'PLACE_PIECE': {
      const { pieceIndex, row, col } = action;
      const piece = state.pieces[pieceIndex];
      if (!piece) return state;
      if (!canPlace(state.grid, piece.shape, row, col)) return state;

      // Place piece
      const placed = placePiece(state.grid, piece, row, col);

      // Detect which rows/cols are full BEFORE clearing
      const fullRows: number[] = [];
      const fullCols: number[] = [];
      const COLS = placed[0].length;
      for (let r = 0; r < placed.length; r++) {
        if (placed[r].every(c => c.filled)) fullRows.push(r);
      }
      for (let c = 0; c < COLS; c++) {
        if (placed.every(row => row[c].filled)) fullCols.push(c);
      }

      // Capture cleared cells (with colors) BEFORE clearing
      const clearedCells: import('../types').ClearedCellInfo[] = [];
      for (const r of fullRows) {
        for (let c = 0; c < COLS; c++) {
          if (placed[r][c].filled) {
            clearedCells.push({ r, c, color: placed[r][c].color });
          }
        }
      }
      for (const c of fullCols) {
        for (let r = 0; r < placed.length; r++) {
          if (!fullRows.includes(r) && placed[r][c].filled) {
            clearedCells.push({ r, c, color: placed[r][c].color });
          }
        }
      }

      // Track cells that were just placed and stayed (not cleared) for pop-in animation
      const clearedKeySet = new Set(clearedCells.map(cc => `${cc.r},${cc.c}`));
      const justPlacedCells: import('../types').ClearedCellInfo[] = [];
      for (let r = 0; r < placed.length; r++) {
        for (let c = 0; c < COLS; c++) {
          if (placed[r][c].filled && !clearedKeySet.has(`${r},${c}`)) {
            justPlacedCells.push({ r, c, color: placed[r][c].color });
          }
        }
      }

      // Clear lines
      const { newGrid, linesCleared } = clearLines(placed);

      // Score
      const newCombo = linesCleared > 0 ? state.comboCount + 1 : 0;
      const gained = calcScore(linesCleared, newCombo);
      const newScore = state.score + gained;
      const newBest = Math.max(newScore, state.bestScore);
      if (newBest > state.bestScore) localStorage.setItem('blockPuzzleBest', String(newBest));

      // Update piece tray
      let newPieces = state.pieces.map((p, i) => i === pieceIndex ? null : p) as (BlockShape | null)[];
      if (newPieces.every(p => p === null)) {
        newPieces = generatePieces();
      }

      const gameOver = !hasAnyValidMove(newGrid, newPieces);

      return {
        ...state,
        grid: newGrid,
        pieces: newPieces,
        score: newScore,
        bestScore: newBest,
        gameOver,
        lastClearedLines: linesCleared,
        comboCount: newCombo,
        clearedRows: fullRows,
        clearedCols: fullCols,
        clearedCells,
        justPlacedCells,
        lastScoreGained: linesCleared > 0 ? gained : 0,
      };
    }

    case 'ROTATE_PIECE': {
      const pieceToRotate = state.pieces[action.pieceIndex];
      if (!pieceToRotate) return state;
      const rotated = rotateShape(pieceToRotate.shape);
      const newPieces = state.pieces.map((p, i) =>
        i === action.pieceIndex ? { ...pieceToRotate, shape: rotated } : p
      );
      return { ...state, pieces: newPieces };
    }

    case 'CLEAR_ANIMATION':
      return { ...state, lastClearedLines: 0, clearedRows: [], clearedCols: [], clearedCells: [], justPlacedCells: [], lastScoreGained: 0 };

    case 'RESTART': {
      const saved = localStorage.getItem('blockPuzzleBest');
      const best = saved ? parseInt(saved) : state.bestScore;
      return initState(best);
    }

    default:
      return state;
  }
}

// ─── GameBlock ──────────────────────────────────────────────

const GameBlock: React.FC = () => {
  const [phase, setPhase] = React.useState<'menu' | 'playing'>('menu');
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = localStorage.getItem('blockPuzzleBest');
    return initState(saved ? parseInt(saved) : 0);
  });

  // Stats from localStorage
  const [stats, setStats] = React.useState(() => {
    const raw = localStorage.getItem('blockPuzzleStats');
    return raw ? JSON.parse(raw) : { gamesPlayed: 0, bestCombo: 0, totalLines: 0 };
  });

  const startGame = () => {
    unlockAudio();
    setPhase('playing');
    dispatch({ type: 'RESTART' });
  };

  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);
  const [hoverRow, setHoverRow] = React.useState<number | null>(null);
  const [hoverCol, setHoverCol] = React.useState<number | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchRef = useRef<{ pieceIndex: number } | null>(null);
  const gameOverTracked = useRef(false);

  // Track stats when game ends
  useEffect(() => {
    if (state.gameOver && !gameOverTracked.current) {
      gameOverTracked.current = true;
      const raw = localStorage.getItem('blockPuzzleStats');
      const st = raw ? JSON.parse(raw) : { gamesPlayed: 0, bestCombo: 0, totalLines: 0 };
      st.gamesPlayed += 1;
      if (state.comboCount > st.bestCombo) st.bestCombo = state.comboCount;
      localStorage.setItem('blockPuzzleStats', JSON.stringify(st));
      setStats(st);
    }
    if (!state.gameOver) gameOverTracked.current = false;
  }, [state.gameOver, state.comboCount]);

  // Sound effects — watch state changes
  const prevScore = useRef(state.score);
  useEffect(() => {
    if (state.score > prevScore.current) {
      if (state.lastClearedLines > 0) {
        if (state.comboCount > 1) sfxCombo(state.comboCount);
        else sfxClear(state.lastClearedLines);
      } else {
        sfxPlace();
      }
      prevScore.current = state.score;
    }
  }, [state.score, state.lastClearedLines, state.comboCount]);

  useEffect(() => {
    if (state.gameOver) {
      if (state.score >= state.bestScore && state.score > 0) {
        sfxNewBest();
      } else {
        sfxGameOver();
      }
    }
  }, [state.gameOver]); // eslint-disable-line

  // Floating score state
  const [floatingScores, setFloatingScores] = React.useState<Array<{ id: number; text: string; key: number }>>([]);
  const floatIdRef = useRef(0);

  // Clear animation timeout + floating scores
  useEffect(() => {
    if (state.lastClearedLines > 0 && state.lastScoreGained > 0) {
      if (clearTimer.current) clearTimeout(clearTimer.current);

      // Spawn floating score
      const id = floatIdRef.current++;
      const lines = state.lastClearedLines;
      const combo = state.comboCount;
      let text = `+${state.lastScoreGained}`;
      if (lines >= 4) text = `🔥 ${text}`;
      if (combo > 1) text += ` x${combo}`;

      setFloatingScores(prev => [...prev, { id, text, key: Date.now() }]);
      setTimeout(() => {
        setFloatingScores(prev => prev.filter(s => s.id !== id));
      }, 900);

      clearTimer.current = setTimeout(() => {
        dispatch({ type: 'CLEAR_ANIMATION' });
      }, 650);
    }
    return () => { if (clearTimer.current) clearTimeout(clearTimer.current); };
  }, [state.lastClearedLines, state.lastScoreGained, state.comboCount, state.score]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    unlockAudio();
    setDraggingIndex(index);
    // Invisible ghost image
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;top:-9999px;opacity:0;pointer-events:none;width:1px;height:1px;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setHoverRow(null);
    setHoverCol(null);
  }, []);

  const draggingPiece = draggingIndex !== null ? (state.pieces[draggingIndex] ?? null) : null;

  const handleDrop = useCallback((row: number, col: number) => {
    if (draggingIndex === null) return;
    dispatch({ type: 'PLACE_PIECE', pieceIndex: draggingIndex, row, col });
    setDraggingIndex(null);
    setHoverRow(null);
    setHoverCol(null);
  }, [draggingIndex]);

  const handleHover = useCallback((r: number | null, c: number | null) => {
    setHoverRow(r);
    setHoverCol(c);
  }, []);

  // Touch support — handlers attached at document level so they work over the grid too
  const handleRotate = useCallback((index: number) => {
    dispatch({ type: 'ROTATE_PIECE', pieceIndex: index });
  }, []);

  const handleTouchStart = useCallback((_e: React.TouchEvent, index: number) => {
    touchRef.current = { pieceIndex: index };
    setDraggingIndex(index);
  }, []);

  // Helper to resolve grid cell from touch coordinates via the grid element's bounding rect
  const getCellFromTouch = useCallback((clientX: number, clientY: number): [number, number] | null => {
    // Try the grid's bounding-rect calculation first (handles gaps properly)
    const gridEl = document.querySelector('.grid') as HTMLElement | null;
    if (gridEl && (gridEl as any).__cellFromPoint) {
      return (gridEl as any).__cellFromPoint(clientX, clientY);
    }
    // Fallback: elementFromPoint + closest data attribute
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (el) {
      const cell = el.closest('[data-row]') as HTMLElement | null;
      if (cell) {
        return [parseInt(cell.dataset.row!), parseInt(cell.dataset.col!)];
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      if (!touchRef.current) return;
      e.preventDefault();
      const t = e.touches[0];
      const cell = getCellFromTouch(t.clientX, t.clientY);
      if (cell) {
        setHoverRow(cell[0]);
        setHoverCol(cell[1]);
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!touchRef.current) return;
      const t = e.changedTouches[0];
      const cell = getCellFromTouch(t.clientX, t.clientY);
      if (cell) {
        dispatch({
          type: 'PLACE_PIECE',
          pieceIndex: touchRef.current.pieceIndex,
          row: cell[0],
          col: cell[1],
        });
      }
      touchRef.current = null;
      setDraggingIndex(null);
      setHoverRow(null);
      setHoverCol(null);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);

    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [getCellFromTouch]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="game-title">
          <span className="title-block">BLOCK</span>
          <span className="title-blast">BLAST</span>
        </h1>
      </header>

      <ScoreBoard
        score={state.score}
        bestScore={state.bestScore}
        comboCount={state.comboCount}
        lastClearedLines={state.lastClearedLines}
      />

      <main className={`game-area ${state.clearedCells.length > 0 ? 'shaking' : ''}`}>
        <GridComponent
          grid={state.grid}
          draggingPiece={draggingPiece}
          hoverRow={hoverRow}
          hoverCol={hoverCol}
          onDrop={handleDrop}
          onHover={handleHover}
          clearedRows={state.clearedRows}
          clearedCols={state.clearedCols}
          clearedCells={state.clearedCells}
          justPlacedCells={state.justPlacedCells}
          comboCount={state.comboCount}
        />

        {/* Floating score popups */}
        {floatingScores.map(fs => (
          <div key={fs.id} className="float-score">{fs.text}</div>
        ))}
      </main>

      <PieceTray
        pieces={state.pieces}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggingIndex={draggingIndex}
        onTouchStart={handleTouchStart}
        onRotate={handleRotate}
      />

      <p className="hint">Drag pieces onto the grid · Fill rows or columns to clear them</p>

      {state.gameOver && (
        <GameOver
          score={state.score}
          bestScore={state.bestScore}
          stats={stats}
          onRestart={() => dispatch({ type: 'RESTART' })}
          onMenu={() => { setPhase('menu'); dispatch({ type: 'RESTART' }); }}
        />
      )}

      {/* Start Menu */}
      {phase === 'menu' && (
        <div className="menu-overlay">
          <div className="menu-card">
            <h1 className="menu-title">
              <span className="title-block">BLOCK</span>
              <span className="title-blast">BLAST</span>
            </h1>
            <p className="menu-sub">Drag pieces. Fill lines. Clear the grid.</p>
            <div className="menu-stats-row">
              {stats.gamesPlayed > 0 && (
                <>
                  <div className="menu-stat">
                    <span className="menu-stat-val">{stats.gamesPlayed}</span>
                    <span className="menu-stat-label">Games</span>
                  </div>
                  <div className="menu-stat">
                    <span className="menu-stat-val">{state.bestScore.toLocaleString()}</span>
                    <span className="menu-stat-label">Best</span>
                  </div>
                </>
              )}
            </div>
            <button className="play-btn" onClick={startGame}>
              PLAY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBlock;
