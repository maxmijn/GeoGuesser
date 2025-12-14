import { KeyboardEvent } from 'react';
import type { Player } from '../types';
import { getPlayerInitial } from '../utils/haversine';

interface PlayerEntryProps {
  player: Player;
  index: number;
  onNameChange: (playerId: number, name: string) => void;
  onRemove: (playerId: number) => void;
  onEnterPress: () => void;
  canRemove: boolean;
}

export function PlayerEntry({
  player,
  index,
  onNameChange,
  onRemove,
  onEnterPress,
  canRemove,
}: PlayerEntryProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnterPress();
    }
  };

  return (
    <div className="player-entry" data-player-id={player.id}>
      <div
        className="player-color-badge"
        style={{ backgroundColor: player.color }}
      >
        {player.name ? getPlayerInitial(player.name) : index + 1}
      </div>
      <input
        type="text"
        className="player-name-input"
        placeholder={`Speler ${index + 1} naam`}
        maxLength={20}
        value={player.name}
        onChange={(e) => onNameChange(player.id, e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {canRemove && (
        <button
          className="remove-player-btn"
          onClick={() => onRemove(player.id)}
        >
          ×
        </button>
      )}
    </div>
  );
}
