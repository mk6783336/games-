export type RoomId = "study" | "clockwork" | "observatory";
export type PuzzleKind = "keypad" | "symbols" | "rings";
export type ItemId =
  | "brass-key"
  | "matchbox"
  | "candle"
  | "lit-candle"
  | "screwdriver"
  | "iron-gear"
  | "brass-handle"
  | "telescope-lens";

export type ItemIcon = "key" | "box" | "candle" | "flame" | "wrench" | "cog" | "grip" | "lens";

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  icon: ItemIcon;
  tint: "gold" | "blue" | "warm" | "steel";
}

export const ITEMS: Record<ItemId, ItemDef> = {
  "brass-key": {
    id: "brass-key",
    name: "Brass key",
    description: "Small, warm, and recently used. It fits something in this room.",
    icon: "key",
    tint: "gold",
  },
  matchbox: {
    id: "matchbox",
    name: "Matchbox",
    description: "Three matches left. The label is water-damaged.",
    icon: "box",
    tint: "blue",
  },
  candle: {
    id: "candle",
    name: "Candle stub",
    description: "Unlit. The wick is still good.",
    icon: "candle",
    tint: "warm",
  },
  "lit-candle": {
    id: "lit-candle",
    name: "Lit candle",
    description: "A steady flame. It makes the dark parts of the room uncomfortable.",
    icon: "flame",
    tint: "gold",
  },
  screwdriver: {
    id: "screwdriver",
    name: "Screwdriver",
    description: "A watchmaker's tool. Thin enough for stubborn brass screws.",
    icon: "wrench",
    tint: "steel",
  },
  "iron-gear": {
    id: "iron-gear",
    name: "Iron gear",
    description: "Oiled and intact. It was made for a mechanism, not a shelf.",
    icon: "cog",
    tint: "steel",
  },
  "brass-handle": {
    id: "brass-handle",
    name: "Brass handle",
    description: "A door handle, wrapped in cloth. The mounting holes look familiar.",
    icon: "grip",
    tint: "gold",
  },
  "telescope-lens": {
    id: "telescope-lens",
    name: "Telescope lens",
    description: "Ground glass, wrapped in velvet. It has been waiting for the sky.",
    icon: "lens",
    tint: "blue",
  },
};

export const COMBINATIONS: { a: ItemId; b: ItemId; result: ItemId; label: string }[] = [
  { a: "candle", b: "matchbox", result: "lit-candle", label: "Light the candle" },
];

export function combineItems(a: ItemId, b: ItemId): ItemId | null {
  const match = COMBINATIONS.find(
    (c) => (c.a === a && c.b === b) || (c.a === b && c.b === a),
  );
  return match?.result ?? null;
}

export interface PuzzleDef {
  kind: PuzzleKind;
  title: string;
  prompt: string;
  successFlag: string;
  successText: string;
  give?: ItemId;
  code?: string;
  sequence?: ("moon" | "star" | "sun")[];
  rings?: number[];
}

export interface HotspotUse {
  item: ItemId;
  text: string;
  give?: ItemId;
  setFlag?: string;
  consume?: boolean;
}

export interface Hotspot {
  id: string;
  label: string;
  x: number;
  y: number;
  look: string;
  take?: ItemId;
  takeLabel?: string;
  use?: HotspotUse;
  puzzle?: string;
  afterFlag?: { flag: string; look: string };
  ambient?: boolean;
}

export interface RoomDef {
  id: RoomId;
  number: number;
  name: string;
  subtitle: string;
  intro: string;
  objective: string;
  exitFlag: string;
  doorId: string;
  hints: string[];
  hotspots: Hotspot[];
  puzzles: Record<string, PuzzleDef>;
  palette: "study" | "clockwork" | "observatory";
}

