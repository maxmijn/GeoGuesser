interface RevealOverlayProps {
  isOpen: boolean;
  onShowResult: () => void;
}

export function RevealOverlay({ isOpen, onShowResult }: RevealOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className={`overlay ${isOpen ? 'active' : ''}`}>
      <div className="reveal-content">
        <div className="reveal-emoji">🗺️</div>
        <div className="reveal-emoji christmas-emoji">🎅</div>
        <h2>Iedereen heeft geraden!</h2>
        <p className="reveal-subtitle">
          Klaar om te zien waar iedereen heeft gekozen?
        </p>
        <button className="show-result-btn" onClick={onShowResult}>
          Toon Resultaat
        </button>
      </div>
    </div>
  );
}
