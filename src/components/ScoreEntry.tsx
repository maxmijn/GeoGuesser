import type { Guess, Player } from '../types';
import { formatDistance, getPlayerInitial } from '../utils/haversine';

interface RoundScoreEntryProps {
  guess: Guess;
  index: number;
}

export function RoundScoreEntry({ guess, index }: RoundScoreEntryProps) {
  return (
    <div
      className={`score-entry ${guess.points > 0 ? 'winner' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div
        className="player-color-badge"
        style={{ backgroundColor: guess.playerColor }}
      >
        {getPlayerInitial(guess.playerName)}
      </div>
      <span className="player-name">{guess.playerName}</span>
      <span className="distance">{formatDistance(guess.distance)}</span>
      <span className="points">{guess.points > 0 ? '🏆 +1' : ''}</span>
    </div>
  );
}

interface TotalScoreEntryProps {
  player: Player;
  index: number;
}

export function TotalScoreEntry({ player, index }: TotalScoreEntryProps) {
  return (
    <div className="score-entry" style={{ animationDelay: `${index * 0.1}s` }}>
      <div
        className="player-color-badge"
        style={{ backgroundColor: player.color }}
      >
        {getPlayerInitial(player.name)}
      </div>
      <span className="player-name">{player.name}</span>
      <span className="points">{player.totalScore}</span>
    </div>
  );
}

interface FinalScoreEntryProps {
  player: Player;
  rank: number;
  index: number;
}

export function FinalScoreEntry({ player, rank, index }: FinalScoreEntryProps) {
  return (
    <div
      className="final-score-entry"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <span className="rank">#{rank}</span>
      <div
        className="player-color-badge"
        style={{ backgroundColor: player.color }}
      >
        {getPlayerInitial(player.name)}
      </div>
      <span className="player-name">{player.name}</span>
      <span className="total-points">{player.totalScore}</span>
    </div>
  );
}
