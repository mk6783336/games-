import { useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Flame,
  Play,
  RefreshCw,
  Share2,
  Sparkles,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { absoluteChallengeUrl, challengePath, makeChallenge, newSeed, type ChallengeLink } from "../lib/challenges";
import { getDaily } from "../lib/daily";
import { formatDuration, formatScore, GAME_LIST, GAMES } from "../lib/games";
import type { GameId } from "../lib/types";
import { usePlayer } from "../state/player";
import type { ChallengeRecord } from "../lib/types";
import { Avatar } from "../components/Brand";
import { Countdown, ProgressBar } from "../components/UI";

function DailyCard({ gameId }: { gameId: GameId }) {
  const { state } = usePlayer();
  const game = GAMES[gameId];
  const daily = getDaily(gameId);
  const record = state.dailies[daily.key];
  const done = record?.completed ?? false;
  const progress =
    record == null
      ? 0
      : gameId === "impossible-room"
        ? Math.max(0, Math.min(100, (1 - record.score / daily.target) * 100))
        : Math.min(100, (record.score / daily.target) * 100);

  return (
    <article className={`panel relative overflow-hidden p-5 sm:p-6 ${done ? "border-gold/25" : ""}`}>
      <div className={`pointer-events-none absolute -right-16 -top-20 size-52 rounded-full blur-3xl ${gameId === "one-chance" ? "bg-blue-600/15" : "bg-gold/10"}`} />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-extrabold text-mist-600">
            Game {game.index}, {game.genre}
          </span>
          <span className={`chip text-[9px] ${done ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10"}`}>
            {done ? <><Check size={10} /> Complete</> : <><CalendarDays size={10} /> Daily</>}
          </span>
        </div>
        <h3 className="mt-3 font-display text-xl font-bold text-white">{daily.title}</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-mist-600">{daily.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="chip border-white/10 text-[10px]">
            <Target size={10} />
            {daily.unit === "points" ? `${daily.target.toLocaleString()} pts` : `Under ${formatDuration(daily.target)}`}
          </span>
          <span className="chip border-gold/25 bg-gold/[0.07] text-[10px] text-gold">+{daily.reward} coins</span>
        </div>
        <div className="mt-4 rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="font-semibold text-mist-500">
              {record ? `${done ? "Cleared" : "Best today"}, ${formatScore(gameId, record.score)}` : "Not attempted yet"}
            </span>
            <span className="font-bold tabular-nums text-mist-600">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} tone={done ? "gold" : "violet"} className="mt-2" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold text-mist-600"><Countdown /> remaining</span>
          <Link to={`${game.route}?mode=daily`} className="btn btn-primary px-4 py-2.5 text-[11px]">
            <Play size={12} fill="currentColor" /> {done ? "Run again" : "Play daily"}
          </Link>
        </div>
      </div>
    </article>
  );
}

