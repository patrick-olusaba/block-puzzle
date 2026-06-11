import React, { useEffect, useRef, useState } from 'react';
import './ScoreBoard.css';

interface ScoreBoardProps {
  score: number;
  bestScore: number;
  comboCount: number;
  lastClearedLines: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, bestScore, comboCount, lastClearedLines }) => {
  const [pop, setPop] = useState(false);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score > prevScore.current) {
      setPop(true);
      const timer = setTimeout(() => setPop(false), 400);
      prevScore.current = score;
      return () => clearTimeout(timer);
    }
    prevScore.current = score;
  }, [score]);

  const showCombo = comboCount > 1;

  return (
    <div className="scoreboard">
      <div className="score-block current">
        <span className="score-label">SCORE</span>
        <span className={`score-value ${pop ? 'score-pop' : ''}`}>{score.toLocaleString()}</span>
      </div>
      <div className="score-block best">
        <span className="score-label">BEST</span>
        <span className="score-value">{bestScore.toLocaleString()}</span>
      </div>
      {showCombo && (
        <div className="combo-badge" key={`combo-${comboCount}-${Date.now()}`}>
          <span>🔥 x{comboCount} COMBO</span>
        </div>
      )}
      {lastClearedLines > 0 && (
        <div className="lines-badge" key={`lines-${lastClearedLines}-${Date.now()}`}>
          <span>{lastClearedLines} LINE{lastClearedLines > 1 ? 'S' : ''}!</span>
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;
