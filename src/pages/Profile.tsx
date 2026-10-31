import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Coins,
  Gamepad2,
  Pencil,
  Play,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ACHIEVEMENTS } from "../lib/achievements";
import { analyticsConfigured } from "../lib/analytics";
import { COUNTRIES, countryInfo, formatScore, GAMES, GAME_LIST, levelFromXp } from "../lib/games";
import { usePlayer } from "../state/player";
import { AchievementIcon } from "../components/AchievementBadge";
import { Avatar } from "../components/Brand";
import { GameArt } from "../components/Art";
import { Modal, ProgressBar, StatTile } from "../components/UI";

const AVATAR_HUES = [266, 218, 192, 152, 32, 342, 288, 16];

function timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/6 py-3.5 last:border-0">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 text-mist-600">{icon}</span>}
        <div>
          <p className="text-[12px] font-semibold text-mist-200">{label}</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-mist-600">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition ${
          checked ? "border-violet-400/50 bg-violet-500/80" : "border-white/12 bg-white/8"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[1.35rem]" : "translate-x-0.5"}`}
          style={{ width: 18, height: 18 }}
        />
      </button>
    </div>
  );
}

export default function Profile() {
  const { state, identity, updateProfile, updateSettings, resetProgress } = usePlayer();
  const location = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.profile.name);
  const [hueDraft, setHueDraft] = useState(state.profile.avatarHue);
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  const level = levelFromXp(state.xp);
  const earned = ACHIEVEMENTS.filter((a) => state.achievements[a.id]);
  const totalRuns = state.stats["impossible-room"].plays + state.stats["one-chance"].plays;
  const coinsEarned = state.stats["impossible-room"].coinsEarned + state.stats["one-chance"].coinsEarned;
  const country = countryInfo(state.profile.country);
  const visibleAchievements = ACHIEVEMENTS.filter((a) =>
    filter === "all" ? true : filter === "earned" ? Boolean(state.achievements[a.id]) : !state.achievements[a.id],
  );
  const recent = state.history.slice(0, 7);

  useEffect(() => {
    if (location.hash === "#achievements") {
      const t = window.setTimeout(() => {
        document.getElementById("achievements")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [location.hash]);

  const openEdit = () => {
    setNameDraft(state.profile.name);
    setHueDraft(state.profile.avatarHue);
    setEditOpen(true);
  };

  const saveProfile = () => {
    updateProfile({ name: nameDraft.trim() || state.profile.name, avatarHue: hueDraft });
    setEditOpen(false);
  };

  return (
    <div className="container-page pt-8 sm:pt-12">
      {/* Profile hero */}
      <section className="panel relative overflow-hidden">
        <div className="relative h-28 overflow-hidden border-b border-white/6 sm:h-36">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_120%,rgba(124,58,237,0.4),transparent_60%),radial-gradient(ellipse_at_80%_-20%,rgba(59,130,246,0.28),transparent_55%),linear-gradient(120deg,#0b0f22,#121634_55%,#0a0e1e)]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute right-5 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-mist-400 backdrop-blur">
            <ShieldCheck size={11} className="text-violet-300" /> Player card
          </div>
          <div className="pointer-events-none absolute -bottom-16 left-1/3 size-48 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        <div className="relative px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 sm:-mt-12">
            <div className="flex items-end gap-3.5 sm:gap-4">
              <span className="rounded-full bg-[#0a0e1c] p-1 ring-1 ring-white/10">
                <Avatar name={state.profile.name} hue={state.profile.avatarHue} size={78} ring={false} />
              </span>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{state.profile.name}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-mist-500">
                  <span>{country.name}</span>
                  <span className="text-white/15">·</span>
                  <span className="text-violet-300">Level {level.level}</span>
                  <span className="text-white/15">·</span>
                  <span>Joined {new Date(state.profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
                </p>
              </div>
            </div>
            <button onClick={openEdit} className="btn btn-ghost px-4 py-2.5 text-[11px]">
              <Pencil size={12} /> Edit profile
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-mist-600">
                <span>Level progress</span>
                <span>{level.into} / {level.needed} XP</span>
              </div>
              <ProgressBar value={level.percent} className="mt-1.5" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 rounded-xl border border-gold/20 bg-gold/[0.06] px-3.5 py-2.5 text-gold">
                <Coins size={15} />
                <span className="font-display text-sm font-bold tabular-nums">{state.coins.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-mist-300">
                <Trophy size={15} className="text-gold" />
                <span className="font-display text-sm font-bold tabular-nums">{earned.length}/{ACHIEVEMENTS.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6" aria-label="Your statistics">
        <StatTile label="Runs" value={totalRuns} icon={<Gamepad2 size={13} />} />
        <StatTile label="One Chance best" value={formatScore("one-chance", state.stats["one-chance"].best)} icon={<Sparkles size={13} />} />
        <StatTile label="Fastest escape" value={formatScore("impossible-room", state.stats["impossible-room"].best)} icon={<Timer size={13} />} />
        <StatTile label="Chapters" value={`${state.room.completedLevels.length}/3`} icon={<DoorMark />} />
        <StatTile label="Coins earned" value={coinsEarned.toLocaleString()} tone="gold" icon={<Coins size={13} />} />
        <StatTile label="Achievements" value={`${earned.length}/${ACHIEVEMENTS.length}`} icon={<Trophy size={13} />} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="space-y-6">
          {/* Records */}
          <section className="panel p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Personal records</p>
                <h2 className="mt-1.5 font-display text-xl font-bold text-white">Your two campaigns</h2>
              </div>
              <Link to="/games" className="text-[10px] font-bold text-violet-300 hover:text-violet-200">Library →</Link>
            </div>
            <div className="mt-4 space-y-2.5">
              {GAME_LIST.map((game) => {
                const stat = state.stats[game.id];
                return (
                  <div key={game.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-2.5">
                    <div className="art-vignette relative h-14 w-20 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-24">
                      <GameArt art={game.art} className="absolute inset-0 h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-white">{game.title}</p>
                      <p className="mt-0.5 text-[10px] text-mist-600">
                        {game.scoreLabel} · <span className="font-semibold text-mist-300">{formatScore(game.id, stat.best)}</span>
                      </p>
                      <p className="mt-0.5 text-[9px] text-mist-600">{stat.plays} runs · {stat.coinsEarned.toLocaleString()} coins earned</p>
                    </div>
                    <Link to={game.route} aria-label={`Play ${game.title}`} className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-200 transition hover:border-violet-400/40 hover:text-white">
                      <Play size={14} fill="currentColor" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Achievements */}
          <section id="achievements" className="panel scroll-mt-24 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow"><Trophy size={12} className="text-gold" /> Trophy room</p>
                <h2 className="mt-1.5 font-display text-xl font-bold text-white">Achievements</h2>
              </div>
              <div className="flex gap-1 rounded-full border border-white/8 bg-white/[0.025] p-1">
                {(["all", "earned", "locked"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold capitalize transition ${filter === f ? "bg-white/[0.08] text-white" : "text-mist-500 hover:text-mist-200"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <ProgressBar value={(earned.length / ACHIEVEMENTS.length) * 100} tone="gold" />
              <span className="shrink-0 text-[10px] font-bold tabular-nums text-gold">{Math.round((earned.length / ACHIEVEMENTS.length) * 100)}%</span>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {visibleAchievements.map((def) => {
                const unlockedAt = state.achievements[def.id];
                return (
                  <div
                    key={def.id}
                    className={`rounded-2xl border p-3.5 transition ${unlockedAt ? "border-gold/20 bg-gold/[0.035]" : "border-white/6 bg-white/[0.015]"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <AchievementIcon icon={def.icon} tier={def.tier} locked={!unlockedAt} />
                      <span className={`text-[8px] font-extrabold uppercase tracking-[0.14em] ${unlockedAt ? "text-gold/80" : "text-mist-600"}`}>
                        {unlockedAt ? "Earned" : def.tier}
                      </span>
                    </div>
                    <p className={`mt-2.5 text-[12px] font-bold ${unlockedAt ? "text-white" : "text-mist-400"}`}>{def.name}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-mist-600">{def.description}</p>
                    <p className="mt-2 text-[9px] text-mist-600">
                      {unlockedAt ? `Unlocked ${new Date(unlockedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "Keep playing to unlock"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Activity */}
          <section className="panel p-5 sm:p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Recent activity</p>
                <h2 className="mt-1.5 font-display text-xl font-bold text-white">The last few runs</h2>
              </div>
              <span className="text-[9px] text-mist-600">{state.history.length} recorded</span>
            </div>
            <div className="mt-4 space-y-1">
              {recent.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-8 text-center">
                  <Gamepad2 size={20} className="mx-auto text-mist-600" />
                  <p className="mt-2 text-[12px] font-semibold text-mist-400">Nothing recorded yet.</p>
                  <p className="mt-1 text-[10px] text-mist-600">Your first run will appear here.</p>
                  <Link to="/games" className="btn btn-primary mt-4 px-4 py-2 text-[10px]">Choose a game</Link>
                </div>
              ) : (
                recent.map((entry, i) => (
                  <div key={`${entry.at}-${i}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.03]">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg border ${entry.game === "one-chance" ? "border-blue-400/20 bg-blue-500/10 text-blue-300" : "border-gold/20 bg-gold/[0.07] text-gold"}`}>
                      {entry.game === "one-chance" ? <Sparkles size={14} /> : <DoorMark />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-mist-200">{GAMES[entry.game].title}</p>
                      <p className="text-[9px] text-mist-600">
                        {entry.mode === "daily" ? "Daily challenge" : entry.mode === "challenge" ? "Friend challenge" : "Solo run"} · {timeAgo(entry.at)}
                      </p>
                    </div>
                    <span className="font-display text-[11px] font-bold tabular-nums text-mist-300">{formatScore(entry.game, entry.score)}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Settings rail */}
        <aside className="space-y-5">
          <section className="panel p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow">Account</p>
                <h2 className="mt-1.5 font-display text-lg font-bold text-white">Settings</h2>
              </div>
              <Pencil size={14} className="text-mist-600" />
            </div>

            <div className="mt-4 divide-y divide-white/6">
              <button onClick={openEdit} className="flex w-full items-center justify-between gap-3 py-3 text-left">
                <span>
                  <span className="block text-[12px] font-semibold text-mist-200">Display name</span>
                  <span className="mt-0.5 block text-[10px] text-mist-600">{state.profile.name}</span>
                </span>
                <ChevronRight size={14} className="text-mist-600" />
              </button>

              <div className="py-3">
                <p className="text-[12px] font-semibold text-mist-200">Country</p>
                <select
                  value={state.profile.country}
                  onChange={(e) => updateProfile({ country: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#080c19] px-2.5 py-2 text-[11px] text-mist-200 outline-none focus:border-violet-400/50"
                  aria-label="Country"
                >
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                </select>
                <p className="mt-1 text-[9px] text-mist-600">Used for the country leaderboard.</p>
              </div>

              <Toggle
                checked={state.settings.sound}
                onChange={(v) => updateSettings({ sound: v })}
                label="Sound effects"
                description="Short synthesised cues in games. No music."
                icon={state.settings.sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
              />
              <Toggle
                checked={state.settings.haptics}
                onChange={(v) => updateSettings({ haptics: v })}
                label="Haptic feedback"
                description="Short vibrations on supported phones. Off by default."
                icon={<Smartphone size={14} />}
              />
              <Toggle
                checked={state.settings.reducedMotion}
                onChange={(v) => updateSettings({ reducedMotion: v })}
                label="Reduced motion"
                description="Minimise interface animation and glow movement."
                icon={<Sparkles size={14} />}
              />
              <Toggle
                checked={state.settings.publicLeaderboard}
                onChange={(v) => updateSettings({ publicLeaderboard: v })}
                label="Public leaderboard"
                description="Show your name and score on global boards."
                icon={<Trophy size={14} />}
              />
              <Toggle
                checked={state.settings.allowChallenges}
                onChange={(v) => updateSettings({ allowChallenges: v })}
                label="Friend challenges"
                description="Allow challenge links to be created and accepted."
                icon={<ShieldCheck size={14} />}
              />
              {analyticsConfigured && (
                <Toggle
                  checked={state.settings.analytics}
                  onChange={(v) => updateSettings({ analytics: v })}
                  label="Product analytics"
                  description="Anonymous gameplay events that show which games and chapters people reach. Turn off to stop sending them."
                  icon={<BarChart3 size={14} />}
                />
              )}
            </div>
          </section>

          <section className="panel p-5">
            <p className="eyebrow"><ShieldCheck size={12} /> Your data</p>
            {identity?.kind === "account" ? (
              <p className="mt-2 text-[11px] leading-relaxed text-mist-600">
                Signed in as <strong className="font-semibold text-mist-300">{identity.email}</strong>. Progress, records and settings sync to your PLAYFLIX account on the server. With product analytics on, gameplay events are sent to PostHog; turn it off above to stop them.
              </p>
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-mist-600">
                You are playing as a guest. Progress and settings are saved to your PLAYFLIX player record on the server and tied to this browser. Create an account to carry them across devices. With product analytics on, gameplay events are sent to PostHog; turn it off above to stop them.
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link to="/account" className="chip border-violet-400/25 bg-violet-500/10 text-[9px] text-violet-100">
                {identity?.kind === "account" ? <UserRound size={10} /> : <ArrowRight size={10} />}
                {identity?.kind === "account" ? "Manage account" : "Create account / sign in"}
              </Link>
              <Link to="/privacy" className="chip text-[9px]" title="Privacy policy">Privacy</Link>
              <Link to="/terms" className="chip text-[9px]" title="Terms of service">Terms</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-red-400/15 bg-red-400/[0.035] p-4">
            <p className="text-[11px] font-bold text-red-200/90">Reset progress</p>
            <p className="mt-1 text-[10px] leading-relaxed text-red-200/50">
              Clears runs, records, coins, achievements and daily history. Your name and settings stay.
            </p>
            <button
              onClick={() => setResetOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-400/25 bg-red-400/[0.07] px-3 py-2 text-[10px] font-bold text-red-200 transition hover:bg-red-400/[0.12]"
            >
              <RotateCcw size={11} /> Reset everything
            </button>
          </section>
        </aside>
      </div>

      {/* Edit profile modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <div className="flex flex-col items-center">
          <Avatar name={nameDraft || "PlayerOne"} hue={hueDraft} size={76} />
          <p className="mt-2 text-[10px] text-mist-600">Your avatar is generated from your name and colour.</p>
        </div>
        <label htmlFor="display-name" className="mt-5 block text-[10px] font-bold uppercase tracking-[0.14em] text-mist-500">Display name</label>
        <div className="relative mt-1.5">
          <input
            id="display-name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value.slice(0, 18))}
            maxLength={18}
            autoComplete="nickname"
            placeholder="Pick a name"
            className="w-full rounded-xl border border-white/10 bg-[#060915] px-3.5 py-3 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-mist-600 focus:border-violet-400/60"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] tabular-nums text-mist-600">{nameDraft.length}/18</span>
        </div>
        <p className="mt-2 text-[10px] text-mist-600">This appears on leaderboards and friend challenge links.</p>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-mist-500">Avatar colour</p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {AVATAR_HUES.map((hue) => (
            <button
              key={hue}
              onClick={() => setHueDraft(hue)}
              className={`relative size-8 rounded-full transition ${hueDraft === hue ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b0f20]" : "opacity-70 hover:opacity-100"}`}
              style={{ background: `radial-gradient(circle at 30% 25%, hsl(${hue} 90% 70%), hsl(${hue + 28} 70% 38%))` }}
              aria-label={`Avatar colour ${hue}`}
              aria-pressed={hueDraft === hue}
            >
              {hueDraft === hue && <Check size={13} className="absolute inset-0 m-auto text-white" />}
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-2.5">
          <button onClick={() => setEditOpen(false)} className="btn btn-ghost flex-1 py-3 text-xs">Cancel</button>
          <button onClick={saveProfile} disabled={!nameDraft.trim()} className="btn btn-primary flex-1 py-3 text-xs">Save profile</button>
        </div>
      </Modal>

      {/* Reset modal */}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all progress?">
        <p className="text-[12px] leading-relaxed text-mist-400">
          This will erase your scores, chapter progress, coins, achievements, daily history and challenge records for this player. The reset is saved to the server immediately. There is no undo.
        </p>
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.04] px-3.5 py-3">
          <p className="text-[10px] text-red-200/70">Your display name, avatar, country and preferences will be kept.</p>
        </div>
        <div className="mt-5 flex gap-2.5">
          <button onClick={() => setResetOpen(false)} className="btn btn-ghost flex-1 py-3 text-xs">Keep my progress</button>
          <button
            onClick={() => {
              resetProgress();
              setResetOpen(false);
            }}
            className="btn flex-1 border border-red-400/30 bg-red-500/15 py-3 text-xs text-red-100 hover:bg-red-500/25"
          >
            <RotateCcw size={13} /> Reset everything
          </button>
        </div>
      </Modal>
    </div>
  );
}

function DoorMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01" />
      <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.562Z" />
    </svg>
  );
}
