import { useState } from 'react';
import { ResultsMap } from '../components/ResultsMap';
import { RoundScoreEntry, TotalScoreEntry } from '../components/ScoreEntry';
import { PhotoModal } from '../components/PhotoModal';
import { useGame } from '../context/GameContext';
import { getAssetUrl } from '../utils/assets';

export function ResultsScreen() {
  const { state, dispatch, currentPhoto, isLastPhoto } = useGame();
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  if (!currentPhoto) return null;

  const sortedGuesses = [...state.roundGuesses].sort((a, b) => a.distance - b.distance);
  const sortedPlayers = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
  const photoUrl = getAssetUrl(currentPhoto.image);

  const handleNextPhoto = () => {
    dispatch({ type: 'NEXT_PHOTO' });
  };

  return (
    <div id="results-screen" className="screen active">
      <div className="results-header">
        <h2 className="results-title">Ronde Resultaten</h2>
        <p className="results-photo-num">
          Foto {state.currentPhotoIndex + 1} van {state.quizData.length}
        </p>
      </div>

      {currentPhoto.answer && (
        <div className="answer-section">
          <p className="answer-text">{currentPhoto.answer}</p>
          <button className="view-photo-btn" onClick={() => setShowPhotoModal(true)}>
            📷 Bekijk Foto
          </button>
        </div>
      )}

      <div className="results-content">
        <ResultsMap photo={currentPhoto} guesses={state.roundGuesses} />

        <div className="round-scores">
          <h3>Deze ronde</h3>
          <div className="scores-list">
            {sortedGuesses.map((guess, index) => (
              <RoundScoreEntry key={guess.playerId} guess={guess} index={index} />
            ))}
          </div>
        </div>

        <div className="total-scores">
          <h3>Totale score</h3>
          <div className="scores-list">
            {sortedPlayers.map((player, index) => (
              <TotalScoreEntry key={player.id} player={player} index={index} />
            ))}
          </div>
        </div>
      </div>

      <div className="results-footer">
        <button className="next-btn" onClick={handleNextPhoto}>
          {isLastPhoto ? 'Bekijk Eindstand' : 'Volgende Foto'}
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
