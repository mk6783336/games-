export type GameId = "impossible-room" | "one-chance";

export type PlayMode = "solo" | "daily" | "challenge";

export interface Profile {
  name: string;
  country: string;
  avatarHue: number;
  createdAt: number;
}

export interface GameStat {
  plays: number;
  best: number | null;
  lastPlayed: number | null;
  coinsEarned: number;
}

export interface RoomProgress {
  unlocked: number;
  completedLevels: number[];
  bestTimes: Record<number, number>;
  totalEscapes: number;
  hintsUsed: number;
  lastEscapeHints: number | null;
  fastestEscapeMs: number | null;
}

export interface DailyRecord {
  date: string;
  game: GameId;
  score: number;
  completed: boolean;
}

export interface ChallengeRecord {
  id: string;
  game: GameId;
  seed: number;
  target: number;
  from: string;
  createdAt: number;
  score: number | null;
  beat: boolean;
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  publicLeaderboard: boolean;
  allowChallenges: boolean;
  analytics: boolean;
}

export interface HistoryEntry {
  game: GameId;
  score: number;
  at: number;
  mode: PlayMode;
}

export interface PlayerState {
  version: 1;
  profile: Profile;
  coins: number;
  xp: number;
  achievements: Record<string, number>;
  stats: Record<GameId, GameStat>;
  room: RoomProgress;
  dailies: Record<string, DailyRecord>;
  challenges: ChallengeRecord[];
  history: HistoryEntry[];
  settings: Settings;
}

export interface RunResult {
  coins: number;
  xp: number;
  newAchievements: string[];
  newBest: boolean;
}

export interface LeaderboardEntry {
  name: string;
  country: string;
  score: number;
  avatarHue: number;
  isYou?: boolean;
}

export type LeaderboardScope = "global" | "country" | "friends";
export type LeaderboardTimeframe = "today" | "week" | "all";
