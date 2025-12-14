import { useCallback, useRef, useEffect } from 'react';
import { PlayerEntry } from '../components/PlayerEntry';
import { useGame } from '../context/GameContext';
import type { QuizPhoto } from '../types';

export function SetupScreen() {
  const { state, dispatch, hasValidPlayers } = useGame();
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const handleAddPlayer = useCallback(() => {
    dispatch({ type: 'ADD_PLAYER' });
  }, [dispatch]);

  const handleRemovePlayer = useCallback(
    (playerId: number) => {
      dispatch({ type: 'REMOVE_PLAYER', playerId });
    },
    [dispatch]
  );

  const handleNameChange = useCallback(
    (playerId: number, name: string) => {
      dispatch({ type: 'UPDATE_PLAYER_NAME', playerId, name });
    },
    [dispatch]
  );

  const handleEnterPress = useCallback(
    (index: number) => {
      if (index < state.players.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        handleAddPlayer();
      }
    },
    [state.players.length, handleAddPlayer]
  );

  const handleStartGame = async () => {
    if (!hasValidPlayers) return;

    try {
      const response = await fetch(state.quizPath);
      if (!response.ok) throw new Error('Failed to load quiz');
      const data: QuizPhoto[] = await response.json();

      if (data.length === 0) {
        alert('Geen quiz data gevonden!');
        return;
      }

      dispatch({ type: 'SET_QUIZ_DATA', data });
      dispatch({ type: 'START_GAME' });
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert('Kon quiz data niet laden.');
    }
  };

  // Focus first input on mount
  useEffect(() => {
    const firstInput = document.querySelector('.player-name-input') as HTMLInputElement;
    firstInput?.focus();
  }, []);

  return (
    <div id="setup-screen" className="screen active">
      <div className="setup-container">
        <div className="logo-section">
          <h1 className="game-title">
            <span className="title-geo">Geo</span>
            <span className="title-guess">Guess</span>
          </h1>
          <p className="tagline">Waar is deze foto gemaakt?</p>
        </div>

        <div className="players-section">
          <h2 className="section-title">Spelers</h2>
          <div className="players-list">
            {state.players.map((player, index) => (
              <PlayerEntry
                key={player.id}
                player={player}
                index={index}
                onNameChange={handleNameChange}
                onRemove={handleRemovePlayer}
                onEnterPress={() => handleEnterPress(index)}
                canRemove={state.players.length > 1}
              />
            ))}
          </div>
          {state.players.length < 8 && (
            <button className="add-player-btn" onClick={handleAddPlayer}>
              <span className="plus-icon">+</span>
              <span>Speler Toevoegen</span>
            </button>
          )}
        </div>

        <button
          className="start-btn"
          disabled={!hasValidPlayers}
          onClick={handleStartGame}
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
}
