import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Coins, Gamepad2, Lock, Play, Swords, Target, Trophy } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getDaily } from "../lib/daily";
import { formatDuration, formatScore, GAMES } from "../lib/games";
import type { GameId } from "../lib/types";
import { getLeaderboard } from "../lib/leaderboard";
import { usePlayer } from "../state/player";
import { GameArt } from "../components/Art";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { Countdown, ProgressBar, SectionHeading } from "../components/UI";

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
  const other = Object.values(GAMES).find((g) => g.id !== game.id)!;
  const sectionId = "how-to-play";
  const isCycle = game.id === "cycle";
  const clearedChapters = isCycle ? state.cycle.levelsCleared : state.room.completedLevels;
  const furthestChapter = isCycle
    ? Math.min(game.chapters?.length ?? 5, Math.max(0, ...state.cycle.levelsCleared) + 1)
    : state.room.unlocked;
  const chapterTime = (n: number) => (isCycle ? state.cycle.bestMs[n] : state.room.bestTimes[n]);

  return (
    <div className="container-page pt-5 sm:pt-8">
      <Link to="/games" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-mist-500 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent">
        <ArrowLeft size={13} /> All games
      </Link>

      {/* Banner */}
      <section className="art-vignette relative mt-4 overflow-hidden rounded-[2rem] border border-white/10">
        <div className="relative aspect-[4/3] sm:aspect-[16/8] lg:aspect-[16/6.4]">
          <GameArt art={game.art} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-shade/95 via-shade/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-shade via-transparent to-transparent" />
        </div>
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-white/15 bg-black/30 text-white/80">Game {game.index}</span>
            <span className="chip border-white/15 bg-black/30 text-white/80">{game.genre}</span>
            <span className="chip border-gold/30 bg-gold/10 text-gold">Free to play</span>
          </div>
          <h1 className="mt-3 max-w-2xl font-display text-[clamp(2rem,5.6vw,4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.05em] text-white">
            {game.title}
          </h1>
          <p className="mt-2.5 max-w-lg text-sm font-medium text-mist-300 sm:text-base">{game.short}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={game.route} className="btn btn-primary px-6 py-3.5 text-sm">
              <Play size={16} fill="currentColor" /> Play now
            </Link>
            <a href={`#${sectionId}`} className="btn btn-ghost border-white/15 bg-black/25 px-5 py-3.5 text-sm">
              <Gamepad2 size={16} /> How to play
            </a>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_0.9fr]">
        <div className="space-y-6">
          <section className="panel p-5 sm:p-7">
                        <h2 className="mt-2 font-display text-2xl font-bold text-white">{game.tagline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-mist-400">{game.description}</p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {game.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2.5 rounded-xl border border-white/7 bg-white/[0.025] px-3 py-3">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-300"><Check size={12} /></span>
                  <span className="text-[12px] leading-relaxed text-mist-300">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          {game.chapters && (
            <section className="panel p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                                    <h2 className="mt-1.5 font-display text-xl font-bold text-white">{isCycle ? "The five roads" : "The way out"}</h2>
                </div>
                <span className="chip border-gold/20 bg-gold/[0.06] text-gold">
                  {clearedChapters.length} / {game.chapters.length} cleared
                </span>
              </div>
              <div className="mt-4 space-y-2.5">
                {game.chapters.map((ch) => {
                  const cleared = clearedChapters.includes(ch.number);
                  const locked = ch.number > furthestChapter;
                  return (
                    <div key={ch.number} className={`flex items-center gap-3.5 rounded-xl border px-3.5 py-3 ${cleared ? "border-gold/20 bg-gold/[0.035]" : "border-white/7 bg-white/[0.02]"}`}>
                      <span className={`grid size-9 shrink-0 place-items-center rounded-xl border font-display text-[11px] font-bold ${cleared ? "border-gold/30 bg-gold/10 text-gold" : locked ? "border-white/8 bg-white/[0.02] text-mist-600" : "border-violet-400/25 bg-violet-500/10 text-violet-300"}`}>
                        {locked ? <Lock size={13} /> : cleared ? <Check size={15} /> : String(ch.number).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-bold ${locked ? "text-mist-500" : "text-mist-100"}`}>{ch.name}</p>
                        <p className="truncate text-[11px] text-mist-600">
                          {locked ? (isCycle ? "Clear the previous road to unlock." : "Complete the previous chapter to unlock.") : ch.subtitle}
                        </p>
                      </div>
                      {cleared && chapterTime(ch.number) != null && (
                        <span className="shrink-0 font-display text-[11px] font-bold tabular-nums text-mist-500">{formatDuration(chapterTime(ch.number)!)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section id={sectionId} className="panel scroll-mt-24 p-5 sm:p-7">
                        <h2 className="mt-1.5 font-display text-xl font-bold text-white">Built for thumbs and keyboards</h2>
            <div className="mt-4 divide-y divide-white/6">
              {game.controls.map((control) => (
                <div key={control.action} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-[12px] text-mist-400">{control.action}</span>
                  <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {control.keys.map((key) => <kbd key={key} className="keycap">{key}</kbd>)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-5 sm:p-7">
            <SectionHeading
              eyebrow="Leaderboard"
              title="The score to beat"
              action={<Link to="/leaderboard" className="btn btn-ghost px-3.5 py-2 text-[11px]">Full board <ChevronRight size={13} /></Link>}
            />
            <div className="mt-5">
              <LeaderboardTable rows={board} game={game.id} limit={5} />
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-5">
            <p className="label">Your record</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-mist-600">{game.scoreLabel}</p>
                <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-white">
                  {formatScore(game.id, stat.best)}
                </p>
              </div>
              <span className={`grid size-10 place-items-center rounded-xl border ${stat.best ? "border-gold/30 bg-gold/10 text-gold" : "border-white/8 bg-white/[0.03] text-mist-600"}`}>
                <Trophy size={17} />
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/7 bg-white/[0.025] px-3 py-2.5">
                <p className="text-[9px] font-bold text-mist-600">Runs</p>
                <p className="mt-0.5 font-display text-sm font-bold text-white">{stat.plays}</p>
              </div>
              <div className="rounded-xl border border-white/7 bg-white/[0.025] px-3 py-2.5">
                <p className="text-[9px] font-bold text-mist-600">Coins earned</p>
                <p className="mt-0.5 font-display text-sm font-bold text-gold">{stat.coinsEarned.toLocaleString()}</p>
              </div>
            </div>
            {game.id === "impossible-room" && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] font-semibold text-mist-600">
                  <span>Escape progress</span>
                  <span>{state.room.completedLevels.length}/3</span>
                </div>
                <ProgressBar value={(state.room.completedLevels.length / 3) * 100} tone="gold" className="mt-1.5" />
              </div>
            )}
            {game.id === "cycle" && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] font-semibold text-mist-600">
                  <span>Roads cleared</span>
                  <span>{state.cycle.levelsCleared.length}/5</span>
                </div>
                <ProgressBar value={(state.cycle.levelsCleared.length / 5) * 100} tone="gold" className="mt-1.5" />
              </div>
            )}
            <Link to={game.route} className="btn btn-primary mt-5 w-full py-3 text-xs">
              <Play size={14} fill="currentColor" /> {stat.plays === 0 ? "Start your first run" : "Play again"}
            </Link>
          </div>

          <div className="panel panel-glow overflow-hidden p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="label text-gold"><Target size={12} /> Daily challenge</span>
              <span className="text-gold"><Countdown className="text-[10px]" /></span>
            </div>
            <h3 className="mt-2.5 font-display text-lg font-bold text-white">{daily.title}</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-mist-600">{daily.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="chip border-white/10 text-[10px]">
                {daily.unit === "points" ? `${daily.target.toLocaleString()} pts` : `Under ${formatDuration(daily.target)}`}
              </span>
              <span className="chip border-gold/25 bg-gold/[0.07] text-[10px] text-gold"><Coins size={10} /> +{daily.reward}</span>
            </div>
            <Link to={`${game.route}?mode=daily`} className="btn btn-ghost mt-4 w-full py-2.5 text-[11px]">
              <Clock3 size={13} /> Play today's seed
            </Link>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="label">Next up</p>
              <Swords size={14} className="text-mist-600" />
            </div>
            <Link to={`/games/${other.id}`} className="group mt-3 block overflow-hidden rounded-xl border border-white/8">
              <div className="art-vignette relative aspect-[16/8]">
                <GameArt art={other.art} className="absolute inset-0 h-full w-full transition-transform duration-700 motion-reduce:transition-none group-hover:scale-105" />
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-3">
                  <p className="text-[9px] font-bold text-white/50">Game {other.index}</p>
                  <p className="font-display text-lg font-extrabold uppercase leading-none text-white">{other.title}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 text-[10px] font-semibold text-mist-500">
                {other.short} <ArrowRight size={12} />
              </div>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
