import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import type { Player, QuizPhoto, Guess, Screen } from '../types';
import { PLAYER_COLORS } from '../types';
import { haversineDistance } from '../utils/haversine';

interface GameState {
  screen: Screen;
  players: Player[];
  currentPlayerIndex: number;
  currentPhotoIndex: number;
  quizData: QuizPhoto[];
  roundGuesses: Guess[];
  quizPath: string;
}

type GameAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_QUIZ_PATH'; path: string }
  | { type: 'ADD_PLAYER' }
  | { type: 'REMOVE_PLAYER'; playerId: number }
  | { type: 'UPDATE_PLAYER_NAME'; playerId: number; name: string }
  | { type: 'SET_QUIZ_DATA'; data: QuizPhoto[] }
  | { type: 'START_GAME' }
  | { type: 'ADD_GUESS'; guess: Omit<Guess, 'points'> }
  | { type: 'NEXT_PLAYER' }
  | { type: 'CALCULATE_ROUND_POINTS' }
  | { type: 'NEXT_PHOTO' }
  | { type: 'RESET_GAME' }
  | { type: 'PLAY_AGAIN' };

const initialState: GameState = {
  screen: 'password',
  players: [],
  currentPlayerIndex: 0,
  currentPhotoIndex: 0,
  quizData: [],
  roundGuesses: [],
  quizPath: '',
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    case 'SET_QUIZ_PATH':
      return { ...state, quizPath: action.path };

    case 'ADD_PLAYER': {
      if (state.players.length >= 8) return state;
      const newPlayer: Player = {
        id: Date.now(),
        name: '',
        color: PLAYER_COLORS[state.players.length],
        totalScore: 0,
      };
      return { ...state, players: [...state.players, newPlayer] };
    }

    case 'REMOVE_PLAYER': {
      if (state.players.length <= 1) return state;
      const filtered = state.players.filter((p) => p.id !== action.playerId);
      // Reindex colors
      const reindexed = filtered.map((p, i) => ({
        ...p,
        color: PLAYER_COLORS[i],
      }));
      return { ...state, players: reindexed };
    }

    case 'UPDATE_PLAYER_NAME':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, name: action.name } : p
        ),
      };

    case 'SET_QUIZ_DATA':
      return { ...state, quizData: action.data };

    case 'START_GAME': {
      // Filter out players without names
      const validPlayers = state.players.filter((p) => p.name.trim().length > 0);
      return {
        ...state,
        players: validPlayers.map((p) => ({ ...p, totalScore: 0 })),
        currentPhotoIndex: 0,
        currentPlayerIndex: 0,
        roundGuesses: [],
        screen: 'quiz',
      };
    }

    case 'ADD_GUESS':
      return {
        ...state,
        roundGuesses: [...state.roundGuesses, { ...action.guess, points: 0 }],
      };

    case 'NEXT_PLAYER':
      return { ...state, currentPlayerIndex: state.currentPlayerIndex + 1 };

    case 'CALCULATE_ROUND_POINTS': {
      const minDistance = Math.min(...state.roundGuesses.map((g) => g.distance));
      const updatedGuesses = state.roundGuesses.map((guess) => ({
        ...guess,
        points: guess.distance === minDistance ? 1 : 0,
      }));
      // Update player scores
      const updatedPlayers = state.players.map((player) => {
        const playerGuess = updatedGuesses.find((g) => g.playerId === player.id);
        return {
          ...player,
          totalScore: player.totalScore + (playerGuess?.points ?? 0),
        };
      });
      return {
        ...state,
        roundGuesses: updatedGuesses,
        players: updatedPlayers,
      };
    }

    case 'NEXT_PHOTO':
      return {
        ...state,
        currentPhotoIndex: state.currentPhotoIndex + 1,
        currentPlayerIndex: 0,
        roundGuesses: [],
        screen: state.currentPhotoIndex + 1 >= state.quizData.length ? 'final' : 'quiz',
      };

    case 'RESET_GAME':
      return initialState;

    case 'PLAY_AGAIN':
      return {
        ...state,
        players: state.players.map((p) => ({ ...p, totalScore: 0 })),
        currentPhotoIndex: 0,
        currentPlayerIndex: 0,
        roundGuesses: [],
        screen: 'setup',
      };

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  currentPlayer: Player | null;
  currentPhoto: QuizPhoto | null;
  hasValidPlayers: boolean;
  allPlayersGuessed: boolean;
  isLastPhoto: boolean;
  addGuess: (coordinates: [number, number]) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const currentPlayer = state.players[state.currentPlayerIndex] ?? null;
  const currentPhoto = state.quizData[state.currentPhotoIndex] ?? null;
  const hasValidPlayers = state.players.some((p) => p.name.trim().length > 0);
  const allPlayersGuessed = state.currentPlayerIndex >= state.players.length;
  const isLastPhoto = state.currentPhotoIndex >= state.quizData.length - 1;

  const addGuess = useCallback(
    (coordinates: [number, number]) => {
      if (!currentPlayer || !currentPhoto) return;

      const distance = haversineDistance(
        coordinates[1],
        coordinates[0],
        currentPhoto.lat,
        currentPhoto.lng
      );

      dispatch({
        type: 'ADD_GUESS',
        guess: {
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          playerColor: currentPlayer.color,
          coordinates,
          distance,
        },
      });
    },
    [currentPlayer, currentPhoto]
  );

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        currentPlayer,
        currentPhoto,
        hasValidPlayers,
        allPlayersGuessed,
        isLastPhoto,
        addGuess,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
