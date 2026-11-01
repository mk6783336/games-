import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Coins,
  FlaskConical,
  Pause,
  Play,
  RotateCcw,
  Swords,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AchievementToasts } from "../components/SiteChrome";
import { Logo } from "../components/Brand";
import { Countdown, ProgressBar } from "../components/UI";
import { achievementById } from "../lib/achievements";
import { parseChallenge } from "../lib/challenges";
import { getDaily } from "../lib/daily";
import { formatDuration, formatScore } from "../lib/games";
import { haptic } from "../lib/haptics";
import { playCue } from "../lib/sound";
import type { PlayMode, RunResult } from "../lib/types";
import { usePlayer } from "../state/player";
import { OneChanceGame, type HudStats, type RunSummary } from "../games/one-chance/engine";

type Screen = "menu" | "playing" | "paused" | "over";

const EMPTY_HUD: HudStats = { score: 0, coins: 0, speed: 0.4, distance: 0 };

export default function OneChance() {
  const { state, recordRun, registerChallenge, updateSettings } = usePlayer();
  const [searchParams] = useSearchParams();
  const rawMode = searchParams.get("mode");
  const mode: PlayMode = rawMode === "daily" || rawMode === "challenge" ? rawMode : "solo";
  const challenge = parseChallenge("one-chance", searchParams);
  const daily = getDaily("one-chance");
  const dailyRecord = state.dailies[daily.key];
  const challengeRecord = challenge ? state.challenges.find((c) => c.id === challenge.id) : undefined;
  const soundOn = state.settings.sound;
  const hapticsOn = state.settings.haptics;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<OneChanceGame | null>(null);
  const soundRef = useRef(soundOn);
  const hapticsRef = useRef(hapticsOn);
  const endRef = useRef<(summary: RunSummary) => void>(() => undefined);
  const endedRef = useRef(false);
  const registeredRef = useRef<string | null>(null);

  const [screen, setScreen] = useState<Screen>("menu");
  const [practice, setPractice] = useState(false);
  const [hud, setHud] = useState<HudStats>(EMPTY_HUD);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const targetScore = mode === "daily" ? daily.target : mode === "challenge" && challenge ? challenge.target : null;
  const targetProgress = targetScore ? Math.min(100, (hud.score / targetScore) * 100) : 0;
  const unlockedDefs = (runResult?.newAchievements ?? []).flatMap((id) => {
    const def = achievementById(id);
    return def ? [def] : [];
  });

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    hapticsRef.current = hapticsOn;
  }, [hapticsOn]);

  useEffect(() => {
    document.title = "One Chance — PLAYFLIX";
    return () => {
      document.title = "PLAYFLIX — Play. Challenge. Compete.";
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new OneChanceGame(canvas, {
      onHud: (stats) => setHud(stats),
      onEnd: (result) => endRef.current(result),
      onCue: (cue) => {
        playCue(cue, soundRef.current);
        if (cue === "hit") haptic("heavy", hapticsRef.current);
        else if (cue === "coin") haptic("light", hapticsRef.current);
      },
    });
    gameRef.current = game;
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mode === "challenge" && challenge && registeredRef.current !== challenge.id) {
      registeredRef.current = challenge.id;
      registerChallenge({
        id: challenge.id,
        game: "one-chance",
        seed: challenge.seed,
        target: challenge.target,
        from: challenge.from,
      });
    }
  }, [mode, challenge, registerChallenge]);

  useEffect(() => {
    endRef.current = (result) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const res = practice
        ? null
        : recordRun({
            game: "one-chance",
            score: result.score,
            coins: result.collectedCoins,
            mode,
            challengeId: mode === "challenge" ? challenge?.id ?? null : null,
          });
      setSummary(result);
      setRunResult(res);
      setScreen("over");
    };
  });

  const startGame = (asPractice = false) => {
    setPractice(asPractice);
    const seed = mode === "daily" ? daily.seed : mode === "challenge" && challenge ? challenge.seed : Math.floor(Math.random() * 2_147_483_647);
    endedRef.current = false;
    setSummary(null);
    setRunResult(null);
    setHud(EMPTY_HUD);
    setScreen("playing");
    gameRef.current?.start(seed);
    playCue("click", soundOn);
  };

  const pauseGame = () => {
    if (screen !== "playing") return;
    gameRef.current?.pause();
    setScreen("paused");
  };

  const resumeGame = () => {
    if (screen !== "paused") return;
    gameRef.current?.resume();
    setScreen("playing");
  };

  const jump = () => gameRef.current?.jump();
  const slide = () => gameRef.current?.slide();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (screen === "playing") jump();
        else if (screen === "menu" || screen === "over") startGame(screen === "over" && practice);
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        if (screen === "playing") slide();
      } else if (e.code === "Escape" || e.code === "KeyP") {
        if (screen === "playing") pauseGame();
        else if (screen === "paused") resumeGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, practice]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && screen === "playing") {
        gameRef.current?.pause();
        setScreen("paused");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [screen]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-shade">
      <AchievementToasts />

      <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-white/8 bg-shade/90 px-2.5 backdrop-blur-xl sm:px-4">
        <Link
          to="/games/one-chance"
          aria-label="Back to game overview"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-mist-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-white sm:text-xs">One Chance</p>
          <p className="truncate text-[9px] font-semibold text-mist-600">
            One life, {practice ? "Practice run" : mode === "daily" ? "Daily seed" : mode === "challenge" ? `Challenge, ${challenge?.from ?? "Unknown"}` : "Endless run"}
          </p>
        </div>
        {screen !== "menu" && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-mist-400">
              <Coins size={12} className="text-gold" /> {hud.coins}
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-mist-400">
              <Trophy size={12} className="text-gold" /> {formatScore("one-chance", state.stats["one-chance"].best)}
            </span>
          </div>
        )}
        {screen === "playing" ? (
          <button onClick={pauseGame} className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-mist-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-accent" aria-label="Pause">
            <Pause size={15} />
          </button>
        ) : (
          <Link to="/leaderboard" className="hidden rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold text-mist-400 transition hover:text-white sm:block">
            Leaderboard
          </Link>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="game-canvas absolute inset-0 h-full w-full"
          onPointerDown={(e) => {
            e.preventDefault();
            if (screen === "playing") jump();
          }}
          aria-label="One Chance survival game canvas. Tap to jump, or use the slide control."
        />

        {/* In-game HUD */}
        {(screen === "playing" || screen === "paused") && (
          <div className="pointer-events-none absolute inset-0 z-20">
            <div className="absolute left-3 top-3 sm:left-5 sm:top-4">
              <p className="text-[9px] font-extrabold text-white/45">Score</p>
              <p className="font-display text-4xl font-extrabold leading-none tabular-nums text-white title-legible sm:text-5xl">{hud.score.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-white/60">
                <span className="flex items-center gap-1"><Coins size={11} className="text-gold" />{hud.coins}</span>
                <span className="text-white/15">/</span>
                <span>{hud.distance} m</span>
              </div>
            </div>
            <div className="absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-5 sm:top-4">
              {targetScore != null ? (
                <div className="w-40 rounded-xl border border-white/10 bg-shade/70 px-3 py-2.5 backdrop-blur-md sm:w-48">
                  <div className="flex items-center justify-between text-[8px] font-bold text-mist-500">
                    <span className="flex items-center gap-1"><Target size={10} className="text-gold" />Target</span>
                    <span className="tabular-nums text-mist-300">{hud.score.toLocaleString()} / {targetScore.toLocaleString()}</span>
                  </div>
                  <ProgressBar value={targetProgress} tone="gold" className="mt-1.5" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-shade/70 px-2.5 py-1 text-[9px] font-semibold text-mist-400 backdrop-blur">
                  <Zap size={10} className="text-accent" /> Speed {Math.round(Math.min(100, Math.max(0, ((hud.speed - 0.4) / 0.38) * 100)))}%
                </div>
              )}
              <span className="text-[8px] font-semibold text-white/30">{practice ? "Practice, not ranked" : "One life, no retries"}</span>
            </div>

            {/* Mobile controls */}
            <div className="game-touch-controls pointer-events-none absolute inset-x-0 bottom-0 items-end justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  slide();
                }}
                className="pointer-events-auto grid size-[4.4rem] place-items-center rounded-full border border-accent/45 bg-accent/15 text-accent backdrop-blur-md active:scale-95"
                aria-label="Slide"
              >
                <span className="flex flex-col items-center gap-0.5">
                  <span className="text-lg">⌄</span>
                  <span className="text-[8px] font-extrabold">Slide</span>
                </span>
              </button>
              <div className="pointer-events-none pb-2 text-center text-[9px] font-semibold text-white/35">
                Tap to jump
              </div>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  jump();
                }}
                className="pointer-events-auto grid size-[4.4rem] place-items-center rounded-full border border-accent/40 bg-accent/25 text-accent backdrop-blur-md active:scale-95"
                aria-label="Jump"
              >
                <span className="flex flex-col items-center gap-0.5">
                  <span className="text-lg">⌃</span>
                  <span className="text-[8px] font-extrabold">Jump</span>
                </span>
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-3 hidden items-center justify-center gap-3 text-[9px] font-semibold text-white/40 sm:flex">
              <span><kbd className="keycap mr-1">Space</kbd> Jump</span>
              <span className="text-white/15">/</span>
              <span><kbd className="keycap mr-1">↓</kbd> Slide</span>
              <span className="text-white/15">/</span>
              <span><kbd className="keycap mr-1">P</kbd> Pause</span>
            </div>
          </div>
        )}

        {/* Menu */}
        {screen === "menu" && (
          <div className="absolute inset-0 z-30 overflow-y-auto hud-scrim backdrop-blur-[2px]">
            <div className="mx-auto flex min-h-full w-full max-w-4xl items-center px-4 py-6 sm:px-8">
              <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="fade-up">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip border-electric/25 text-electric">Game 02 · Survival arcade</span>
                    {mode === "daily" && <span className="chip border-gold/25 text-gold"><Target size={10} /> Daily seed</span>}
                    {mode === "challenge" && challenge && <span className="chip border-white/15">From {challenge.from}</span>}
                    {practice && <span className="chip border-white/15"><FlaskConical size={10} /> Practice, unranked</span>}
                  </div>
                  <h1 className="mt-5 font-display text-[clamp(3.4rem,9vw,6rem)] font-medium uppercase leading-[0.82] tracking-[-0.055em] text-ink">
                    One<br /><span className="text-mist-400">Chance.</span>
                  </h1>
                  <p className="serif mt-3 text-[clamp(1.15rem,2vw,1.55rem)] text-mist-400">
                    The city doesn't stop. Neither do you.
                  </p>
                  <p className="mt-4 max-w-md text-[13px] leading-relaxed text-mist-400">
                    One life. One run. No excuses. The city accelerates with every second; jump the spikes, slide under the lasers, and stay alive long enough to matter.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button onClick={() => startGame(false)} className="btn btn-primary px-6 py-3.5 text-sm">
                      <Play size={15} fill="currentColor" /> Start the run
                    </button>
                    <Link to="/games/one-chance" className="btn btn-ghost px-4 py-3.5 text-xs">
                      Game details
                    </Link>
                  </div>
                  {mode === "solo" && (
                    <button
                      onClick={() => startGame(true)}
                      className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-mist-500 transition hover:text-ink"
                    >
                      <FlaskConical size={12} /> Practice run, no records, no leaderboard
                    </button>
                  )}

                  <div className="mt-7 flex flex-wrap gap-5">
                    <div>
                      <p className="label">Personal best</p>
                      <p className="mt-1.5 font-display text-lg font-medium tabular-nums text-ink">{formatScore("one-chance", state.stats["one-chance"].best)}</p>
                    </div>
                    <div>
                      <p className="label">Runs</p>
                      <p className="mt-1.5 font-display text-lg font-medium tabular-nums text-ink">{state.stats["one-chance"].plays}</p>
                    </div>
                    <div>
                      <p className="label">
                        {mode === "daily" ? "Daily target" : mode === "challenge" ? "Target to beat" : "Today's best"}
                      </p>
                      <p className="mt-1.5 font-display text-lg font-medium tabular-nums text-accent">
                        {targetScore ? targetScore.toLocaleString() : dailyRecord ? dailyRecord.score.toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>

                  {(dailyRecord || challengeRecord) && (
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                      {mode === "daily" && dailyRecord && (
                        <span className={`rounded-full border px-2.5 py-1 ${dailyRecord.completed ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300" : "border-white/10 bg-white/[0.03] text-mist-400"}`}>
                          {dailyRecord.completed ? <span className="flex items-center gap-1"><Check size={10} /> Cleared today</span> : `Best today ${dailyRecord.score.toLocaleString()}`}
                        </span>
                      )}
                      {mode === "challenge" && challengeRecord && (
                        <span className={`rounded-full border px-2.5 py-1 ${challengeRecord.beat ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300" : "border-white/10 bg-white/[0.03] text-mist-400"}`}>
                          {challengeRecord.beat ? <span className="flex items-center gap-1"><Check size={10} /> Challenge beaten, {challengeRecord.score?.toLocaleString()}</span> : challengeRecord.score != null ? `Your attempt ${challengeRecord.score.toLocaleString()}` : "Not attempted yet"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="fade-up animation-delay-2 border border-rule bg-paper-2/85 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <p className="label">Run briefing</p>
                    <Zap size={13} className="text-electric" />
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {mode === "daily" ? (
                      <Briefing icon={<Target size={14} />} title={`Reach ${daily.target.toLocaleString()} points`} body="Everyone in the world gets this same city today. Same hazards, same seed." />
                    ) : mode === "challenge" && challenge ? (
                      <Briefing icon={<Swords size={14} />} title={`Beat ${challenge.target.toLocaleString()}`} body={`${challenge.from} set this target. Your run uses their exact seed.`} />
                    ) : (
                      <Briefing icon={<Trophy size={14} />} title="Survive. Score. Repeat." body="Hazards are telegraphed before they arrive. Learn the rhythm and push deeper." />
                    )}
                    <Briefing icon={<Zap size={14} />} title="One hit ends the run" body="Jump over ground hazards. Slide under energy gates. Double-jump once per airtime." />
                    <Briefing icon={<Coins size={14} />} title="Coins are points" body="Collect gold orbs for bonus score. Your final score sets your place on the board." />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3.5 text-[10px]">
                    <span className="flex items-center gap-1 text-mist-500"><Countdown className="text-[10px]" /> to reset</span>
                    <button
                      onClick={() => updateSettings({ sound: !soundOn })}
                      className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 font-semibold text-mist-400 transition hover:text-white"
                    >
                      {soundOn ? <Volume2 size={11} /> : <VolumeX size={11} />} Sound {soundOn ? "on" : "off"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pause */}
        {screen === "paused" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-shade/80 p-4 backdrop-blur-md">
            <div className="panel fade-up w-full max-w-sm p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center border border-electric/25 text-electric"><Pause size={17} /></span>
                <div>
                                    <h2 className="font-display text-xl font-semibold text-ink">Catch your breath.</h2>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Score", hud.score.toLocaleString()],
                  ["Coins", String(hud.coins)],
                  ["Distance", `${hud.distance}m`],
                ].map(([label, value]) => (
                  <div key={label} className="border border-rule px-2 py-2.5 text-center">
                    <p className="label !text-[8px]">{label}</p>
                    <p className="mt-0.5 font-display text-sm font-medium tabular-nums text-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                <button onClick={resumeGame} className="btn btn-primary w-full py-3 text-xs"><Play size={13} fill="currentColor" /> Resume</button>
                <button onClick={() => startGame(practice)} className="btn btn-ghost w-full py-2.5 text-[11px]"><RotateCcw size={12} /> Restart {practice ? "practice" : "run"}</button>
                <button onClick={() => updateSettings({ sound: !soundOn })} className="btn btn-ghost w-full py-2.5 text-[11px]">
                  {soundOn ? <Volume2 size={12} /> : <VolumeX size={12} />} Sound {soundOn ? "on" : "off"}
                </button>
              </div>
              <Link to="/games/one-chance" className="mt-3 block text-center text-[10px] text-mist-600 hover:text-mist-300">Leave run</Link>
            </div>
          </div>
        )}

        {/* Game over */}
        {screen === "over" && summary && (
          <div className="absolute inset-0 z-40 overflow-y-auto bg-shade/80 backdrop-blur-md">
            <div className="relative mx-auto flex min-h-full w-full max-w-md items-center px-4 py-6">
              <div className="panel fade-up relative w-full overflow-hidden p-6">
                <div className="relative text-center">
                  <p className={`label ${practice ? "!text-mist-400" : "!text-accent"}`}>{practice ? "Practice run" : "Run ended"}</p>
                  <h2 className="mt-2 font-display text-[2rem] font-medium tracking-[-0.04em] text-ink">{practice ? "No records. Just reps." : runResult?.newBest ? "A new best." : "One chance, spent."}</h2>
                  <p className="mt-2 text-[11px] text-mist-500">
                    {practice ? "Same city, same hazards. Nothing here touched your records or the boards." : runResult?.newBest ? "You went further than ever. The board noticed." : "The city always wins eventually. The score is what you leave behind."}
                  </p>

                  <div className="mt-5">
                    <p className="label">Final score</p>
                    <p className="mt-2 font-display text-5xl font-medium leading-none tabular-nums text-ink">{summary.score.toLocaleString()}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="border border-rule px-2 py-2.5">
                      <p className="label !text-[8px]">Coins</p>
                      <p className="mt-0.5 font-display text-sm font-medium tabular-nums text-accent">{summary.collectedCoins}</p>
                    </div>
                    <div className="border border-rule px-2 py-2.5">
                      <p className="label !text-[8px]">Distance</p>
                      <p className="mt-0.5 font-display text-sm font-medium tabular-nums text-ink">{summary.distance}m</p>
                    </div>
                    <div className="border border-rule px-2 py-2.5">
                      <p className="label !text-[8px]">Survived</p>
                      <p className="mt-0.5 font-display text-sm font-medium tabular-nums text-ink">{formatDuration(summary.durationMs)}</p>
                    </div>
                  </div>

                  {practice && (
                    <div className="mt-3 rounded-xl border border-blue-400/20 bg-blue-400/[0.04] px-3.5 py-2.5 text-[10px] leading-relaxed text-blue-200/75">
                      Practice mode: score, coins, experience and personal bests are unchanged.
                    </div>
                  )}

                  {mode !== "solo" && (
                    <div className={`mt-3 rounded-xl border px-3.5 py-3 text-left ${
                      mode === "daily"
                        ? summary.score >= daily.target ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-orange-400/20 bg-orange-400/[0.04]"
                        : challenge && summary.score > challenge.target ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-orange-400/20 bg-orange-400/[0.04]"
                    }`}>
                      <p className={`flex items-center gap-1.5 text-[10px] font-bold ${
                        mode === "daily"
                          ? summary.score >= daily.target ? "text-emerald-300" : "text-orange-300"
                          : challenge && summary.score > challenge.target ? "text-emerald-300" : "text-orange-300"
                      }`}>
                        {mode === "daily" ? (summary.score >= daily.target ? <Check size={12} /> : <Target size={12} />) : (challenge && summary.score > challenge.target ? <Check size={12} /> : <Swords size={12} />)}
                        {mode === "daily" ? (summary.score >= daily.target ? "Daily challenge complete" : "Daily target missed") : (challenge && summary.score > challenge.target ? `You beat ${challenge.from}` : "The challenge stands")}
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-mist-500">
                        {mode === "daily"
                          ? `Target ${daily.target.toLocaleString()}, Your score ${summary.score.toLocaleString()}${summary.score >= daily.target ? `, +${daily.reward} coins` : ""}`
                          : challenge ? `${challenge.from}'s target ${challenge.target.toLocaleString()}, You ${summary.score.toLocaleString()}` : "Challenge data missing."}
                      </p>
                    </div>
                  )}

                  {runResult && (
                    <div className="mt-3 flex items-center justify-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-[10px]">
                      <span className="flex items-center gap-1 text-gold"><Coins size={11} /> +{runResult.coins} coins</span>
                      <span className="h-3 w-px bg-white/10" />
                      <span className="text-mist-400">+{runResult.xp} XP</span>
                      {runResult.newBest && <><span className="h-3 w-px bg-white/10" /><span className="font-bold text-gold">New best</span></>}
                    </div>
                  )}

                  {unlockedDefs.map((def) => (
                    <div key={def.id} className="mt-2 flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/[0.05] px-3 py-2 text-left">
                      <Trophy size={12} className="text-gold" />
                      <span className="text-[10px] font-bold text-gold">{def.name}</span>
                      <span className="truncate text-[9px] text-mist-600">{def.description}</span>
                    </div>
                  ))}

                  <div className="mt-5 space-y-2">
                    <button onClick={() => startGame(practice)} className="btn btn-primary w-full py-3 text-xs"><RotateCcw size={13} /> {practice ? "Practice again" : "One more run"}</button>
                    {practice ? (
                      <button onClick={() => startGame(false)} className="btn btn-ghost w-full py-2.5 text-[11px]"><Trophy size={12} /> Start a ranked run</button>
                    ) : mode === "daily" || mode === "challenge" ? (
                      <Link to="/challenges" className="btn btn-ghost w-full py-2.5 text-[11px]"><Swords size={12} /> Back to challenges</Link>
                    ) : (
                      <Link to="/leaderboard" className="btn btn-ghost w-full py-2.5 text-[11px]"><Trophy size={12} /> See the leaderboard</Link>
                    )}
                    <Link to="/games/one-chance" className="btn btn-ghost w-full py-2.5 text-[11px]">Back to game overview</Link>
                  </div>
                  <p className="mt-3 hidden text-[9px] text-mist-600 [@media(pointer:fine)]:block">Press <span className="keycap mx-0.5">Space</span> for another run</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-2 left-3 z-10 hidden items-center gap-1.5 text-[8px] font-semibold text-white/20 sm:flex">
          <Logo size={14} wordmark={false} linkTo={null} /> PLAYFLIX, One Chance
        </div>
      </div>
    </div>
  );
}

function Briefing({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center border border-rule text-electric">{icon}</span>
      <div>
        <p className="text-[11px] font-medium text-ink-2">{title}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-mist-500">{body}</p>
      </div>
    </div>
  );
}
