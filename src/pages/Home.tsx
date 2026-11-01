import { useState } from "react";
import { ArrowRight, CalendarDays, Coins, Flame, Pause, Play, Sparkles, Swords, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { ACHIEVEMENTS } from "../lib/achievements";
import { getDaily } from "../lib/daily";
import { formatScore, GAME_LIST, levelFromXp } from "../lib/games";
import { getLeaderboard } from "../lib/leaderboard";
import { usePlayer } from "../state/player";
import { AchievementIcon, AchievementRow } from "../components/AchievementBadge";
import { CycleCardArt, RunnerCardArt, RoomCardArt } from "../components/Art";
import { Avatar } from "../components/Brand";
import { GameCard } from "../components/GameCard";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { Countdown, ProgressBar, SectionHeading } from "../components/UI";

function useTilt() {
  const [pos, setPos] = useState({ rx: 0, ry: 0 });
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return { style: undefined, onPointerMove: undefined, onPointerLeave: undefined };
  return {
    style: { "--rx": `${pos.rx}deg`, "--ry": `${pos.ry}deg` } as React.CSSProperties,
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      setPos({ rx: -py * 7, ry: px * 9 });
    },
    onPointerLeave: () => setPos({ rx: 0, ry: 0 }),
  };
}

export default function Home() {
  const { state } = usePlayer();
  const [marqueePaused, setMarqueePaused] = useState(false);
  const tilt = useTilt();
  const daily = getDaily("one-chance");
  const dailyRecord = state.dailies[daily.key];
  const dailyDone = dailyRecord?.completed ?? false;
  const dailyProgress = Math.min(100, ((dailyRecord?.score ?? 0) / daily.target) * 100);
  const level = levelFromXp(state.xp);
  const unlocked = Object.keys(state.achievements);
  const board = getLeaderboard({
    game: "one-chance",
    scope: "global",
    timeframe: "all",
    profile: state.profile,
    best: state.stats["one-chance"].best,
    includePlayer: state.settings.publicLeaderboard,
  });
  const nextUp = ACHIEVEMENTS.filter((a) => !state.achievements[a.id]).slice(0, 4);
  const achievementsToShow = nextUp.length ? nextUp : ACHIEVEMENTS.slice(0, 4);

  const marqueeLine = (
    <span className="flex shrink-0 items-center gap-6 pr-6" aria-hidden="true">
      {GAME_LIST.map((g) => (
        <span key={g.id} className="flex items-center gap-6">
          <span>{g.title}</span>
          <span className="text-accent">·</span>
        </span>
      ))}
    </span>
  );

  return (
    <div>
      {/* HERO: settled, the screens themselves lead */}
      <section className="relative">
        <div className="container-page grid items-center gap-10 pb-10 pt-10 sm:pt-14 lg:min-h-[560px] lg:grid-cols-[1.05fr_0.95fr] lg:pb-14 lg:pt-16">
          <div>
            <h1 className="split fade-up max-w-[11ch] text-[clamp(2.8rem,6.4vw,5rem)]">
              Free arcade, built to be replayed.
            </h1>
            <p className="fade-up animation-delay-1 lead mt-6 text-mist-300">
              Pick a game and chase your best on the global board.
            </p>
            <div className="fade-up animation-delay-2 mt-8 flex flex-wrap items-center gap-3">
              <Link to="/games" className="btn btn-primary">
                <Play size={16} fill="currentColor" />
                Start playing
              </Link>
              <Link to="/challenges" className="btn btn-ghost">
                <Swords size={16} />
                Daily challenge
              </Link>
            </div>
            <div className="fade-up animation-delay-3 mt-8 flex flex-wrap gap-2">
              {[
                { label: "Free to play" },
                { label: "Instant play, no download" },
                { label: "Global leaderboards" },
              ].map((m) => (
                <span key={m.label} className="chip">
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* signature: the three game screens, tilted in 3D */}
          <div
            className="tilt relative mx-auto w-full max-w-[540px]"
            style={tilt.style}
            onPointerMove={tilt.onPointerMove}
            onPointerLeave={tilt.onPointerLeave}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/games/impossible-room"
                className="panel art-vignette group relative block aspect-[16/10] overflow-hidden focus-visible:outline-offset-4"
              >
                <RoomCardArt className="absolute inset-0 h-full w-full" />
                <span className="absolute inset-x-0 bottom-0 z-[3] block p-3">
                  <span className="block font-display text-sm font-extrabold tracking-[-0.01em] text-white">
                    The Impossible Room
                  </span>
                </span>
              </Link>
              <Link
                to="/games/one-chance"
                className="panel art-vignette group relative block aspect-[16/10] overflow-hidden focus-visible:outline-offset-4 sm:mt-8"
              >
                <RunnerCardArt className="absolute inset-0 h-full w-full" />
                <span className="absolute inset-x-0 bottom-0 z-[3] block p-3">
                  <span className="block font-display text-sm font-extrabold tracking-[-0.01em] text-white">
                    One Chance
                  </span>
                </span>
              </Link>
              <Link
                to="/games/cycle"
                className="panel art-vignette group relative block aspect-[16/10] overflow-hidden focus-visible:outline-offset-4 sm:col-start-2"
              >
                <CycleCardArt className="absolute inset-0 h-full w-full" />
                <span className="absolute inset-x-0 bottom-0 z-[3] block p-3">
                  <span className="block font-display text-sm font-extrabold tracking-[-0.01em] text-white">
                    Cycle
                  </span>
                </span>
              </Link>
              <Link
                to="/leaderboard"
                className="panel lift flex flex-col justify-between p-3.5 focus-visible:outline-offset-4 sm:col-start-1 sm:row-start-2 sm:mt-8"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-gold">
                  <Trophy size={13} /> Global number one
                </span>
                <span className="mt-3 flex items-center gap-2">
                  <Avatar name={board[0]?.name ?? "PlayerPro"} hue={board[0]?.avatarHue ?? 268} size={30} ring={false} />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-ink">{board[0]?.name ?? "PlayerPro"}</span>
                    <span className="block text-[11px] text-mist-500">
                      One Chance, {formatScore("one-chance", board[0]?.score ?? 3430)}
                    </span>
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE: the shape's band, pausable */}
      <div className="marquee-wrap relative border-y border-rule bg-paper-2 py-3 overflow-hidden">
        <div className={`marquee-track flex w-max ${marqueePaused ? "is-paused" : ""}`}>
          {marqueeLine}
          {marqueeLine}
          {marqueeLine}
          {marqueeLine}
        </div>
        <button
          type="button"
          aria-pressed={marqueePaused}
          aria-label={marqueePaused ? "Resume the marquee" : "Pause the marquee"}
          onClick={() => setMarqueePaused((p) => !p)}
          className="absolute right-3 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-card border border-rule bg-paper-3 text-mist-300 transition-colors hover:border-accent hover:text-accent"
        >
          <Pause size={14} fill={marqueePaused ? "currentColor" : "none"} />
        </button>
        <span className="sr-only">The Impossible Room, One Chance, Cycle.</span>
      </div>

      <div className="container-page space-y-16 pb-8 sm:space-y-20">
        {/* GAMES: the rail */}
        <section aria-labelledby="launch-games">
          <SectionHeading
            title={<span id="launch-games">Three games, no filler</span>}
            description="Every game on PLAYFLIX earns its place. Complete, replayable and built to be mastered."
            action={
              <Link to="/games" className="btn btn-ghost px-4 py-2.5 text-xs">
                Explore games <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {GAME_LIST.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {/* DAILY + PROGRESS */}
        <section className="grid gap-5 lg:grid-cols-[1.28fr_0.72fr]">
          <div className="panel crt relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.42]">
              <RunnerCardArt className="h-full w-full" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(100deg,var(--color-paper-2)_20%,color-mix(in_oklab,var(--color-paper-2)_92%,transparent)_52%,color-mix(in_oklab,var(--color-paper-2)_55%,transparent)_100%)]" />
            <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="chip border-accent/40 text-accent">
                    <Sparkles size={11} /> Featured daily challenge
                  </span>
                  <span className="chip">
                    <Countdown /> left
                  </span>
                </div>
                <h2 className="mt-5 text-[clamp(1.7rem,3vw,2.4rem)]">One seed. Everyone runs it.</h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist-500">{daily.description}</p>
              </div>

              <div className="mt-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip">
                    <Flame size={11} className="text-accent" />
                    {daily.title}
                  </span>
                  <span className="chip border-accent/40 text-accent">
                    <Target size={11} />
                    {daily.target.toLocaleString()} pts
                  </span>
                  <span className="chip">
                    <Coins size={11} className="text-accent" />+{daily.reward} coins
                  </span>
                </div>
                <div className="mt-4 rounded-card border border-rule bg-shade/50 px-3.5 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-mist-500">
                      {dailyDone
                        ? `Cleared with ${formatScore("one-chance", dailyRecord?.score ?? daily.target)}`
                        : dailyRecord
                          ? `Best today, ${formatScore("one-chance", dailyRecord.score)}`
                          : "Your daily run is waiting"}
                    </span>
                    <span className={`font-bold ${dailyDone ? "text-success" : "text-accent"}`}>
                      {dailyDone ? "Complete" : `${Math.round(dailyProgress)}%`}
                    </span>
                  </div>
                  <ProgressBar value={dailyDone ? 100 : dailyProgress} tone={dailyDone ? "gold" : "violet"} className="mt-2" />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/play/one-chance?mode=daily" className="btn btn-primary btn-sm">
                    <Play size={14} fill="currentColor" />
                    {dailyDone ? "Run it again" : "Play daily run"}
                  </Link>
                  <Link to="/challenges" className="btn btn-ghost btn-sm">
                    All challenges
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="panel flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2>Level {level.level}</h2>
                <p className="mt-2 text-xs text-mist-500">Your journey so far</p>
              </div>
              <div className="grid size-12 place-items-center rounded-card border-2 border-accent-2/50 bg-accent-2/10 text-sm font-extrabold text-accent-2">
                {level.level}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold text-mist-600">
                <span>
                  {level.into} / {level.needed} XP
                </span>
                <span>{level.percent}%</span>
              </div>
              <ProgressBar value={level.percent} className="mt-1.5" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { value: state.coins.toLocaleString(), label: "Coins" },
                { value: `${unlocked.length}/${ACHIEVEMENTS.length}`, label: "Awards" },
                { value: `${state.room.completedLevels.length}/3`, label: "Chapters" },
              ].map((s) => (
                <div key={s.label} className="rounded-card border border-rule bg-paper-3 px-2.5 py-2.5 text-center">
                  <div className="label text-center">{s.label}</div>
                  <div className="mt-1 text-sm font-bold tabular-nums text-ink">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 min-h-0 flex-1">
              <p className="label mb-2">Up next</p>
              <div className="space-y-2">
                {(state.room.completedLevels.length === 0
                  ? ACHIEVEMENTS.filter((a) => a.id === "chapter-one" || a.id === "still-standing")
                  : ACHIEVEMENTS.filter((a) => !state.achievements[a.id]).slice(0, 2)
                ).map((def) => (
                  <div key={def.id} className="flex items-center gap-2.5 rounded-card border border-rule bg-paper-3 px-2.5 py-2">
                    <AchievementIcon icon={def.icon} tier={def.tier} locked={!state.achievements[def.id]} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-mist-200">{def.name}</p>
                      <p className="truncate text-[11px] text-mist-600">{def.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/profile" className="mt-4 block rounded-card border border-rule bg-paper-3 px-3.5 py-2.5 text-center text-xs font-bold text-mist-300 transition-colors hover:border-accent-2 hover:text-ink">
              Open your profile
            </Link>
          </div>
        </section>

        {/* LEADERBOARD + ACHIEVEMENTS */}
        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2>Everyone wants the top</h2>
                <p className="mt-2 text-xs text-mist-500">Global board, all time</p>
              </div>
              <Link to="/leaderboard" className="btn btn-ghost btn-sm">
                Full board
              </Link>
            </div>
            <div className="mt-5">
              <LeaderboardTable rows={board} game="one-chance" limit={5} dense />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-rule bg-paper-3 px-3.5 py-2.5">
              <span className="text-xs text-mist-500">
                {state.stats["one-chance"].best
                  ? `Your best, ${formatScore("one-chance", state.stats["one-chance"].best)}`
                  : "You're not on the board yet."}
              </span>
              <Link to="/play/one-chance" className="text-xs font-bold text-accent-2 hover:text-ink">
                {state.stats["one-chance"].best ? "Beat it" : "Claim a spot"}
              </Link>
            </div>
          </div>

          <div className="panel p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2>
                  {unlocked.length} of {ACHIEVEMENTS.length} earned
                </h2>
                <p className="mt-2 text-xs text-mist-500">Achievements</p>
              </div>
              <AchievementIcon icon="trophy" tier="gold" locked={unlocked.length === 0} size="md" />
            </div>
            <ProgressBar value={(unlocked.length / ACHIEVEMENTS.length) * 100} tone="gold" className="mt-4" />
            <div className="mt-4 space-y-2">
              {achievementsToShow.slice(0, 3).map((def) => (
                <AchievementRow key={def.id} def={def} unlocked={Boolean(state.achievements[def.id])} />
              ))}
            </div>
            <Link to="/profile#achievements" className="mt-4 block text-xs font-bold text-accent-2 transition-colors hover:text-ink">
              See the trophy room
            </Link>
          </div>
        </section>

        {/* THE LOOP */}
        <section className="panel relative overflow-hidden px-5 py-7 sm:px-8 sm:py-8">
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2>Why players come back</h2>
              <p className="label mt-2">The loop</p>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-mist-600">
              Discover something worth your time, improve your best, and give a friend something to chase.
            </p>
          </div>
          <ol className="relative mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-6">
            {[
              ["Discover", "Three games, no noise"],
              ["Play", "Instant, no download"],
              ["Improve", "Beat your own best"],
              ["Challenge", "Send a rival a seed"],
              ["Share", "One link, real stakes"],
              ["Return", "New daily, every day"],
            ].map(([step, sub], i) => (
              <li key={step} className="bg-paper-2 px-3 py-3">
                <span className="text-xs font-bold text-accent">0{i + 1}</span>
                <p className="mt-1 text-sm font-bold text-mist-100">{step}</p>
                <p className="mt-0.5 hidden text-[11px] leading-snug text-mist-600 sm:block">{sub}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FINAL CTA: the one ember field, no split, no glow */}
        <section className="relative overflow-hidden rounded-card bg-accent px-6 py-10 text-accent-ink sm:px-10 sm:py-12">
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-lg">
              <h2 className="text-accent-ink">One shot at the top.</h2>
              <p className="mt-3 text-sm leading-relaxed text-accent-ink/80">
                Your first run takes seconds. Your best might take all night.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/play/one-chance" className="btn bg-paper text-accent border-paper hover:shadow-[6px_6px_0_var(--color-accent-2)]">
                <Play size={14} fill="currentColor" /> Play One Chance
              </Link>
              <Link to="/play/impossible-room" className="btn border-accent-ink text-accent-ink hover:shadow-[4px_4px_0_var(--color-accent-ink)]">
                <CalendarDays size={14} /> Enter the room
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
