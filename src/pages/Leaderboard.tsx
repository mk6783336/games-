import { Crown, Globe2, MapPin, Play, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Avatar } from "../components/Brand";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { COUNTRIES, countryInfo, formatScore, GAMES, GAME_LIST } from "../lib/games";
import { getLeaderboard } from "../lib/leaderboard";
import { usePlayer } from "../state/player";
import type { GameId, LeaderboardScope, LeaderboardTimeframe } from "../lib/types";

const TIMEFRAMES: { id: LeaderboardTimeframe; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "all", label: "All time" },
];

export default function Leaderboard() {
  const { state, updateProfile } = usePlayer();
  const [game, setGame] = useState<GameId>("one-chance");
  const [scope, setScope] = useState<LeaderboardScope>("global");
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("all");

  const gameMeta = GAMES[game];
  const stat = state.stats[game];
  const rows = getLeaderboard({
    game,
    scope,
    timeframe,
    profile: state.profile,
    best: stat.best,
    includePlayer: state.settings.publicLeaderboard,
  });
  const you = rows.find((r) => r.isYou);
  const yourRank = you ? rows.findIndex((r) => r.isYou) + 1 : null;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);
  const scopeOptions: { id: LeaderboardScope; label: string; icon: typeof Globe2 }[] = [
    { id: "global", label: "Global", icon: Globe2 },
    { id: "country", label: countryInfo(state.profile.country).name, icon: MapPin },
    { id: "friends", label: "Friends", icon: Users },
  ];

  return (
    <div className="container-page pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
                    <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[0.98] tracking-[-0.05em] text-white">
            Somebody has<br />to be <span className="violet-text">first.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mist-500">
            Your own runs are saved on this device. Pick a board, find your name, then do something about the gap.
          </p>
          <p className="mt-3 text-[9px] font-bold text-mist-600">Preview board, rival entries are sample data</p>
        </div>
        <div className="panel flex items-center gap-4 px-5 py-4">
          <div>
            <p className="text-[9px] font-bold text-mist-600">Your standing</p>
            <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-white">
              {yourRank ? `#${yourRank}` : "—"}
              <span className="ml-1 text-sm font-semibold text-mist-600">/ {rows.length}</span>
            </p>
          </div>
          <span className="grid size-11 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300"><Trophy size={19} /></span>
        </div>
      </div>

      {/* Game selector */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {GAME_LIST.map((g) => (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            className={`flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-left transition ${
              game === g.id ? "border-violet-400/40 bg-violet-500/[0.1]" : "border-white/8 bg-white/[0.02] hover:border-white/20"
            }`}
            aria-pressed={game === g.id}
          >
            <span className={`font-display text-[10px] font-bold ${game === g.id ? "text-violet-300" : "text-mist-600"}`}>{g.index}</span>
            <span>
              <span className={`block text-[12px] font-bold ${game === g.id ? "text-white" : "text-mist-300"}`}>{g.title}</span>
              <span className="block text-[9px] text-mist-600">{game === g.id ? g.scoreLabel : g.genre}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="order-2 lg:order-1">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-full border border-white/8 bg-white/[0.025] p-1">
              {scopeOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setScope(id)}
                  className={`inline-flex max-w-[10rem] items-center gap-1.5 truncate rounded-full px-3 py-1.5 text-[10px] font-bold transition ${
                    scope === id ? "bg-white/[0.08] text-white" : "text-mist-500 hover:text-mist-200"
                  }`}
                >
                  <Icon size={11} className="shrink-0" /> <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-full border border-white/8 bg-white/[0.025] p-1">
              {TIMEFRAMES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTimeframe(id)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition ${
                    timeframe === id ? "bg-white/[0.08] text-white" : "text-mist-500 hover:text-mist-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {scope === "country" && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/7 bg-white/[0.02] px-3.5 py-2.5">
              <span className="text-[11px] text-mist-500">
                Showing players from {countryInfo(state.profile.country).name}
              </span>
              <label className="flex items-center gap-2 text-[10px] font-semibold text-mist-600">
                Change
                <select
                  value={state.profile.country}
                  onChange={(e) => updateProfile({ country: e.target.value })}
                  className="rounded-lg border border-white/10 bg-paper-2 px-2 py-1 text-[10px] text-mist-200 outline-none focus:border-violet-400/50"
                  aria-label="Change your country"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {scope === "friends" && (
            <p className="mt-3 rounded-xl border border-white/7 bg-white/[0.02] px-3.5 py-2.5 text-[10px] text-mist-600">
              Friends board shows your PLAYFLIX rivals and their best runs. Invite a real friend from the Challenges tab to settle it directly.
            </p>
          )}

          {!state.settings.publicLeaderboard && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-400/20 bg-orange-400/[0.05] px-3.5 py-2.5">
              <span className="text-[10px] text-orange-200/80">Your profile is private, so your score is hidden from these boards.</span>
              <Link to="/profile" className="text-[10px] font-bold text-orange-200 hover:text-white">Change in settings</Link>
            </div>
          )}

          {/* Podium */}
          {podium.length > 0 && (
            <div className="mt-6 grid grid-cols-3 items-end gap-2 sm:gap-3">
              {podiumOrder.map((row) => {
                const rank = podium.findIndex((p) => p === row) + 1;
                const first = rank === 1;
                return (
                  <div
                    key={`${row.name}-${rank}`}
                    className={`relative overflow-hidden rounded-2xl border px-2 pb-4 pt-5 text-center ${
                      first
                        ? "border-gold/30 gold-panel sm:pt-6"
                        : "border-white/8 bg-shade/85"
                    }`}
                  >
                    {first && <div className="pointer-events-none absolute inset-x-0 top-0 h-20 gold-toplight" />}
                    <div className="relative mx-auto w-fit">
                      {first && <Crown size={16} className="mx-auto mb-1 text-gold" fill="rgba(245,196,90,0.2)" />}
                      <Avatar name={row.name} hue={row.avatarHue} size={first ? 50 : 42} />
                      <span className={`absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border text-[9px] font-extrabold ${
                        first ? "border-gold/50 bg-gold text-accent-ink" : "border-white/15 bg-shade text-mist-300"
                      }`}>
                        {rank}
                      </span>
                    </div>
                    <p className="relative mt-2.5 truncate text-[11px] font-bold text-white sm:text-xs">{row.name}{row.isYou ? ", you" : ""}</p>
                    <p className="text-[9px] text-mist-600">{row.country}</p>
                    <p className={`relative mt-2 font-display text-sm font-extrabold tabular-nums sm:text-base ${first ? "text-gold" : "text-mist-200"}`}>
                      {formatScore(game, row.score)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="panel mt-4 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <p className="text-[10px] font-bold text-mist-600">
                {gameMeta.scoreLabel}, {scope === "global" ? "World" : scope === "country" ? countryInfo(state.profile.country).name : "Friends"}
              </p>
              <span className="text-[9px] text-mist-600">{rows.length} players</span>
            </div>
            {rest.length > 0 ? (
              <LeaderboardTable rows={rest} game={game} rankOffset={3} />
            ) : (
              <p className="px-2 py-8 text-center text-xs text-mist-600">Only three players on this board so far.</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/7 bg-white/[0.02] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar name={state.profile.name} hue={state.profile.avatarHue} size={28} ring={false} />
              <div>
                <p className="text-[11px] font-bold text-mist-200">{state.profile.name}</p>
                <p className="text-[9px] text-mist-600">
                  {stat.best != null ? `${gameMeta.scoreLabel}, ${formatScore(game, stat.best)}` : "No score on this board yet"}
                </p>
              </div>
            </div>
            <Link to={gameMeta.route} className="btn btn-primary px-4 py-2 text-[10px]">
              <Play size={11} fill="currentColor" /> {stat.best != null ? "Improve your rank" : "Set a score"}
            </Link>
          </div>
        </div>

        {/* Side */}
        <aside className="order-1 space-y-4 lg:order-2">
          <div className="panel p-5">
            <p className="label"><Trophy size={12} className="text-gold" /> Board rules</p>
            <ul className="mt-3 space-y-2.5 text-[11px] leading-relaxed text-mist-500">
              <li className="flex gap-2"><span className="text-violet-400">01</span> One Chance ranks by highest score. The Impossible Room ranks by fastest full escape.</li>
              <li className="flex gap-2"><span className="text-violet-400">02</span> Daily runs use the same seed for everyone in the world.</li>
              <li className="flex gap-2"><span className="text-violet-400">03</span> Ties are settled by who set the score first.</li>
            </ul>
          </div>
          <div className="panel relative overflow-hidden p-5">
            <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-violet-600/15 blur-2xl" />
            <p className="label">Season 01</p>
            <p className="mt-2 font-display text-lg font-bold leading-snug text-white">The top three keep their names in lights until the reset.</p>
            <Link to="/challenges" className="btn btn-ghost mt-4 w-full py-2.5 text-[11px]">
              Take the daily challenge
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
