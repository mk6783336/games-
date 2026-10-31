import { ArrowUpRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayer } from "../state/player";
import { formatScore, type GameMeta } from "../lib/games";
import { GameArt } from "./Art";
import { ProgressBar } from "./UI";

export function GameCard({ game, className = "" }: { game: GameMeta; className?: string }) {
  const { state } = usePlayer();
  const stat = state.stats[game.id];
  const chapters = state.room.completedLevels.length;
  const progress = game.id === "impossible-room" ? (chapters / 3) * 100 : Math.min(100, ((stat.best ?? 0) / 2000) * 100);
  const progressLabel =
    game.id === "impossible-room"
      ? `${chapters} of 3 chapters cleared`
      : stat.best
        ? `Personal best · ${formatScore(game.id, stat.best)}`
        : "No run recorded yet";

  return (
    <article className={`group panel lift relative overflow-hidden ${className}`}>
      <Link to={`/games/${game.id}`} className="block focus-visible:outline-offset-4">
        <div className="art-vignette relative aspect-[16/10] overflow-hidden sm:aspect-[16/9]">
          <GameArt
            art={game.art}
            className="absolute inset-0 h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]"
          />
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 sm:p-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
              Game {game.index}
              <span className="size-1 rounded-full bg-violet-400" />
              {game.genre}
            </span>
            <span className="grid size-8 place-items-center rounded-full border border-white/15 bg-black/30 text-white/70 backdrop-blur-md transition group-hover:border-violet-300/40 group-hover:text-white">
              <ArrowUpRight size={15} />
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{game.short}</p>
            <h3 className="font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.04em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.8)] sm:text-[2rem]">
              {game.title}
            </h3>
          </div>
        </div>
      </Link>

      <div className="p-4 sm:p-5">
        <p className="line-clamp-2 min-h-[2.6rem] text-[13px] leading-relaxed text-mist-500">{game.description}</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-semibold text-mist-500">{progressLabel}</span>
            <span className="font-bold text-mist-600">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} tone={game.id === "impossible-room" ? "gold" : "blue"} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {game.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
          <Link
            to={game.route}
            className="btn btn-primary px-3.5 py-2.5 text-[12px] focus-visible:outline-offset-2"
          >
            <Play size={13} fill="currentColor" />
            Play now
          </Link>
        </div>
      </div>
    </article>
  );
}
