import type { GameId } from "./types";

export interface DailyChallenge {
  key: string;
  game: GameId;
  title: string;
  description: string;
  target: number;
  reward: number;
  unit: "points" | "time";
  seed: number;
  date: string;
}

const DAILY_CONFIG: Record<GameId, { title: string; description: string; target: number; reward: number }> = {
  "one-chance": {
    title: "Neon Gauntlet",
    description: "One seeded run. The same city, the same hazards, for every player on Earth.",
    target: 1100,
    reward: 150,
  },
  "impossible-room": {
    title: "The Study, Against the Clock",
    description: "Escape Chapter I in under three minutes. Knowledge from previous runs is allowed.",
    target: 180_000,
    reward: 150,
  },
  cycle: {
    title: "Stormfront Sprint",
    description: "One seeded ride from Fern Hollow to Stormfront. The purse is only paid for the full five-road run.",
    target: 40_000,
    reward: 250,
  },
};

export function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Local calendar day, not UTC — daily challenges should roll over at the player's midnight. */
export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function seedFor(game: GameId, dateKey = dayKey()): number {
  return hashString(`playflix:${game}:${dateKey}`);
}

export function getDaily(game: GameId, dateKey = dayKey()): DailyChallenge {
  const cfg = DAILY_CONFIG[game];
  return {
    key: `${dateKey}:${game}`,
    game,
    title: cfg.title,
    description: cfg.description,
    target: cfg.target,
    reward: cfg.reward,
    unit: game === "impossible-room" ? "time" : "points",
    seed: seedFor(game, dateKey),
    date: dateKey,
  };
}

export function msUntilTomorrow(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Mulberry32 — small, fast, deterministic PRNG used by daily seeded runs. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
