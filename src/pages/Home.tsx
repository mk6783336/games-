import { ArrowRight, CalendarDays, ChevronRight, Coins, Flame, Play, Sparkles, Swords, Target, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { ACHIEVEMENTS } from "../lib/achievements";
import { getDaily } from "../lib/daily";
import { formatScore, GAME_LIST, levelFromXp } from "../lib/games";
import { getLeaderboard } from "../lib/leaderboard";
import { usePlayer } from "../state/player";
import { AchievementIcon, AchievementRow } from "../components/AchievementBadge";
import { HeroArt, RunnerCardArt } from "../components/Art";
import { Avatar } from "../components/Brand";
import { GameCard } from "../components/GameCard";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { Countdown, ProgressBar, SectionHeading } from "../components/UI";

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
  const nextUp = ACHIEVEMENTS.filter((a) => !state.achievements[a.id]).slice(0, 4);
  const achievementsToShow = nextUp.length ? nextUp : ACHIEVEMENTS.slice(0, 4);

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 top-0 h-[520px] w-[820px] rounded-full bg-[radial-gradient(closest-side,rgba(124,58,237,0.28),transparent)] blur-2xl" />
          <div className="absolute left-0 top-24 h-[380px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(37,99,235,0.14),transparent)]" />
        </div>
        <div className="container-page relative pb-8 pt-10 sm:pt-14 lg:min-h-[660px] lg:pb-16 lg:pt-0">
          <div className="relative z-10 flex min-h-full flex-col justify-center lg:min-h-[660px] lg:w-[52%] lg:py-20">
            <div className="fade-up inline-flex w-fit items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.07] px-3 py-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-violet-400" />
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-violet-200">
                Season 01 · Launch lineup live
              </span>
            </div>

            <h1 className="fade-up animation-delay-1 mt-6 font-display text-[clamp(2.7rem,7.2vw,5.1rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.055em] text-white">
              Play.
              <br />
              Challenge.
              <br />
              <span className="violet-text">Compete.</span>
            </h1>

            <p className="fade-up animation-delay-2 mt-6 max-w-md text-[15px] leading-relaxed text-mist-300 sm:text-base">
              A global arena built around two exceptional games. Solve the impossible, survive the run — then dare a friend to beat you.
            </p>

            <div className="fade-up animation-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link to="/games" className="btn btn-primary px-6 py-3.5 text-sm">
                <Play size={16} fill="currentColor" />
                Start playing
              </Link>
              <Link to="/challenges" className="btn btn-ghost px-5 py-3.5 text-sm">
                <Swords size={16} />
                Daily challenge
              </Link>
            </div>

            <div className="fade-up animation-delay-4 mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-mist-600">
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400" />Free to play</span>
              <span className="hidden text-white/15 sm:block">/</span>
              <span className="flex items-center gap-1.5"><Zap size={12} className="text-violet-400" />Instant play, no download</span>
              <span className="hidden text-white/15 sm:block">/</span>
              <span className="flex items-center gap-1.5"><Trophy size={12} className="text-gold" />Global leaderboards</span>
            </div>
          </div>

          {/* Hero artwork */}
          <div className="relative mt-8 h-[330px] overflow-hidden rounded-[2rem] sm:h-[400px] lg:absolute lg:right-[-9%] lg:top-0 lg:mt-0 lg:h-full lg:w-[62%] lg:overflow-visible">
            <div className="absolute inset-0 lg:left-0 lg:top-6 lg:h-[600px]">
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_62%_42%,rgba(124,58,237,0.28),transparent_65%)] lg:rounded-full" />
              <HeroArt className="h-full w-full" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#05070f] to-transparent lg:hidden" />
            <div className="absolute inset-y-0 left-0 hidden w-32 bg-gradient-to-r from-[#05070f] to-transparent lg:block" />

            <div className="absolute right-4 top-4 hidden items-center gap-2 rounded-full border border-white/12 bg-[#070a17]/65 px-3 py-1.5 backdrop-blur-xl sm:flex lg:right-40 lg:top-16">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/80">Arena live</span>
            </div>

            <Link
              to="/leaderboard"
              className="group absolute bottom-5 left-4 hidden w-[228px] rounded-2xl border border-white/12 bg-[#080c1b]/75 p-3.5 shadow-2xl backdrop-blur-xl transition hover:border-violet-300/30 sm:block lg:bottom-20 lg:left-2"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-gold">
                  <Trophy size={11} /> Global #1
                </span>
                <ChevronRight size={13} className="text-mist-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Avatar name={board[0]?.name ?? "PlayerPro"} hue={board[0]?.avatarHue ?? 268} size={30} ring={false} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">{board[0]?.name ?? "PlayerPro"}</p>
                  <p className="text-[10px] text-mist-500">One Chance · {formatScore("one-chance", board[0]?.score ?? 3430)}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="container-page space-y-16 pb-8 sm:space-y-20">
        {/* GAMES */}
        <section aria-labelledby="launch-games">
          <SectionHeading
            eyebrow="The launch lineup"
            title={<span id="launch-games">Two games. No filler.</span>}
            description="Every game on PLAYFLIX earns its place. These two are complete, replayable and built to be mastered."
            action={
              <Link to="/games" className="btn btn-ghost px-4 py-2.5 text-xs">
                Explore games <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {GAME_LIST.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {/* DAILY + PROGRESS */}
        <section className="grid gap-5 lg:grid-cols-[1.28fr_0.72fr]">
          <div className="panel panel-glow relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.42]">
              <RunnerCardArt className="h-full w-full" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(100deg,#0b0f21_20%,rgba(11,15,33,0.92)_52%,rgba(11,15,33,0.55)_100%)]" />
            <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="eyebrow text-gold"><Sparkles size={12} /> Featured daily challenge</span>
                  <span className="chip border-white/12 bg-black/25 text-mist-300"><Countdown /> left</span>
                </div>
                <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-[2.4rem]">
                  One seed.<br />Everyone runs it.
                </h2>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-mist-400">
                  {daily.description}
                </p>
              </div>

              <div className="mt-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip border-white/12 bg-white/[0.05]"><Flame size={11} className="text-orange-300" />{daily.title}</span>
                  <span className="chip border-gold/25 bg-gold/[0.08] text-gold"><Target size={11} />{daily.target.toLocaleString()} pts</span>
                  <span className="chip border-white/12 bg-white/[0.05]"><Coins size={11} className="text-gold" />+{daily.reward} coins</span>
                </div>
                <div className="mt-4 rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-mist-400">
                      {dailyDone ? `Cleared with ${formatScore("one-chance", dailyRecord?.score ?? daily.target)}` : dailyRecord ? `Best today · ${formatScore("one-chance", dailyRecord.score)}` : "Your daily run is waiting"}
                    </span>
                    <span className={`font-bold ${dailyDone ? "text-emerald-300" : "text-gold"}`}>{dailyDone ? "Complete" : `${Math.round(dailyProgress)}%`}</span>
                  </div>
                  <ProgressBar value={dailyDone ? 100 : dailyProgress} tone={dailyDone ? "gold" : "violet"} className="mt-2" />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/play/one-chance?mode=daily" className="btn btn-primary px-5 py-3 text-xs">
                    <Play size={14} fill="currentColor" />
                    {dailyDone ? "Run it again" : "Play daily run"}
                  </Link>
                  <Link to="/challenges" className="btn btn-ghost px-4 py-3 text-xs">
                    All challenges <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="panel flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Your journey</p>
                <h2 className="mt-1.5 font-display text-xl font-bold text-white">Level {level.level}</h2>
              </div>
              <div className="grid size-12 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10 font-display text-sm font-extrabold text-violet-200">
                {level.level}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-mist-600">
                <span>{level.into} / {level.needed} XP</span>
                <span>{level.percent}%</span>
              </div>
              <ProgressBar value={level.percent} className="mt-1.5" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { value: state.coins.toLocaleString(), label: "Coins", icon: <Coins size={12} /> },
                { value: `${unlocked.length}/${ACHIEVEMENTS.length}`, label: "Awards", icon: <Trophy size={12} /> },
                { value: `${state.room.completedLevels.length}/3`, label: "Chapters", icon: <DoorIcon /> },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/7 bg-white/[0.025] px-2.5 py-2.5 text-center">
                  <div className="mx-auto flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-mist-600">{s.icon}{s.label}</div>
                  <div className="mt-1 font-display text-sm font-bold tabular-nums text-white">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 min-h-0 flex-1">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-mist-600">Next to unlock</p>
              <div className="space-y-2">
                {(state.room.completedLevels.length === 0
                  ? ACHIEVEMENTS.filter((a) => a.id === "chapter-one" || a.id === "still-standing")
                  : ACHIEVEMENTS.filter((a) => !state.achievements[a.id]).slice(0, 2)
                ).map((def) => (
                  <div key={def.id} className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.02] px-2.5 py-2">
                    <AchievementIcon icon={def.icon} tier={def.tier} locked={!state.achievements[def.id]} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-mist-200">{def.name}</p>
                      <p className="truncate text-[10px] text-mist-600">{def.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/profile" className="mt-4 inline-flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-[11px] font-bold text-mist-300 transition hover:border-violet-400/30 hover:text-white">
              Open your profile <ChevronRight size={13} />
            </Link>
          </div>
        </section>

        {/* LEADERBOARD + ACHIEVEMENTS */}
        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow"><Trophy size={12} className="text-gold" /> Global leaderboard</p>
                <h2 className="mt-1.5 font-display text-xl font-bold text-white">Everyone wants the top</h2>
              </div>
              <Link to="/leaderboard" className="btn btn-ghost px-3.5 py-2 text-[11px]">
                Full board <ChevronRight size={13} />
              </Link>
            </div>
            <div className="mt-5">
              <LeaderboardTable rows={board} game="one-chance" limit={5} dense />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/7 bg-white/[0.025] px-3.5 py-2.5">
              <span className="text-[11px] text-mist-500">
                {state.stats["one-chance"].best ? `Your best · ${formatScore("one-chance", state.stats["one-chance"].best)}` : "You're not on the board yet."}
              </span>
              <Link to="/play/one-chance" className="text-[11px] font-bold text-violet-300 hover:text-violet-200">
                {state.stats["one-chance"].best ? "Beat it →" : "Claim a spot →"}
              </Link>
            </div>
          </div>

          <div className="panel p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow"><Trophy size={12} className="text-gold" /> Achievements</p>
                <h2 className="mt-1.5 font-display text-xl font-bold text-white">{unlocked.length} of {ACHIEVEMENTS.length} earned</h2>
              </div>
              <AchievementIcon icon="trophy" tier="gold" locked={unlocked.length === 0} size="md" />
            </div>
            <ProgressBar value={(unlocked.length / ACHIEVEMENTS.length) * 100} tone="gold" className="mt-4" />
            <div className="mt-4 space-y-2">
              {achievementsToShow.slice(0, 3).map((def) => (
                <AchievementRow key={def.id} def={def} unlocked={Boolean(state.achievements[def.id])} />
              ))}
            </div>
            <Link to="/profile#achievements" className="mt-4 flex items-center justify-between text-[11px] font-bold text-violet-300 transition hover:text-violet-200">
              See the trophy room <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        {/* THE LOOP */}
        <section className="panel relative overflow-hidden px-5 py-7 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The loop</p>
              <h2 className="mt-1.5 font-display text-xl font-bold text-white">Why players come back</h2>
            </div>
            <p className="max-w-sm text-[11px] leading-relaxed text-mist-600">
              Discover something worth your time, improve your best, and give a friend something to chase.
            </p>
          </div>
          <ol className="relative mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              ["Discover", "Two games, no noise"],
              ["Play", "Instant, no download"],
              ["Improve", "Beat your own best"],
              ["Challenge", "Send a rival a seed"],
              ["Share", "One link, real stakes"],
              ["Return", "New daily, every day"],
            ].map(([step, sub], i) => (
              <li key={step} className="relative rounded-xl border border-white/6 bg-white/[0.02] px-3 py-3">
                <span className="font-display text-[9px] font-bold text-violet-400/70">0{i + 1}</span>
                <p className="mt-1 text-[12px] font-bold text-mist-100">{step}</p>
                <p className="mt-0.5 hidden text-[10px] leading-snug text-mist-600 sm:block">{sub}</p>
                {i < 5 && <span className="absolute -right-1.5 top-1/2 z-10 hidden -translate-y-1/2 text-[10px] text-white/20 sm:block">›</span>}
              </li>
            ))}
          </ol>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden rounded-[2rem] border border-violet-400/20 bg-[linear-gradient(120deg,rgba(60,32,130,0.55),rgba(15,19,42,0.8)_55%,rgba(23,45,102,0.55))] px-6 py-10 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-40 size-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-lg">
              <p className="eyebrow text-violet-300">Free to play</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-4xl">
                Two games. One shot at the top.
              </h2>
              <p className="mt-2.5 text-[13px] leading-relaxed text-mist-400">
                Your first run takes seconds. Your best might take all night.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/play/one-chance" className="btn btn-primary px-5 py-3.5 text-xs">
                <Play size={14} fill="currentColor" /> Play One Chance
              </Link>
              <Link to="/play/impossible-room" className="btn btn-ghost px-5 py-3.5 text-xs">
                <CalendarDays size={14} /> Enter the room
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DoorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01" />
      <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.562Z" />
    </svg>
  );
}