function ReceivedChallenge({ challenge }: { challenge: ChallengeRecord }) {
  const game = GAMES[challenge.game];
  const path = challengePath({
    id: challenge.id,
    game: challenge.game,
    seed: challenge.seed,
    target: challenge.target,
    from: challenge.from,
  });
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3.5">
      <div className="flex items-center gap-2.5">
        <Avatar name={challenge.from} hue={200} size={32} ring={false} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-mist-100">{challenge.from}</p>
          <p className="text-[10px] text-mist-600">{game.title}, beat {formatScore(challenge.game, challenge.target)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-extrabold ${
            challenge.beat
              ? "bg-emerald-400/10 text-emerald-300"
              : challenge.score != null
                ? "bg-orange-400/10 text-orange-300"
                : "bg-white/5 text-mist-500"
          }`}
        >
          {challenge.beat ? "Won" : challenge.score != null ? "Chase" : "New"}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[10px] text-mist-600">
          {challenge.score != null ? `Your result, ${formatScore(challenge.game, challenge.score)}` : "You haven't answered yet."}
        </span>
        <Link to={path} className="text-[10px] font-bold text-violet-300 transition hover:text-violet-200">
          {challenge.score != null ? "Try again" : "Accept"}
        </Link>
      </div>
    </div>
  );
}

export default function Challenges() {
  const { state } = usePlayer();
  const [game, setGame] = useState<GameId>("one-chance");
  const [seed, setSeed] = useState(() => newSeed());
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetFor = (g: GameId) => {
    if (g === "one-chance") {
      const best = state.stats["one-chance"].best;
      return best ? Math.max(300, Math.round((best * 1.04) / 10) * 10 + 10) : 900;
    }
    if (g === "cycle") {
      const best = state.stats.cycle.best;
      return best ? Math.max(2_000, Math.round((best * 1.04) / 100) * 100 + 100) : 12_000;
    }
    const best = state.room.bestTimes[1];
    return best ? Math.max(45_000, Math.round((best * 0.96) / 1000) * 1000) : 180_000;
  };

  const challenge: ChallengeLink = makeChallenge({
    game,
    seed,
    target: targetFor(game),
    from: state.profile.name,
  });
  const url = absoluteChallengeUrl(challenge);
  const shareSupported = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      inputRef.current?.select();
      setCopied(false);
    }
  };

  const shareLink = async () => {
    try {
      await navigator.share({
        title: "PLAYFLIX challenge",
        text: `${state.profile.name} wants you to beat ${formatScore(game, challenge.target)} on ${GAMES[game].title}.`,
        url,
      });
    } catch {
      // The player dismissed the native share sheet — no action needed.
    }
  };

  const reroll = () => {
    setSeed(newSeed());
    setCopied(false);
  };

  return (
    <div className="container-page pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-xl">
                    <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.5rem)] font-extrabold leading-[0.98] tracking-[-0.05em] text-white">
            Don't play alone.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-mist-500">
            A new daily seed for every player on Earth, plus a link that lets you throw a gauntlet at a friend. Same run. Same rules. Bragging rights optional.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[10px] font-semibold text-mist-400">
          <Sparkles size={12} className="text-gold" /> Resets daily, <Countdown />
        </div>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {GAME_LIST.map((game) => (
          <DailyCard key={game.id} gameId={game.id} />
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="panel panel-glow relative overflow-hidden p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="relative">
                        <h2 className="mt-2 font-display text-2xl font-bold text-white">Send a gauntlet</h2>
            <p className="mt-2 max-w-md text-[12px] leading-relaxed text-mist-600">
              Build a link with your chosen game, a fresh seed and a target. They'll get the exact same run; no sign-up, no excuses.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {(["one-chance", "impossible-room", "cycle"] as GameId[]).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setGame(g);
                    setSeed(newSeed());
                    setCopied(false);
                  }}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    game === g
                      ? "border-violet-400/40 bg-violet-500/[0.1]"
                      : "border-white/8 bg-white/[0.02] hover:border-white/20"
                  }`}
                  aria-pressed={game === g}
                >
                  <span className={`text-[9px] font-bold ${game === g ? "text-violet-300" : "text-mist-600"}`}>Game {GAMES[g].index}</span>
                  <span className="mt-1 block text-[12px] font-bold text-white">{GAMES[g].title}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-mist-600">{GAMES[g].short}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5">
                <p className="text-[9px] font-bold text-mist-600">Target to beat</p>
                <p className="mt-0.5 font-display text-sm font-bold text-gold">{formatScore(game, challenge.target)}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5">
                <p className="text-[9px] font-bold text-mist-600">{game === "one-chance" ? "Seed" : "Rules"}</p>
                <p className="mt-0.5 truncate font-display text-sm font-bold text-mist-200">
                  {game === "one-chance"
                    ? `#${String(seed).slice(0, 8)}`
                    : game === "cycle"
                      ? "All five roads"
                      : "Chapter I, timed"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[10px] font-bold text-mist-600" htmlFor="challenge-link">
                Your challenge link
              </label>
              <div className="flex gap-2">
                <input
                  id="challenge-link"
                  ref={inputRef}
                  readOnly
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-paper-2 px-3 py-2.5 font-mono text-[10px] text-mist-400 outline-none focus:border-violet-400/50"
                />
                <button onClick={copyLink} className="btn btn-primary shrink-0 px-3.5 py-2.5 text-[11px]" aria-label="Copy challenge link">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {shareSupported && (
                <button onClick={shareLink} className="btn btn-ghost px-3.5 py-2.5 text-[11px]">
                  <Share2 size={13} /> Share
                </button>
              )}
              <button onClick={reroll} className="btn btn-ghost px-3.5 py-2.5 text-[11px]">
                <RefreshCw size={13} /> New seed
              </button>
              <Link
                to={challengePath(challenge)}
                className="btn btn-ghost ml-auto px-3.5 py-2.5 text-[11px]"
              >
                Preview run <ArrowRight size={13} />
              </Link>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-mist-600">
              Your target is built from your personal best. Open your own link to verify it; your score is recorded just like theirs.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                                <h2 className="mt-1.5 font-display text-lg font-bold text-white">Who called you out</h2>
              </div>
              <span className="grid size-9 place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-mist-500"><Swords size={16} /></span>
            </div>
            <div className="mt-4 space-y-2.5">
              {state.challenges.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-7 text-center">
                  <Swords size={20} className="mx-auto text-mist-600" />
                  <p className="mt-2 text-[12px] font-semibold text-mist-400">No challenges yet.</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-mist-600">Open a friend's link and their challenge will land here.</p>
                </div>
              ) : (
                state.challenges.map((c) => <ReceivedChallenge key={c.id} challenge={c} />)
              )}
            </div>
            {state.challenges.some((c) => c.beat) && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.05] px-3 py-2.5 text-[10px] text-gold">
                <Trophy size={12} /> You've beaten {state.challenges.filter((c) => c.beat).length} of your friends. Keep the streak.
              </div>
            )}
          </div>

          <div className="panel p-5 sm:p-6">
            <p className="label"><Flame size={12} className="text-orange-300" /> How it works</p>
            <ol className="mt-4 space-y-3">
              {[
                ["Pick a game", "A One Chance seed, a timed room sprint, or all five Cycle roads."],
                ["Share the link", "The seed and target travel inside the URL."],
                ["Settle it", "Their score lands here automatically when they finish."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-violet-400/25 bg-violet-500/10 font-display text-[10px] font-bold text-violet-300">{i + 1}</span>
                  <div>
                    <p className="text-[12px] font-bold text-mist-200">{title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-mist-600">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
