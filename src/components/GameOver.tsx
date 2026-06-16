import React, { useMemo } from 'react';
import './GameOver.css';

interface GameOverProps {
  score: number;
  bestScore: number;
  onRestart: () => void;
  onMenu: () => void;
  stats: { gamesPlayed: number; bestCombo: number; totalLines: number };
}

const GameOver: React.FC<GameOverProps> = ({ score, bestScore, onRestart, onMenu, stats }) => {
  const isNewBest = score >= bestScore && score > 0;

  const shareScore = () => {
    const text = `🔲 I scored ${score.toLocaleString()} on Block Blast!${isNewBest ? ' 🏆 NEW BEST!' : ''}\nCan you beat me?`;
    if (navigator.share) {
      navigator.share({ title: 'Block Blast', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  // Confetti pieces
  const confetti = useMemo(() =>
    Array.from({ length: isNewBest ? 40 : 0 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: ['#fbbf24', '#7c3aed', '#3b82f6', '#22c55e', '#f97316', '#ec4899'][i % 6],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    })),
  [isNewBest]);

  return (
    <div className="gameover-overlay">
      {confetti.map((c) => (
        <span
          key={c.id}
          className="confetti-piece"
          style={{
            left: `${c.left}%`,
            animationDelay: `${c.delay}s`,
            backgroundColor: c.color,
            width: c.size,
            height: c.size * 1.5,
            transform: `rotate(${c.rotation}deg)`,
          }}
        />
      ))}

      <div className="gameover-card">
        <div className="gameover-icon">{isNewBest ? '🏆' : '💥'}</div>
        <h2 className="gameover-title">{isNewBest ? 'NEW BEST!' : 'GAME OVER'}</h2>

        {isNewBest && (
          <div className="new-record">
            <span>🎉 You beat your record!</span>
          </div>
        )}

        <div className="gameover-scores">
          <div className="go-score-row">
            <span className="go-label">SCORE</span>
            <span className="go-value score-yellow">{score.toLocaleString()}</span>
          </div>
          <div className="go-score-row">
            <span className="go-label">BEST</span>
            <span className="go-value score-blue">{bestScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="gameover-stats">
          <div className="go-stat">
            <span className="go-stat-val">{stats.gamesPlayed}</span>
            <span className="go-stat-label">Games</span>
          </div>
          <div className="go-stat">
            <span className="go-stat-val">{stats.bestCombo}</span>
            <span className="go-stat-label">Best Combo</span>
          </div>
          <div className="go-stat">
            <span className="go-stat-val">{stats.totalLines}</span>
            <span className="go-stat-label">Lines</span>
          </div>
        </div>

        <button className="restart-btn" onClick={onRestart}>
          PLAY AGAIN
        </button>

        <button className="share-btn" onClick={shareScore}>
          📤 Share Score
        </button>

        <button className="menu-btn" onClick={onMenu}>
          ← Menu
        </button>
      </div>
    </div>
  );
};

export default GameOver;
