import { FormEvent, useState } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useGame } from '../context/GameContext';
import { hashString } from '../utils/hash';
import { QUIZ_PASSWORDS } from '../types';

export function PasswordScreen() {
  const { dispatch } = useGame();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = password.trim();
    if (!trimmed) {
      setError('Voer een wachtwoord in.');
      return;
    }

    const passwordHash = await hashString(trimmed);
    const quizId = QUIZ_PASSWORDS[passwordHash];

    if (!quizId) {
      setError('Onjuist wachtwoord. Probeer opnieuw.');
      setPassword('');
      return;
    }

    // Valid password - set quiz path and continue
    dispatch({ type: 'SET_QUIZ_PATH', path: `${import.meta.env.BASE_URL}data/${quizId}/quiz.json` });
    dispatch({ type: 'ADD_PLAYER' }); // Add first player
    dispatch({ type: 'SET_SCREEN', screen: 'setup' });
  };

  return (
    <div id="password-screen" className="screen active">
      <ThemeToggle />

      <div className="password-container">
        <div className="logo-section">
          <h1 className="game-title">
            <span className="title-geo">Geo</span>
            <span className="title-guess">Guess</span>
          </h1>
          <p className="tagline">Voer het wachtwoord in om te beginnen</p>
        </div>

        <form className="password-form" onSubmit={handleSubmit}>
          <div className="password-input-wrapper">
            <span className="password-icon">🔐</span>
            <span className="password-icon christmas-icon">🎁</span>
            <input
              type="password"
              className="password-input"
              placeholder="Wachtwoord"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <p className={`password-error ${error ? 'visible' : ''}`}>{error}</p>
          <button type="submit" className="password-btn">
            Start Quiz
          </button>
        </form>
      </div>
    </div>
  );
}
