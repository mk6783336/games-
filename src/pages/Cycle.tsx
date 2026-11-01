import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Coins,
  Flag,
  Gauge,
  Lock,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  Swords,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Wind,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AchievementToasts } from "../components/SiteChrome";
import { Countdown, ProgressBar } from "../components/UI";
import { achievementById } from "../lib/achievements";
import { parseChallenge } from "../lib/challenges";
import { getDaily } from "../lib/daily";
import { formatClock, formatDuration, formatScore } from "../lib/games";
import { haptic } from "../lib/haptics";
import { playCue } from "../lib/sound";
import type { PlayMode, RunResult } from "../lib/types";
import { usePlayer } from "../state/player";
import {
  CycleGame,
  ROADS,
  type CycleClear,
  type CycleHud,
  type CycleSummary,
} from "../games/cycle/engine";

type Screen = "menu" | "playing" | "paused" | "over";

const EMPTY_HUD: CycleHud = {
  score: 0,
  coins: 0,
  speed: 0,
  distance: 0,
  progress: 0,
  road: 1,
  roadName: ROADS[0].name,
  roadMs: 0,
  roadsCleared: 0,
};

const bestOf = (levels: number[]) => (levels.length ? Math.max(...levels) : 0);

export default function Cycle() {
  const { state, recordRun, recordCycleRoad, registerChallenge, updateSettings } = usePlayer();
  const [searchParams] = useSearchParams();
  const rawMode = searchParams.get("mode");
  const mode: PlayMode = rawMode === "daily" || rawMode === "challenge" ? rawMode : "solo";
  const challenge = parseChallenge("cycle", searchParams);
  const daily = getDaily("cycle");
  const dailyRecord = state.dailies[daily.key];
  const challengeRecord = challenge ? state.challenges.find((c) => c.id === challenge.id) : undefined;
  const soundOn = state.settings.sound;
  const hapticsOn = state.settings.haptics;

  const clearedLevels = state.cycle.levelsCleared;
  const furthestRoad = Math.min(ROADS.length, bestOf(clearedLevels) + 1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<CycleGame | null>(null);
  const soundRef = useRef(soundOn);
  const hapticsRef = useRef(hapticsOn);
  const clearRef = useRef<(clear: CycleClear) => void>(() => undefined);
  const endRef = useRef<(summary: CycleSummary) => void>(() => undefined);
  const endedRef = useRef(false);
  const registeredRef = useRef<string | null>(null);
  const bannerTimer = useRef<number | null>(null);

  const [screen, setScreen] = useState<Screen>("menu");
  const [road, setRoad] = useState(furthestRoad);
  const [hud, setHud] = useState<CycleHud>(EMPTY_HUD);
  const [summary, setSummary] = useState<CycleSummary | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [banner, setBanner] = useState<{ road: number; timeMs: number; coins: number } | null>(null);

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
    if (mode !== "solo") setRoad(1);
  }, [mode]);

  useEffect(() => {
    document.title = "Cycle — PLAYFLIX";
    return () => {
      document.title = "PLAYFLIX — Play. Challenge. Compete.";
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new CycleGame(canvas, {
      onHud: (stats) => setHud(stats),
      onRoadClear: (clear) => clearRef.current(clear),
      onEnd: (result) => endRef.current(result),
      onCue: (cue) => {
        if (cue === "hop") {
          playCue("jump", soundRef.current);
          haptic("light", hapticsRef.current);
        } else if (cue === "mote") {
          playCue("coin", soundRef.current);
          haptic("light", hapticsRef.current);
        } else if (cue === "crash") {
          playCue("hit", soundRef.current);
          haptic("heavy", hapticsRef.current);
        } else if (cue === "clear") {
          playCue("success", soundRef.current);
          haptic("medium", hapticsRef.current);
        } else if (cue === "start") {
          playCue("start", soundRef.current);
        }
      },
    });
    gameRef.current = game;
    // Development-only probe used by the Cycle end-to-end test. Vite
    // replaces the DEV flag, so production builds never expose the engine.
    if (import.meta.env.DEV) {
      (window as typeof window & { __playflixCycle?: CycleGame }).__playflixCycle = game;
    }
    return () => {
      game.destroy();
      gameRef.current = null;
      if (import.meta.env.DEV) {
        delete (window as typeof window & { __playflixCycle?: CycleGame }).__playflixCycle;
      }
      if (bannerTimer.current != null) window.clearTimeout(bannerTimer.current);
    };
  }, []);

  useEffect(() => {
    if (screen === "menu") gameRef.current?.preview(road);
  }, [road, screen]);

  useEffect(() => {
    if (mode === "challenge" && challenge && registeredRef.current !== challenge.id) {
      registeredRef.current = challenge.id;
      registerChallenge({
        id: challenge.id,
        game: "cycle",
        seed: challenge.seed,
        target: challenge.target,
        from: challenge.from,
      });
    }
  }, [mode, challenge, registerChallenge]);

  useEffect(() => {
    clearRef.current = (clear) => {
      const result = recordCycleRoad({
        level: clear.road,
        timeMs: clear.timeMs,
        totalTimeMs: clear.totalMs,
      });
      setBanner({ road: clear.road, timeMs: clear.timeMs, coins: result.coins });
      if (bannerTimer.current != null) window.clearTimeout(bannerTimer.current);
      bannerTimer.current = window.setTimeout(() => setBanner(null), 2800);
    };
  });

  useEffect(() => {
    endRef.current = (result) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const res = recordRun({
        game: "cycle",
        score: result.score,
        coins: result.collectedCoins,
        mode,
        challengeId: mode === "challenge" ? challenge?.id ?? null : null,
      });
      setSummary(result);
      setRunResult(res);
      setBanner(null);
      setScreen("over");
    };
  });

  const startGame = (level: number) => {
    endedRef.current = false;
    setRoad(level);
    setSummary(null);
    setRunResult(null);
    setBanner(null);
    setHud(EMPTY_HUD);
    setScreen("playing");
    const seed =
      mode === "daily"
        ? daily.seed
        : mode === "challenge" && challenge
          ? challenge.seed
          : Math.floor(Math.random() * 2_147_483_647);
    gameRef.current?.start(level, seed);
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

  const hop = () => {
    if (screen === "playing") gameRef.current?.hop();
  };

  const tuck = (active: boolean) => {
    if (screen === "playing") gameRef.current?.setTuck(active);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (screen === "playing") hop();
        else if (screen === "menu") startGame(road);
        else if (screen === "over") startGame(Math.min(ROADS.length, bestOf(clearedLevels) + 1));
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        tuck(true);
      } else if (e.code === "Escape" || e.code === "KeyP") {
        if (screen === "playing") pauseGame();
        else if (screen === "paused") resumeGame();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "KeyS") tuck(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, road, clearedLevels]);

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

  const retryRoad = summary ? Math.min(ROADS.length, bestOf(clearedLevels) + 1) : road;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-shade">
      <AchievementToasts />

      <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-white/8 bg-shade/90 px-2.5 backdrop-blur-xl sm:px-4">
        <Link
          to="/games/cycle"
          aria-label="Back to Cycle overview"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-mist-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-white sm:text-xs">Cycle</p>
          <p className="truncate text-[9px] font-semibold text-mist-600">
            {screen === "menu"
              ? "Five roads, forest to storm"
              : `Road ${hud.road} of 5, ${hud.roadName}`}
            {mode !== "solo" ? `, ${mode === "daily" ? "daily seed" : `challenge from ${challenge?.from ?? "a rival"}`}` : ""}
          </p>
        </div>
        {screen === "playing" ? (
          <button
            onClick={pauseGame}
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-mist-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
            aria-label="Pause"
          >
            <Pause size={15} />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateSettings({ sound: !soundOn })}
              className="grid size-8 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-mist-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={soundOn ? "Sound on" : "Sound off"}
            >
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <Link
              to="/leaderboard"
              className="hidden rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold text-mist-400 transition hover:text-white sm:block"
            >
              Leaderboard
            </Link>
          </div>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="game-canvas absolute inset-0 h-full w-full"
          onPointerDown={(e) => {
            e.preventDefault();
            if (screen === "playing") hop();
          }}
          aria-label="Cycle mountain-bike game canvas. Tap to hop, hold the tuck control to stay low and fast."
        />

        {(screen === "playing" || screen === "paused") && (
          <div className="pointer-events-none absolute inset-0 z-20">
            <div className="absolute left-3 top-3 sm:left-5 sm:top-4">
              <p className="text-[9px] font-extrabold text-white/45">Score</p>
              <p className="font-display text-4xl font-extrabold leading-none tabular-nums text-white title-legible sm:text-5xl">
                {hud.score.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-white/60">
                <span className="flex items-center gap-1"><Coins size={11} className="text-gold" />{hud.coins}</span>
                <span className="text-white/15">/</span>
                <span className="tabular-nums">{formatClock(hud.roadMs)}</span>
                <span className="text-white/15">/</span>
                <span>{hud.distance} m</span>
              </div>
            </div>

            <div className="absolute right-3 top-3 flex w-40 flex-col items-end gap-2 sm:right-5 sm:top-4 sm:w-56">
              <div className="w-full rounded-xl border border-white/10 bg-shade/70 px-3 py-2.5 backdrop-blur-md">
                <div className="flex items-baseline justify-between text-[8px] font-bold text-mist-500">
                  <span className="flex items-center gap-1"><Mountain size={10} className="text-gold" />Road {hud.road}, {hud.roadName}</span>
                  <span className="tabular-nums text-mist-300">{Math.round(hud.progress * 100)}%</span>
                </div>
                <ProgressBar value={hud.progress * 100} tone="violet" className="mt-1.5" />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    {ROADS.map((r) => (
                      <span
                        key={r.number}
                        className={`h-1 w-4 rounded-full ${
                          r.number < hud.road || hud.roadsCleared >= r.number
                            ? "bg-gold"
                            : r.number === hud.road
                              ? "bg-white/70"
                              : "bg-white/15"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-[9px] font-bold tabular-nums text-mist-300">
                    <Gauge size={10} className="text-electric" />{hud.speed} km/h
                  </span>
                </div>
              </div>
              {targetScore != null ? (
                <div className="w-full rounded-xl border border-white/10 bg-shade/70 px-3 py-2 backdrop-blur-md">
                  <div className="flex items-center justify-between text-[8px] font-bold text-mist-500">
                    <span className="flex items-center gap-1"><Target size={10} className="text-gold" />{mode === "daily" ? "Daily target" : "Beat the target"}</span>
                    <span className="tabular-nums text-mist-300">{hud.score.toLocaleString()} / {targetScore.toLocaleString()}</span>
                  </div>
                  <ProgressBar value={targetProgress} tone="gold" className="mt-1.5" />
                </div>
              ) : (
                <span className="rounded-full border border-white/10 bg-shade/70 px-2.5 py-1 text-[8px] font-semibold text-mist-400 backdrop-blur">One fall ends the run</span>
              )}
            </div>

            <div className="game-touch-controls pointer-events-none absolute inset-x-0 bottom-0 items-end justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  tuck(true);
                }}
                onPointerUp={() => tuck(false)}
                onPointerLeave={() => tuck(false)}
                onPointerCancel={() => tuck(false)}
                className="pointer-events-auto grid size-[4.4rem] place-items-center rounded-full border border-sky-400/30 bg-shade/85 text-sky-200 backdrop-blur-md active:scale-95"
                aria-label="Tuck"
              >
                <span className="flex flex-col items-center gap-0.5">
                  <Wind size={18} />
                  <span className="text-[8px] font-extrabold">Tuck</span>
                </span>
              </button>
              <div className="pointer-events-none pb-2 text-center text-[9px] font-semibold text-white/35">
                Tap to hop
              </div>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  hop();
                }}
                className="pointer-events-auto grid size-[4.4rem] place-items-center rounded-full border border-violet-400/40 bg-violet-600/25 text-violet-100 backdrop-blur-md active:scale-95"
                aria-label="Hop"
              >
                <span className="flex flex-col items-center gap-0.5">
                  <span className="text-lg">⌃</span>
                  <span className="text-[8px] font-extrabold">Hop</span>
                </span>
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-3 hidden items-center justify-center gap-3 text-[9px] font-semibold text-white/40 sm:flex">
              <span><kbd className="keycap mr-1">Space</kbd> Hop</span>
              <span className="text-white/15">/</span>
              <span><kbd className="keycap mr-1">↓</kbd> Tuck</span>
              <span className="text-white/15">/</span>
              <span><kbd className="keycap mr-1">P</kbd> Pause</span>
            </div>

            {banner && (
              <div className="absolute inset-x-0 top-16 flex justify-center px-4 sm:top-20">
                <div className="fade-up flex items-center gap-3 rounded-full border border-gold/30 bg-shade/85 px-4 py-2 backdrop-blur-md">
                  <span className="grid size-6 place-items-center rounded-full border border-gold/40 bg-gold/15 text-gold"><Flag size={12} /></span>
                  <span className="text-[10px] font-bold text-white">Road {String(banner.road).padStart(2, "0")} cleared</span>
                  <span className="text-[10px] tabular-nums text-mist-400">{formatClock(banner.timeMs)}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gold"><Coins size={10} />+{banner.coins}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "menu" && (
          <div className="absolute inset-0 z-30 overflow-y-auto hud-scrim backdrop-blur-[2px]">
            <div className="mx-auto grid min-h-full w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_0.95fr]">
              <div className="fade-up">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip border-violet-400/25 bg-violet-500/10 text-violet-200">Game 03, Cycling climb</span>
                  {mode === "daily" && <span className="chip border-gold/25 bg-gold/10 text-gold"><Target size={10} /> Daily seed</span>}
                  {mode === "challenge" && challenge && <span className="chip border-violet-400/25 bg-violet-500/10 text-violet-200">From {challenge.from}</span>}
                </div>
                <h1 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.06em] text-white">
                  Cycle<span className="gold-text">.</span>
                </h1>
                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-mist-400">
                  Five roads, one run. Pump the hollow, hold the ridge, cross the aurora, survive the canyon and bring the bike through the storm. A single fall ends it, a checkpoint keeps it.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button onClick={() => startGame(road)} className="btn btn-primary px-6 py-3.5 text-sm">
                    <Play size={15} fill="currentColor" /> Start at {ROADS[road - 1].name}
                  </button>
                  <Link to="/games/cycle" className="btn btn-ghost px-4 py-3.5 text-xs">
                    Game details
                  </Link>
                </div>
                <p className="mt-3 text-[10px] text-mist-600">
                  The run continues through every road ahead. Each gate saves your split and the next checkpoint.
                </p>

                <div className="mt-7 flex flex-wrap gap-5">
                  <Stat label="Best score" value={formatScore("cycle", state.stats.cycle.best)} />
                  <Stat label="Roads cleared" value={`${clearedLevels.length} / 5`} />
                  <Stat label="Runs" value={String(state.cycle.totalRuns)} />
                  <Stat label="Daily target" value={`${daily.target.toLocaleString()} pts`} gold />
                </div>

                {(dailyRecord || challengeRecord) && (
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                    {mode === "daily" && dailyRecord && (
                      <span className={`rounded-full border px-2.5 py-1 ${dailyRecord.completed ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300" : "border-white/10 bg-white/[0.03] text-mist-400"}`}>
                        {dailyRecord.completed ? <span className="flex items-center gap-1"><Check size={10} /> Cleared today</span> : `Best today ${dailyRecord.score}`}
                      </span>
                    )}
                    {mode === "challenge" && challengeRecord && (
                      <span className={`rounded-full border px-2.5 py-1 ${challengeRecord.beat ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300" : "border-white/10 bg-white/[0.03] text-mist-400"}`}>
                        {challengeRecord.beat ? <span className="flex items-center gap-1"><Check size={10} /> Challenge beaten, {challengeRecord.score?.toLocaleString()}</span> : challengeRecord.score != null ? `Your attempt ${challengeRecord.score}` : "Not attempted yet"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="fade-up animation-delay-2 space-y-2">
                <div className="flex items-end justify-between px-1">
                  <p className="label">The five roads</p>
                  <p className="text-[9px] font-semibold text-mist-600">Pick a checkpoint you have reached</p>
                </div>
                {ROADS.map((r) => {
                  const isCleared = clearedLevels.includes(r.number);
                  const locked = r.number > furthestRoad;
                  const selected = road === r.number;
                  const best = state.cycle.bestMs[r.number];
                  return (
                    <button
                      key={r.number}
                      onClick={() => {
                        if (locked) return;
                        setRoad(r.number);
                        playCue("click", soundOn);
                      }}
                      disabled={locked}
                      aria-pressed={selected}
                      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-gold/45 bg-gold/[0.07]"
                          : locked
                            ? "border-white/6 bg-white/[0.015] opacity-55 disabled:cursor-not-allowed"
                            : "border-white/10 bg-white/[0.025] hover:border-white/20"
                      }`}
                    >
                      <span
                        className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10"
                        style={{ background: `linear-gradient(155deg, ${r.palette.skyBottom}, ${r.palette.ground} 58%, ${r.palette.edge})` }}
                      >
                        <span className="font-display text-[11px] font-bold text-white/90">{String(r.number).padStart(2, "0")}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] font-bold text-white">{r.name}</span>
                          {isCleared && <Check size={11} className="shrink-0 text-emerald-300" />}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-mist-600">{r.subtitle}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        {locked ? (
                          <Lock size={13} className="ml-auto text-mist-600" />
                        ) : best != null ? (
                          <>
                            <span className="block text-[8px] font-bold text-mist-600">Best split</span>
                            <span className="block font-display text-[11px] font-bold tabular-nums text-gold">{formatClock(best)}</span>
                          </>
                        ) : (
                          <>
                            <span className="block text-[8px] font-bold text-mist-600">{isCleared ? "Cleared" : "Next up"}</span>
                            <span className="block text-[10px] text-mist-400">{isCleared ? "No split" : "New road"}</span>
                          </>
                        )}
                      </span>
                      {selected && <ChevronRight size={13} className="shrink-0 text-gold" />}
                    </button>
                  );
                })}

                <div className="panel mt-4 p-4">
                  <div className="flex items-center justify-between">
                    <p className="label text-[11px]">Ride briefing</p>
                    <Wind size={14} className="text-violet-300" />
                  </div>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    <Briefing icon={<span className="keycap">Space</span>} title="Hop the gaps" body="Rocks and chasms are the only things that end a run. Hop early, land on the downslope." />
                    <Briefing icon={<ArrowDownGlyph />} title="Tuck the descent" body="Hold down to stay low: faster on the ground, quicker to land in the air." />
                    <Briefing icon={<Coins size={13} />} title="Collect the motes" body="Every glowing marker adds points and coins to the run." />
                    <Briefing icon={<Flag size={13} />} title="Gates are checkpoints" body="Clear a gate and the next road unlocks, even if the storm takes you later." />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3 text-[10px]">
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

        {screen === "paused" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-shade/80 p-4 backdrop-blur-md">
            <div className="panel panel-glow fade-up w-full max-w-sm p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300"><Pause size={18} /></span>
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Hold the line.</h2>
                  <p className="mt-1 text-[10px] text-mist-500">Road {hud.road}, {hud.roadName}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Score", hud.score.toLocaleString()],
                  ["Motes", String(hud.coins)],
                  ["Split", formatClock(hud.roadMs)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/8 bg-white/[0.025] px-2 py-2 text-center">
                    <p className="text-[8px] font-bold text-mist-600">{label}</p>
                    <p className="mt-0.5 font-display text-sm font-bold tabular-nums text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                <button onClick={resumeGame} className="btn btn-primary w-full py-3 text-xs"><Play size={13} fill="currentColor" /> Resume the ride</button>
                <button onClick={() => startGame(hud.road)} className="btn btn-ghost w-full py-2.5 text-[11px]"><RotateCcw size={12} /> Restart this road</button>
                <button onClick={() => updateSettings({ sound: !soundOn })} className="btn btn-ghost w-full py-2.5 text-[11px]">
                  {soundOn ? <Volume2 size={12} /> : <VolumeX size={12} />} Sound {soundOn ? "on" : "off"}
                </button>
              </div>
              <button
                onClick={() => {
                  setScreen("menu");
                  setHud(EMPTY_HUD);
                }}
                className="mt-3 block w-full text-center text-[10px] text-mist-600 hover:text-mist-300"
              >
                Leave the run
              </button>
            </div>
          </div>
        )}

        {screen === "over" && summary && (
          <div className="absolute inset-0 z-40 overflow-y-auto bg-shade/80 backdrop-blur-md">
            <div className="relative mx-auto flex min-h-full w-full max-w-lg items-center px-4 py-6">
              <div className="panel panel-glow fade-up relative w-full overflow-hidden p-6">
                <div className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="relative">
                  <div className="text-center">
                    <p className={`text-[9px] font-extrabold ${summary.cleared ? "text-gold/80" : "text-rose-300/70"}`}>
                      {summary.cleared ? "All five roads" : "Run ended"}
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.03em] text-white">
                      {summary.cleared ? "Storm brought home." : runResult?.newBest ? "A new best, in the end." : "The road won this one."}
                    </h2>
                    <p className="mt-2 text-[11px] text-mist-500">
                      {summary.cleared
                        ? "Fern Hollow to Stormfront without a fall. That is the whole mountain."
                        : summary.roadsCleared > 0
                          ? `You stopped on ${summary.roadName}. The gate you cleared stays unlocked.`
                          : `You stopped on ${summary.roadName}. No checkpoint banked this time, and your unlocked roads are still waiting.`}
                    </p>

                    <div className="mt-5">
                      <p className="text-[9px] font-bold text-mist-600">Run score</p>
                      <p className="mt-1 font-display text-5xl font-extrabold leading-none tabular-nums text-white">{summary.score.toLocaleString()}</p>
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-2">
                      <MiniStat label="Roads" value={String(summary.roadsCleared)} />
                      <MiniStat label="Motes" value={String(summary.collectedCoins)} gold />
                      <MiniStat label="Distance" value={`${summary.distance} m`} />
                      <MiniStat label="Time" value={formatDuration(summary.durationMs)} />
                    </div>
                  </div>

                  {summary.splits.length > 0 && (
                    <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <p className="text-[9px] font-bold text-mist-600">Splits</p>
                      <div className="mt-2 space-y-1.5">
                        {summary.splits.map((split) => {
                          const def = ROADS.find((r) => r.number === split.road);
                          const best = state.cycle.bestMs[split.road];
                          return (
                            <div key={split.road} className="flex items-center gap-2 text-[10px]">
                              <span className="w-4 text-mist-600">{String(split.road).padStart(2, "0")}</span>
                              <span className="min-w-0 flex-1 truncate text-mist-300">{def?.name ?? "Road"}</span>
                              <span className="tabular-nums font-bold text-white">{formatClock(split.timeMs)}</span>
                              {best != null && <span className="w-14 text-right text-[9px] tabular-nums text-mist-600">best {formatClock(best)}</span>}
                            </div>
                          );
                        })}
                      </div>
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
                        {mode === "daily"
                          ? summary.score >= daily.target ? <Check size={12} /> : <Target size={12} />
                          : challenge && summary.score > challenge.target ? <Check size={12} /> : <Swords size={12} />}
                        {mode === "daily"
                          ? summary.score >= daily.target ? "Daily challenge complete" : "Daily target missed"
                          : challenge && summary.score > challenge.target ? `You beat ${challenge.from}` : "The challenge stands"}
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-mist-500">
                        {mode === "daily"
                          ? `Target ${daily.target.toLocaleString()}, Your score ${summary.score.toLocaleString()}${summary.score >= daily.target ? `, +${daily.reward} coins` : ""}`
                          : challenge ? `${challenge.from}'s target ${challenge.target.toLocaleString()}, You ${summary.score.toLocaleString()}` : "Challenge data missing."}
                      </p>
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
                    <button onClick={() => startGame(retryRoad)} className="btn btn-primary w-full py-3 text-xs">
                      <RotateCcw size={13} /> Ride from {ROADS[retryRoad - 1].name}
                    </button>
                    {retryRoad !== 1 && (
                      <button onClick={() => startGame(1)} className="btn btn-ghost w-full whitespace-nowrap py-2.5 text-[11px]">
                        <Mountain size={12} /> Start over at Fern Hollow
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setScreen("menu");
                        setHud(EMPTY_HUD);
                      }}
                      className="btn btn-ghost w-full py-2.5 text-[11px]"
                    >
                      <ArrowRight size={12} /> Pick another road
                    </button>
                  </div>
                  <p className="mt-3 hidden text-center text-[9px] text-mist-600 [@media(pointer:fine)]:block">
                    Press <span className="keycap mx-0.5">Space</span> to ride again
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <p className="text-[8px] font-bold text-mist-600">{label}</p>
      <p className={`mt-1 font-display text-lg font-extrabold tabular-nums ${gold ? "text-gold" : "text-white"}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-1.5 py-2.5">
      <p className="text-[8px] font-bold text-mist-600">{label}</p>
      <p className={`mt-0.5 font-display text-xs font-bold tabular-nums ${gold ? "text-gold" : "text-white"}`}>{value}</p>
    </div>
  );
}

function Briefing({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-white/8 bg-white/[0.03] text-[10px] text-violet-300">{icon}</span>
      <div>
        <p className="text-[10px] font-bold text-mist-100">{title}</p>
        <p className="mt-0.5 text-[9px] leading-relaxed text-mist-600">{body}</p>
      </div>
    </div>
  );
}

function ArrowDownGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1v8M2.5 6.5 6 10l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

