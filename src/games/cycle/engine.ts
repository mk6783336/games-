import { mulberry32 } from "../../lib/daily";

export type CycleCue = "hop" | "land" | "mote" | "crash" | "clear" | "start";
export type Weather = "pollen" | "wind" | "snow" | "embers" | "rain";

export interface RoadPalette {
  skyTop: string;
  skyBottom: string;
  sun: string;
  glow: string;
  ridgeFar: string;
  ridgeMid: string;
  ridgeNear: string;
  ground: string;
  deep: string;
  edge: string;
  fog: string;
}

export interface RoadDef {
  number: number;
  name: string;
  subtitle: string;
  length: number;
  difficulty: number;
  weather: Weather;
  aurora?: boolean;
  storm?: boolean;
  palette: RoadPalette;
}

export const ROADS: RoadDef[] = [
  {
    number: 1,
    name: "Fern Hollow",
    subtitle: "Soft light, low branches, a first taste of gravel.",
    length: 17_000,
    difficulty: 1,
    weather: "pollen",
    palette: {
      skyTop: "#04121a",
      skyBottom: "#144238",
      sun: "#f4e3ae",
      glow: "rgba(244, 227, 174, 0.22)",
      ridgeFar: "#2f7259",
      ridgeMid: "#12352a",
      ridgeNear: "#081d15",
      ground: "#0a1e15",
      deep: "#030a07",
      edge: "#8fd6a3",
      fog: "#1d4a3c",
    },
  },
  {
    number: 2,
    name: "Ridgeclimb",
    subtitle: "The switchbacks start here. So does the wind.",
    length: 19_000,
    difficulty: 2,
    weather: "wind",
    palette: {
      skyTop: "#060d19",
      skyBottom: "#1d3350",
      sun: "#dce8ff",
      glow: "rgba(220, 232, 255, 0.16)",
      ridgeFar: "#3c5674",
      ridgeMid: "#1d2f45",
      ridgeNear: "#0c1825",
      ground: "#0d1521",
      deep: "#04070d",
      edge: "#a9c4e8",
      fog: "#29405c",
    },
  },
  {
    number: 3,
    name: "Aurora Pass",
    subtitle: "Ride the night sky without losing the trail.",
    length: 21_000,
    difficulty: 3,
    weather: "snow",
    aurora: true,
    palette: {
      skyTop: "#040616",
      skyBottom: "#0e1d3f",
      sun: "#e6f3ff",
      glow: "rgba(120, 200, 255, 0.18)",
      ridgeFar: "#2c467f",
      ridgeMid: "#14224a",
      ridgeNear: "#090f26",
      ground: "#0e1939",
      deep: "#04070f",
      edge: "#cfe2ff",
      fog: "#1b3560",
    },
  },
  {
    number: 4,
    name: "Ember Canyon",
    subtitle: "Hot rock, long drops, no shade anywhere.",
    length: 23_000,
    difficulty: 4,
    weather: "embers",
    palette: {
      skyTop: "#1a0a0c",
      skyBottom: "#4a1a12",
      sun: "#ffb070",
      glow: "rgba(255, 140, 80, 0.22)",
      ridgeFar: "#5c2a1e",
      ridgeMid: "#301311",
      ridgeNear: "#170909",
      ground: "#200c0a",
      deep: "#0a0405",
      edge: "#ff9d5c",
      fog: "#562317",
    },
  },
  {
    number: 5,
    name: "Stormfront",
    subtitle: "The road ends in weather. Bring the bike through.",
    length: 25_000,
    difficulty: 5,
    weather: "rain",
    storm: true,
    palette: {
      skyTop: "#03050b",
      skyBottom: "#111c31",
      sun: "#cfd8ef",
      glow: "rgba(190, 210, 255, 0.12)",
      ridgeFar: "#26324e",
      ridgeMid: "#131a2c",
      ridgeNear: "#070b16",
      ground: "#090e19",
      deep: "#02040a",
      edge: "#c8d4f2",
      fog: "#1c2740",
    },
  },
];

export interface CycleHud {
  score: number;
  coins: number;
  speed: number;
  distance: number;
  progress: number;
  road: number;
  roadName: string;
  roadMs: number;
  roadsCleared: number;
}

export interface CycleClear {
  road: number;
  timeMs: number;
  totalMs: number;
  roadsCleared: number;
}

export interface CycleSummary {
  score: number;
  collectedCoins: number;
  distance: number;
  durationMs: number;
  road: number;
  roadName: string;
  cleared: boolean;
  roadsCleared: number;
  splits: { road: number; timeMs: number }[];
}

export interface CycleCallbacks {
  onHud: (hud: CycleHud) => void;
  onRoadClear: (clear: CycleClear) => void;
  onEnd: (summary: CycleSummary) => void;
  onCue: (cue: CycleCue) => void;
}

const STEP = 8;
const BASE_RATIO = 0.76;
const MAX_H = 208;
const MIN_H = -8;

interface Rock {
  x: number;
  height: number;
  width: number;
  base: number;
}

interface Mote {
  x: number;
  y: number;
  phase: number;
  taken: boolean;
}

interface Span {
  road: number;
  start: number;
  gate: number;
  cleared: boolean;
}

