import { Podium } from '../components/Podium';
import { FinalScoreEntry } from '../components/ScoreEntry';
import { Confetti } from '../components/Confetti';
import { useGame } from '../context/GameContext';

export function FinalScreen() {
  const { state, dispatch } = useGame();

  const sortedPlayers = [...state.players].sort((a, b) => b.totalScore - a.totalScore);

  const handlePlayAgain = () => {
    dispatch({ type: 'PLAY_AGAIN' });
  };

  return (
    <div id="final-screen" className="screen active">
      <div className="final-container">
        <Confetti />

        <h1 className="final-title">Einde Spel!</h1>

        <div className="podium-section">
          <Podium players={state.players} />
        </div>

        <div className="final-leaderboard">
          <h3>Eindstand</h3>
          <div className="final-scores-list">
            {sortedPlayers.map((player, index) => (
              <FinalScoreEntry
                key={player.id}
                player={player}
                rank={index + 1}
                index={index}
              />
            ))}
          </div>
        </div>

        <button className="play-again-btn" onClick={handlePlayAgain}>
          Opnieuw Spelen
        </button>
      </div>
    </div>
  );
}
