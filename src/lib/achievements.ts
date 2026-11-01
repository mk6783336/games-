import type { PlayerState } from "./types";

export type AchievementTier = "bronze" | "silver" | "gold";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  test: (state: PlayerState) => boolean;
}

const totalRuns = (state: PlayerState) =>
  state.stats["impossible-room"].plays + state.stats["one-chance"].plays;

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-run",
    name: "First Light",
    description: "Complete your first run on PLAYFLIX.",
    tier: "bronze",
    icon: "sparkles",
    test: (s) => totalRuns(s) > 0,
  },
  {
    id: "chapter-one",
    name: "Out of the Study",
    description: "Escape Chapter I of The Impossible Room.",
    tier: "bronze",
    icon: "door",
    test: (s) => s.room.completedLevels.includes(1),
  },
  {
    id: "clockwork",
    name: "Timekeeper",
    description: "Escape the Clockmaker's Hall.",
    tier: "silver",
    icon: "cog",
    test: (s) => s.room.completedLevels.includes(2),
  },
  {
    id: "escape-artist",
    name: "Impossible No More",
    description: "Escape all three chapters of The Impossible Room.",
    tier: "gold",
    icon: "trophy",
    test: (s) => s.room.completedLevels.includes(1) && s.room.completedLevels.includes(2) && s.room.completedLevels.includes(3),
  },
  {
    id: "no-whisper",
    name: "Without a Whisper",
    description: "Complete the full escape without using a single hint.",
    tier: "gold",
    icon: "feather",
    test: (s) => s.room.totalEscapes > 0 && s.room.lastEscapeHints === 0,
  },
  {
    id: "five-minute-escape",
    name: "Five-Minute Mile",
    description: "Finish a full escape in under 5:00.",
    tier: "silver",
    icon: "timer",
    test: (s) => s.room.fastestEscapeMs != null && s.room.fastestEscapeMs <= 300_000,
  },
  {
    id: "still-standing",
    name: "Still Standing",
    description: "Score 500 or more in a single One Chance run.",
    tier: "bronze",
    icon: "flame",
    test: (s) => (s.stats["one-chance"].best ?? 0) >= 500,
  },
  {
    id: "untouchable",
    name: "Untouchable",
    description: "Score 2,000 or more in a single One Chance run.",
    tier: "silver",
    icon: "zap",
    test: (s) => (s.stats["one-chance"].best ?? 0) >= 2000,
  },
  {
    id: "daily-devotee",
    name: "Clock In",
    description: "Complete any daily challenge.",
    tier: "silver",
    icon: "calendar",
    test: (s) => Object.values(s.dailies).some((d) => d.completed),
  },
  {
    id: "rivalry",
    name: "Rivalry",
    description: "Beat a friend's challenge score.",
    tier: "bronze",
    icon: "swords",
    test: (s) => s.challenges.some((c) => c.beat),
  },
  {
    id: "vault",
    name: "Vault Builder",
    description: "Hold 3,000 coins at once.",
    tier: "gold",
    icon: "coins",
    test: (s) => s.coins >= 3000,
  },
  {
    id: "regular",
    name: "Regular",
    description: "Record 10 runs across the games.",
    tier: "silver",
    icon: "gamepad",
    test: (s) => s.history.length >= 10,
  },
  {
    id: "first-road",
    name: "Gravel Beginner",
    description: "Clear your first road in Cycle.",
    tier: "bronze",
    icon: "feather",
    test: (s) => s.cycle.levelsCleared.includes(1),
  },
  {
    id: "all-roads",
    name: "All Five Roads",
    description: "Carry the bike from Fern Hollow to Stormfront.",
    tier: "gold",
    icon: "trophy",
    test: (s) => [1, 2, 3, 4, 5].every((n) => s.cycle.levelsCleared.includes(n)),
  },
  {
    id: "eye-of-the-storm",
    name: "Eye of the Storm",
    description: "Clear Stormfront in under 2:30.",
    tier: "silver",
    icon: "zap",
    test: (s) => s.cycle.bestMs[5] != null && s.cycle.bestMs[5] <= 150_000,
  },
];

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Returns the ids of achievements whose conditions are newly satisfied. */
export function findNewAchievements(state: PlayerState): string[] {
  return ACHIEVEMENTS.filter((a) => !state.achievements[a.id] && a.test(state)).map((a) => a.id);
}
