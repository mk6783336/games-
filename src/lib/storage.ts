import type { PlayerState } from "./types";

const LEGACY_STORAGE_KEY = "playflix.player.v1";

export function createInitialState(): PlayerState {
  const now = Date.now();
  return {
    version: 1,
    profile: {
      name: "PlayerOne",
      country: "US",
      avatarHue: 266,
      createdAt: now,
    },
    coins: 500,
    xp: 0,
    achievements: {},
    stats: {
      "impossible-room": { plays: 0, best: null, lastPlayed: null, coinsEarned: 0 },
      "one-chance": { plays: 0, best: null, lastPlayed: null, coinsEarned: 0 },
      cycle: { plays: 0, best: null, lastPlayed: null, coinsEarned: 0 },
    },
    cycle: {
      levelsCleared: [],
      bestMs: {},
      totalRuns: 0,
    },
    room: {
      unlocked: 1,
      completedLevels: [],
      bestTimes: {},
      totalEscapes: 0,
      hintsUsed: 0,
      lastEscapeHints: null,
      fastestEscapeMs: null,
    },
    dailies: {},
    challenges: [],
    history: [],
    settings: {
      sound: true,
      haptics: false,
      reducedMotion: false,
      publicLeaderboard: true,
      allowChallenges: true,
      analytics: true,
    },
  };
}

/** Merge any stored or server-supplied document with the current defaults. */
export function hydrateState(parsed: Partial<PlayerState>): PlayerState {
  return normalizeState(parsed);
}

function normalizeState(parsed: Partial<PlayerState>): PlayerState {
  const base = createInitialState();
  return {
    ...base,
    ...parsed,
    version: 1,
    profile: { ...base.profile, ...(parsed.profile ?? {}) },
    stats: {
      "impossible-room": { ...base.stats["impossible-room"], ...(parsed.stats?.["impossible-room"] ?? {}) },
      "one-chance": { ...base.stats["one-chance"], ...(parsed.stats?.["one-chance"] ?? {}) },
      cycle: { ...base.stats.cycle, ...(parsed.stats?.cycle ?? {}) },
    },
    cycle: {
      levelsCleared: Array.isArray(parsed.cycle?.levelsCleared) ? parsed.cycle.levelsCleared : [],
      bestMs: { ...parsed.cycle?.bestMs },
      totalRuns: parsed.cycle?.totalRuns ?? 0,
    },
    room: { ...base.room, ...(parsed.room ?? {}), bestTimes: { ...base.room.bestTimes, ...(parsed.room?.bestTimes ?? {}) } },
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    achievements: parsed.achievements ?? {},
    dailies: parsed.dailies ?? {},
    challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
    history: Array.isArray(parsed.history) ? parsed.history.slice(0, 60) : [],
  };
}

/**
 * One-time import source for browsers that played before the account migration.
 * The server is the source of truth after this state is uploaded.
 */
export function loadLegacyState(): PlayerState | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw) as Partial<PlayerState>);
  } catch {
    return null;
  }
}

export function clearLegacyState() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing.
  }
}
