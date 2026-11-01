import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { GAME_LIST } from "../lib/games";
import { formatScore } from "../lib/games";
import { usePlayer } from "../state/player";
import { GameArt } from "../components/Art";

export default function Games() {
  const { state } = usePlayer();

  return (
    <div className="container-page pb-10 pt-14 sm:pt-20">
      <p className="eyebrow">The library</p>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-8">
        <h1 className="max-w-3xl text-[clamp(2.6rem,6vw,5.25rem)] leading-[0.9]">
          Three worlds.
          <span className="serif block text-mist-500">One standard.</span>
        </h1>
        <p className="max-w-xs text-[12px] leading-relaxed text-mist-500">
          Every game ships complete: a beginning, an ending, a score worth defending. Nothing here is a demo.
        </p>
      </div>

      <ol className="mt-12 border-t border-rule">
        {GAME_LIST.map((game, index) => {
          const best = state.stats[game.id].best;
          const progress =
            game.id === "impossible-room"
              ? state.room.completedLevels.length / 3
              : game.id === "cycle"
                ? state.cycle.levelsCleared.length / 5
                : Math.min(1, (best ?? 0) / 2000);
          const progressLabel =
            game.id === "impossible-room"
              ? `${state.room.completedLevels.length} of 3 chapters`
              : game.id === "cycle"
                ? `${state.cycle.levelsCleared.length} of 5 roads`
                : best
                  ? `Best ${formatScore(game.id, best)}`
                  : "No run yet";
          return (
            <li key={game.id} className="border-b border-rule py-10 sm:py-12">
              <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
                <Link
                  to={`/games/${game.id}`}
                  className={`group relative block overflow-hidden border border-rule ${
                    index % 2 === 0 ? "lg:col-span-6" : "lg:col-span-6 lg:order-2"
                  }`}
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <GameArt
                      art={game.art}
                      className="h-full w-full transition-transform duration-[1200ms] group-hover:scale-[1.02]"
                    />
                  </div>
                  <span className="absolute left-4 top-4 index-number text-white/70">0{index + 1}</span>
                </Link>

                <div className={`lg:col-span-6 ${index % 2 === 0 ? "" : "lg:order-1"}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="label !text-accent">{game.genre}</span>
                    <span className="h-px w-6 bg-rule" />
                    <span className="label">{game.tags[0]}</span>
                  </div>
                  <h2 className="mt-3 text-[clamp(1.9rem,3.8vw,3rem)] leading-[0.95]">{game.title}</h2>
                  <p className="serif mt-2 text-lg text-mist-400">{game.tagline}</p>
                  <p className="mt-4 max-w-md text-[12px] leading-relaxed text-mist-500">{game.description}</p>

                  <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule pt-4">
                    <div>
                      <p className="label">Progress</p>
                      <p className="mt-1 text-[11px] text-ink-2">{progressLabel}</p>
                    </div>
                    <div className="min-w-[120px] flex-1">
                      <div className="h-px w-full bg-rule">
                        <div
                          className="h-px bg-accent transition-[width] duration-500"
                          style={{ width: `${Math.max(2, progress * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link to={game.route} className="btn btn-primary">
                      <Play size={12} fill="currentColor" />
                      Play now
                    </Link>
                    <Link to={`/games/${game.id}`} className="btn btn-ghost">
                      Details <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-md text-[11px] leading-relaxed text-mist-600">
          A launch lineup deliberately kept small. Each game is tested on desktop and mobile before it reaches this page.
        </p>
        <Link to="/challenges" className="text-link">
          Today's challenges <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
