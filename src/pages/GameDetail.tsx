import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Coins, Lock, Play, Target } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getDaily } from "../lib/daily";
import { formatDuration, formatScore, GAME_LIST, GAMES } from "../lib/games";
import type { GameId } from "../lib/types";
import { getLeaderboard } from "../lib/leaderboard";
import { usePlayer } from "../state/player";
import { GameArt } from "../components/Art";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { Countdown } from "../components/UI";

const THEME: Record<
  GameId,
  { kicker: string; accent: string; rule: string; facts: { label: string; value: string }[] }
> = {
  cycle: {
    kicker: "Alpine climb · five stages",
    accent: "text-accent",
    rule: "bg-accent",
    facts: [
      { label: "Roads", value: "5" },
      { label: "Run", value: "~8 min" },
      { label: "Lives", value: "1" },
    ],
  },
  "one-chance": {
    kicker: "Survival arcade · endless",
    accent: "text-electric",
    rule: "bg-electric",
    facts: [
      { label: "Lives", value: "1" },
      { label: "Mode", value: "Endless" },
      { label: "Seed", value: "Daily" },
    ],
  },
  "impossible-room": {
    kicker: "Escape room · three chapters",
    accent: "text-accent",
    rule: "bg-accent",
    facts: [
      { label: "Chapters", value: "3" },
      { label: "Hints", value: "Optional" },
      { label: "Progress", value: "Saved" },
    ],
  },
};

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const { state } = usePlayer();
  const game = GAMES[gameId as GameId];

  useEffect(() => {
    if (game) document.title = `${game.title} — PLAYFLIX`;
    return () => {
      document.title = "PLAYFLIX — Play. Challenge. Compete.";
    };
  }, [game]);

  if (!game) return <Navigate to="/games" replace />;

  const theme = THEME[game.id];
  const stat = state.stats[game.id];
  const daily = getDaily(game.id);
  const board = getLeaderboard({
    game: game.id,
    scope: "global",
    timeframe: "all",
    profile: state.profile,
    best: stat.best,
    includePlayer: state.settings.publicLeaderboard,
  });
  const nextGame = GAME_LIST[(GAME_LIST.findIndex((g) => g.id === game.id) + 1) % GAME_LIST.length];
  const isCycle = game.id === "cycle";
  const clearedChapters = isCycle ? state.cycle.levelsCleared : state.room.completedLevels;
  const furthestChapter = isCycle
    ? Math.min(game.chapters?.length ?? 5, Math.max(0, ...state.cycle.levelsCleared) + 1)
    : state.room.unlocked;
  const chapterTime = (n: number) => (isCycle ? state.cycle.bestMs[n] : state.room.bestTimes[n]);
  const progressValue = isCycle
    ? state.cycle.levelsCleared.length / 5
    : game.id === "impossible-room"
      ? state.room.completedLevels.length / 3
      : Math.min(1, (stat.best ?? 0) / 2000);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rule">
        <div className="absolute inset-0">
          <GameArt art={game.art} className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.95)_0%,rgba(5,6,8,0.72)_38%,rgba(5,6,8,0.18)_78%,rgba(5,6,8,0.35)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--color-paper)_0%,rgba(5,6,8,0.25)_34%,transparent_60%)]" />

        <div className="container-page relative flex min-h-[66svh] flex-col justify-between pb-10 pt-5 sm:pb-12 sm:pt-7">
          <Link
            to="/games"
            className="inline-flex w-fit items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-mist-400 transition-colors hover:text-ink"
          >
            <ArrowLeft size={12} /> The library
          </Link>

          <div className="mt-16 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`label ${theme.accent}`}>{theme.kicker}</span>
              <span className="h-px w-7 bg-white/25" />
              <span className="label !text-mist-400">Game {game.index}</span>
            </div>
            <h1 className="mt-4 text-[clamp(2.9rem,8vw,6.75rem)] uppercase leading-[0.85] text-ink">
              {game.title}
            </h1>
            <p className="serif mt-4 max-w-2xl text-[clamp(1.25rem,2.4vw,1.9rem)] leading-tight text-ink-2">
              {game.tagline}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={game.route} className="btn btn-primary">
                <Play size={13} fill="currentColor" /> {stat.plays === 0 ? "Start your first run" : "Play again"}
              </Link>
              <a href="#how-to-play" className="btn btn-ghost">
                How to play
              </a>
            </div>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-4">
            {theme.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="label !text-mist-500">{fact.label}</dt>
                <dd className="mt-1 text-[12px] font-medium text-ink-2">{fact.value}</dd>
              </div>
            ))}
            <div>
              <dt className="label !text-mist-500">{game.scoreLabel}</dt>
              <dd className={`mt-1 text-[12px] font-medium tabular-nums ${theme.accent}`}>
                {formatScore(game.id, stat.best)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="container-page grid gap-16 py-14 sm:py-20 lg:grid-cols-[1.55fr_0.85fr] lg:gap-20">
        <div className="min-w-0 space-y-16">
          {/* about */}
          <section>
            <p className="eyebrow">The game</p>
            <h2 className="mt-4 max-w-xl">{game.tagline}</h2>
            <p className="mt-5 max-w-xl text-[13px] leading-[1.8] text-mist-400">{game.description}</p>

            <div className="mt-8 grid gap-x-10 sm:grid-cols-2">
              {game.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 border-t border-rule py-3.5">
                  <Check size={13} className={`mt-0.5 shrink-0 ${theme.accent}`} />
                  <span className="text-[12px] leading-relaxed text-mist-300">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          {/* structure */}
          {game.chapters && (
            <section>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">{isCycle ? "The route" : "The chapters"}</p>
                  <h2 className="mt-4">{isCycle ? "Five roads, one continuous run." : "Three rooms, no way back."}</h2>
                </div>
                <span className="label">
                  {clearedChapters.length} / {game.chapters.length} cleared
                </span>
              </div>

              {isCycle && <RoadProfile />}

              <ol className="mt-6 border-t border-rule">
                {game.chapters.map((chapter) => {
                  const cleared = clearedChapters.includes(chapter.number);
                  const locked = chapter.number > furthestChapter;
                  return (
                    <li
                      key={chapter.number}
                      className={`grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 border-b border-rule py-4 ${
                        locked ? "opacity-45" : ""
                      }`}
                    >
                      <span className={`font-display text-[11px] tabular-nums ${cleared ? theme.accent : "text-mist-600"}`}>
                        {String(chapter.number).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-medium text-ink">{chapter.name}</p>
                          {cleared && <Check size={11} className={theme.accent} />}
                          {locked && <Lock size={10} className="text-mist-600" />}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-mist-500">
                          {locked
                            ? isCycle
                              ? "Clear the previous road to unlock."
                              : "Complete the previous chapter to unlock."
                            : chapter.subtitle}
                        </p>
                      </div>
                      <span className="text-[10px] tabular-nums text-mist-500">
                        {cleared && chapterTime(chapter.number) != null
                          ? formatDuration(chapterTime(chapter.number)!)
                          : ""}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-[10px] uppercase tracking-[0.12em] text-mist-600">
                Best splits are saved to your profile and survive a reload.
              </p>
            </section>
          )}

          {/* controls */}
          <section id="how-to-play" className="scroll-mt-24">
            <p className="eyebrow">Controls</p>
            <h2 className="mt-4">Built for desks and thumbs.</h2>
            <div className="mt-6 border-t border-rule">
              {game.controls.map((control) => (
                <div key={control.action} className="flex items-center justify-between gap-6 border-b border-rule py-3.5">
                  <span className="text-[12px] text-mist-300">{control.action}</span>
                  <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {control.keys.map((key) => (
                      <kbd key={key} className="keycap">
                        {key}
                      </kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* board */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Leaderboard</p>
                <h2 className="mt-4">The score to beat.</h2>
              </div>
              <Link to="/leaderboard" className="text-link">
                Full board <ArrowRight size={13} />
              </Link>
            </div>
            <div className="mt-7">
              <LeaderboardTable rows={board} game={game.id} limit={5} />
            </div>
          </section>
        </div>

        {/* ASIDE */}
        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="label">Your record</p>
            <div className="mt-4 flex items-end justify-between gap-4 border-b border-rule pb-4">
              <p className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tabular-nums tracking-[-0.04em] text-ink">
                {formatScore(game.id, stat.best)}
              </p>
              <span className="text-[10px] uppercase tracking-[0.12em] text-mist-600">
                {stat.plays} {stat.plays === 1 ? "run" : "runs"}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-mist-500">
              <span>{isCycle ? "Roads cleared" : game.id === "impossible-room" ? "Escape progress" : "Season progress"}</span>
              <span>{Math.round(progressValue * 100)}%</span>
            </div>
            <div className="mt-2 h-px bg-rule">
              <div className={`h-px ${theme.rule}`} style={{ width: `${Math.max(2, progressValue * 100)}%` }} />
            </div>
            <Link to={game.route} className="mt-6 flex w-full">
              <span className="btn btn-primary w-full">
                <Play size={13} fill="currentColor" /> {stat.plays === 0 ? "Start your first run" : "Play again"}
              </span>
            </Link>
          </div>

          <div className="border-t border-rule pt-6">
            <div className="flex items-center justify-between gap-3">
              <span className="label flex items-center gap-1.5 !text-accent">
                <Target size={11} /> Daily challenge
              </span>
              <Countdown className="text-[10px] text-mist-500" />
            </div>
            <h3 className="mt-3 text-lg">{daily.title}</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-mist-500">{daily.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip">
                {daily.unit === "points" ? `${daily.target.toLocaleString()} pts` : `Under ${formatDuration(daily.target)}`}
              </span>
              <span className="chip border-accent/25 text-accent">
                <Coins size={10} /> +{daily.reward}
              </span>
            </div>
            <Link to={`${game.route}?mode=daily`} className="btn btn-ghost mt-5 w-full">
              <Clock3 size={12} /> Play today's seed
            </Link>
          </div>

          <div className="border-t border-rule pt-6">
            <p className="label">Next in the library</p>
            <Link to={`/games/${nextGame.id}`} className="group mt-4 block">
              <div className="relative aspect-[16/9] overflow-hidden border border-rule">
                <GameArt
                  art={nextGame.art}
                  className="h-full w-full transition-transform duration-[1000ms] group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-ink">{nextGame.title}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-mist-600">{nextGame.genre}</p>
                </div>
                <ArrowRight size={13} className="text-mist-500 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RoadProfile() {
  const profile = "M0 74 L36 60 L72 66 L108 42 L144 52 L180 30 L216 44 L252 24 L288 36 L324 16 L360 30 L396 10";
  return (
    <div className="mt-8 border-y border-rule py-4">
      <svg viewBox="0 0 396 84" className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="road-profile-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e5b15f" stopOpacity="0.18" />
            <stop offset="1" stopColor="#e5b15f" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${profile} L396 84 L0 84 Z`} fill="url(#road-profile-fill)" />
        <path d={profile} fill="none" stroke="#e5b15f" strokeWidth="1" opacity="0.7" />
        {[36, 108, 180, 252, 324].map((x, i) => (
          <g key={x}>
            <line x1={x} y1="6" x2={x} y2="80" stroke="#23252b" strokeWidth="1" strokeDasharray="2 5" />
            <text x={x + 4} y="14" fill="#8e897d" fontSize="7" letterSpacing="1.5">
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[9px] uppercase tracking-[0.14em] text-mist-600">
        <span>Fern Hollow</span>
        <span>Stormfront</span>
      </div>
    </div>
  );
}
