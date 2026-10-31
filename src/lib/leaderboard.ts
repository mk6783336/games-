import { hashString, mulberry32 } from "./daily";
import type { GameId, LeaderboardEntry, LeaderboardScope, LeaderboardTimeframe, Profile } from "./types";

interface Rival {
  id: string;
  name: string;
  country: string;
  hue: number;
  skill: number;
}

/**
 * Seeded rival roster. In production these rows come from the server; the client
 * keeps a stable competitive field so leaderboards are presentable before sign-in.
 */
const RIVALS: Rival[] = [
  { id: "playerpro", name: "PlayerPro", country: "US", hue: 268, skill: 0.97 },
  { id: "gamemaster", name: "GameMaster", country: "US", hue: 212, skill: 0.93 },
  { id: "hikarijp", name: "HikariJP", country: "JP", hue: 330, skill: 0.91 },
  { id: "arslanx", name: "ArslanX", country: "PK", hue: 152, skill: 0.89 },
  { id: "vanta", name: "Vanta", country: "CA", hue: 258, skill: 0.87 },
  { id: "turboplayer", name: "TurboPlayer", country: "IN", hue: 24, skill: 0.86 },
  { id: "kaltblut", name: "KaltBlut", country: "DE", hue: 198, skill: 0.84 },
  { id: "ember", name: "Ember", country: "NG", hue: 14, skill: 0.83 },
  { id: "seoulslayer", name: "SeoulSlayer", country: "KR", hue: 286, skill: 0.81 },
  { id: "neonnova", name: "NeonNova", country: "US", hue: 312, skill: 0.8 },
  { id: "silentsable", name: "SilentSable", country: "GB", hue: 236, skill: 0.78 },
  { id: "fogovivo", name: "FogoVivo", country: "BR", hue: 46, skill: 0.77 },
  { id: "rheastrikes", name: "RheaStrikes", country: "IN", hue: 342, skill: 0.75 },
  { id: "kyro", name: "Kyro", country: "JP", hue: 174, skill: 0.74 },
  { id: "legendgamer", name: "LegendGamer", country: "GB", hue: 52, skill: 0.72 },
  { id: "desertflare", name: "DesertFlare", country: "AE", hue: 36, skill: 0.71 },
  { id: "zaraplays", name: "ZaraPlays", country: "PK", hue: 300, skill: 0.7 },
  { id: "aderuns", name: "AdeRuns", country: "NG", hue: 126, skill: 0.69 },
  { id: "orbit", name: "Orbit", country: "FR", hue: 250, skill: 0.68 },
  { id: "pixelqueen", name: "PixelQueen", country: "GB", hue: 320, skill: 0.66 },
  { id: "maplie", name: "MapleGhost", country: "CA", hue: 96, skill: 0.64 },
  { id: "lunenoire", name: "LuneNoire", country: "FR", hue: 272, skill: 0.63 },
  { id: "manilamayhem", name: "ManilaMayhem", country: "PH", hue: 208, skill: 0.62 },
  { id: "atarikid", name: "AtariKid", country: "DE", hue: 164, skill: 0.6 },
  { id: "mango", name: "Mango", country: "PH", hue: 32, skill: 0.55 },
  { id: "outbackace", name: "OutbackAce", country: "AU", hue: 18, skill: 0.58 },
];

const FRIEND_IDS = ["turboplayer", "neonnova", "zaraplays", "legendgamer", "vanta", "orbit"];

function rivalScore(game: GameId, rival: Rival, timeframe: LeaderboardTimeframe): number {
  const rng = mulberry32(hashString(`${rival.id}:${game}:${timeframe}:v3`));
  const jitter = 0.94 + rng() * 0.12;
  if (game === "one-chance") {
    const base = 780 + rival.skill * 2650;
    const factor = timeframe === "all" ? 1 : timeframe === "week" ? 0.84 : 0.66;
    return Math.round((base * factor * jitter) / 5) * 5;
  }
  const base = 322_000 - rival.skill * 205_000;
  const factor = timeframe === "all" ? 1 : timeframe === "week" ? 1.05 : 1.12;
  return Math.round((base * factor * jitter) / 100) * 100;
}

export interface LeaderboardOptions {
  game: GameId;
  scope: LeaderboardScope;
  timeframe: LeaderboardTimeframe;
  profile: Profile;
  best: number | null;
  includePlayer: boolean;
}

export function getLeaderboard({ game, scope, timeframe, profile, best, includePlayer }: LeaderboardOptions): LeaderboardEntry[] {
  let pool = RIVALS;
  if (scope === "country") pool = RIVALS.filter((r) => r.country === profile.country);
  if (scope === "friends") pool = RIVALS.filter((r) => FRIEND_IDS.includes(r.id));

  const rows: LeaderboardEntry[] = pool.map((r) => ({
    name: r.name,
    country: r.country,
    score: rivalScore(game, r, timeframe),
    avatarHue: r.hue,
  }));

  if (includePlayer && best != null) {
    rows.push({
      name: profile.name,
      country: profile.country,
      score: best,
      avatarHue: profile.avatarHue,
      isYou: true,
    });
  }

  const lowerIsBetter = game === "impossible-room";
  rows.sort((a, b) => (lowerIsBetter ? a.score - b.score : b.score - a.score));
  return rows;
}

export function playerRank(rows: LeaderboardEntry[]): number | null {
  const idx = rows.findIndex((r) => r.isYou);
  return idx === -1 ? null : idx + 1;
}

export const FRIEND_COUNT = FRIEND_IDS.length;
