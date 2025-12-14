import { useState, useCallback } from 'react';
import { QuizMap } from '../components/QuizMap';
import { PhotoModal } from '../components/PhotoModal';
import { PassOverlay } from '../components/PassOverlay';
import { RevealOverlay } from '../components/RevealOverlay';
import { useGame } from '../context/GameContext';
import { getAssetUrl } from '../utils/assets';

export function QuizScreen() {
  const { state, dispatch, currentPlayer, currentPhoto, addGuess } = useGame();
  const [guessCoordinates, setGuessCoordinates] = useState<[number, number] | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPassOverlay, setShowPassOverlay] = useState(false);
  const [showRevealOverlay, setShowRevealOverlay] = useState(false);
  const [pendingNextPlayer, setPendingNextPlayer] = useState<typeof currentPlayer>(null);

  const handleMapGuess = useCallback((coordinates: [number, number]) => {
    setGuessCoordinates(coordinates);
  }, []);

  const handleConfirmGuess = () => {
    if (!guessCoordinates || !currentPlayer) return;

    addGuess(guessCoordinates);

    // Check if more players need to guess BEFORE incrementing
    if (state.currentPlayerIndex + 1 < state.players.length) {
      // Store next player for the overlay
      setPendingNextPlayer(state.players[state.currentPlayerIndex + 1]);
      setShowPassOverlay(true);
    } else {
      // All players have guessed
      dispatch({ type: 'CALCULATE_ROUND_POINTS' });
      setShowRevealOverlay(true);
    }

    setGuessCoordinates(null);
  };

  const handlePlayerReady = () => {
    setShowPassOverlay(false);
    setPendingNextPlayer(null);
    dispatch({ type: 'NEXT_PLAYER' });
    setGuessCoordinates(null);
  };

  const handleShowResult = () => {
    setShowRevealOverlay(false);
    dispatch({ type: 'SET_SCREEN', screen: 'results' });
  };

  // Show overlays even if currentPlayer is null (after all players guessed)
  if (showRevealOverlay) {
    return (
      <div id="quiz-screen" className="screen active">
        <RevealOverlay isOpen={true} onShowResult={handleShowResult} />
      </div>
    );
  }

  if (showPassOverlay && pendingNextPlayer) {
    return (
      <div id="quiz-screen" className="screen active">
        <PassOverlay isOpen={true} nextPlayer={pendingNextPlayer} onReady={handlePlayerReady} />
      </div>
    );
  }

  if (!currentPhoto || !currentPlayer) return null;

  const progress = (state.currentPhotoIndex / state.quizData.length) * 100;
  const photoUrl = getAssetUrl(currentPhoto.image);

  return (
    <div id="quiz-screen" className="screen active">
      <div className="quiz-header">
        <div className="progress-info">
          <span className="photo-counter">
            Foto {state.currentPhotoIndex + 1} van {state.quizData.length}
          </span>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="quiz-content">
        <div className="photo-section">
          <div className="photo-frame">
            <img src={photoUrl} alt="Guess the location" />
            <button
              className="enlarge-photo-btn"
              onClick={() => setShowPhotoModal(true)}
            >
              🔍
            </button>
            <div className="photo-frame-decor christmas-only">
              <span className="corner-decor top-left">🎄</span>
              <span className="corner-decor top-right">⭐</span>
              <span className="corner-decor bottom-left">🎁</span>
            </div>
          </div>
          <p className="photo-caption">{currentPhoto.text}</p>
        </div>

        <div className="map-section">
          <div
            className="player-turn-banner"
            style={{ backgroundColor: currentPlayer.color }}
          >
            <span className="turn-emoji default-emoji">🎯</span>
            <span className="turn-emoji christmas-emoji">🎅</span>
            <span>{currentPlayer.name}</span> is aan de beurt!
          </div>

          <QuizMap
            playerColor={currentPlayer.color}
            onGuess={handleMapGuess}
            guessCoordinates={guessCoordinates}
          />

          <p className={`map-hint ${guessCoordinates ? 'hidden' : ''}`}>
            Tik op de kaart om te raden
          </p>
        </div>
      </div>

      <div className="quiz-footer">
        <button
          className="confirm-btn"
          disabled={!guessCoordinates}
          style={{ backgroundColor: currentPlayer.color }}
          onClick={handleConfirmGuess}
        >
          Bevestig Keuze
        </button>
      </div>

      <PhotoModal
        isOpen={showPhotoModal}
        imageSrc={photoUrl}
        onClose={() => setShowPhotoModal(false)}
      />
    </div>
  );
}
