import { ArrowRight, ArrowUpRight, Play, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { ACHIEVEMENTS } from "../lib/achievements";
import { getDaily } from "../lib/daily";
import { formatScore, GAME_LIST, levelFromXp } from "../lib/games";
import { getLeaderboard } from "../lib/leaderboard";
import { usePlayer } from "../state/player";
import { AchievementIcon } from "../components/AchievementBadge";
import { CycleCardArt, RoomCardArt, RunnerCardArt } from "../components/Art";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { Countdown, ProgressBar } from "../components/UI";

export default function Home() {
  const { state } = usePlayer();
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
  const nextUp = ACHIEVEMENTS.filter((a) => !state.achievements[a.id]).slice(0, 3);

  return (
    <div>
      {/* HERO — one game, one image, one decision */}
      <section className="hero-frame">
        <div className="absolute inset-0">
          <CycleCardArt className="h-full w-full" />
        </div>
        <div className="relative z-[2] flex min-h-[min(74svh,660px)] items-end">
          <div className="container-page w-full pb-12 pt-16 sm:pb-14 sm:pt-24">
            <div className="max-w-[640px]">
              <p className="eyebrow fade-up">Featured · Game 03</p>
              <h1 className="fade-up animation-delay-1 mt-4 text-[clamp(4rem,11vw,8.5rem)] uppercase leading-[0.82] text-ink">
                Cycle
              </h1>
              <p className="fade-up animation-delay-2 serif mt-4 text-[clamp(1.35rem,2.4vw,2rem)] text-ink-2">
                The hill always wins. Pedal anyway.
              </p>
              <p className="fade-up animation-delay-3 mt-5 max-w-md text-[13px] leading-relaxed text-mist-300">
                Five roads from fern hollow to stormfront. Read the terrain, hold your line through rock and weather, and bring the bike home in one run.
              </p>
              <div className="fade-up animation-delay-3 mt-8 flex flex-wrap items-center gap-3">
                <Link to="/play/cycle" className="btn btn-primary">
                  <Play size={13} fill="currentColor" />
                  Start the ride
                </Link>
                <Link to="/games/cycle" className="btn btn-ghost">
                  View the game
                </Link>
              </div>
              <div className="fade-up animation-delay-4 mt-9 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.14em] text-mist-400">
                <span>5 roads</span>
                <span>One life</span>
                <span>Keyboard + touch</span>
                <span className="text-accent">
                  Best {formatScore("cycle", state.stats.cycle.best)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 right-[var(--gutter)] z-[2] hidden items-center gap-4 md:flex">
          <span className="label !text-mist-500">Next</span>
          <Link to="/games/one-chance" className="group flex items-center gap-2 text-[11px] font-medium text-ink-2 transition-colors hover:text-ink">
            One Chance
            <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* index strip */}
      <div className="border-b border-rule">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3.5">
          <p className="label !text-mist-600">The library · three complete games</p>
          <p className="hidden text-[10px] uppercase tracking-[0.16em] text-mist-600 sm:block">
            The Impossible Room <span className="mx-2 text-rule">/</span> One Chance{" "}
            <span className="mx-2 text-rule">/</span> Cycle
          </p>
        </div>
      </div>

      {/* LIBRARY */}
      <section className="container-page py-20 sm:py-24" aria-labelledby="library">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">The games</p>
            <h2 id="library" className="mt-4 max-w-xl">
              Three worlds, each built to be finished and then beaten.
            </h2>
          </div>
          <Link to="/games" className="text-link">
            Browse the library <ArrowRight size={13} />
          </Link>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden border border-rule bg-rule lg:grid-cols-12">
          <Link
            to="/games/impossible-room"
            className="group relative block min-h-[420px] overflow-hidden bg-paper-2 lg:col-span-7 lg:min-h-[560px]"
          >
            <RoomCardArt className="absolute inset-0 h-full w-full transition-transform duration-[1200ms] group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,5,6,0.94)_0%,rgba(5,5,6,0.55)_36%,transparent_66%)]" />
            <div className="relative flex h-full min-h-[420px] flex-col justify-between p-6 sm:p-8 lg:min-h-[560px]">
              <div className="flex items-center justify-between">
                <span className="index-number">01</span>
                <span className="chip border-white/20 text-ink-2">Escape room</span>
              </div>
              <div>
                <p className="label !text-accent">The Impossible Room</p>
                <h3 className="mt-3 max-w-md font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-ink">
                  The door was never the puzzle.
                </h3>
                <p className="mt-3 max-w-sm text-[12px] leading-relaxed text-mist-300">
                  Search the room, read what others missed, combine what shouldn't work. Three chapters, one way out.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-5 text-[10px] uppercase tracking-[0.14em] text-mist-400">
                  <span>{state.room.completedLevels.length} / 3 chapters</span>
                  <span className="text-accent">Enter the room →</span>
                </div>
              </div>
            </div>
          </Link>

          <div className="grid gap-px bg-rule lg:col-span-5">
            <Link
              to="/games/one-chance"
              className="group relative block min-h-[220px] overflow-hidden bg-paper-2"
            >
              <RunnerCardArt className="absolute inset-0 h-full w-full transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.94)_0%,rgba(5,6,8,0.4)_72%,transparent_100%)]" />
              <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="index-number">02</span>
                  <span className="chip border-white/15 text-ink-2">One life</span>
                </div>
                <div>
                  <h3 className="font-display text-[clamp(1.5rem,2.5vw,2.1rem)] font-semibold leading-none tracking-[-0.03em] text-ink">
                    One Chance
                  </h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-mist-400">
                    The city accelerates. You don't get a second mistake.
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-accent">
                    Best {formatScore("one-chance", state.stats["one-chance"].best)} →
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/games/cycle"
              className="group relative block min-h-[220px] overflow-hidden bg-paper-2"
            >
              <CycleCardArt className="absolute inset-0 h-full w-full transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.94)_0%,rgba(5,6,8,0.32)_72%,transparent_100%)]" />
              <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="index-number">03</span>
                  <span className="chip border-white/15 text-ink-2">Alpine</span>
                </div>
                <div>
                  <h3 className="font-display text-[clamp(1.5rem,2.5vw,2.1rem)] font-semibold leading-none tracking-[-0.03em] text-ink">
                    Cycle
                  </h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-mist-400">
                    Five roads. One line. The weather gets the last word.
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-accent">
                    {state.cycle.levelsCleared.length} / 5 roads cleared →
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* DAILY */}
      <section className="border-y border-rule bg-paper-2">
        <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <p className="eyebrow">Daily challenge</p>
            <h2 className="mt-4 max-w-md">One seed. Everyone runs it.</h2>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-mist-500">
              {daily.description}
            </p>
            <div className="mt-8 flex items-center gap-3 border-t border-rule pt-4 text-[10px] uppercase tracking-[0.14em] text-mist-500">
              <Target size={12} className="text-accent" />
              <span>{daily.title}</span>
              <span className="text-rule">/</span>
              <Countdown className="text-mist-400" />
            </div>
            <Link to="/challenges" className="mt-8 inline-flex text-link">
              All challenges and friend runs <ArrowRight size={13} />
            </Link>
          </div>

          <div className="border border-rule bg-paper px-6 py-7 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="label">Today's run</p>
                <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">
                  {daily.target.toLocaleString()} pts
                </p>
              </div>
              <span className="chip border-accent/30 text-accent">+{daily.reward} coins</span>
            </div>

            <div className="mt-7 flex items-end justify-between text-[10px] uppercase tracking-[0.12em] text-mist-500">
              <span>
                {dailyDone
                  ? `Cleared at ${formatScore("one-chance", dailyRecord?.score ?? daily.target)}`
                  : dailyRecord
                    ? `Best today ${formatScore("one-chance", dailyRecord.score)}`
                    : "Not attempted"}
              </span>
              <span className={dailyDone ? "text-success" : "text-accent"}>
                {dailyDone ? "Complete" : `${Math.round(dailyProgress)}%`}
              </span>
            </div>
            <ProgressBar
              value={dailyDone ? 100 : dailyProgress}
              tone={dailyDone ? "gold" : "blue"}
              className="mt-3"
            />

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/play/one-chance?mode=daily" className="btn btn-primary">
                <Play size={13} fill="currentColor" />
                {dailyDone ? "Run it again" : "Play today's seed"}
              </Link>
              <Link to="/games/one-chance" className="btn btn-ghost">
                About One Chance
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PLAYER + BOARD */}
      <section className="container-page py-20 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <div>
              <p className="eyebrow">Your record</p>
              <h2 className="mt-4">Level {level.level}</h2>
              <p className="mt-2 text-[12px] text-mist-500">
                {level.needed - level.into} XP to the next level
              </p>
            </div>
            <ProgressBar value={level.percent} tone="gold" className="mt-6" />

            <dl className="mt-8 grid grid-cols-3 gap-px border-y border-rule bg-rule">
              {[
                { value: state.coins.toLocaleString(), label: "Coins" },
                { value: `${unlocked.length}/${ACHIEVEMENTS.length}`, label: "Awards" },
                { value: `${state.room.completedLevels.length + state.cycle.levelsCleared.length}/8`, label: "Clears" },
              ].map((stat) => (
                <div key={stat.label} className="bg-paper px-3 py-4">
                  <dt className="label">{stat.label}</dt>
                  <dd className="mt-1.5 font-display text-xl font-semibold tabular-nums tracking-[-0.03em] text-ink">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <div className="flex items-end justify-between">
                <p className="label">Next honours</p>
                <Link to="/profile#achievements" className="text-[10px] uppercase tracking-[0.12em] text-mist-500 transition-colors hover:text-ink">
                  All
                </Link>
              </div>
              <ul className="mt-4 space-y-3">
                {nextUp.map((def) => (
                  <li key={def.id} className="flex items-center gap-3">
                    <AchievementIcon icon={def.icon} tier={def.tier} locked size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-ink-2">{def.name}</p>
                      <p className="truncate text-[10px] text-mist-600">{def.description}</p>
                    </div>
                    <span className="label !text-mist-600">{def.tier}</span>
                  </li>
                ))}
                {nextUp.length === 0 && (
                  <li className="text-[12px] text-mist-500">Every honour earned. The board is yours to defend.</li>
                )}
              </ul>
            </div>

            <Link to="/profile" className="mt-8 inline-flex text-link">
              Open your profile <ArrowRight size={13} />
            </Link>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Global board</p>
                <h2 className="mt-4">One Chance, all time.</h2>
              </div>
              <Link to="/leaderboard" className="text-link">
                Full board <ArrowRight size={13} />
              </Link>
            </div>
            <div className="mt-8">
              <LeaderboardTable rows={board} game="one-chance" limit={6} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-[11px] text-mist-500">
              <span>
                {state.stats["one-chance"].best
                  ? `Your best: ${formatScore("one-chance", state.stats["one-chance"].best)}`
                  : "You are not on the board yet."}
              </span>
              <Link to="/play/one-chance" className="text-link !text-[10px]">
                {state.stats["one-chance"].best ? "Beat it" : "Claim a place"} <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* closing line */}
      <section className="container-page pb-8">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-rule pt-10 sm:flex-row sm:items-end">
          <p className="max-w-xl font-display text-[clamp(1.7rem,3vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.035em] text-ink">
            Pick a game. Set a time.{" "}
            <span className="serif text-mist-500">Then beat it.</span>
          </p>
          <div className="flex gap-3">
            {GAME_LIST.map((game) => (
              <Link key={game.id} to={game.route} className="btn btn-ghost btn-sm">
                {game.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
