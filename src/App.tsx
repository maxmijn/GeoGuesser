import { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { GameProvider, useGame } from './context/GameContext';
import { SnowAnimation } from './components/SnowAnimation';
import { PasswordScreen } from './screens/PasswordScreen';
import { SetupScreen } from './screens/SetupScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { FinalScreen } from './screens/FinalScreen';
import 'mapbox-gl/dist/mapbox-gl.css';
import './styles.css';

function GameScreens() {
  const { state } = useGame();

  // Warn before leaving during active game
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.screen === 'quiz' || state.screen === 'results') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.screen]);

  switch (state.screen) {
    case 'password':
      return <PasswordScreen />;
    case 'setup':
      return <SetupScreen />;
    case 'quiz':
      return <QuizScreen />;
    case 'results':
      return <ResultsScreen />;
    case 'final':
      return <FinalScreen />;
    default:
      return <PasswordScreen />;
  }
}

function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <SnowAnimation />
        <GameScreens />
      </GameProvider>
    </ThemeProvider>
  );
}

export default App;
