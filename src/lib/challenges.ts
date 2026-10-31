import { hashString } from "./daily";
import type { GameId } from "./types";

export interface ChallengeLink {
  id: string;
  game: GameId;
  seed: number;
  target: number;
  from: string;
}

export function makeChallenge(input: { game: GameId; seed: number; target: number; from: string }): ChallengeLink {
  const from = input.from.trim().slice(0, 18) || "A rival";
  return {
    ...input,
    from,
    id: hashString(`${input.game}:${input.seed}:${input.target}:${from}`).toString(36),
  };
}

export function challengePath(challenge: ChallengeLink): string {
  const params = new URLSearchParams({
    mode: "challenge",
    challengeId: challenge.id,
    seed: String(challenge.seed),
    target: String(Math.round(challenge.target)),
    from: challenge.from,
  });
  return `/play/${challenge.game}?${params.toString()}`;
}

export function absoluteChallengeUrl(challenge: ChallengeLink): string {
  return `${window.location.origin}${challengePath(challenge)}`;
}

export function parseChallenge(game: GameId, params: URLSearchParams): ChallengeLink | null {
  if (params.get("mode") !== "challenge") return null;
  const rawTarget = Number(params.get("target"));
  const rawSeed = Number(params.get("seed"));
  const from = (params.get("from") ?? "").trim().slice(0, 18) || "A rival";
  if (!Number.isFinite(rawTarget) || rawTarget <= 0) return null;
  const seed = Number.isFinite(rawSeed) && rawSeed > 0 ? Math.floor(rawSeed) : hashString(`${game}:${rawTarget}`);
  const computed = makeChallenge({ game, seed, target: rawTarget, from });
  const claimedId = (params.get("challengeId") ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 16);
  return { ...computed, id: claimedId || computed.id };
}

export function newSeed(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % 2_147_483_647;
  }
  return Math.floor(Math.random() * 2_147_483_647);
}
