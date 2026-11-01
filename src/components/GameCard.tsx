import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayer } from "../state/player";
import { formatScore, type GameMeta } from "../lib/games";
import { GameArt } from "./Art";
import { ProgressBar } from "./UI";

export function GameCard({ game, className = "" }: { game: GameMeta; className?: string }) {
  const { state } = usePlayer();
  const stat = state.stats[game.id];
  const chapters = state.room.completedLevels.length;
  const progress =
    game.id === "impossible-room"
      ? (chapters / 3) * 100
      : game.id === "cycle"
        ? (state.cycle.levelsCleared.length / 5) * 100
        : Math.min(100, ((stat.best ?? 0) / 2000) * 100);
  const progressLabel =
    game.id === "impossible-room"
      ? `${chapters} of 3 chapters cleared`
      : game.id === "cycle"
        ? state.cycle.levelsCleared.length
          ? `${state.cycle.levelsCleared.length} of 5 roads cleared`
          : "No road cleared yet"
        : stat.best
          ? `Personal best, ${formatScore(game.id, stat.best)}`
          : "No run recorded yet";

  return (
    <article className={`group panel lift relative overflow-hidden ${className}`}>
      <Link to={`/games/${game.id}`} className="block focus-visible:outline-offset-4">
        <div className="art-vignette relative aspect-[16/10] overflow-hidden sm:aspect-[16/9]">
          <GameArt art={game.art} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
            <h3 className="font-display text-2xl font-extrabold uppercase leading-[1] tracking-[-0.03em] text-white sm:text-[2rem]">
              {game.title}
            </h3>
            <p className="mt-1 text-[13px] text-white/75">{game.short}</p>
          </div>
        </div>
      </Link>

      <div className="p-4 sm:p-5">
        <p className="line-clamp-2 min-h-[2.6rem] text-sm leading-relaxed text-mist-500">{game.description}</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-mist-500">{progressLabel}</span>
            <span className="font-bold text-mist-600">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} tone={game.id === "impossible-room" || game.id === "cycle" ? "gold" : "blue"} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {game.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
          <Link to={game.route} className="btn btn-sm btn-primary">
            <Play size={13} fill="currentColor" />
            Play now
          </Link>
        </div>
      </div>
    </article>
  );
}
