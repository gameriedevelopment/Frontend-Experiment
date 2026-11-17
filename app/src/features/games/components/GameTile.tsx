import { Link } from "react-router-dom";
import { TournamentArt } from "@/features/tournaments/components/TournamentArt";

export interface TileGame {
  id: string;
  name: string;
  wallPhoto?: string | null;
  banner?: string;
  image?: string;
  gameType?: string;
  genre?: string;
}

/** A compact, image-led link to a game, for search results and short lists. */
export function GameTile({ game }: { game: TileGame }) {
  const kind = game.gameType || game.genre;
  return (
    <Link to={`/games/${encodeURIComponent(game.id)}`} className="group relative block aspect-4/3 overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-lavender-400">
      <TournamentArt src={game.wallPhoto || game.banner || game.image} game={game.name} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
      <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/35 to-transparent" />
      <span aria-hidden="true" className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/8 transition-colors group-hover:ring-lavender-400/40" />
      <span className="absolute inset-x-3 bottom-3">
        <span className="block truncate text-sm font-semibold">{game.name}</span>
        {kind && <span className="block truncate text-xs text-mist-400">{kind}</span>}
      </span>
    </Link>
  );
}
