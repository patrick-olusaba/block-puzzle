import React from 'react';
import './GameOver.css';

interface GameOverProps {
  score: number;
  bestScore: number;
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, bestScore, onRestart }) => {
  const isNewBest = score >= bestScore && score > 0;

  return (
    <div className="gameover-overlay">
      <div className="gameover-card">
        <div className="gameover-icon">💥</div>
        <h2 className="gameover-title">GAME OVER</h2>
        {isNewBest && (
          <div className="new-record">
            <span>🏆 NEW BEST!</span>
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
        <button className="restart-btn" onClick={onRestart}>
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};

export default GameOver;
