import type { GameId } from "./types";

export interface GameMeta {
  id: GameId;
  index: string;
  title: string;
  short: string;
  tagline: string;
  description: string;
  genre: string;
  art: "room" | "runner";
  route: string;
  scoreKind: "time" | "points";
  scoreLabel: string;
  accent: string;
  tags: string[];
  features: string[];
  controls: { keys: string[]; action: string }[];
  chapters?: { number: number; name: string; subtitle: string }[];
}

export const GAMES: Record<GameId, GameMeta> = {
  "impossible-room": {
    id: "impossible-room",
    index: "01",
    title: "The Impossible Room",
    short: "Escape. Think. Discover.",
    tagline: "The door was never the puzzle.",
    description:
      "A cinematic escape-room adventure. Search the room, read what others missed, combine unlikely objects and out-think the mechanism between you and the door. Three connected chapters, one way out.",
    genre: "Escape-room puzzle",
    art: "room",
    route: "/play/impossible-room",
    scoreKind: "time",
    scoreLabel: "Fastest escape",
    accent: "#f5c45a",
    tags: ["Single player", "3 chapters", "Hints"],
    features: [
      "Interactive rooms with layered clues",
      "Inventory, inspection and object combinations",
      "Three connected chapters with saved progress",
      "Optional hints when you're stuck",
    ],
    controls: [
      { keys: ["Click", "Tap"], action: "Inspect or interact" },
      { keys: ["Item"], action: "Select an item, then tap the scene" },
      { keys: ["H"], action: "Reveal a written hint" },
    ],
    chapters: [
      { number: 1, name: "The Study", subtitle: "Someone left in a hurry. The door did not." },
      { number: 2, name: "The Clockmaker's Hall", subtitle: "Every mechanism keeps a secret. This one keeps three." },
      { number: 3, name: "The Observatory", subtitle: "The last door opens to the sky." },
    ],
  },
  "one-chance": {
    id: "one-chance",
    index: "02",
    title: "One Chance",
    short: "One life. One run. No excuses.",
    tagline: "The city doesn't stop. Neither do you.",
    description:
      "A fast survival arcade built for one more run. Vault the spikes, slide beneath the lasers and stay ahead of a city that accelerates with every second. One mistake ends the run — your best doesn't.",
    genre: "Survival arcade",
    art: "runner",
    route: "/play/one-chance",
    scoreKind: "points",
    scoreLabel: "Best score",
    accent: "#6ea8ff",
    tags: ["One life", "Endless", "Daily seed"],
    features: [
      "One-life runs with progressive speed",
      "Telegraphed hazards and fair spacing",
      "Daily seeded challenge shared worldwide",
      "Instant retry and friend challenge links",
    ],
    controls: [
      { keys: ["Space", "↑", "W"], action: "Jump (tap twice to double jump)" },
      { keys: ["↓", "S"], action: "Slide under hazards" },
      { keys: ["P", "Esc"], action: "Pause the run" },
    ],
  },
};

export const GAME_LIST: GameMeta[] = [GAMES["impossible-room"], GAMES["one-chance"]];

export const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
];

export function countryInfo(code: string) {
  return COUNTRIES.find((c) => c.code === code) ?? { code, name: code, flag: "🌍" };
}

export function formatScore(game: GameId, value: number | null): string {
  if (value == null) return "—";
  if (game === "impossible-room") return formatDuration(value);
  return value.toLocaleString("en-US");
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const centi = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(centi).padStart(2, "0")}`;
}

export function levelFromXp(xp: number) {
  const level = Math.floor(xp / 800) + 1;
  const into = xp % 800;
  return { level, into, needed: 800, percent: Math.round((into / 800) * 100) };
}