interface World {
  heights: number[];
  gaps: Uint8Array;
  rocks: Rock[];
  motes: Mote[];
  spans: Span[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

interface WeatherPart {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  alpha: number;
}

type Phase = "idle" | "riding" | "paused" | "crash" | "finish";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function clampHeight(h: number) {
  return clamp(h, MIN_H, MAX_H);
}

function buildWorld(fromRoad: number, seed: number): World {
  const heights: number[] = [];
  const gaps: number[] = [];
  const rocks: Rock[] = [];
  const motes: Mote[] = [];
  const spans: Span[] = [];

  let height = 34;
  let cursor = 0;

  for (let road = fromRoad; road < ROADS.length; road++) {
    const def = ROADS[road];
    const rng = mulberry32((seed ^ Math.imul(road + 1, 0x9e3779b1)) >>> 0);
    const diff = def.difficulty;
    const startIndex = cursor;
    const totalSamples = Math.ceil(def.length / STEP);
    const endGuard = startIndex + totalSamples - Math.floor(300 / STEP);

    // A straight run-in: nothing to hit before the camera settles.
    const runIn = Math.floor(300 / STEP);
    for (let k = 0; k < runIn; k++) {
      heights.push(height);
      gaps.push(0);
      cursor++;
    }

    let featureCount = 0;
    let restUntil = 0;
    while (cursor < endGuard) {
      if (cursor < restUntil) {
        heights.push(height);
        gaps.push(0);
        cursor++;
        continue;
      }
      featureCount += 1;
      // Give the rider a real run-in: the first three features are always
      // rollers and ramps, so no one dies before they have read the road.
      const roll = featureCount <= 3 ? (featureCount === 2 ? 0.5 : 0.12) : rng();
      if (roll < 0.34) {
        // A hill that returns to the same elevation: the pump for speed.
        const before = height;
        const len = Math.round(28 + rng() * 34);
        const peak = clampHeight(before + (rng() < 0.5 ? 1 : -1) * (38 + rng() * 86) * (0.75 + diff * 0.13));
        for (let k = 0; k < len && cursor < endGuard; k++) {
          const t = k / Math.max(1, len - 1);
          const eased = 0.5 - 0.5 * Math.cos(Math.PI * 2 * t);
          heights.push(before + (peak - before) * eased);
          gaps.push(0);
          cursor++;
        }
        height = before;
      } else if (roll < 0.64) {
        // A climb or a descent: the elevation carries into the next feature.
        const before = height;
        const len = Math.round(18 + rng() * 26);
        const up = rng() < 0.54;
        const target = clampHeight(before + (up ? 1 : -1) * (52 + rng() * 104) * (0.72 + diff * 0.1));
        for (let k = 0; k < len && cursor < endGuard; k++) {
          const t = k / Math.max(1, len - 1);
          const eased = t * t * (3 - 2 * t);
          heights.push(before + (target - before) * eased);
          gaps.push(0);
          cursor++;
        }
        height = target;
      } else if (roll < 0.8 && featureCount > 3) {
        // A chasm. The landing is always a touch lower than the take-off.
        const flat = 8 + Math.floor(rng() * 5);
        for (let k = 0; k < flat && cursor < endGuard; k++) {
          heights.push(height);
          gaps.push(0);
          cursor++;
        }
        const width = Math.round(6 + rng() * (6 + diff));
        for (let k = 0; k < width && cursor < endGuard; k++) {
          heights.push(height - 60);
          gaps.push(1);
          cursor++;
        }
        height = clampHeight(height - 8);
        for (let k = 0; k < 4 && cursor < endGuard; k++) {
          heights.push(height);
          gaps.push(0);
          cursor++;
        }
        restUntil = cursor + 38;
      } else {
        // A rocky flat: one rock, never a second hop straight after the landing.
        const before = height;
        const len = 34 + Math.floor(rng() * 26);
        for (let k = 0; k < len && cursor < endGuard; k++) {
          const wobble = Math.sin((cursor + k) * 0.45) * 2.2;
          heights.push(clampHeight(before + wobble));
          gaps.push(0);
          cursor++;
        }
        const at = cursor - len + 9 + Math.floor(rng() * Math.max(6, len - 18));
        rocks.push({
          x: at * STEP,
          width: 20 + rng() * 16,
          height: 15 + rng() * 18 * (0.85 + diff * 0.12),
          base: heights[at] ?? height,
        });
        restUntil = cursor + 38;
      }
    }

    while (cursor < startIndex + totalSamples) {
      heights.push(height);
      gaps.push(0);
      cursor++;
    }

    const roadStartX = startIndex * STEP;
    const gateX = cursor * STEP;
    for (let mx = roadStartX + 130; mx < gateX - 90; mx += 135 + rng() * 95) {
      const idx = clamp(Math.round(mx / STEP), 0, heights.length - 1);
      motes.push({
        x: mx,
        y: heights[idx] + 34 + rng() * 70,
        phase: rng() * Math.PI * 2,
        taken: false,
      });
    }

    spans.push({ road: def.number, start: roadStartX, gate: gateX, cleared: false });
  }

  return { heights, gaps: new Uint8Array(gaps), rocks, motes, spans };
}

export class CycleGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: CycleCallbacks;
  private raf = 0;
  private last = 0;
  private ro: ResizeObserver | null = null;

  private W = 900;
  private H = 540;
  private base = 410;
  private dpr = 1;

  private phase: Phase = "idle";
  private world: World | null = null;
  private previewRoad = 0;

  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private grounded = true;
  private coyote = 0;
  private tuck = false;
  private camX = 0;
  private camLift = 0;

  private runElapsed = 0;
  private roadStart = 0;
  private roadIndex = 0;
  private cleared = 0;
  private score = 0;
  private motes = 0;
  private startX = 0;
  private splits: { road: number; timeMs: number }[] = [];

  private crashTimer = 0;
  private crashSpin = 0;
  private finishTimer = 0;
  private shake = 0;
  private hudTimer = 0;
  private ended = false;

  private particles: Particle[] = [];
  private dustTimer = 0;
  private weather: WeatherPart[] = [];
  private weatherRoad = -1;
  private weatherClock = 0;
  private lightning = 0;
  private lightningTimer = 6;

  constructor(canvas: HTMLCanvasElement, callbacks: CycleCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.cb = callbacks;
    this.resize();
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);

    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas.parentElement ?? canvas);
    }
  }

  resize() {
    const rect = (this.canvas.parentElement ?? this.canvas).getBoundingClientRect();
    const w = Math.max(320, rect.width);
    const h = Math.max(280, rect.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = w;
    this.H = h;
    this.base = h * BASE_RATIO;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.weather = [];
    this.weatherRoad = -1;
  }

  /** A scenic, still frame behind the level select. */
  preview(roadNumber: number) {
    const idx = clamp(roadNumber, 1, ROADS.length) - 1;
    this.previewRoad = idx;
    this.phase = "idle";
    this.world = buildWorld(idx, 20261);
    this.roadIndex = 0;
    this.camX = 60;
    const span = this.world.spans[0];
    const focus = span.start + 420;
    this.camLift = this.hAt(focus) * 0.68;
    this.x = focus;
    this.y = this.hAt(focus);
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.weather = [];
    this.weatherRoad = -1;
    this.emitHud(true);
  }

  start(roadNumber: number, seed: number) {
    const idx = clamp(roadNumber, 1, ROADS.length) - 1;
    this.world = buildWorld(idx, seed >>> 0);
    this.roadIndex = 0;
    this.startX = this.world.spans[0].start + 30;
    this.x = this.startX;
    this.y = this.hAt(this.x);
    this.vx = 230;
    this.vy = 0;
    this.grounded = true;
    this.coyote = 0;
    this.tuck = false;
    this.camX = this.x - this.W * 0.33;
    this.camLift = this.y * 0.68;
    this.runElapsed = 0;
    this.roadStart = 0;
    this.cleared = 0;
    this.score = 0;
    this.motes = 0;
    this.splits = [];
    this.crashTimer = 0;
    this.crashSpin = 0;
    this.finishTimer = 0;
    this.shake = 0;
    this.hudTimer = 0;
    this.ended = false;
    this.particles = [];
    this.dustTimer = 0;
    this.lightning = 0;
    this.lightningTimer = 6;
    this.weather = [];
    this.weatherRoad = -1;

    for (const span of this.world.spans) span.cleared = false;
    this.phase = "riding";
    this.emitHud(true);
    this.cb.onCue("start");
  }

  pause() {
    if (this.phase === "riding") this.phase = "paused";
  }

  resume() {
    if (this.phase === "paused") {
      this.phase = "riding";
      this.last = performance.now();
    }
  }

  hop() {
    if (this.phase !== "riding") return;
    if (!this.grounded && this.coyote <= 0) return;
    this.vy = 500;
    this.grounded = false;
    this.coyote = 0;
    this.burst(this.x, this.y + 4, 6, "#d8dee9", 0.5);
    this.cb.onCue("hop");
  }

  setTuck(active: boolean) {
    this.tuck = active;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
  }

  private loop(now: number) {
    const dt = Math.min(0.045, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }

  private get calm() {
    return typeof document !== "undefined" && document.documentElement.dataset.reducedMotion === "true";
  }

  private currentRoad(): RoadDef {
    const world = this.world;
    if (!world) return ROADS[this.previewRoad];
    return ROADS[world.spans[this.roadIndex]?.road - 1] ?? ROADS[this.previewRoad];
  }

  private hAt(x: number): number {
    const world = this.world;
    if (!world || world.heights.length === 0) return 0;
    const raw = x / STEP;
    const i = Math.floor(raw);
    if (i < 0) return world.heights[0];
    if (i >= world.heights.length - 1) return world.heights[world.heights.length - 1];
    const t = raw - i;
    return world.heights[i] * (1 - t) + world.heights[i + 1] * t;
  }

  private isGap(x: number): boolean {
    const world = this.world;
    if (!world) return false;
    const i = Math.floor(x / STEP);
    if (i < 0 || i >= world.gaps.length) return false;
    return world.gaps[i] === 1;
  }

  private slopeAt(x: number): number {
    return (this.hAt(x + 12) - this.hAt(x - 12)) / 24;
  }

  private update(dt: number) {
    this.weatherClock += dt;
    this.shake *= 0.9;
    this.lightning = Math.max(0, this.lightning - dt * 1.8);

    if (this.phase === "idle") {
      this.updateWeather(dt, this.currentRoad());
      return;
    }

    if (this.phase === "paused") {
      this.updateParticles(dt);
      return;
    }

    if (this.phase === "crash") {
      this.crashTimer -= dt;
      this.crashSpin += dt * 7;
      this.vy -= 1300 * dt;
      this.y += this.vy * dt;
      this.x += this.vx * dt * 0.35;
      this.vx *= 0.985;
      this.updateParticles(dt);
      this.updateWeather(dt, this.currentRoad());
      if (this.crashTimer <= 0 && !this.ended) {
        this.ended = true;
        this.cb.onEnd(this.summary(false));
      }
      return;
    }

    if (this.phase === "finish") {
      this.finishTimer -= dt;
      this.vx *= 0.985;
      this.x += this.vx * dt;
      this.y = this.hAt(this.x);
      const ease = 1 - Math.exp(-dt * 5);
      this.camX += (this.x - this.W * 0.33 - this.camX) * ease;
      this.camLift += (this.y * 0.68 - this.camLift) * ease * 0.8;
      this.updateParticles(dt);
      this.updateWeather(dt, this.currentRoad());
      this.emitHud();
      if (this.finishTimer <= 0 && !this.ended) {
        this.ended = true;
        this.cb.onEnd(this.summary(true));
      }
      return;
    }

    const world = this.world;
    if (!world) return;
    const span = world.spans[this.roadIndex];
    const road = this.currentRoad();
    const slope = this.slopeAt(this.x);

    this.runElapsed += dt;

    if (this.phase === "riding") {
      // Speed: gravity on the grade, the rider's legs, a tucked chest.
      const target = clamp(
        292 + road.difficulty * 6 + (this.grounded ? -slope * 780 : 60) + (this.tuck ? 44 : 0),
        150,
        660,
      );
      if (this.grounded) {
        this.vx += (target - this.vx) * Math.min(1, dt * 2.7);
      } else {
        this.vx += (target - this.vx) * Math.min(1, dt * 0.32);
      }

      if (!this.grounded) {
        this.vy -= (this.tuck ? 2600 : 1500) * dt;
        this.y += this.vy * dt;
      }

      this.x += this.vx * dt;
      this.coyote = this.grounded ? 0.1 : Math.max(0, this.coyote - dt);

      const nowGround = this.isGap(this.x) ? null : this.hAt(this.x);
      if (nowGround == null) {
        this.grounded = false;
      } else if (this.y <= nowGround + 0.5) {
        if (!this.grounded && this.vy < -140) {
          const landing = clamp(-this.vy * 0.14, 0, 150);
          const onDownhill = this.slopeAt(this.x) < -0.04;
          this.vx = Math.max(150, this.vx - landing * (onDownhill ? 0.35 : 1));
          this.shake = Math.min(7, -this.vy * 0.012);
          this.burst(this.x - 10, nowGround + 2, 9, road.palette.edge, 0.55);
          this.cb.onCue("land");
        }
        this.y = nowGround;
        this.vy = 0;
        this.grounded = true;
      } else {
        this.grounded = false;
      }

      if (this.tuck && this.grounded) this.vx += 26 * dt;

      if (this.y < -140) {
        this.crash();
        return;
      }

      // Rock contact: wheels hit anything below the crown.
      for (const rock of world.rocks) {
        if (Math.abs(rock.x - this.x) > rock.width * 0.5 + 16) continue;
        const top = rock.base + rock.height;
        if (this.y < top) {
          this.crash();
          return;
        }
      }

      // Motes.
      for (const mote of world.motes) {
        if (mote.taken) continue;
        if (Math.abs(mote.x - this.x) > 26) continue;
        if (Math.abs(mote.y - this.y) > 66) continue;
        mote.taken = true;
        this.motes += 1;
        this.burst(mote.x, mote.y, 7, road.palette.edge, 0.4);
        this.cb.onCue("mote");
      }

      // Dust from the back wheel.
      this.dustTimer -= dt;
      if (this.grounded && this.vx > 240 && this.dustTimer <= 0) {
        this.dustTimer = this.calm ? 0.24 : 0.09;
        this.particles.push({
          x: this.x - 16,
          y: this.y + 2,
          vx: -40 - Math.random() * 70,
          vy: 12 + Math.random() * 32,
          life: 0,
          max: 0.45 + Math.random() * 0.3,
          size: 2 + Math.random() * 3,
          color: road.palette.edge,
        });
      }

      // Passing the gate: bank the split, then carry on into the next road.
      if (span && this.x >= span.gate) {
        span.cleared = true;
        const timeMs = Math.round((this.runElapsed - this.roadStart) * 1000);
        this.splits.push({ road: span.road, timeMs });
        this.cleared += 1;
        this.roadStart = this.runElapsed;
        this.roadIndex = Math.min(this.roadIndex + 1, world.spans.length - 1);
        this.cb.onCue("clear");
        this.emitHud(true);
        this.cb.onRoadClear({
          road: span.road,
          timeMs,
          totalMs: Math.round(this.runElapsed * 1000),
          roadsCleared: this.cleared,
        });
        if (span.road === ROADS[ROADS.length - 1].number) {
          this.phase = "finish";
          this.finishTimer = 1.15;
        }
      }
    }

    // Distance and motes form the base score; clearing a road pays its bonus on top.
    const travelled = Math.max(0, this.x - this.startX);
    this.score = Math.floor(travelled * 0.35) + this.motes * 12;

    // Camera: follow with a little lag, and lift with the grade only partly so
    // climbs still read as climbs.
    const camTarget = this.x - this.W * 0.33;
    const liftTarget = this.hAt(this.x) * 0.68;
    const ease = 1 - Math.exp(-dt * 5);
    this.camX += (camTarget - this.camX) * ease;
    this.camLift += (liftTarget - this.camLift) * ease * 0.8;

    this.updateParticles(dt);
    this.updateWeather(dt, road);

    if (road.storm) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 5 + Math.random() * 7;
        if (!this.calm) this.lightning = 0.3;
      }
    }

    this.emitHud();
  }

  private clearBonus() {
    const world = this.world;
    if (!world) return 0;
    let total = 0;
    for (const span of world.spans) {
      if (span.cleared) total += 260 + span.road * 110;
    }
    return total;
  }

  private crash() {
    if (this.phase !== "riding") return;
    this.phase = "crash";
    this.crashTimer = 1.05;
    this.crashSpin = 0;
    this.vy = 220;
    this.shake = 13;
    const road = this.currentRoad();
    this.burst(this.x, this.y, 22, road.palette.edge, 1);
    this.burst(this.x, this.y, 12, "#f4f5ff", 0.8);
    this.cb.onCue("crash");
  }

  private summary(cleared: boolean): CycleSummary {
    const road = this.currentRoad();
    const world = this.world;
    const span = world?.spans[this.roadIndex];
    return {
      score: Math.floor(this.score + this.clearBonus()),
      collectedCoins: this.motes,
      distance: Math.floor(Math.max(0, this.x - this.startX) / 20),
      durationMs: Math.round(this.runElapsed * 1000),
      road: span?.road ?? road.number,
      roadName: road.name,
      cleared,
      roadsCleared: this.cleared,
      splits: this.splits,
    };
  }

  private burst(x: number, y: number, count: number, color: string, power: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = (40 + Math.random() * 150) * power;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0,
        max: 0.4 + Math.random() * 0.6,
        size: 1.5 + Math.random() * 3.5,
        color,
      });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 60 * dt;
      p.vx *= 0.98;
    }
    this.particles = this.particles.filter((p) => p.life < p.max).slice(-120);
  }

  private updateWeather(dt: number, road: RoadDef) {
    if (this.weatherRoad !== road.number) {
      this.weatherRoad = road.number;
      this.weather = this.makeWeather(road);
    }
    const { W, H } = this;
    for (const p of this.weather) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (road.weather === "snow") p.x += Math.sin(this.weatherClock * 0.8 + p.phase) * 14 * dt;
      if (road.weather === "embers") p.vx += Math.sin(this.weatherClock * 1.6 + p.phase) * 20 * dt;
      if (p.y > H + 24) {
        p.y = -20;
        p.x = Math.random() * W;
      }
      if (p.y < -24) {
        p.y = H + 16;
        p.x = Math.random() * W;
      }
      if (p.x > W + 24) p.x = -20;
      if (p.x < -24) p.x = W + 20;
    }
  }

  private makeWeather(road: RoadDef): WeatherPart[] {
    const count = this.calm ? 24 : road.storm ? 96 : 56;
    const parts: WeatherPart[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.W;
      const y = Math.random() * this.H;
      switch (road.weather) {
        case "pollen":
          parts.push({ x, y, vx: 6 + Math.random() * 12, vy: -4 - Math.random() * 8, size: 1 + Math.random() * 1.8, phase: Math.random() * 6.28, alpha: 0.2 + Math.random() * 0.4 });
          break;
        case "wind":
          parts.push({ x, y, vx: 210 + Math.random() * 190, vy: 6 + Math.random() * 26, size: 0.8 + Math.random() * 1.2, phase: Math.random() * 6.28, alpha: 0.08 + Math.random() * 0.16 });
          break;
        case "snow":
          parts.push({ x, y, vx: -16 - Math.random() * 22, vy: 30 + Math.random() * 55, size: 1.2 + Math.random() * 2.4, phase: Math.random() * 6.28, alpha: 0.3 + Math.random() * 0.5 });
          break;
        case "embers":
          parts.push({ x, y: this.H, vx: -20 + Math.random() * 40, vy: -40 - Math.random() * 90, size: 1 + Math.random() * 2.6, phase: Math.random() * 6.28, alpha: 0.3 + Math.random() * 0.6 });
          break;
        case "rain":
          parts.push({ x, y, vx: -150 - Math.random() * 90, vy: 420 + Math.random() * 260, size: 8 + Math.random() * 16, phase: Math.random() * 6.28, alpha: 0.1 + Math.random() * 0.22 });
          break;
      }
    }
    return parts;
  }

  private emitHud(force = false) {
    if (!force) {
      this.hudTimer += 1;
      if (this.hudTimer % 6 !== 0) return;
    }
    const world = this.world;
    const span = world?.spans[this.roadIndex];
    const road = this.currentRoad();
    const progress = span ? clamp((this.x - span.start) / Math.max(1, span.gate - span.start), 0, 1) : 0;
    this.cb.onHud({
      score: Math.floor(this.score + this.clearBonus()),
      coins: this.motes,
      speed: Math.round(this.vx * 0.18),
      distance: Math.floor(Math.max(0, this.x - this.startX) / 20),
      progress,
      road: span?.road ?? road.number,
      roadName: road.name,
      roadMs: Math.round((this.runElapsed - this.roadStart) * 1000),
      roadsCleared: this.cleared,
    });
  }

  // ---------------------------------------------------------------- drawing

  private draw() {
    const { ctx, W, H } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const road = this.currentRoad();
    const p = road.palette;
    const shakeX = this.shake > 0.2 && !this.calm ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake > 0.2 && !this.calm ? (Math.random() - 0.5) * this.shake : 0;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, p.skyTop);
    sky.addColorStop(0.7, p.skyBottom);
    sky.addColorStop(1, p.skyTop);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawStars(road);
    if (road.aurora) this.drawAurora();
    this.drawSun(road);
    this.drawRidges(road);
    this.drawTreeline(road);
    this.drawHorizon(p);
    this.drawGates(road);
    this.drawTerrain(road);
    this.drawRocks(road);
    this.drawMotes(road);
    this.drawRider(road);
    this.drawParticles();
    this.drawWeather(road);
    this.drawSpeedLines(road);
    ctx.restore();

    // Vignette and horizon haze push the eye to the rider.
    const haze = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.78);
    haze.addColorStop(0, "transparent");
    haze.addColorStop(1, `${p.fog}22`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, W, H);

    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.46, H * 0.28, W * 0.5, H * 0.48, H * 0.86);
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.32)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    if (this.lightning > 0) {
      ctx.fillStyle = `rgba(200, 220, 255, ${this.lightning * 0.9})`;
      ctx.fillRect(0, 0, W, H);
      if (this.lightning > 0.18) this.drawBolt();
    }
  }

  private drawStars(road: RoadDef) {
    const { ctx, W, H } = this;
    const tint = road.storm ? "#dfe8ff" : "#e8f4ff";
    ctx.save();
    for (let i = 0; i < 54; i++) {
      const x = (hash01(i * 3.7) * W * 1.4 - this.camX * 0.02) % (W + 60) - 30;
      const y = hash01(i * 8.3) * H * 0.5;
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(this.weatherClock * (0.4 + hash01(i) * 0.5) + i));
      ctx.globalAlpha = twinkle * (road.storm ? 0.25 : 0.6);
      ctx.fillStyle = tint;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.restore();
  }

  private drawAurora() {
    const { ctx, W, H } = this;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = "blur(18px)";
    for (let band = 0; band < 4; band++) {
      const top = H * (0.055 + band * 0.052);
      const amp = H * (0.05 + band * 0.014);
      const grad = ctx.createLinearGradient(0, top - amp, 0, top + H * 0.17);
      grad.addColorStop(0, "rgba(56, 189, 248, 0)");
      grad.addColorStop(0.42, band % 2 === 0 ? "rgba(56, 189, 248, 0.22)" : "rgba(139, 92, 246, 0.2)");
      grad.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-20, top);
      for (let x = -20; x <= W + 20; x += 18) {
        const wave = Math.sin(x * 0.005 + this.weatherClock * 0.1 + band * 1.6) * amp;
        const wave2 = Math.sin(x * 0.012 - this.weatherClock * 0.07 + band) * amp * 0.45;
        ctx.lineTo(x, top + wave + wave2);
      }
      ctx.lineTo(W + 20, top + H * 0.2);
      ctx.lineTo(-20, top + H * 0.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.filter = "none";
    ctx.restore();
  }

  private drawSun(road: RoadDef) {
    const { ctx, W, H } = this;
    const p = road.palette;
    const cx = W * 0.74 - this.camX * 0.015;
    const cy = H * 0.21 + this.camLift * 0.04;
    const radius = road.aurora ? H * 0.032 : road.storm ? H * 0.02 : H * 0.038;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.42);
    glow.addColorStop(0, p.glow);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = p.sun;
    ctx.globalAlpha = road.storm ? 0.28 : 0.86;
    ctx.fill();
    ctx.globalAlpha = 1;
    if (road.aurora) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(207, 226, 255, 0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private ridgeOffset(layer: number): number {
    const base = [0.46, 0.585, 0.72][layer];
    return this.H * base - this.camLift * (0.06 + layer * 0.05);
  }

  private ridgeY(worldX: number, layer: number): number {
    const freq = [0.0011, 0.0017, 0.0027][layer];
    const amp = [0.105, 0.08, 0.05][layer] * this.H;
    const seedA = layer * 2.4 + 1.2;
    return (
      this.ridgeOffset(layer) +
      Math.sin(worldX * freq + seedA) * amp * 0.55 +
      Math.sin(worldX * freq * 2.3 + seedA * 1.7) * amp * 0.3 +
      Math.sin(worldX * freq * 0.47 + seedA * 0.6) * amp * 0.5
    );
  }

  private drawRidges(road: RoadDef) {
    const { ctx, W, H } = this;
    const colors = [road.palette.ridgeFar, road.palette.ridgeMid, road.palette.ridgeNear];
    const factors = [0.1, 0.22, 0.4];
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      ctx.moveTo(-10, H + 4);
      for (let sx = -10; sx <= W + 24; sx += 20) {
        const wx = this.camX * factors[layer] + sx;
        ctx.lineTo(sx, this.ridgeY(wx, layer));
      }
      ctx.lineTo(W + 24, H + 4);
      ctx.closePath();
      ctx.fillStyle = colors[layer];
      ctx.fill();

      if (layer === 1 && (road.number === 1 || road.number === 2)) this.drawPines(road, factors[layer]);
    }
  }

  private drawHorizon(p: RoadPalette) {
    const { ctx, W, H } = this;
    const haze = ctx.createLinearGradient(0, H * 0.46, 0, H * 0.82);
    haze.addColorStop(0, "rgba(0, 0, 0, 0)");
    haze.addColorStop(0.55, `${p.fog}2e`);
    haze.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, H * 0.44, W, H * 0.4);
  }

  private drawTreeline(road: RoadDef) {
    const { ctx, W, H } = this;
    const factor = 0.56;
    const base = H * 0.87 - this.camLift * 0.16;
    const spacing = road.number <= 2 ? 48 : 66;
    const start = Math.floor((this.camX * factor - 100) / spacing) * spacing;
    ctx.save();
    ctx.fillStyle = road.palette.ridgeNear;
    for (let wx = start; wx < this.camX * factor + W + 100; wx += spacing) {
      const r = hash01(wx * 0.013 + road.number * 3.1);
      const sx = wx - this.camX * factor;
      if (road.number <= 2) {
        const height = 46 + r * 78;
        const width = height * 0.27;
        ctx.beginPath();
        ctx.moveTo(sx, base - height);
        ctx.lineTo(sx + width, base + 22);
        ctx.lineTo(sx - width, base + 22);
        ctx.closePath();
        ctx.fill();
        if (r > 0.7) {
          const small = height * 0.55;
          ctx.beginPath();
          ctx.moveTo(sx + width * 1.5, base - small);
          ctx.lineTo(sx + width * 1.5 + small * 0.27, base + 22);
          ctx.lineTo(sx + width * 1.5 - small * 0.27, base + 22);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        const height = 56 + r * 96;
        const width = height * (0.3 + r * 0.14);
        ctx.beginPath();
        ctx.moveTo(sx - width, base + 18);
        ctx.lineTo(sx - width * 0.18, base - height);
        ctx.lineTo(sx + width * 0.22, base - height * 0.66);
        ctx.lineTo(sx + width, base + 18);
        ctx.closePath();
        ctx.fill();
        if (road.number === 3 && r > 0.45) {
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = "#dfeeff";
          ctx.beginPath();
          ctx.moveTo(sx - width * 0.18, base - height);
          ctx.lineTo(sx - width * 0.02, base - height * 0.82);
          ctx.lineTo(sx - width * 0.3, base - height * 0.78);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = road.palette.ridgeNear;
        }
      }
    }
    ctx.restore();
  }

  private drawPines(road: RoadDef, factor: number) {
    const { ctx, W } = this;
    const spacing = road.number === 1 ? 84 : 126;
    const start = Math.floor((this.camX * factor - 80) / spacing) * spacing;
    ctx.save();
    ctx.fillStyle = road.palette.ridgeNear;
    for (let wx = start; wx < this.camX * factor + W + 80; wx += spacing) {
      const r = hash01(wx * 0.021 + road.number);
      if (r < 0.28) continue;
      const sx = wx - this.camX * factor;
      const ground = this.ridgeY(wx, 1) + 6;
      const height = 26 + r * 58;
      const width = height * 0.3;
      ctx.beginPath();
      ctx.moveTo(sx, ground - height);
      ctx.lineTo(sx + width, ground);
      ctx.lineTo(sx - width, ground);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx, ground - height * 0.58);
      ctx.lineTo(sx + width * 0.78, ground + 2);
      ctx.lineTo(sx - width * 0.78, ground + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawGates(road: RoadDef) {
    const { ctx, W } = this;
    const world = this.world;
    if (!world) return;
    for (const span of world.spans) {
      const gx = span.gate - this.camX;
      if (gx < -140 || gx > W + 140) continue;
      const ground = this.hAt(span.gate);
      const gy = this.base - (ground - this.camLift);
      const top = gy - 100;
      const color = span.cleared ? "#f5c45a" : road.palette.edge;
      ctx.save();
      ctx.globalAlpha = span.cleared ? 0.55 : 0.9;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx - 46, gy);
      ctx.lineTo(gx - 46, top);
      ctx.moveTo(gx + 46, gy);
      ctx.lineTo(gx + 46, top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx - 52, top);
      ctx.lineTo(gx + 52, top);
      ctx.stroke();
      // start/finish pennants
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? color : "rgba(244, 245, 255, 0.75)";
        ctx.fillRect(gx - 46 + i * 23, top + 2, 11, 7);
      }
      ctx.fillStyle = color;
      ctx.font = "700 11px Sora, Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(span.road).padStart(2, "0"), gx, top - 12);
      ctx.restore();
    }
  }

  private drawTerrain(road: RoadDef) {
    const { ctx, W, H } = this;
    const world = this.world;
    if (!world) return;
    const p = road.palette;
    const from = Math.max(0, Math.floor((this.camX - 80) / STEP));
    const to = Math.min(world.heights.length - 1, Math.ceil((this.camX + W + 80) / STEP));

    const fill = ctx.createLinearGradient(0, this.base - 240, 0, H);
    fill.addColorStop(0, p.ground);
    fill.addColorStop(1, p.deep);

    let i = from;
    while (i <= to) {
      if (world.gaps[i]) {
        i++;
        continue;
      }
      const startI = i;
      while (i <= to && !world.gaps[i]) i++;
      const endI = i - 1;

      const sx = (k: number) => k * STEP - this.camX;
      const sy = (k: number) => this.base - (world.heights[k] - this.camLift);

      ctx.beginPath();
      ctx.moveTo(sx(startI), sy(startI));
      for (let k = startI + 1; k <= endI; k++) ctx.lineTo(sx(k), sy(k));
      ctx.lineTo(sx(endI), H + 12);
      ctx.lineTo(sx(startI), H + 12);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // The trail bed: a wide strip of lighter earth under the edge line,
      // so the road reads as a surface rather than a cut-out silhouette.
      ctx.beginPath();
      ctx.moveTo(sx(startI), sy(startI));
      for (let k = startI + 1; k <= endI; k++) ctx.lineTo(sx(k), sy(k));
      ctx.strokeStyle = p.ridgeMid;
      ctx.lineWidth = 13;
      ctx.globalAlpha = 0.75;
      ctx.stroke();

      ctx.strokeStyle = p.edge;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;

      this.drawTerrainTexture(road, startI, endI);
      i++;
    }
  }

  private drawTerrainTexture(road: RoadDef, startI: number, endI: number) {
    const { ctx } = this;
    const world = this.world;
    if (!world) return;
    const p = road.palette;
    const sx = (k: number) => k * STEP - this.camX;
    const sy = (k: number) => this.base - (world.heights[k] - this.camLift);

    ctx.save();
    if (road.number === 1) {
      ctx.strokeStyle = p.edge;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.2;
      for (let k = startI; k <= endI; k += 4) {
        const r = hash01(k * 1.7);
        if (r < 0.52) continue;
        const x = sx(k);
        const y = sy(k);
        const h = 4 + r * 9;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2.5, y - h);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 1, y - h * 0.8);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 4, y - h * 0.55);
        ctx.stroke();
      }
    } else if (road.number === 2) {
      ctx.fillStyle = p.edge;
      ctx.globalAlpha = 0.18;
      for (let k = startI; k <= endI; k += 3) {
        const r = hash01(k * 2.3);
        if (r < 0.55) continue;
        ctx.fillRect(sx(k) + r * 6, sy(k) + 6 + r * 16, 1.8, 1.2);
      }
    } else if (road.number === 3) {
      ctx.strokeStyle = "#e8f4ff";
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 2.4;
      for (let k = startI; k <= endI; k += 2) {
        if (k % 8 === 0) {
          ctx.beginPath();
          ctx.moveTo(sx(k), sy(k) + 1);
          ctx.lineTo(sx(k + 1), sy(k + 1) + 1);
          ctx.stroke();
        }
      }
    } else if (road.number === 4) {
      ctx.strokeStyle = "#ff9d5c";
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      for (let k = startI; k <= endI; k += 5) {
        const r = hash01(k * 3.1);
        if (r < 0.5) continue;
        const x = sx(k);
        const y = sy(k) + 5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 6, y + 9 + r * 8);
        ctx.lineTo(x + 3, y + 16 + r * 10);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = "#c8d4f2";
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1.6;
      for (let k = startI; k <= endI; k += 6) {
        if (hash01(k * 1.3) < 0.5) continue;
        ctx.beginPath();
        ctx.moveTo(sx(k), sy(k) + 7);
        ctx.lineTo(sx(k) + 18, sy(k) + 7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawRocks(road: RoadDef) {
    const { ctx, W } = this;
    const world = this.world;
    if (!world) return;
    for (const rock of world.rocks) {
      const sx = rock.x - this.camX;
      if (sx < -60 || sx > W + 60) continue;
      const baseY = this.base - (rock.base - this.camLift);
      ctx.save();
      ctx.fillStyle = road.palette.ridgeNear;
      ctx.strokeStyle = road.palette.edge;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(sx - rock.width / 2, baseY + 1);
      ctx.lineTo(sx - rock.width * 0.32, baseY - rock.height * 0.72);
      ctx.lineTo(sx - rock.width * 0.05, baseY - rock.height);
      ctx.lineTo(sx + rock.width * 0.3, baseY - rock.height * 0.66);
      ctx.lineTo(sx + rock.width / 2, baseY + 1);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawMotes(road: RoadDef) {
    const { ctx, W } = this;
    const world = this.world;
    if (!world) return;
    const t = this.weatherClock;
    for (const mote of world.motes) {
      if (mote.taken) continue;
      const sx = mote.x - this.camX;
      if (sx < -30 || sx > W + 30) continue;
      const sy = this.base - (mote.y - this.camLift) + Math.sin(t * 2 + mote.phase) * 5;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(t * 0.9 + mote.phase);
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = road.palette.edge;
      ctx.fillRect(-9, -9, 18, 18);
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = "#f5f8ff";
      ctx.fillRect(-3.4, -3.4, 6.8, 6.8);
      ctx.restore();
    }
  }

  private drawRider(road: RoadDef) {
    const { ctx } = this;
    const screenX = this.phase === "idle" ? this.W * 0.42 : this.x - this.camX;
    const height = this.phase === "idle" ? this.hAt(this.camX + this.W * 0.42) : this.y;
    const py = this.base - (height - this.camLift);

    const slope = this.phase === "idle" ? 0 : this.slopeAt(this.x);
    let angle = -Math.atan(slope);
    if (!this.grounded && this.phase === "riding") angle += clamp(this.vy * 0.0005, -0.2, 0.2);
    if (this.phase === "crash") angle += this.crashSpin;
    if (this.phase === "finish") angle *= 0.3;

    const R = clamp(this.H * 0.03, 10, 17);
    const ink = "#f4f5ff";
    const accent = road.palette.edge;
    const tyre = "#05070d";

    ctx.save();
    ctx.translate(screenX, py);
    ctx.rotate(angle);

    // soft contact shadow only when the wheels are on the ground
    if (this.grounded || this.phase === "idle") {
      ctx.save();
      ctx.translate(R * 1.45, 0);
      ctx.rotate(-angle);
      ctx.scale(1, 0.18);
      const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 2.6);
      shadow.addColorStop(0, "rgba(0, 0, 0, 0.45)");
      shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.arc(0, 0, R * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const wheelSpin = this.phase === "idle" ? this.weatherClock * 2.2 : this.x / Math.max(1, R);
    for (const wx of [0, R * 2.9]) {
      ctx.beginPath();
      ctx.arc(wx, -R, R, 0, Math.PI * 2);
      ctx.strokeStyle = tyre;
      ctx.lineWidth = R * 0.3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(wx, -R, R * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      for (let s = 0; s < 6; s++) {
        const a = wheelSpin + (s * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(wx + Math.cos(a) * R * 0.76, -R + Math.sin(a) * R * 0.76);
        ctx.lineTo(wx - Math.cos(a) * R * 0.76, -R - Math.sin(a) * R * 0.76);
        ctx.strokeStyle = ink;
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    const hubRear = { x: 0, y: -R };
    const hubFront = { x: R * 2.9, y: -R };
    const bb = { x: R * 1.42, y: -R * 0.78 };
    const saddle = { x: R * 0.95, y: -R * 2.12 };
    const bar = { x: R * 2.34, y: -R * 2.06 };

    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1.4, R * 0.16);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hubRear.x, hubRear.y);
    ctx.lineTo(bb.x, bb.y);
    ctx.lineTo(saddle.x, saddle.y);
    ctx.lineTo(bar.x, bar.y);
    ctx.moveTo(bb.x, bb.y);
    ctx.lineTo(hubFront.x, hubFront.y);
    ctx.moveTo(saddle.x, saddle.y);
    ctx.lineTo(hubRear.x, hubRear.y);
    ctx.moveTo(bar.x, bar.y);
    ctx.lineTo(hubFront.x, hubFront.y);
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1.2, R * 0.11);
    ctx.beginPath();
    ctx.moveTo(bb.x, bb.y);
    ctx.lineTo(saddle.x - R * 0.12, saddle.y + R * 0.16);
    ctx.stroke();

    // handlebar tip
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1.2, R * 0.13);
    ctx.beginPath();
    ctx.moveTo(bar.x - R * 0.06, bar.y);
    ctx.lineTo(bar.x + R * 0.3, bar.y - R * 0.12);
    ctx.stroke();

    // Modern derailleur-ish dot on the rear hub
    ctx.beginPath();
    ctx.arc(hubRear.x, hubRear.y, R * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();

    // Rider: hips on the saddle, hands on the bar, knees driving the cranks.
    const crank = this.weatherClock * (this.phase === "idle" ? 3.2 : 4.4 + this.vx * 0.012);
    const tucking = this.tuck && this.phase !== "idle";
    const hip = { x: saddle.x + R * 0.06, y: saddle.y - R * 0.16 };
    const shoulder = tucking
      ? { x: bar.x - R * 0.2, y: bar.y - R * 0.42 }
      : { x: bar.x - R * 0.44, y: bar.y - R * 0.82 };
    const head = {
      x: shoulder.x + R * 0.24,
      y: shoulder.y - R * 0.36,
    };

    const pedals = [crank, crank + Math.PI].map((a) => ({
      x: bb.x + Math.cos(a) * R * 0.52,
      y: bb.y + Math.sin(a) * R * 0.52,
    }));

    ctx.strokeStyle = ink;
    ctx.lineWidth = R * 0.26;
    for (const pedal of pedals) {
      const kneeX = (hip.x + pedal.x) / 2 + R * 0.46;
      const kneeY = (hip.y + pedal.y) / 2 - R * 0.08;
      ctx.beginPath();
      ctx.moveTo(hip.x, hip.y);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(pedal.x, pedal.y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(shoulder.x, shoulder.y);
    ctx.stroke();

    // arms
    ctx.lineWidth = R * 0.17;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(bar.x - R * 0.1, bar.y - R * 0.1);
    ctx.stroke();

    // head and helmet
    ctx.beginPath();
    ctx.arc(head.x, head.y, R * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = ink;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x + R * 0.03, head.y - R * 0.08, R * 0.32, Math.PI * 1.05, Math.PI * 1.9);
    ctx.strokeStyle = accent;
    ctx.lineWidth = R * 0.17;
    ctx.stroke();

    // jersey accent on the back
    ctx.strokeStyle = accent;
    ctx.lineWidth = R * 0.12;
    ctx.beginPath();
    ctx.moveTo(hip.x - R * 0.02, hip.y - R * 0.28);
    ctx.lineTo(shoulder.x - R * 0.08, shoulder.y + R * 0.12);
    ctx.stroke();

    ctx.restore();
  }

  private drawParticles() {
    const { ctx } = this;
    for (const p of this.particles) {
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, a * 0.8);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - this.camX, this.base - (p.y - this.camLift), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  private drawWeather(road: RoadDef) {
    const { ctx } = this;
    const t = this.weatherClock;
    switch (road.weather) {
      case "pollen":
        for (const p of this.weather) {
          ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(t * 2 + p.phase));
          ctx.fillStyle = "#f5e6b8";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "wind":
        ctx.strokeStyle = "#dbe8ff";
        ctx.lineWidth = 1;
        for (const p of this.weather) {
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.size * 14, p.y + p.size * 2);
          ctx.stroke();
        }
        break;
      case "snow":
        ctx.fillStyle = "#eaf3ff";
        for (const p of this.weather) {
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "embers":
        for (const p of this.weather) {
          const flicker = 0.5 + 0.5 * Math.sin(t * 6 + p.phase);
          ctx.globalAlpha = p.alpha * flicker;
          ctx.fillStyle = flicker > 0.55 ? "#ffb070" : "#ff6a3d";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "rain":
        ctx.strokeStyle = "#d9e5ff";
        ctx.lineWidth = 1.5;
        for (const p of this.weather) {
          ctx.globalAlpha = p.alpha * 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.size * 0.28, p.y - p.size);
          ctx.stroke();
        }
        break;
    }
    ctx.globalAlpha = 1;
  }

  private drawSpeedLines(road: RoadDef) {
    if (this.vx < 410 || this.calm) return;
    const { ctx, W, H } = this;
    const intensity = clamp((this.vx - 410) / 250, 0, 1);
    ctx.save();
    ctx.strokeStyle = road.palette.edge;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = hash01(i * 5.1 + Math.floor(this.weatherClock * 2)) * H;
      const len = 40 + hash01(i * 9.7) * 120;
      ctx.globalAlpha = intensity * 0.14 * (0.4 + hash01(i * 2.3));
      ctx.beginPath();
      ctx.moveTo(W - 20, y);
      ctx.lineTo(W - 20 - len, y + 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBolt() {
    const { ctx, W, H } = this;
    const start = W * (0.2 + Math.random() * 0.6);
    ctx.save();
    ctx.strokeStyle = "rgba(226, 236, 255, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(start, 0);
    let x = start;
    let y = 0;
    while (y < H * 0.55) {
      x += (Math.random() - 0.5) * 60;
      y += 18 + Math.random() * 26;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}