export const ROOMS: RoomDef[] = [
  {
    id: "study",
    number: 1,
    name: "The Study",
    subtitle: "Someone left in a hurry. The door did not.",
    intro:
      "The door clicked shut behind you. The room smells of old paper and colder weather. Somewhere, a clock you cannot see is already counting.",
    objective: "Find the three digits. Open the study door.",
    exitFlag: "study-unlocked",
    doorId: "door",
    palette: "study",
    hints: [
      "Start with what is out of place. That desk drawer is not going to open itself.",
      "A good bookshelf hides more than stories. Look behind the spines.",
      "Fire needs a spark. Find what the drawer was hiding, then look at the mantel.",
      "The painting has been hiding three digits under its varnish. Light the candle, hold it close, and read: 492.",
    ],
    hotspots: [
      {
        id: "door",
        label: "Study door",
        x: 50,
        y: 50,
        look: "The only way out. A three-digit keypad glows beside the handle. It is waiting for an answer.",
        puzzle: "study-keypad",
      },
      {
        id: "painting",
        label: "Portrait",
        x: 21,
        y: 31,
        look: "A stern man with too many rings. The varnish is dull — except in three places, where something brighter sits beneath the surface.",
        use: {
          item: "lit-candle",
          text: "You hold the flame close. Beneath the varnish, three digits bloom into view: 4 · 9 · 2.",
          setFlag: "study-code",
        },
        afterFlag: {
          flag: "study-code",
          look: "Under the candlelight, the hidden digits are unmistakable: 4 · 9 · 2.",
        },
      },
      {
        id: "bookshelf",
        label: "Bookshelf",
        x: 84,
        y: 43,
        look: "Dust, leather spines and a row of books no one has opened in years. Something brass glints behind a green spine.",
        take: "brass-key",
        takeLabel: "Reach behind the books",
      },
      {
        id: "desk",
        label: "Writing desk",
        x: 23,
        y: 69,
        look: "A writing desk. The top drawer is locked — small brass keyhole, recently oiled.",
        use: {
          item: "brass-key",
          text: "The key turns. Inside the drawer: a matchbox, and a note in hasty handwriting. “Light shows what dust hides.”",
          give: "matchbox",
          setFlag: "study-drawer",
          consume: true,
        },
        afterFlag: {
          flag: "study-drawer",
          look: "The drawer hangs open. The note inside still says: “Light shows what dust hides.”",
        },
      },
      {
        id: "mantel",
        label: "Fireplace mantel",
        x: 80,
        y: 68,
        look: "A cold fireplace. On the mantel, a stub of candle sits in a tarnished brass dish.",
        take: "candle",
        takeLabel: "Take the candle",
      },
      {
        id: "chandelier",
        label: "Chandelier",
        x: 50,
        y: 12,
        look: "Five candles, all cold. Whatever happened here, it happened before anyone thought to light them.",
        ambient: true,
      },
    ],
    puzzles: {
      "study-keypad": {
        kind: "keypad",
        title: "The study door",
        prompt: "Three brass digits. The display blinks once, patiently.",
        code: "492",
        successFlag: "study-unlocked",
        successText: "The bolt retracts with a heavy clunk. The door drifts open, letting in colder air.",
      },
    },
  },
  {
    id: "clockwork",
    number: 2,
    name: "The Clockmaker's Hall",
    subtitle: "Every mechanism keeps a secret. This one keeps three.",
    intro:
      "The study led here: a hall of unfinished clocks. Above the door, a mechanism the size of a wardrobe hangs mid-tick. One of the clocks is still trying to strike.",
    objective: "Repair the clockmaker's mechanism. Find the missing handle.",
    exitFlag: "hall-unlocked",
    doorId: "door",
    palette: "clockwork",
    hints: [
      "The floor grate is screwed shut. The workbench should have something for that.",
      "The clock is missing a gear — and the grate is hiding it.",
      "The portrait gives you the order: moon, star, sun. Set the cabinet's three rings to match.",
      "The cabinet releases a brass handle. Fit it to the door and the hall lets you go.",
    ],
    hotspots: [
      {
        id: "door",
        label: "Hall door",
        x: 50,
        y: 46,
        look: "A slab of blackened oak. The handle has been removed — the mounting plate is empty, four screws still in place.",
        use: {
          item: "brass-handle",
          text: "The handle slots into the mounting plate. The door swings inward on a long, patient hinge.",
          setFlag: "hall-unlocked",
          consume: true,
        },
      },
      {
        id: "portrait",
        label: "Clockmaker's portrait",
        x: 21,
        y: 30,
        look: "The clockmaker, surrounded by half-built clocks. The inscription reads: “Moonrise. Starlight. Sunrise. Everything in its order.”",
      },
      {
        id: "clock",
        label: "Grandfather clock",
        x: 78,
        y: 37,
        look: "A grandfather clock, taller than it should be. Its side cabinet is open; the gear train is missing one tooth.",
        use: {
          item: "iron-gear",
          text: "The gear seats with a click. The clock shudders to life. Its hands snap to 3:15 — and behind the glass, three symbols light in sequence: crescent, star, sun.",
          setFlag: "hall-clock",
          consume: true,
        },
        afterFlag: {
          flag: "hall-clock",
          look: "The clock is alive again. Crescent. Star. Sun. The same three symbols glow behind its glass.",
        },
      },
      {
        id: "cabinet",
        label: "Symbol cabinet",
        x: 81,
        y: 71,
        look: "A narrow cabinet with three brass rings. Each ring can show a crescent, a star or a sun. All three are out of alignment.",
        puzzle: "hall-symbols",
      },
      {
        id: "workbench",
        label: "Watchmaker's bench",
        x: 20,
        y: 62,
        look: "Tiny tools laid out with obsessive care. A screwdriver rests in its cradle, handle toward you.",
        take: "screwdriver",
        takeLabel: "Take the screwdriver",
      },
      {
        id: "grate",
        label: "Floor grate",
        x: 24,
        y: 84,
        look: "A brass floor grate, fixed with four stubborn screws. Something metal rattles in the dark beneath it.",
        use: {
          item: "screwdriver",
          text: "Four screws later, the grate lifts. An iron gear sits in the dust, slick with old oil.",
          give: "iron-gear",
          setFlag: "hall-grate",
        },
        afterFlag: {
          flag: "hall-grate",
          look: "The grate is open. The dark beneath it has given up its secret.",
        },
      },
    ],
    puzzles: {
      "hall-symbols": {
        kind: "symbols",
        title: "The symbol cabinet",
        prompt: "Three brass rings. Set the symbols in the clockmaker's order.",
        sequence: ["moon", "star", "sun"],
        successFlag: "hall-cabinet",
        successText: "Three clicks, one after another. The cabinet unfolds. Inside, wrapped in cloth: a brass door handle.",
        give: "brass-handle",
      },
    },
  },
  {
    id: "observatory",
    number: 3,
    name: "The Observatory",
    subtitle: "The last door opens to the sky.",
    intro:
      "Above you, the dome opens on a sky that does not match any map you know. A brass telescope points at nothing in particular. The last mechanism waits beside a sealed door.",
    objective: "Align the rings. Open the dome and escape.",
    exitFlag: "observatory-unlocked",
    doorId: "door",
    palette: "observatory",
    hints: [
      "The telescope cannot focus without its lens. Check the map table.",
      "Fit the lens, then read the star chart again. The sky has three numbers for you.",
      "The rings want 7, then 2, then 9 — hours, minutes, declination.",
      "Set the three rings to 7 · 2 · 9. The dome will do the rest.",
    ],
    hotspots: [
      {
        id: "door",
        label: "Dome door",
        x: 50,
        y: 41,
        look: "A circular pressure door with three numbered rings around the seal. Each ring turns independently. The mechanism has not been touched in years.",
        puzzle: "observatory-rings",
      },
      {
        id: "star-chart",
        label: "Star chart",
        x: 20,
        y: 31,
        look: "A chart of the Vela constellation, pinned open. The coordinates are smudged beyond reading — but there are three clear blanks beside them.",
        afterFlag: {
          flag: "observatory-lens",
          look: "With the telescope focused, the chart makes sense again: Vela. Right ascension 7h 02m. Declination +9°. Three blanks, three numbers.",
        },
      },
      {
        id: "telescope",
        label: "Brass telescope",
        x: 74,
        y: 48,
        look: "A brass refractor aimed at the open dome. The lens housing is empty; someone took the glass out and wrapped it away.",
        use: {
          item: "telescope-lens",
          text: "The lens clicks home. The sky snaps into focus — and the smudged numbers on the chart resolve: 7 · 2 · 9.",
          setFlag: "observatory-lens",
          consume: true,
        },
        afterFlag: {
          flag: "observatory-lens",
          look: "The telescope is whole again. Vela hangs in the eyepiece, bright and exact.",
        },
      },
      {
        id: "desk",
        label: "Map table",
        x: 22,
        y: 67,
        look: "A map table under a drift of paper. The drawer is half open. Inside, something wrapped in velvet catches the light.",
        take: "telescope-lens",
        takeLabel: "Open the velvet wrap",
      },
      {
        id: "armillary",
        label: "Armillary sphere",
        x: 80,
        y: 73,
        look: "A brass armillary sphere, three rings inside three rings. A tiny numeral I is engraved on the outermost band. It turns freely.",
        ambient: true,
      },
    ],
    puzzles: {
      "observatory-rings": {
        kind: "rings",
        title: "The dome door",
        prompt: "Three rings, each marked 0–9. Hours. Minutes. Declination.",
        rings: [7, 2, 9],
        successFlag: "observatory-unlocked",
        successText: "The rings align. Somewhere above you, a great iris begins to open. The door unseals with a breath of night air.",
      },
    },
  },
];

export function getRoom(number: number): RoomDef {
  return ROOMS.find((r) => r.number === number) ?? ROOMS[0];
}
