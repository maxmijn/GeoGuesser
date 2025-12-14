import type { Player } from '../types';

interface PassOverlayProps {
  isOpen: boolean;
  nextPlayer: Player | null;
  onReady: () => void;
}

export function PassOverlay({ isOpen, nextPlayer, onReady }: PassOverlayProps) {
  if (!isOpen || !nextPlayer) return null;

  return (
    <div className={`overlay ${isOpen ? 'active' : ''}`}>
      <div className="pass-content">
        <div className="pass-emoji">📱</div>
        <div className="pass-emoji christmas-emoji">🎁</div>
        <h2>Geef de iPad aan</h2>
        <div
          className="next-player-name"
          style={{ backgroundColor: nextPlayer.color }}
        >
          {nextPlayer.name}
        </div>
        <button className="ready-btn" onClick={onReady}>
          Ik ben klaar!
        </button>
      </div>
    </div>
  );
}
