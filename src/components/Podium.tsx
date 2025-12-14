import type { Player } from '../types';
import { getPlayerInitial } from '../utils/haversine';

interface PodiumPlaceProps {
  player: Player;
  rank: number;
  medal: 'gold' | 'silver' | 'bronze';
}

function PodiumPlace({ player, rank, medal }: PodiumPlaceProps) {
  return (
    <div className="podium-place">
      <div className="podium-avatar" style={{ backgroundColor: player.color }}>
        {getPlayerInitial(player.name)}
      </div>
      <div className="podium-name">{player.name}</div>
      <div className="podium-score">{player.totalScore} pnt</div>
      <div className={`podium-stand ${medal}`}>{rank}</div>
    </div>
  );
}

interface PodiumProps {
  players: Player[];
}

export function Podium({ players }: PodiumProps) {
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="podium">
      {/* Second place (left) */}
      {sorted[1] && <PodiumPlace player={sorted[1]} rank={2} medal="silver" />}
      {/* First place (center) */}
      {sorted[0] && <PodiumPlace player={sorted[0]} rank={1} medal="gold" />}
      {/* Third place (right) */}
      {sorted[2] && <PodiumPlace player={sorted[2]} rank={3} medal="bronze" />}
    </div>
  );
}
