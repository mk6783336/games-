import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Coins,
  Fuel,
  Gauge,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Wind,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AchievementToasts } from "../components/SiteChrome";
import { Countdown, ProgressBar } from "../components/UI";
import { parseChallenge } from "../lib/challenges";
import { getDaily } from "../lib/daily";
import { formatDuration, formatScore } from "../lib/games";
import { haptic } from "../lib/haptics";
import { playCue } from "../lib/sound";
import type { PlayMode, RunResult } from "../lib/types";
import { usePlayer } from "../state/player";
import {
  CycleGame,
  ROADS,
  type CycleHud,
  type CycleSummary,
} from "../games/cycle/engine";

type Screen = "menu" | "playing" | "paused" | "over";

const EMPTY_HUD: CycleHud = {
  distance: 0,
  fuel: 100,
  speed: 0,
  altitude: 0,
  airTime: 0,
  coins: 0,
  score: 0,
};

export default function Cycle() {
  const { state, recordRun, updateSettings } = usePlayer();
  const [searchParams] = useSearchParams();
  const rawMode = searchParams.get("mode");
  const mode: PlayMode = rawMode === "daily" || rawMode === "challenge" ? rawMode : "solo";
  const challenge = parseChallenge("cycle", searchParams);
  const daily = getDaily("cycle");
  const soundOn = state.settings.sound;
  const hapticsOn = state.settings.haptics;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<CycleGame | null>(null);
  const soundRef = useRef(soundOn);
  const hapticsRef = useRef(hapticsOn);
  const endRef = useRef<(summary: CycleSummary) => void>(() => undefined);
  const endedRef = useRef(false);

  const [screen, setScreen] = useState<Screen>("menu");
  const [road, setRoad] = useState(1);
  const [hud, setHud] = useState<CycleHud>(EMPTY_HUD);
  const [summary, setSummary] = useState<CycleSummary | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [gasHeld, setGasHeld] = useState(false);
  const [brakeHeld, setBrakeHeld] = useState(false);
  const [tiltLeftHeld, setTiltLeftHeld] = useState(false);
  const [tiltRightHeld, setTiltRightHeld] = useState(false);

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    hapticsRef.current = hapticsOn;
  }, [hapticsOn]);

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
      onEnd: (result) => endRef.current(result),
      onCue: (cue) => {
        if (cue === "coin") {
          playCue("coin", soundRef.current);
          haptic("light", hapticsRef.current);
        } else if (cue === "fuel") {
          playCue("success", soundRef.current);
          haptic("light", hapticsRef.current);
        } else if (cue === "crash") {
          playCue("hit", soundRef.current);
          haptic("heavy", hapticsRef.current);
        } else if (cue === "air" || cue === "flip") {
          playCue("success", soundRef.current);
          haptic("medium", hapticsRef.current);
        } else if (cue === "start") {
          playCue("start", soundRef.current);
        }
      },
    });
    gameRef.current = game;
    if (import.meta.env.DEV) {
      (window as typeof window & { __playflixCycle?: CycleGame }).__playflixCycle = game;
    }
    return () => {
      game.destroy();
      gameRef.current = null;
      if (import.meta.env.DEV) {
        delete (window as typeof window & { __playflixCycle?: CycleGame }).__playflixCycle;
      }
    };
  }, []);

  useEffect(() => {
    if (screen === "menu") gameRef.current?.preview(road);
  }, [road, screen]);

  useEffect(() => {
    endRef.current = (result) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const res = recordRun({
        game: "cycle",
        score: result.score,
        coins: result.coins,
        mode,
        challengeId: mode === "challenge" ? challenge?.id ?? null : null,
      });
      setSummary(result);
      setRunResult(res);
      setScreen("over");
    };
  });

  const startGame = (level: number) => {
    endedRef.current = false;
    setRoad(level);
    setSummary(null);
    setRunResult(null);
    setHud(EMPTY_HUD);
    setGasHeld(false);
    setBrakeHeld(false);
    setTiltLeftHeld(false);
    setTiltRightHeld(false);
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
    releaseControls();
    setScreen("paused");
  };

  const resumeGame = () => {
    if (screen !== "paused") return;
    gameRef.current?.resume();
    setScreen("playing");
  };

  const gas = (active: boolean) => {
    if (screen !== "playing") return;
    gameRef.current?.setGas(active);
    setGasHeld(active);
  };

  const brake = (active: boolean) => {
    if (screen !== "playing") return;
    gameRef.current?.setBrake(active);
    setBrakeHeld(active);
  };

  const tiltLeft = (active: boolean) => {
    if (screen !== "playing") return;
    gameRef.current?.setTiltLeft(active);
    setTiltLeftHeld(active);
  };

  const tiltRight = (active: boolean) => {
    if (screen !== "playing") return;
    gameRef.current?.setTiltRight(active);
    setTiltRightHeld(active);
  };

  const releaseControls = () => {
    gameRef.current?.setGas(false);
    gameRef.current?.setBrake(false);
    gameRef.current?.setTiltLeft(false);
    gameRef.current?.setTiltRight(false);
    setGasHeld(false);
    setBrakeHeld(false);
    setTiltLeftHeld(false);
    setTiltRightHeld(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (screen === "playing") {
        if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
          e.preventDefault();
          gas(true);
        } else if (e.code === "ArrowDown" || e.code === "KeyS") {
          e.preventDefault();
          brake(true);
        } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          tiltLeft(true);
        } else if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          tiltRight(true);
        }
      } else if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (screen === "menu") startGame(road);
        else if (screen === "over") startGame(1);
      }

      if (e.code === "Escape" || e.code === "KeyP") {
        if (screen === "playing") pauseGame();
        else if (screen === "paused") resumeGame();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") gas(false);
      if (e.code === "ArrowDown" || e.code === "KeyS") brake(false);
      if (e.code === "ArrowLeft" || e.code === "KeyA") tiltLeft(false);
      if (e.code === "ArrowRight" || e.code === "KeyD") tiltRight(false);
    };

    const onBlur = () => releaseControls();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, road]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && screen === "playing") {
        gameRef.current?.pause();
        releaseControls();
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
          to="/games/cycle"
          aria-label="Back to Cycle overview"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-mist-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-white sm:text-xs">Cycle</p>
          <p className="truncate text-[9px] font-semibold text-mist-600">
            Hill climb racing · {hud.distance}m · {hud.fuel}%
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
          aria-label="Cycle hill climb racing game. Gas to accelerate, brake to slow down, tilt in air for flips."
        />

        {(screen === "playing" || screen === "paused") && (
          <div className="pointer-events-none absolute inset-0 z-20">
            <div className="absolute left-3 top-3 sm:left-5 sm:top-4">
              <p className="text-[9px] font-extrabold text-white/45">Distance</p>
              <p className="font-display text-4xl font-extrabold leading-none tabular-nums text-white title-legible sm:text-5xl">
                {hud.distance}m
              </p>
              <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-white/60">
                <span className="flex items-center gap-1"><Coins size={11} className="text-gold" />{hud.coins}</span>
                <span className="flex items-center gap-1"><Gauge size={11} className="text-electric" />{hud.speed} km/h</span>
              </div>
            </div>

            <div className="absolute right-3 top-3 w-40 sm:right-5 sm:top-4 sm:w-48">
              <div className="rounded-xl border border-white/10 bg-shade/70 px-3 py-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between text-[9px] font-bold text-mist-500">
                  <span className="flex items-center gap-1"><Fuel size={10} className="text-rose-400" />Fuel</span>
                  <span className={`tabular-nums ${hud.fuel < 25 ? "text-rose-400" : "text-mist-300"}`}>{hud.fuel}%</span>
                </div>
                <ProgressBar value={hud.fuel} tone="gold" className="mt-1.5" />
              </div>

              {hud.airTime > 0.1 && (
                <div className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-950/60 px-3 py-2 backdrop-blur-md">
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="text-emerald-300">Air time</span>
                    <span className="tabular-nums text-emerald-200">{hud.airTime.toFixed(1)}s</span>
                  </div>
                </div>
              )}

              <div className="mt-2 rounded-xl border border-white/10 bg-shade/70 px-3 py-2 backdrop-blur-md">
                <div className="flex items-center justify-between text-[9px] font-bold text-mist-500">
                  <span>Altitude</span>
                  <span className="tabular-nums text-mist-300">{hud.altitude}m</span>
                </div>
              </div>
            </div>

            <div className="game-touch-controls pointer-events-none absolute inset-x-0 bottom-0 items-end justify-between gap-2 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] touch-none select-none">
              <div className="pointer-events-auto flex items-end gap-2">
                <button
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); tiltLeft(true); }}
                  onPointerUp={() => tiltLeft(false)}
                  onPointerLeave={() => tiltLeft(false)}
                  onPointerCancel={() => tiltLeft(false)}
                  className={`grid size-[3.9rem] place-items-center rounded-full border backdrop-blur-md transition active:scale-95 ${
                    tiltLeftHeld ? "border-accent/70 bg-accent/25 text-accent" : "border-white/20 bg-shade/75 text-ink"
                  }`}
                  aria-label="Tilt back (lean left)"
                >
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="text-[13px] font-black leading-none">↺</span>
                    <span className="text-[8px] font-extrabold">Back</span>
                  </span>
                </button>
                <button
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); tiltRight(true); }}
                  onPointerUp={() => tiltRight(false)}
                  onPointerLeave={() => tiltRight(false)}
                  onPointerCancel={() => tiltRight(false)}
                  className={`grid size-[3.9rem] place-items-center rounded-full border backdrop-blur-md transition active:scale-95 ${
                    tiltRightHeld ? "border-accent/70 bg-accent/25 text-accent" : "border-white/20 bg-shade/75 text-ink"
                  }`}
                  aria-label="Tilt forward (lean right)"
                >
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="text-[13px] font-black leading-none">↻</span>
                    <span className="text-[8px] font-extrabold">Fwd</span>
                  </span>
                </button>
              </div>
              <div className="pointer-events-auto flex items-end gap-2">
                <button
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); gas(true); }}
                  onPointerUp={() => gas(false)}
                  onPointerLeave={() => gas(false)}
                  onPointerCancel={() => gas(false)}
                  className={`grid size-[4.35rem] place-items-center rounded-full border backdrop-blur-md transition active:scale-95 ${
                    gasHeld ? "border-emerald-400/70 bg-emerald-500/25 text-emerald-100" : "border-emerald-400/40 bg-shade/80 text-emerald-200"
                  }`}
                  aria-label="Gas"
                >
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="text-[15px] font-black leading-none">↑</span>
                    <span className="text-[8px] font-extrabold">GAS</span>
                  </span>
                </button>
                <button
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); brake(true); }}
                  onPointerUp={() => brake(false)}
                  onPointerLeave={() => brake(false)}
                  onPointerCancel={() => brake(false)}
                  className={`grid size-[4.35rem] place-items-center rounded-full border backdrop-blur-md transition active:scale-95 ${
                    brakeHeld ? "border-rose-300/70 bg-rose-400/25 text-rose-100" : "border-rose-300/35 bg-shade/80 text-rose-200"
                  }`}
                  aria-label="Brake"
                >
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="text-[15px] font-black leading-none">↓</span>
                    <span className="text-[8px] font-extrabold">BRK</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-3 hidden items-center justify-center gap-3 text-[9px] font-semibold text-white/40 sm:flex">
              <span><kbd className="keycap mx-1">↑</kbd> Gas</span>
              <span><kbd className="keycap mx-1">↓</kbd> Brake</span>
              <span><kbd className="keycap mx-1">←</kbd><kbd className="keycap mx-1">→</kbd> Tilt in air</span>
              <span><kbd className="keycap mx-1">P</kbd> Pause</span>
            </div>
          </div>
        )}

        {screen === "menu" && (
          <div className="absolute inset-0 z-30 overflow-y-auto hud-scrim backdrop-blur-[2px]">
            <div className="mx-auto grid min-h-full w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_0.95fr]">
              <div className="fade-up">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip border-accent/25 text-accent">Hill Climb Racing</span>
                  {mode === "daily" && <span className="chip border-gold/25 text-gold"><Target size={10} /> Daily seed</span>}
                </div>
                <h1 className="mt-5 font-display text-[clamp(3.4rem,9vw,6rem)] font-medium uppercase leading-[0.82] tracking-[-0.055em] text-ink">
                  Cycle
                </h1>
                <p className="serif mt-3 text-[clamp(1.15rem,2vw,1.55rem)] text-mist-400">
                  Climb higher. Fly further. Beat the distance.
                </p>
                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-mist-400">
                  Master the throttle on rolling hills, launch off ramps for massive air time, collect coins and fuel, and tilt mid-air to stick perfect flips. Every hill is steeper than the last — how far can you climb before running out of fuel?
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button onClick={() => startGame(road)} className="btn btn-primary px-6 py-3.5 text-sm">
                    <Play size={15} fill="currentColor" /> Start Riding
                  </button>
                  <Link to="/games/cycle" className="btn btn-ghost px-4 py-3.5 text-xs">
                    Game details
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap gap-5">
                  <Stat label="Best score" value={formatScore("cycle", state.stats.cycle.best ?? 0)} gold />
                  <Stat label="Total runs" value={String(state.stats.cycle.plays)} />
                  <Stat label="Coins earned" value={String(state.stats.cycle.coinsEarned)} />
                </div>
              </div>

              <div className="fade-up animation-delay-2 space-y-4">
                <div className="panel p-5">
                  <div className="flex items-center justify-between">
                    <p className="label text-[11px]">How to play</p>
                    <Wind size={14} className="text-accent" />
                  </div>
                  <div className="mt-4 grid gap-3">
                    <Briefing icon={<span className="text-[11px] font-black">↑</span>} title="Gas" body="Hold to accelerate. Feather it on steep climbs to avoid wheelies." />
                    <Briefing icon={<span className="text-[11px] font-black">↓</span>} title="Brake" body="Tap to slow down. Useful before jumps and on descents." />
                    <Briefing icon={<span className="text-[11px] font-black">←</span>} title="Tilt Back" body="In the air, lean back to land on the rear wheel. Perfect for flips." />
                    <Briefing icon={<span className="text-[11px] font-black">→</span>} title="Tilt Forward" body="Lean forward in the air. Helps avoid nose-diving on landings." />
                    <Briefing icon={<Coins size={13} className="text-gold" />} title="Collect coins" body="Grab gold coins for bonus points. Look for arcs over jumps." />
                    <Briefing icon={<Fuel size={13} className="text-rose-400" />} title="Fuel pickups" body="Grab red fuel cans to refill your tank. Empty tank = game over." />
                  </div>
                </div>

                <div className="panel p-5">
                  <div className="flex items-center justify-between">
                    <p className="label text-[11px]">Roads</p>
                    <Mountain size={14} className="text-accent" />
                  </div>
                  <div className="mt-3 space-y-2">
                    {ROADS.map((r) => (
                      <button
                        key={r.number}
                        onClick={() => setRoad(r.number)}
                        className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                          road === r.number ? "border-accent/45 bg-accent/[0.05]" : "border-rule hover:border-white/25"
                        }`}
                      >
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-md"
                          style={{ background: `linear-gradient(135deg, ${r.palette.skyTop}, ${r.palette.ground})` }}
                        >
                          <span className="text-[10px] font-bold text-white">{r.number}</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-ink">{r.name}</p>
                          <p className="text-[9px] text-mist-600">{r.subtitle}</p>
                        </div>
                        <ChevronRight size={13} className="shrink-0 text-mist-600" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel p-4">
                  <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3 text-[10px]">
                    <span className="flex items-center gap-1 text-mist-500"><Countdown className="text-[10px]" /> to daily reset</span>
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
                <span className="grid size-10 place-items-center border border-accent/25 text-accent"><Pause size={17} /></span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">Paused</h2>
                  <p className="mt-1 text-[10px] text-mist-500">{hud.distance}m climbed</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Distance", `${hud.distance}m`],
                  ["Coins", String(hud.coins)],
                  ["Fuel", `${hud.fuel}%`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/8 bg-white/[0.025] px-2 py-2 text-center">
                    <p className="text-[8px] font-bold text-mist-600">{label}</p>
                    <p className="mt-0.5 font-display text-sm font-bold tabular-nums text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                <button onClick={resumeGame} className="btn btn-primary w-full py-3 text-xs"><Play size={13} fill="currentColor" /> Resume</button>
                <button onClick={() => startGame(road)} className="btn btn-ghost w-full py-2.5 text-[11px]"><RotateCcw size={12} /> Restart</button>
                <button onClick={() => updateSettings({ sound: !soundOn })} className="btn btn-ghost w-full py-2.5 text-[11px]">
                  {soundOn ? <Volume2 size={12} /> : <VolumeX size={12} />} Sound {soundOn ? "on" : "off"}
                </button>
              </div>
              <button
                onClick={() => { setScreen("menu"); setHud(EMPTY_HUD); }}
                className="mt-3 block w-full text-center text-[10px] text-mist-600 hover:text-mist-300"
              >
                Quit run
              </button>
            </div>
          </div>
        )}

        {screen === "over" && summary && (
          <div className="absolute inset-0 z-40 overflow-y-auto bg-shade/80 backdrop-blur-md">
            <div className="relative mx-auto flex min-h-full w-full max-w-lg items-center px-4 py-6">
              <div className="panel panel-glow fade-up relative w-full overflow-hidden p-6">
                <div className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
                <div className="relative">
                  <div className="text-center">
                    <p className="text-[9px] font-extrabold text-rose-300/70">Run over</p>
                    <h2 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.03em] text-white">
                      {runResult?.newBest ? "New personal best!" : "Nice run!"}
                    </h2>
                    <p className="mt-2 text-[11px] text-mist-500">
                      You climbed {summary.distance} meters on {ROADS[road - 1]?.name ?? "the hills"}.
                    </p>

                    <div className="mt-5">
                      <p className="text-[9px] font-bold text-mist-600">Final score</p>
                      <p className="mt-1 font-display text-5xl font-extrabold leading-none tabular-nums text-white">{summary.score.toLocaleString()}</p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                        <p className="text-[9px] font-bold text-mist-600">Distance</p>
                        <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-white">{summary.distance}m</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                        <p className="text-[9px] font-bold text-mist-600">Coins</p>
                        <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-gold">{summary.coins}</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                        <p className="text-[9px] font-bold text-mist-600">Best air</p>
                        <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-emerald-300">{summary.bestAirTime.toFixed(1)}s</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                        <p className="text-[9px] font-bold text-mist-600">Flips</p>
                        <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-electric">{summary.flips}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-mist-400">
                      <div className="flex items-center justify-between rounded-lg border border-white/8 px-3 py-2">
                        <span>Top speed</span>
                        <span className="font-bold tabular-nums text-white">{summary.topSpeed} km/h</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-white/8 px-3 py-2">
                        <span>Time</span>
                        <span className="font-bold tabular-nums text-white">{formatDuration(summary.durationMs)}</span>
                      </div>
                    </div>
                  </div>

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
                    <button onClick={() => startGame(road)} className="btn btn-primary w-full py-3 text-xs">
                      <RotateCcw size={13} /> Ride again
                    </button>
                    <button
                      onClick={() => { setScreen("menu"); setHud(EMPTY_HUD); }}
                      className="btn btn-ghost w-full py-2.5 text-[11px]"
                    >
                      <ArrowRight size={12} /> Main menu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const unlockedDefs: { id: string; name: string; description: string }[] = [];

function Stat({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={`mt-1.5 font-display text-lg font-medium tabular-nums ${gold ? "text-accent" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function Briefing({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center border border-rule text-[10px] text-accent">{icon}</span>
      <div>
        <p className="text-[10px] font-medium text-ink-2">{title}</p>
        <p className="mt-0.5 text-[9px] leading-relaxed text-mist-500">{body}</p>
      </div>
    </div>
  );
}
