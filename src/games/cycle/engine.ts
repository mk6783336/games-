import { mulberry32 } from "../../lib/daily";

export type CycleCue = "mote" | "crash" | "clear" | "start";
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
      skyTop: "#071216",
      skyBottom: "#28473d",
      sun: "#f2d6a0",
      glow: "rgba(242, 214, 160, 0.3)",
      ridgeFar: "#61766a",
      ridgeMid: "#2c4a3d",
      ridgeNear: "#0f241c",
      ground: "#173328",
      deep: "#050c09",
      edge: "#dcc794",
      fog: "#31594a",
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
      skyTop: "#0a1220",
      skyBottom: "#334a60",
      sun: "#e7ebf2",
      glow: "rgba(214, 226, 244, 0.2)",
      ridgeFar: "#6d8092",
      ridgeMid: "#354b5e",
      ridgeNear: "#121f2c",
      ground: "#182a39",
      deep: "#060b12",
      edge: "#d2dbe4",
      fog: "#3b5468",
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
      skyTop: "#050a1c",
      skyBottom: "#1a2d52",
      sun: "#e9f2ff",
      glow: "rgba(150, 200, 255, 0.2)",
      ridgeFar: "#405d86",
      ridgeMid: "#203558",
      ridgeNear: "#0b1426",
      ground: "#142747",
      deep: "#050a14",
      edge: "#aac6e8",
      fog: "#28466d",
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
      skyTop: "#1b0c0a",
      skyBottom: "#5c2718",
      sun: "#ffc47e",
      glow: "rgba(255, 160, 90, 0.32)",
      ridgeFar: "#7c4631",
      ridgeMid: "#452017",
      ridgeNear: "#1e0d09",
      ground: "#2e130d",
      deep: "#0b0403",
      edge: "#e3a26a",
      fog: "#6d3120",
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
      skyTop: "#04070c",
      skyBottom: "#1d2838",
      sun: "#d7dfea",
      glow: "rgba(190, 205, 230, 0.16)",
      ridgeFar: "#4b5c72",
      ridgeMid: "#293a4c",
      ridgeNear: "#0d1620",
      ground: "#132130",
      deep: "#03070c",
      edge: "#c2d0e2",
      fog: "#2d4159",
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
  rivalName: string | null;
  rivalGapMs: number | null;
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
  startRoad: number;
  splits: { road: number; timeMs: number }[];
  rivals: { name: string; color: string; gapMs: number; finished: boolean }[];
}

export interface CycleCallbacks {
  onHud: (hud: CycleHud) => void;
  onRoadClear: (clear: CycleClear) => void;
  onEnd: (summary: CycleSummary) => void;
  onCue: (cue: CycleCue) => void;
}

/* ------------------------------------------------------------------ world */

const SEG = 8;
const ROAD_HALF = 600;
const CAMERA_HEIGHT = 520;
const CAMERA_BACK = 540;
const CAMERA_DEPTH = 0.84;
const PLAYER_SCALE = CAMERA_DEPTH / CAMERA_BACK;
const STEP_2 = Math.PI * 2;

interface Prop {
  kind: "pine" | "rock" | "shrub" | "dead";
  lat: number;
  height: number;
  seed: number;
}

interface Hazard {
  kind: "boulder" | "log" | "pothole";
  z: number;
  lat: number;
  width: number;
  height: number;
  hit: boolean;
}

interface Mote {
  z: number;
  lat: number;
  phase: number;
  taken: boolean;
}

interface TrafficVehicle {
  z: number;
  lat: number;
  speed: number;
  width: number;
  length: number;
  kind: "van" | "car" | "pickup";
  color: string;
  road: number;
  stop: number;
}

interface GhostRival {
  name: string;
  color: string;
  z: number;
  speed: number;
  baseLat: number;
  lat: number;
  phase: number;
  finished: boolean;
  finishElapsed: number | null;
}

interface Segment {
  z: number;
  y: number;
  curve: number;
  road: number;
  gate: number | null;
  props: Prop[];
  hazard: Hazard | null;
  mote: Mote | null;
}

interface Span {
  road: number;
  start: number;
  gate: number;
  cleared: boolean;
}

interface World {
  segments: Segment[];
  spans: Span[];
  traffic: TrafficVehicle[];
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

interface Projected {
  x: number;
  y: number;
  w: number;
  scale: number;
}

interface Row {
  seg: Segment;
  p1: Projected;
  p2: Projected;
  fog: number;
}

type Phase = "idle" | "riding" | "paused" | "crash" | "finish";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function mixHex(a: string, b: string, t: number): string {
  if (!a.startsWith("#") || a.length !== 7 || !b.startsWith("#") || b.length !== 7) return b;
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const t2 = clamp(t, 0, 1);
  const channel = (value: number) =>
    Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");
  return `#${channel(ar + (br - ar) * t2)}${channel(ag + (bg - ag) * t2)}${channel(ab + (bb - ab) * t2)}`;
}

function rgba(hex: string, a: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp(a, 0, 1)})`;
}

function elevation(z: number): number {
  return 60 + Math.sin(z * 0.00052) * 300 + Math.sin(z * 0.0015 + 1.3) * 78;
}

function curveAt(z: number, start: number, gate: number, road: number): number {
  const fade = Math.min(clamp((z - start) / 560, 0, 1), clamp((gate - z) / 720, 0, 1));
  return (
    (Math.sin(z * 0.00073 + road * 1.9) * 0.052 +
      Math.sin(z * 0.00021 + 1.7) * 0.026) *
    fade
  );
}

function buildWorld(fromRoad: number, seed: number): World {
  const segments: Segment[] = [];
  const spans: Span[] = [];
  const traffic: TrafficVehicle[] = [];
  let cursor = 0;

  for (let index = fromRoad - 1; index < ROADS.length; index++) {
    const def = ROADS[index];
    const count = Math.max(2, Math.round(def.length / SEG));
    const start = cursor;
    const gate = start + count * SEG;
    const rng = mulberry32((seed ^ Math.imul(def.number, 0x9e3779b1)) >>> 0);

    for (let n = 0; n < count; n++) {
      const z = start + n * SEG;
      segments.push({
        z,
        y: elevation(z),
        curve: curveAt(z, start, gate, def.number),
        road: def.number,
        gate: n === count - 1 ? def.number : null,
        props: [],
        hazard: null,
        mote: null,
      });
    }

    // Roadside scenery. Denser at the edge, layered heights so the near
    // silhouettes read as real depth rather than a repeating border.
    for (let pz = start + 28; pz < gate - 24; pz += 54 + rng() * 74) {
      const seg = segments[Math.round(pz / SEG)];
      if (!seg) continue;
      const side = rng() < 0.5 ? -1 : 1;
      const kindRoll = rng();
      const kind: Prop["kind"] =
        def.number === 4
          ? kindRoll < 0.28
            ? "shrub"
            : "rock"
          : def.number === 5
            ? kindRoll < 0.62
              ? "dead"
              : "rock"
            : kindRoll < 0.16
              ? "shrub"
              : kindRoll < 0.24
                ? "rock"
                : "pine";
      seg.props.push({
        kind,
        lat: side * (1.22 + rng() * 1.5),
        height: kind === "pine" ? 560 + rng() * 840 : kind === "dead" ? 480 + rng() * 520 : 160 + rng() * 360,
        seed: rng() * 1000,
      });
      if (rng() < 0.34) {
        const far = rng() < 0.5 ? -1 : 1;
        seg.props.push({
          kind: "pine",
          lat: far * (2.4 + rng() * 1.6),
          height: 420 + rng() * 560,
          seed: rng() * 1000,
        });
      }
    }

    // Low verge growth fills the empty plane beside the near road.
    for (let gz = start + 12; gz < gate - 12; gz += 36 + rng() * 42) {
      const seg = segments[Math.round(gz / SEG)];
      if (!seg) continue;
      const side = rng() < 0.5 ? -1 : 1;
      seg.props.push({
        kind: rng() < 0.28 ? "rock" : "shrub",
        lat: side * (1.06 + rng() * 0.46),
        height: 42 + rng() * 128,
        seed: rng() * 1000,
      });
    }

    // Hazards live only in the middle of a road. The last 750 units before
    // every checkpoint stay clear so the gate is always a clean run-in.
    const lanes = [-0.62, -0.3, 0.3, 0.62];
    let hazardZ = start + 760;
    while (hazardZ < gate - 760) {
      const seg = segments[Math.round(hazardZ / SEG)];
      if (seg && !seg.hazard) {
        const laneIndex = Math.floor(rng() * lanes.length);
        const kind: Hazard["kind"] = rng() < 0.16 ? "pothole" : rng() < 0.58 ? "boulder" : "log";
        seg.hazard = {
          kind,
          z: seg.z,
          lat: lanes[laneIndex] + (rng() - 0.5) * 0.08,
          width: kind === "pothole" ? 0.15 : 0.18 + rng() * 0.08,
          height: kind === "pothole" ? 1 : kind === "log" ? 74 : 96 + rng() * 44,
          hit: false,
        };
      }
      // Spacing grows with the road instead of shrinking: top speed rises by
      // roughly 14%, so a tighter gap would leave later roads with less
      // reaction time than Fern Hollow.
      hazardZ += (380 + rng() * 320) * (1 + def.difficulty * 0.035);
    }

    // The racing line, marked by motes, gently snakes across the road.
    for (let mz = start + 420; mz < gate - 480; mz += 230 + rng() * 170) {
      const seg = segments[Math.round(mz / SEG)];
      if (!seg || seg.mote || seg.hazard) continue;
      seg.mote = {
        z: seg.z,
        lat: Math.sin(mz * 0.0037 + def.number) * 0.58,
        phase: rng() * STEP_2,
        taken: false,
      };
    }

    // Slow service traffic holds one lane at a time. The last 950 units of
    // each road stay empty so a checkpoint is never approached behind a van.
    const gap = 1560 - def.difficulty * 110;
    let tz = start + 1250;
    while (tz < gate - 950) {
      const seg = segments[Math.round(tz / SEG)];
      // Keep traffic away from a hazard cluster. A car forty units in front of
      // a boulder turns a normal lane change into an unfair pinch.
      let clean = !seg?.hazard;
      for (let probe = tz - 180; clean && probe <= tz + 180; probe += SEG) {
        if (segments[Math.round(probe / SEG)]?.hazard) clean = false;
      }
      if (seg && clean) {
        const side = rng() < 0.5 ? -1 : 1;
        const kindRoll = rng();
        const kind: TrafficVehicle["kind"] = kindRoll < 0.26 ? "van" : kindRoll < 0.52 ? "pickup" : "car";
        traffic.push({
          z: tz,
          lat: side * (0.27 + rng() * 0.11),
          speed: 118 + rng() * 58 + def.difficulty * 4,
          width: kind === "van" ? 0.15 : kind === "pickup" ? 0.135 : 0.13,
          length: kind === "van" ? 112 : 90,
          kind,
          color: kind === "van" ? "#8b8069" : kind === "pickup" ? "#64706c" : "#6e7278",
          road: def.number,
          stop: Number.POSITIVE_INFINITY,
        });
      }
      tz += gap + rng() * 620;
    }

    spans.push({ road: def.number, start, gate, cleared: false });
    cursor = gate;
  }

  const finish = spans[spans.length - 1]?.gate ?? 0;
  for (const vehicle of traffic) vehicle.stop = finish - 140;

  return { segments, spans, traffic };
}

/* ------------------------------------------------------------------ game */

export class CycleGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: CycleCallbacks;
  private raf = 0;
  private last = 0;
  private ro: ResizeObserver | null = null;

  private W = 900;
  private H = 540;
  private dpr = 1;
  private drawDistance = 180;
  private horizon = 286;

  private phase: Phase = "idle";
  private world: World | null = null;
  private previewRoad = 0;

  // `x`, `y`, `camX`, `camLift`, `world` and `hAt` are the deliberate
  // development probe surface used by the checkpoint end-to-end test.
  private x = 0;
  private y = 0;
  private camX = 0;
  private camLift = 0;
  private speed = 0;
  private riderLat = 0;
  private steer = 0;
  private steerInput = 0;
  private brake = false;
  private pedal = false;

  private runElapsed = 0;
  private roadStartElapsed = 0;
  private roadIndex = 0;
  private cleared = 0;
  private score = 0;
  private motes = 0;
  private startX = 0;
  private splits: { road: number; timeMs: number }[] = [];
  private ghosts: GhostRival[] = [];

  private crashTimer = 0;
  private crashDir = 1;
  private finishTimer = 0;
  private ended = false;
  private shake = 0;
  private hudClock = 0;
  private dustClock = 0;

  private particles: Particle[] = [];
  private weather: WeatherPart[] = [];
  private weatherRoad = -1;
  private weatherClock = 0;
  private lightning = 0;
  private lightningTimer = 7;
  private backdrop: HTMLCanvasElement | null = null;
  private backdropKey = "";
  private spriteCache = new Map<string, HTMLCanvasElement>();

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
    this.horizon = h * 0.53;
    this.drawDistance = w < 720 ? 190 : 260;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.weather = [];
    this.weatherRoad = -1;
    this.backdrop = null;
    this.backdropKey = "";
  }

  /** A scenic still frame behind the level select. */
  preview(roadNumber: number) {
    const idx = clamp(roadNumber, 1, ROADS.length) - 1;
    this.previewRoad = idx;
    this.phase = "idle";
    this.world = buildWorld(idx + 1, 20261);
    this.roadIndex = 0;
    const span = this.world.spans[0];
    this.x = span.start + Math.min(2_600, (span.gate - span.start) * 0.28);
    this.y = this.hAt(this.x);
    this.speed = 0;
    this.riderLat = 0;
    this.steer = 0;
    this.steerInput = 0;
    this.brake = false;
    this.pedal = false;
    this.camX = this.x - CAMERA_BACK;
    this.camLift = this.y + CAMERA_HEIGHT;
    this.runElapsed = 0;
    this.roadStartElapsed = 0;
    this.cleared = 0;
    this.score = 0;
    this.motes = 0;
    this.splits = [];
    this.ghosts = [];
    this.crashTimer = 0;
    this.finishTimer = 0;
    this.ended = false;
    this.shake = 0;
    this.weather = [];
    this.weatherRoad = -1;
    this.emitHud(true);
  }

  start(roadNumber: number, seed: number) {
    const idx = clamp(roadNumber, 1, ROADS.length) - 1;
    this.world = buildWorld(idx + 1, seed >>> 0);
    this.roadIndex = 0;
    const span = this.world.spans[0];
    this.startX = span.start + 24;
    this.x = this.startX;
    this.y = this.hAt(this.x);
    this.speed = 205;
    this.riderLat = 0;
    this.steer = 0;
    this.steerInput = 0;
    this.brake = false;
    this.pedal = false;
    this.camX = this.x - CAMERA_BACK;
    this.camLift = this.y + CAMERA_HEIGHT;
    this.runElapsed = 0;
    this.roadStartElapsed = 0;
    this.cleared = 0;
    this.score = 0;
    this.motes = 0;
    this.splits = [];
    this.ghosts = this.createRivals();
    this.crashTimer = 0;
    this.finishTimer = 0;
    this.ended = false;
    this.shake = 0;
    this.hudClock = 0;
    this.dustClock = 0;
    this.particles = [];
    this.weather = [];
    this.weatherRoad = -1;
    this.lightning = 0;
    this.lightningTimer = 7;
    this.phase = "riding";
    this.emitHud(true);
    this.cb.onCue("start");
  }

  pause() {
    if (this.phase === "riding") {
      this.phase = "paused";
      this.steerInput = 0;
      this.steer = 0;
      this.brake = false;
      this.pedal = false;
    }
  }

  resume() {
    if (this.phase === "paused") {
      this.phase = "riding";
      this.last = performance.now();
    }
  }

  /** -1 left, 0 straight, 1 right. Repeated calls keep the input held. */
  setSteer(direction: -1 | 0 | 1) {
    this.steerInput = direction;
  }

  setBrake(active: boolean) {
    this.brake = active;
  }

  setPedal(active: boolean) {
    this.pedal = active;
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
    const span = this.world?.spans[this.roadIndex];
    return ROADS[(span?.road ?? this.previewRoad + 1) - 1] ?? ROADS[this.previewRoad];
  }

  private hAt(x: number): number {
    const world = this.world;
    if (!world || world.segments.length === 0) return 0;
    const raw = clamp(x / SEG, 0, world.segments.length - 1);
    const i = Math.floor(raw);
    const next = world.segments[Math.min(i + 1, world.segments.length - 1)];
    const t = raw - i;
    return world.segments[i].y * (1 - t) + next.y * t;
  }

  private get span(): Span | undefined {
    return this.world?.spans[this.roadIndex];
  }

  private get finalGate(): number {
    const spans = this.world?.spans;
    return spans?.[spans.length - 1]?.gate ?? this.x;
  }

  private createRivals(): GhostRival[] {
    // A run started at a checkpoint still spans every road ahead, so rival pace
    // is based on the average difficulty of that whole remaining route rather
    // than the road the player happens to start on.
    const spans = this.world?.spans ?? [];
    const avgDiff = spans.length
      ? spans.reduce((total, span) => total + (ROADS[span.road - 1]?.difficulty ?? 1), 0) / spans.length
      : this.currentRoad().difficulty;
    const specs = [
      { name: "Ilya Ren", color: "#9dc7dc", pace: 356 + avgDiff * 6, delay: 3.4, lat: -0.24, phase: 0.6 },
      { name: "Mara Voss", color: "#e2c08f", pace: 338 + avgDiff * 5, delay: 1.7, lat: 0.21, phase: 2.4 },
      { name: "Sena Okafor", color: "#c3b0e6", pace: 322 + avgDiff * 5, delay: 0.35, lat: -0.03, phase: 4.1 },
    ];
    return specs.map((spec) => ({
      name: spec.name,
      color: spec.color,
      z: this.startX + spec.pace * spec.delay,
      speed: spec.pace,
      baseLat: spec.lat,
      lat: spec.lat,
      phase: spec.phase,
      finished: false,
      finishElapsed: null,
    }));
  }

  private moveTraffic(dt: number) {
    const world = this.world;
    if (!world) return;
    for (const vehicle of world.traffic) {
      if (vehicle.z < vehicle.stop) {
        vehicle.z = Math.min(vehicle.stop, vehicle.z + vehicle.speed * dt);
      }
    }
  }

  private moveRivals(dt: number) {
    for (const ghost of this.ghosts) {
      if (ghost.finished) continue;
      ghost.z += ghost.speed * dt;
      ghost.lat = ghost.baseLat + Math.sin(this.runElapsed * 0.75 + ghost.phase) * 0.14;
      if (ghost.z >= this.finalGate) {
        const overshoot = ghost.z - this.finalGate;
        ghost.finishElapsed = this.runElapsed - overshoot / ghost.speed;
        ghost.z = this.finalGate;
        ghost.finished = true;
      }
    }
  }

  private nearestRival(): { name: string; gapMs: number } | null {
    let best: { name: string; gapMs: number } | null = null;
    for (const ghost of this.ghosts) {
      if (ghost.finished) continue;
      const gapMs = ((ghost.z - this.x) / ghost.speed) * 1000;
      if (!best || Math.abs(gapMs) < Math.abs(best.gapMs)) {
        best = { name: ghost.name, gapMs };
      }
    }
    return best;
  }

  private update(dt: number) {
    this.weatherClock += dt;
    this.shake *= Math.max(0, 1 - dt * 5);
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
      this.speed *= Math.max(0, 1 - dt * 0.9);
      this.x += this.speed * dt * 0.28;
      this.riderLat += this.crashDir * dt * 0.32;
      this.shake = Math.max(this.shake, 8);
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
      this.speed *= Math.max(0, 1 - dt * 1.4);
      this.x += this.speed * dt * 0.5;
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
    const span = this.span;
    if (!world || !span) return;
    const road = this.currentRoad();
    this.runElapsed += dt;
    this.moveTraffic(dt);
    this.moveRivals(dt);

    // Steering is speed-sensitive: a loaded bike at 80 km/h takes longer to
    // place than one at 30. The camera follows the rider rather than the road.
    const speedFactor = clamp(1.18 - this.speed / 680, 0.56, 1.08);
    this.steer += (this.steerInput - this.steer) * Math.min(1, dt * 8.5);
    this.riderLat += this.steer * 0.92 * speedFactor * dt;
    if (this.steerInput === 0 && Math.abs(this.riderLat) < 1.04) {
      this.riderLat *= Math.max(0, 1 - dt * 0.16);
    }

    const offRoad = Math.abs(this.riderLat) > 1.02;
    const edge = Math.abs(this.riderLat) > 1.38;
    const grade = (this.hAt(this.x + 34) - this.hAt(this.x - 34)) / 68;

    let target = 220 + road.difficulty * 11;
    if (this.pedal) target = 340 + road.difficulty * 12;
    if (offRoad) target = Math.min(target, 148);
    if (grade > 0.18) target *= 1 - Math.min(0.3, (grade - 0.18) * 0.7);
    if (grade < -0.16) target *= 1.12;
    if (this.brake) target = 0;

    if (this.brake) {
      this.speed = Math.max(0, this.speed - 520 * dt);
    } else {
      const rate = this.pedal ? 2.4 : 1.15;
      this.speed += (target - this.speed) * Math.min(1, dt * rate);
    }
    this.speed = clamp(this.speed, 0, 470);

    this.x += this.speed * dt;
    this.y = this.hAt(this.x);

    // Collisions, checkpoint gates and motes all run per frame so a long
    // frame at high speed cannot skip a hazard.
    const from = Math.max(0, Math.floor((this.x - 44) / SEG));
    const to = Math.min(world.segments.length - 1, Math.floor((this.x + 44) / SEG));
    for (let i = from; i <= to; i++) {
      const seg = world.segments[i];
      if (!seg) continue;
      const hazard = seg.hazard;
      if (hazard && !hazard.hit && Math.abs(hazard.z - this.x) < 26) {
        if (Math.abs(hazard.lat - this.riderLat) < hazard.width + 0.075) {
          hazard.hit = true;
          this.crash();
          return;
        }
      }
      const mote = seg.mote;
      if (mote && !mote.taken && Math.abs(mote.z - this.x) < 24) {
        if (Math.abs(mote.lat - this.riderLat) < 0.2) {
          mote.taken = true;
          this.motes += 1;
          this.burst(this.W / 2, this.H * 0.72, 7, road.palette.edge, 0.4);
          this.cb.onCue("mote");
        }
      }
    }

    for (const vehicle of world.traffic) {
      if (
        Math.abs(vehicle.z - this.x) < vehicle.length * 0.5 + 10 &&
        Math.abs(vehicle.lat - this.riderLat) < vehicle.width + 0.075
      ) {
        this.crash();
        return;
      }
    }

    if (edge) {
      this.crash();
      return;
    }

    if (this.x >= span.gate) {
      span.cleared = true;
      const timeMs = Math.round((this.runElapsed - this.roadStartElapsed) * 1000);
      this.splits.push({ road: span.road, timeMs });
      this.cleared += 1;
      this.roadStartElapsed = this.runElapsed;
      this.cb.onCue("clear");
      this.cb.onRoadClear({
        road: span.road,
        timeMs,
        totalMs: Math.round(this.runElapsed * 1000),
        roadsCleared: this.cleared,
      });

      if (span.road === ROADS[ROADS.length - 1].number) {
        this.phase = "finish";
        this.finishTimer = 1.15;
      } else {
        this.roadIndex = Math.min(this.roadIndex + 1, world.spans.length - 1);
        this.emitHud(true);
      }
    }

    // Camera lag keeps the horizon stable while the road climbs under it.
    const ease = 1 - Math.exp(-dt * 7.5);
    this.camX += (this.x - CAMERA_BACK - this.camX) * ease;
    this.camLift += (this.y + CAMERA_HEIGHT - this.camLift) * ease;

    // Braking hard leaves a little rubber and dust.
    if (this.brake && this.speed > 140) {
      this.shake = Math.max(this.shake, 1.8);
      this.dustClock -= dt;
      if (this.dustClock <= 0) {
        this.dustClock = 0.035;
        this.particles.push({
          x: this.W / 2 + (Math.random() - 0.5) * 18,
          y: this.H * 0.925,
          vx: (Math.random() - 0.5) * 34,
          vy: -10 - Math.random() * 26,
          life: 0,
          max: 0.4 + Math.random() * 0.25,
          size: 2 + Math.random() * 3.5,
          color: "#b9b1a0",
        });
      }
    } else if (offRoad && this.speed > 80) {
      this.shake = Math.max(this.shake, 1.3);
      this.dustClock -= dt;
      if (this.dustClock <= 0) {
        this.dustClock = 0.06;
        this.particles.push({
          x: this.W / 2 + (Math.random() - 0.5) * 30,
          y: this.H * 0.925,
          vx: (Math.random() - 0.5) * 55,
          vy: -18 - Math.random() * 22,
          life: 0,
          max: 0.35 + Math.random() * 0.3,
          size: 2 + Math.random() * 4,
          color: road.palette.edge,
        });
      }
    } else if (this.speed > 120) {
      this.dustClock -= dt;
      if (this.dustClock <= 0) {
        this.dustClock = this.calm ? 0.24 : 0.11;
        this.particles.push({
          x: this.W / 2 + (Math.random() - 0.5) * 15,
          y: this.H * 0.93,
          vx: -10 - Math.random() * 28,
          vy: -12 - Math.random() * 16,
          life: 0,
          max: 0.4 + Math.random() * 0.3,
          size: 1.5 + Math.random() * 3,
          color: rgba(road.palette.edge, 0.5),
        });
      }
    }

    this.score = Math.floor(Math.max(0, this.x - this.startX) * 0.35) + this.motes * 12;

    if (road.storm) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 5 + Math.random() * 7;
        if (!this.calm) this.lightning = 0.28;
      }
    }

    this.updateParticles(dt);
    this.updateWeather(dt, road);
    this.emitHud();
  }

  private clearBonus(): number {
    if (!this.world) return 0;
    return this.world.spans.reduce(
      (total, span) => total + (span.cleared ? 260 + span.road * 110 : 0),
      0,
    );
  }

  private crash() {
    if (this.phase !== "riding") return;
    this.phase = "crash";
    this.crashTimer = 1.15;
    this.crashDir = this.riderLat >= 0 ? 1 : -1;
    this.shake = 14;
    this.brake = false;
    this.pedal = false;
    const road = this.currentRoad();
    this.burst(this.W / 2, this.H * 0.78, 24, road.palette.edge, 1);
    this.burst(this.W / 2, this.H * 0.78, 10, "#e9e2d2", 0.8);
    this.cb.onCue("crash");
  }

  private summary(cleared: boolean): CycleSummary {
    const span = this.span;
    const road = this.currentRoad();
    return {
      score: Math.floor(this.score + this.clearBonus()),
      collectedCoins: this.motes,
      distance: Math.floor(Math.max(0, this.x - this.startX) / 20),
      durationMs: Math.round(this.runElapsed * 1000),
      road: span?.road ?? road.number,
      roadName: road.name,
      cleared,
      roadsCleared: this.cleared,
      startRoad: this.world?.spans[0]?.road ?? road.number,
      splits: this.splits,
      rivals: this.ghosts.map((ghost) => ({
        name: ghost.name,
        color: ghost.color,
        gapMs:
          ghost.finishElapsed != null
            ? Math.round((ghost.finishElapsed - this.runElapsed) * 1000)
            : Math.round(((ghost.z - this.x) / ghost.speed) * 1000),
        finished: ghost.finished,
      })),
    };
  }

  private burst(x: number, y: number, count: number, color: string, power: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * STEP_2;
      const speed = (34 + Math.random() * 130) * power;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0,
        max: 0.38 + Math.random() * 0.6,
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
      p.vy += 10 * dt;
      p.vx *= 0.985;
    }
    this.particles = this.particles.filter((p) => p.life < p.max).slice(-140);
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
      if (road.weather === "snow") p.x += Math.sin(this.weatherClock * 0.8 + p.phase) * 15 * dt;
      if (road.weather === "embers") p.vx += Math.sin(this.weatherClock * 1.6 + p.phase) * 22 * dt;
      if (p.y > H + 30) {
        p.y = -24;
        p.x = Math.random() * W;
      }
      if (p.y < -30) {
        p.y = H + 18;
        p.x = Math.random() * W;
      }
      if (p.x > W + 30) p.x = -24;
      if (p.x < -30) p.x = W + 22;
    }
  }

  private makeWeather(road: RoadDef): WeatherPart[] {
    const count = this.calm ? 20 : road.storm ? 92 : 52;
    const parts: WeatherPart[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.W;
      const y = Math.random() * this.H;
      switch (road.weather) {
        case "pollen":
          parts.push({
            x,
            y,
            vx: 7 + Math.random() * 14,
            vy: -4 - Math.random() * 8,
            size: 1 + Math.random() * 1.8,
            phase: Math.random() * STEP_2,
            alpha: 0.16 + Math.random() * 0.3,
          });
          break;
        case "wind":
          parts.push({
            x,
            y,
            vx: 195 + Math.random() * 180,
            vy: 5 + Math.random() * 24,
            size: 8 + Math.random() * 18,
            phase: Math.random() * STEP_2,
            alpha: 0.06 + Math.random() * 0.12,
          });
          break;
        case "snow":
          parts.push({
            x,
            y,
            vx: -16 - Math.random() * 22,
            vy: 34 + Math.random() * 52,
            size: 1.2 + Math.random() * 2.4,
            phase: Math.random() * STEP_2,
            alpha: 0.3 + Math.random() * 0.45,
          });
          break;
        case "embers":
          parts.push({
            x,
            y: this.H + 10,
            vx: -16 + Math.random() * 34,
            vy: -35 - Math.random() * 80,
            size: 1 + Math.random() * 2.4,
            phase: Math.random() * STEP_2,
            alpha: 0.24 + Math.random() * 0.45,
          });
          break;
        case "rain":
          parts.push({
            x,
            y,
            vx: -138 - Math.random() * 80,
            vy: 390 + Math.random() * 240,
            size: 8 + Math.random() * 16,
            phase: Math.random() * STEP_2,
            alpha: 0.08 + Math.random() * 0.17,
          });
          break;
      }
    }
    return parts;
  }

  private emitHud(force = false) {
    this.hudClock += 1;
    if (!force && this.hudClock % 7 !== 0) return;
    const span = this.span;
    const road = this.currentRoad();
    const progress = span ? clamp((this.x - span.start) / Math.max(1, span.gate - span.start), 0, 1) : 0;
    const rival = this.nearestRival();
    this.cb.onHud({
      score: Math.floor(this.score + this.clearBonus()),
      coins: this.motes,
      speed: Math.round(this.speed * 0.18),
      distance: Math.floor(Math.max(0, this.x - this.startX) / 20),
      progress,
      road: span?.road ?? road.number,
      roadName: road.name,
      roadMs: Math.round(Math.max(0, this.runElapsed - this.roadStartElapsed) * 1000),
      roadsCleared: this.cleared,
      rivalName: rival?.name ?? null,
      rivalGapMs: rival ? Math.round(rival.gapMs) : null,
    });
  }

  /* ---------------------------------------------------------------- draw */

  private project(relZ: number, worldX: number, worldY: number): Projected {
    const scale = CAMERA_DEPTH / Math.max(1, relZ);
    return {
      x: this.W / 2 + scale * worldX * (this.W / 2),
      y: this.horizon - scale * (worldY - this.camLift) * (this.H / 2),
      w: scale * ROAD_HALF * (this.W / 2),
      scale,
    };
  }

  private draw() {
    const { ctx, W, H } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const road = this.currentRoad();
    const p = road.palette;

    ctx.fillStyle = p.deep;
    ctx.fillRect(0, 0, W, H);

    const shakeX = this.shake > 0.3 && !this.calm ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake > 0.3 && !this.calm ? (Math.random() - 0.5) * this.shake : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);    this.drawBackdrop(road);

    if (this.world) {
        this.drawRoad(road);
        this.drawAtmosphere(road);
        if (this.phase !== "idle") this.drawRider(road);
      }


    this.drawParticles();
    this.drawWeather(road);
    this.drawSpeedLines(road);
    this.drawVignette(p);
    ctx.restore();

    if (this.lightning > 0) {
      ctx.fillStyle = `rgba(198, 216, 246, ${this.lightning * 0.8})`;
      ctx.fillRect(0, 0, W, H);
      if (this.lightning > 0.17) this.drawBolt();
    }
  }

  private drawBackdrop(road: RoadDef) {
    const key = `${road.number}:${this.W}:${this.H}:${this.dpr}`;
    if (!this.backdrop || this.backdropKey !== key) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(this.W * this.dpr));
      canvas.height = Math.max(1, Math.round(this.H * this.dpr));
      const g = canvas.getContext("2d");
      if (g) {
        g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.drawSky(road, g);
        this.drawGround(road, g);
        this.drawMountains(road, g, 0);
        this.backdrop = canvas;
        this.backdropKey = key;
      }
    }
    if (this.backdrop) {
      this.ctx.drawImage(this.backdrop, 0, 0, this.W, this.H);
      return;
    }
    this.drawSky(road);
    this.drawGround(road);
    this.drawMountains(road);
  }

  private drawSky(road: RoadDef, g: CanvasRenderingContext2D = this.ctx) {
    const { W, H } = this;
    const ctx = g;
    const p = road.palette;
    const sky = ctx.createLinearGradient(0, 0, 0, this.horizon + H * 0.12);
    sky.addColorStop(0, p.skyTop);
    sky.addColorStop(0.7, p.skyBottom);
    sky.addColorStop(1, mixHex(p.skyBottom, p.fog, 0.35));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, this.horizon + H * 0.12);

    this.drawStars(road, g);
    if (road.aurora) this.drawAurora(g);
    this.drawSun(road, g);
    if (!road.aurora) this.drawClouds(road, g);
  }

  private drawStars(road: RoadDef, g: CanvasRenderingContext2D = this.ctx) {
    const { W, H } = this;
    const ctx = g;
    const count = road.storm ? 18 : road.aurora ? 58 : 28;
    const strength = road.storm ? 0.18 : road.aurora ? 0.58 : 0.16;
    for (let i = 0; i < count; i++) {
      const x = hash01(i * 3.7) * W;
      const y = hash01(i * 8.3) * H * 0.4;
      const twinkle = 0.38 + 0.62 * Math.abs(Math.sin(hash01(i) * 9 + i));
      ctx.globalAlpha = twinkle * strength;
      ctx.fillStyle = "#e8f1ff";
      ctx.fillRect(x, y, 1.3, 1.3);
    }
    ctx.globalAlpha = 1;
  }

  private drawAurora(g: CanvasRenderingContext2D = this.ctx) {
    const { W, H } = this;
    const ctx = g;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = "blur(13px)";
    for (let band = 0; band < 3; band++) {
      const top = H * (0.07 + band * 0.058);
      const amp = H * (0.045 + band * 0.012);
      const grad = ctx.createLinearGradient(0, top - amp, 0, top + H * 0.17);
      grad.addColorStop(0, "rgba(72, 205, 224, 0)");
      grad.addColorStop(0.4, band % 2 === 0 ? "rgba(60, 196, 224, 0.19)" : "rgba(170, 212, 255, 0.17)");
      grad.addColorStop(1, "rgba(146, 170, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-30, top);
      for (let x = -30; x <= W + 30; x += 16) {
        const wave = Math.sin(x * 0.0048 + band * 1.6) * amp;
        const wave2 = Math.sin(x * 0.012 + band) * amp * 0.4;
        ctx.lineTo(x, top + wave + wave2);
      }
      ctx.lineTo(W + 30, top + H * 0.19);
      ctx.lineTo(-30, top + H * 0.19);
      ctx.closePath();
      ctx.fill();
    }
    ctx.filter = "none";
    ctx.restore();
  }

  private drawSun(road: RoadDef, g: CanvasRenderingContext2D = this.ctx) {
    const { W, H } = this;
    const ctx = g;
    const p = road.palette;
    const cx = W * 0.73 + Math.sin(road.number * 1.7) * W * 0.018;
    const cy = this.horizon - H * (road.aurora ? 0.2 : road.storm ? 0.13 : 0.17);
    const radius = road.aurora ? H * 0.025 : road.storm ? H * 0.014 : H * 0.034;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.4);
    glow.addColorStop(0, p.glow);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, this.horizon + H * 0.1);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, STEP_2);
    ctx.fillStyle = p.sun;
    ctx.globalAlpha = road.storm ? 0.3 : 0.86;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawClouds(road: RoadDef, g: CanvasRenderingContext2D = this.ctx) {
    const { W, H } = this;
    const ctx = g;
    if (road.storm) {
      const band = ctx.createLinearGradient(0, 0, 0, this.horizon);
      band.addColorStop(0, "rgba(7, 12, 19, 0)");
      band.addColorStop(0.45, "rgba(8, 13, 20, 0.35)");
      band.addColorStop(1, "rgba(18, 27, 39, 0.15)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, this.horizon);
      return;
    }
    for (let i = 0; i < 5; i++) {
      const y = this.horizon - H * (0.26 - i * 0.037);
      const x = ((i * 317 + road.number * 61) % (W + 480)) - 240;
      const width = W * (0.3 + (i % 3) * 0.09);
      const height = H * 0.012;
      const cloud = ctx.createLinearGradient(x, y, x + width, y);
      cloud.addColorStop(0, "rgba(0, 0, 0, 0)");
      cloud.addColorStop(0.45, road.palette.glow);
      cloud.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = cloud;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y, width / 2, height, 0, 0, STEP_2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawMountains(road: RoadDef, g: CanvasRenderingContext2D = this.ctx, scrollOrigin = this.camX) {
    const { W, H } = this;
    const ctx = g;
    const p = road.palette;
    const layers = [
      { color: mixHex(p.ridgeFar, p.deep, 0.38), amp: H * 0.27, base: this.horizon + H * 0.026, speed: 0.085, seed: 1.7 },
      { color: mixHex(p.ridgeMid, p.deep, 0.24), amp: H * 0.18, base: this.horizon + H * 0.045, speed: 0.155, seed: 4.2 },
      { color: mixHex(p.ridgeNear, p.deep, 0.08), amp: H * 0.12, base: this.horizon + H * 0.063, speed: 0.25, seed: 8.1 },
    ];
    for (let layer = 0; layer < layers.length; layer++) {
      const l = layers[layer];
      const scroll = scrollOrigin * l.speed;
      const envelope = 0.72 + 0.28 * Math.sin(scroll * 0.0004 + l.seed);
      ctx.beginPath();
      ctx.moveTo(-20, this.horizon + H * 0.12);
      for (let x = -20; x <= W + 20; x += 7) {
        const wx = x + scroll;
        const peakA = 1 - Math.abs(Math.sin(wx * 0.0021 + l.seed));
        const peakB = 1 - Math.abs(Math.sin(wx * 0.0053 + l.seed * 2.1));
        const peakC = 1 - Math.abs(Math.sin(wx * 0.013 + l.seed * 0.7));
        const ridge =
          0.18 +
          0.37 * Math.pow(peakA, 1.9) +
          0.2 * Math.pow(peakB, 2.4) +
          0.075 * Math.pow(peakC, 2);
        ctx.lineTo(x, l.base - l.amp * ridge * envelope);
      }
      ctx.lineTo(W + 20, this.horizon + H * 0.12);
      ctx.closePath();
      const mountainFill = ctx.createLinearGradient(0, l.base - l.amp, 0, l.base + H * 0.05);
      mountainFill.addColorStop(0, mixHex(l.color, p.edge, layer === 0 ? 0.12 : 0.05));
      mountainFill.addColorStop(0.42, l.color);
      mountainFill.addColorStop(1, mixHex(l.color, p.deep, 0.32));
      ctx.fillStyle = mountainFill;
      ctx.fill();
      if (layer === 0) {
        ctx.strokeStyle = rgba(p.edge, 0.17);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // A soft fog band between the range and the trail.
    const haze = ctx.createLinearGradient(0, this.horizon - H * 0.025, 0, this.horizon + H * 0.07);
    haze.addColorStop(0, "rgba(0, 0, 0, 0)");
    haze.addColorStop(0.55, rgba(p.fog, road.storm ? 0.2 : 0.32));
    haze.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, this.horizon - H * 0.03, W, H * 0.1);

    this.drawTreeline(road, g, scrollOrigin);
  }

  private drawTreeline(road: RoadDef, g: CanvasRenderingContext2D = this.ctx, scrollOrigin = this.camX) {
    const { W, H } = this;
    const ctx = g;
    const p = road.palette;
    if (road.storm) return;
    const scroll = scrollOrigin * 0.36;
    ctx.fillStyle = mixHex(p.ridgeNear, p.deep, 0.32);
    ctx.beginPath();
    for (let x = -12; x <= W + 12; x += 13) {
      const wx = x + scroll;
      const h = 5 + hash01(Math.floor(wx / 13)) * H * 0.018;
      ctx.lineTo(x, this.horizon + H * 0.055);
      ctx.lineTo(x + 6.5, this.horizon + H * 0.055 - h);
      ctx.lineTo(x + 13, this.horizon + H * 0.055);
    }
    ctx.lineTo(W + 12, this.horizon + H * 0.075);
    ctx.lineTo(-12, this.horizon + H * 0.075);
    ctx.closePath();
    ctx.fill();
  }

  private drawGround(road: RoadDef, g: CanvasRenderingContext2D = this.ctx) {
    const { W, H } = this;
    const ctx = g;
    const p = road.palette;
    const ground = ctx.createLinearGradient(0, this.horizon, 0, H);
    ground.addColorStop(0, mixHex(p.ground, p.fog, 0.5));
    ground.addColorStop(0.28, mixHex(p.ground, p.fog, 0.2));
    ground.addColorStop(0.7, p.ground);
    ground.addColorStop(1, p.deep);
    ctx.fillStyle = ground;
    ctx.fillRect(0, this.horizon, W, H - this.horizon);
  }

  private drawAtmosphere(road: RoadDef) {
    const { ctx, W, H } = this;
    const p = road.palette;
    const haze = ctx.createLinearGradient(0, this.horizon - H * 0.02, 0, this.horizon + H * 0.34);
    haze.addColorStop(0, rgba(p.fog, road.storm ? 0.16 : 0.2));
    haze.addColorStop(0.45, rgba(p.fog, road.storm ? 0.08 : 0.1));
    haze.addColorStop(1, rgba(p.fog, 0));
    ctx.fillStyle = haze;
    ctx.fillRect(0, this.horizon - H * 0.02, W, H * 0.36);
  }

  private drawRoad(road: RoadDef) {
    const world = this.world;
    if (!world) return;
    const baseIndex = clamp(Math.floor((this.x - CAMERA_BACK) / SEG), 0, world.segments.length - 1);
    const base = world.segments[baseIndex];
    const camZ = this.camX;
    const camLat = this.riderLat * ROAD_HALF * 0.62;
    let xOffset = 0;
    let dx = -base.curve * clamp((this.x - CAMERA_BACK - base.z) / SEG, 0, 1);
    const rows: Row[] = [];

    for (let n = 0; n < this.drawDistance; n++) {
      const seg = world.segments[baseIndex + n];
      if (!seg) break;
      const z1 = seg.z - camZ;
      if (z1 < 8) {
        xOffset += dx;
        dx += seg.curve;
        continue;
      }
      const next = world.segments[baseIndex + n + 1] ?? seg;
      const p1 = this.project(z1, xOffset - camLat, seg.y);
      const p2 = this.project(z1 + SEG, xOffset + dx - camLat, next.y);
      rows.push({ seg, p1, p2, fog: clamp(n / this.drawDistance, 0, 1) });
      xOffset += dx;
      dx += seg.curve;
    }

    if (rows.length < 2) return;
    const { ctx } = this;
    const p = road.palette;
    const far = rows[rows.length - 1];
    const near = rows[0];
    const shoulderColor = mixHex(p.ground, "#9c8e74", 0.26);
    const asphalt = mixHex(mixHex(p.deep, "#746f63", 0.44), p.ground, 0.14);

    const strip = (factor: number) => {
      ctx.beginPath();
      ctx.moveTo(far.p2.x - far.p2.w * factor, far.p2.y);
      for (let i = rows.length - 1; i >= 0; i--) {
        ctx.lineTo(rows[i].p1.x - rows[i].p1.w * factor, rows[i].p1.y);
      }
      for (let i = 0; i < rows.length; i++) {
        ctx.lineTo(rows[i].p1.x + rows[i].p1.w * factor, rows[i].p1.y);
      }
      ctx.lineTo(far.p2.x + far.p2.w * factor, far.p2.y);
      ctx.closePath();
    };

    strip(1.065);
    ctx.fillStyle = shoulderColor;
    ctx.fill();

    strip(1);
    const roadFill = ctx.createLinearGradient(0, far.p2.y, 0, near.p1.y);
    roadFill.addColorStop(0, mixHex(asphalt, p.fog, 0.32));
    roadFill.addColorStop(0.35, mixHex(asphalt, p.fog, 0.08));
    roadFill.addColorStop(1, asphalt);
    ctx.fillStyle = roadFill;
    ctx.fill();

    const band = (inner: number, outer: number, color: string) => {
      ctx.beginPath();
      ctx.moveTo(far.p2.x + far.p2.w * inner, far.p2.y);
      for (let i = rows.length - 1; i >= 0; i--) {
        ctx.lineTo(rows[i].p1.x + rows[i].p1.w * inner, rows[i].p1.y);
      }
      for (let i = 0; i < rows.length; i++) {
        ctx.lineTo(rows[i].p1.x + rows[i].p1.w * outer, rows[i].p1.y);
      }
      ctx.lineTo(far.p2.x + far.p2.w * outer, far.p2.y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    band(-0.56, -0.34, "rgba(5, 8, 7, 0.09)");
    band(0.34, 0.56, "rgba(5, 8, 7, 0.09)");

    // Two edge strokes and one dashed centreline replace hundreds of tiny
    // per-segment quads. At 60 fps this is the difference between a road and
    // a flip book.
    ctx.strokeStyle = rgba(p.edge, 0.58);
    ctx.lineWidth = 1.45;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(far.p2.x + side * far.p2.w, far.p2.y);
      for (let i = rows.length - 1; i >= 0; i--) {
        ctx.lineTo(rows[i].p1.x + side * rows[i].p1.w, rows[i].p1.y);
      }
      ctx.stroke();
    }

    ctx.save();
    ctx.strokeStyle = rgba(p.edge, 0.46);
    ctx.lineWidth = 2.1;
    ctx.setLineDash([13, 17]);
    ctx.beginPath();
    ctx.moveTo(far.p2.x, far.p2.y);
    for (let i = rows.length - 1; i >= 0; i--) ctx.lineTo(rows[i].p1.x, rows[i].p1.y);
    ctx.stroke();
    ctx.restore();

    // Sparse guard posts near the camera give the verge scale.
    for (let i = 0; i < Math.min(rows.length, 90); i += 12) {
      const row = rows[i];
      if (row.fog > 0.55) continue;
      const postH = Math.max(2, row.p1.w * 0.095);
      const postW = Math.max(1, row.p1.w * 0.011);
      ctx.fillStyle = rgba(p.edge, 0.29 * (1 - row.fog));
      ctx.fillRect(row.p1.x - row.p1.w * 1.14 - postW, row.p1.y - postH, postW, postH);
      ctx.fillRect(row.p1.x + row.p1.w * 1.14, row.p1.y - postH, postW, postH);
    }

    // Hazards, motes, scenery and the checkpoint arch sit on top of the road.
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      const segRoad = ROADS[row.seg.road - 1] ?? road;
      if (row.seg.hazard) this.drawHazard(row, segRoad);
      if (row.seg.mote && !row.seg.mote.taken) this.drawMote(row, segRoad);
      if (row.seg.props.length) this.drawProps(row, segRoad);
      if (row.seg.gate) this.drawGate(row, segRoad);
    }

    this.drawActors(rows, road);
  }

  private drawActors(rows: Row[], road: RoadDef) {
    const world = this.world;
    if (!world || this.phase === "idle" || rows.length < 2) return;
    const minZ = rows[0].seg.z;
    const maxZ = rows[rows.length - 1].seg.z + SEG;
    const actors: { z: number; vehicle?: TrafficVehicle; ghost?: GhostRival }[] = [];

    for (const vehicle of world.traffic) {
      if (vehicle.z < minZ || vehicle.z > maxZ || vehicle.z < this.x - 40) continue;
      actors.push({ z: vehicle.z, vehicle });
    }
    for (const ghost of this.ghosts) {
      if (ghost.finished || ghost.z < minZ || ghost.z > maxZ || ghost.z < this.x - 40) continue;
      actors.push({ z: ghost.z, ghost });
    }

    actors.sort((a, b) => b.z - a.z);
    for (const actor of actors) {
      const proj = this.actorAt(rows, actor.z);
      if (!proj) continue;
      if (actor.vehicle) this.drawVehicle(proj, actor.vehicle, road);
      else if (actor.ghost) this.drawGhost(proj, actor.ghost, road);
    }
  }

  private actorAt(rows: Row[], z: number): { x: number; y: number; w: number; fog: number } | null {
    const raw = (z - rows[0].seg.z) / SEG;
    const index = Math.floor(raw);
    if (index < 0 || index >= rows.length - 1) return null;
    const t = raw - index;
    const row = rows[index];
    const next = row.p2;
    return {
      x: row.p1.x + (next.x - row.p1.x) * t,
      y: row.p1.y + (next.y - row.p1.y) * t,
      w: row.p1.w + (next.w - row.p1.w) * t,
      fog: row.fog,
    };
  }

  private drawVehicle(
    proj: { x: number; y: number; w: number; fog: number },
    vehicle: TrafficVehicle,
    road: RoadDef,
  ) {
    const { ctx } = this;
    const alpha = clamp(1.35 - proj.fog * 1.2, 0.14, 1);
    const h = clamp(proj.w * 0.36, 3, this.H * 0.5);
    const w = h * (vehicle.kind === "van" ? 0.98 : 0.92);
    const x = proj.x + vehicle.lat * proj.w;
    const ground = proj.y;
    const color = mixHex(vehicle.color, road.palette.fog, proj.fog * 0.4);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    ctx.ellipse(x, ground + 1, w * 0.58, h * 0.1, 0, 0, STEP_2);
    ctx.fill();

    const bodyFill = ctx.createLinearGradient(0, ground - h, 0, ground);
    bodyFill.addColorStop(0, mixHex(color, "#d8d3c3", 0.17));
    bodyFill.addColorStop(0.58, color);
    bodyFill.addColorStop(1, mixHex(color, "#070b0b", 0.34));
    const outline = "rgba(4, 7, 8, 0.55)";
    ctx.lineWidth = Math.max(0.6, h * 0.008);
    ctx.strokeStyle = outline;

    if (vehicle.kind === "van") {
      ctx.fillStyle = bodyFill;
      ctx.beginPath();
      ctx.roundRect(x - w * 0.5, ground - h * 0.94, w, h * 0.8, h * 0.08);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = mixHex(color, "#0b1214", 0.4);
      ctx.beginPath();
      ctx.roundRect(x - w * 0.38, ground - h * 0.84, w * 0.76, h * 0.28, h * 0.04);
      ctx.fill();
      ctx.fillStyle = "rgba(183, 209, 214, 0.2)";
      ctx.fillRect(x - w * 0.42, ground - h * 0.58, w * 0.84, h * 0.04);
      ctx.strokeStyle = "rgba(5, 9, 10, 0.35)";
      ctx.beginPath();
      ctx.moveTo(x, ground - h * 0.56);
      ctx.lineTo(x, ground - h * 0.18);
      ctx.stroke();
      ctx.fillStyle = "rgba(5, 9, 10, 0.35)";
      ctx.fillRect(x - w * 0.2, ground - h * 0.46, w * 0.06, h * 0.025);
      ctx.fillRect(x + w * 0.14, ground - h * 0.46, w * 0.06, h * 0.025);
    } else if (vehicle.kind === "pickup") {
      ctx.fillStyle = bodyFill;
      ctx.beginPath();
      ctx.roundRect(x - w * 0.5, ground - h * 0.58, w, h * 0.5, h * 0.05);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(x - w * 0.42, ground - h * 0.9, w * 0.84, h * 0.4, h * 0.06);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = mixHex(color, "#0b1214", 0.44);
      ctx.beginPath();
      ctx.roundRect(x - w * 0.3, ground - h * 0.82, w * 0.6, h * 0.2, h * 0.03);
      ctx.fill();
      ctx.fillStyle = "rgba(207, 221, 216, 0.14)";
      ctx.fillRect(x - w * 0.28, ground - h * 0.79, w * 0.2, h * 0.025);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.moveTo(x - w * 0.36, ground - h * 0.5);
      ctx.lineTo(x + w * 0.36, ground - h * 0.5);
      ctx.stroke();
      ctx.fillStyle = "rgba(5, 9, 10, 0.38)";
      ctx.fillRect(x - w * 0.06, ground - h * 0.44, w * 0.12, h * 0.025);
    } else {
      ctx.fillStyle = bodyFill;
      ctx.beginPath();
      ctx.roundRect(x - w * 0.5, ground - h * 0.55, w, h * 0.46, h * 0.07);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - w * 0.4, ground - h * 0.55);
      ctx.quadraticCurveTo(x - w * 0.34, ground - h * 0.82, x - w * 0.08, ground - h * 0.84);
      ctx.lineTo(x + w * 0.08, ground - h * 0.84);
      ctx.quadraticCurveTo(x + w * 0.34, ground - h * 0.82, x + w * 0.4, ground - h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = mixHex(color, "#0b1214", 0.44);
      ctx.beginPath();
      ctx.roundRect(x - w * 0.27, ground - h * 0.76, w * 0.54, h * 0.19, h * 0.03);
      ctx.fill();
      ctx.fillStyle = "rgba(207, 221, 216, 0.14)";
      ctx.fillRect(x - w * 0.24, ground - h * 0.735, w * 0.17, h * 0.022);
      ctx.fillStyle = "rgba(5, 9, 10, 0.35)";
      ctx.fillRect(x - w * 0.22, ground - h * 0.32, w * 0.44, h * 0.018);
    }

    // Tyres and a slim hub sit over the lower body, so the vehicle reads as
    // planted instead of a floating rectangle.
    ctx.fillStyle = "#0d1112";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(x + side * w * 0.46 - w * 0.065, ground - h * 0.19, w * 0.13, h * 0.19, h * 0.025);
      ctx.fill();
      ctx.fillStyle = "rgba(154, 158, 148, 0.24)";
      ctx.fillRect(x + side * w * 0.46 - w * 0.035, ground - h * 0.14, w * 0.07, h * 0.025);
      ctx.fillStyle = "#0d1112";
    }

    const light = Math.max(1, h * 0.075);
    ctx.fillStyle = "rgba(255, 78, 56, 0.88)";
    ctx.fillRect(x - w * 0.42, ground - h * (vehicle.kind === "van" ? 0.32 : 0.3), light * 1.6, light);
    ctx.fillRect(x + w * 0.42 - light * 1.6, ground - h * (vehicle.kind === "van" ? 0.32 : 0.3), light * 1.6, light);
    ctx.fillStyle = "rgba(223, 229, 218, 0.32)";
    ctx.fillRect(x - w * 0.12, ground - h * 0.22, w * 0.24, h * 0.07);
    ctx.restore();
  }

  private drawGhost(
    proj: { x: number; y: number; w: number; fog: number },
    ghost: GhostRival,
    road: RoadDef,
  ) {
    const { ctx } = this;
    const h = clamp(proj.w * 0.42, 3, this.H * 0.52);
    const x = proj.x + ghost.lat * proj.w;
    const ground = proj.y;
    const alpha = clamp(1.15 - proj.fog * 0.95, 0.12, 0.58);
    const color = mixHex(ghost.color, road.palette.fog, proj.fog * 0.3);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(x, ground + 1, h * 0.24, h * 0.045, 0, 0, STEP_2);
    ctx.fill();

    // A soft vertical trail sells the ghost without turning it into a neon blob.
    const aura = ctx.createLinearGradient(x, ground - h * 1.1, x, ground);
    aura.addColorStop(0, rgba(color, 0));
    aura.addColorStop(0.7, rgba(color, 0.1));
    aura.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = aura;
    ctx.fillRect(x - h * 0.28, ground - h * 1.1, h * 0.56, h * 1.1);

    ctx.strokeStyle = rgba(color, 0.9);
    ctx.fillStyle = rgba(color, 0.5);
    ctx.lineWidth = Math.max(1, h * 0.024);
    // Wheels and frame, drawn as a spare rear view.
    ctx.beginPath();
    ctx.ellipse(x, ground - h * 0.11, h * 0.2, h * 0.2, 0, 0, STEP_2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, ground - h * 0.26);
    ctx.lineTo(x - h * 0.1, ground - h * 0.52);
    ctx.lineTo(x, ground - h * 0.62);
    ctx.lineTo(x + h * 0.1, ground - h * 0.52);
    ctx.closePath();
    ctx.fill();
    // Torso, shoulders, helmet.
    ctx.beginPath();
    ctx.moveTo(x - h * 0.12, ground - h * 0.62);
    ctx.lineTo(x - h * 0.16, ground - h * 0.84);
    ctx.quadraticCurveTo(x, ground - h * 0.95, x + h * 0.16, ground - h * 0.84);
    ctx.lineTo(x + h * 0.12, ground - h * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, ground - h * 0.93, h * 0.065, 0, STEP_2);
    ctx.fill();
    ctx.lineWidth = Math.max(1, h * 0.018);
    ctx.beginPath();
    ctx.moveTo(x - h * 0.13, ground - h * 0.82);
    ctx.lineTo(x - h * 0.22, ground - h * 0.66);
    ctx.moveTo(x + h * 0.13, ground - h * 0.82);
    ctx.lineTo(x + h * 0.22, ground - h * 0.66);
    ctx.stroke();
    ctx.restore();

    if (h > 34 && proj.fog < 0.82) {
      const label = ghost.name.split(" ")[0];
      const font = Math.max(8, h * 0.095);
      ctx.save();
      ctx.font = `600 ${font}px Inter, system-ui, sans-serif`;
      const width = ctx.measureText(label).width + font * 1.1;
      const top = ground - h * 1.2;
      ctx.fillStyle = "rgba(5, 9, 12, 0.62)";
      ctx.beginPath();
      ctx.roundRect(x - width / 2, top - font * 1.35, width, font * 1.45, font * 0.4);
      ctx.fill();
      ctx.fillStyle = rgba(color, 0.92);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, top - font * 0.6);
      ctx.restore();
    }
  }

  private drawHazard(row: Row, road: RoadDef) {
    const { ctx } = this;
    const p = road.palette;
    const { p1, seg, fog } = row;
    const h = seg.hazard;
    if (!h) return;
    const x = p1.x + h.lat * p1.w;
    const size = Math.max(1.5, p1.scale * h.height * (this.H / 2));
    const alpha = clamp(1.2 - fog * 1.1, 0.18, 1);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(x, p1.y + 1, size * 0.9, size * 0.17, 0, 0, STEP_2);
    ctx.fill();

    if (h.kind === "pothole") {
      ctx.fillStyle = mixHex(p.deep, "#000000", 0.35);
      ctx.beginPath();
      ctx.ellipse(x, p1.y + 1, size * 1.5, size * 0.28, 0, 0, STEP_2);
      ctx.fill();
      ctx.strokeStyle = rgba(p.edge, 0.3);
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (h.kind === "log") {
      const width = Math.max(3, p1.w * h.width * 3.1);
      const height = Math.max(2, size * 0.55);
      ctx.fillStyle = mixHex("#6a4a32", p.fog, fog * 0.55);
      ctx.beginPath();
      ctx.roundRect(x - width / 2, p1.y - height * 0.55, width, height, height * 0.4);
      ctx.fill();
      ctx.strokeStyle = "rgba(228, 205, 168, 0.32)";
      ctx.lineWidth = Math.max(1, height * 0.09);
      ctx.beginPath();
      ctx.arc(x - width * 0.32, p1.y - height * 0.15, height * 0.28, 0, STEP_2);
      ctx.stroke();
      ctx.fillStyle = rgba(p.edge, 0.6);
      ctx.fillRect(x - width * 0.08, p1.y - height * 0.82, width * 0.16, height * 0.12);
    } else {
      const width = Math.max(3, p1.w * h.width * 2.7);
      const height = Math.max(2, size * 0.85);
      ctx.fillStyle = mixHex("#4b4a45", p.fog, fog * 0.55);
      ctx.beginPath();
      ctx.moveTo(x - width * 0.55, p1.y);
      ctx.lineTo(x - width * 0.36, p1.y - height * 0.78);
      ctx.lineTo(x - width * 0.04, p1.y - height);
      ctx.lineTo(x + width * 0.35, p1.y - height * 0.65);
      ctx.lineTo(x + width * 0.52, p1.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(232, 222, 202, 0.16)";
      ctx.beginPath();
      ctx.moveTo(x - width * 0.36, p1.y - height * 0.78);
      ctx.lineTo(x - width * 0.04, p1.y - height);
      ctx.lineTo(x + width * 0.08, p1.y - height * 0.72);
      ctx.lineTo(x - width * 0.22, p1.y - height * 0.58);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawMote(row: Row, road: RoadDef) {
    const { ctx } = this;
    const p = road.palette;
    const { p1, seg, fog } = row;
    const mote = seg.mote;
    if (!mote) return;
    const x = p1.x + mote.lat * p1.w;
    const bob = Math.sin(this.weatherClock * 2 + mote.phase) * Math.max(1, p1.w * 0.035);
    const y = p1.y - p1.w * 0.24 + bob;
    const r = Math.max(1.3, p1.w * 0.024);
    const alpha = clamp(1.1 - fog, 0.2, 1);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 5.5);
    glow.addColorStop(0, rgba(p.sun, 0.52 * alpha));
    glow.addColorStop(0.4, rgba(p.sun, 0.2 * alpha));
    glow.addColorStop(1, rgba(p.sun, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
    ctx.fillStyle = rgba(p.sun, 0.92 * alpha);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, STEP_2);
    ctx.fill();
  }

  private propSprite(road: RoadDef, prop: Prop): HTMLCanvasElement | null {
    const variant = Math.abs(Math.floor(prop.seed)) % 4;
    const key = `${road.number}:${prop.kind}:${variant}`;
    const cached = this.spriteCache.get(key);
    if (cached) return cached;
    const aspect =
      prop.kind === "pine" ? 0.3 : prop.kind === "rock" ? 0.55 : prop.kind === "dead" ? 0.34 : 0.42;
    const height = 384;
    const width = Math.max(48, Math.round(height * aspect));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const g = canvas.getContext("2d");
    if (!g) return null;
    const p = road.palette;
    const color =
      prop.kind === "rock"
        ? mixHex(p.ridgeMid, p.deep, 0.38)
        : mixHex(p.ridgeNear, "#000000", 0.24);
    g.translate(width / 2, height);
    const drawW = width * 0.94;
    if (prop.kind === "pine") {
      this.drawPine(g, 0, 0, drawW, height * 0.94, color, p, prop.seed);
    } else if (prop.kind === "rock") {
      this.drawRock(g, 0, 0, drawW, height * 0.8, color, prop.seed);
    } else if (prop.kind === "shrub") {
      this.drawShrub(g, 0, 0, drawW, height * 0.9, color, prop.seed);
    } else {
      this.drawDeadTree(g, 0, 0, drawW, height * 0.94, color);
    }
    this.spriteCache.set(key, canvas);
    return canvas;
  }

  private drawProps(row: Row, road: RoadDef) {
    const { ctx } = this;
    const { p1, seg, fog } = row;
    for (const prop of seg.props) {
      const x = p1.x + prop.lat * p1.w;
      const h = Math.min(this.H * 0.92, Math.max(2, p1.scale * prop.height * (this.H / 2)));
      const aspect =
        prop.kind === "pine" ? 0.3 : prop.kind === "rock" ? 0.55 : prop.kind === "dead" ? 0.34 : 0.42;
      const w = h * aspect;
      if (x < -w * 2 || x > this.W + w * 2) continue;
      const sprite = this.propSprite(road, prop);
      if (!sprite) continue;
      const alpha = clamp(1.08 - fog * 0.8, 0.22, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, x - w / 2, p1.y - h, w, h);
      ctx.restore();
    }
  }

  private drawPine(
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    w: number,
    h: number,
    color: string,
    p: RoadPalette,
    seed: number,
  ) {
    const lean = (hash01(seed) - 0.5) * w * 0.12;
    const trunkW = Math.max(1, w * 0.09);
    ctx.fillStyle = mixHex(color, "#000000", 0.25);
    ctx.fillRect(x - trunkW / 2, base - h * 0.34, trunkW, h * 0.34);
    for (let layer = 0; layer < 4; layer++) {
      const ly = base - h * (0.18 + layer * 0.2);
      const lw = w * (1 - layer * 0.18);
      const lh = h * (0.34 - layer * 0.035);
      ctx.fillStyle = layer === 3 ? mixHex(color, p.edge, 0.09) : color;
      ctx.beginPath();
      ctx.moveTo(x - lw * 0.5 + lean, ly);
      ctx.lineTo(x - lw * 0.18 + lean, ly - lh * 0.18);
      ctx.lineTo(x - lw * 0.26 + lean, ly - lh * 0.26);
      ctx.lineTo(x + lean, ly - lh);
      ctx.lineTo(x + lw * 0.25 + lean, ly - lh * 0.24);
      ctx.lineTo(x + lw * 0.18 + lean, ly - lh * 0.16);
      ctx.lineTo(x + lw * 0.5 + lean, ly);
      ctx.closePath();
      ctx.fill();
    }
    if (p.ridgeFar === ROADS[2].palette.ridgeFar) {
      ctx.fillStyle = rgba(p.edge, 0.24);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.14, base - h * 0.67);
      ctx.lineTo(x, base - h * 0.83);
      ctx.lineTo(x + w * 0.16, base - h * 0.66);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawRock(
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    w: number,
    h: number,
    color: string,
    seed: number,
  ) {
    const skew = (hash01(seed) - 0.5) * w * 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.55, base);
    ctx.lineTo(x - w * 0.4 + skew, base - h * 0.55);
    ctx.lineTo(x - w * 0.08 + skew, base - h);
    ctx.lineTo(x + w * 0.32, base - h * 0.6);
    ctx.lineTo(x + w * 0.55, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(235, 226, 208, 0.12)";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.4 + skew, base - h * 0.55);
    ctx.lineTo(x - w * 0.08 + skew, base - h);
    ctx.lineTo(x + w * 0.06, base - h * 0.56);
    ctx.closePath();
    ctx.fill();
  }

  private drawShrub(
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    w: number,
    h: number,
    color: string,
    seed: number,
  ) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, w * 0.07);
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const angle = -1.2 + (i / 4) * 1.9 + (hash01(seed + i) - 0.5) * 0.35;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(
        x + Math.cos(angle) * w * 0.18,
        base - h * 0.45,
        x + Math.cos(angle) * w * 0.45,
        base - h * (0.45 + hash01(seed + i * 3) * 0.45),
      );
      ctx.stroke();
    }
  }

  private drawDeadTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    w: number,
    h: number,
    color: string,
  ) {
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1, w * 0.09);
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x + w * 0.04, base - h * 0.78);
    ctx.stroke();
    ctx.lineWidth = Math.max(0.8, w * 0.045);
    for (let i = 0; i < 4; i++) {
      const y = base - h * (0.4 + i * 0.12);
      const dir = i % 2 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.02, y);
      ctx.lineTo(x + dir * w * (0.28 + i * 0.03), y - h * 0.12);
      ctx.stroke();
    }
  }

  private drawGate(row: Row, road: RoadDef) {
    const { ctx } = this;
    const { p1, seg, fog } = row;
    if (!seg.gate) return;
    const h = Math.max(3, p1.scale * 920 * (this.H / 2));
    const gateW = p1.w * 2.3;
    const postW = Math.max(1, gateW * 0.035);
    const top = p1.y - h;
    const bannerH = Math.max(3, h * 0.17);
    const alpha = clamp(1.6 - fog * 0.55, 0.82, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = mixHex(road.palette.deep, road.palette.edge, 0.16);
    ctx.fillRect(p1.x - gateW / 2, top, postW, h);
    ctx.fillRect(p1.x + gateW / 2 - postW, top, postW, h);
    ctx.fillStyle = "rgba(7, 10, 12, 0.82)";
    ctx.fillRect(p1.x - gateW / 2, top + h * 0.08, gateW, bannerH);
    ctx.strokeStyle = rgba(road.palette.edge, 0.75);
    ctx.lineWidth = Math.max(1, h * 0.004);
    ctx.strokeRect(p1.x - gateW / 2, top + h * 0.08, gateW, bannerH);
    if (gateW > 82) {
      ctx.fillStyle = road.palette.edge;
      ctx.font = `700 ${Math.max(7, Math.min(22, bannerH * 0.5))}px "Archivo", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`CHECKPOINT ${String(seg.gate).padStart(2, "0")}`, p1.x, top + h * 0.08 + bannerH * 0.52);
    }
    ctx.fillStyle = rgba(road.palette.edge, 0.9);
    const lamp = Math.max(1, h * 0.012);
    ctx.beginPath();
    ctx.arc(p1.x - gateW / 2 + postW / 2, top + h * 0.06, lamp, 0, STEP_2);
    ctx.arc(p1.x + gateW / 2 - postW / 2, top + h * 0.06, lamp, 0, STEP_2);
    ctx.fill();
    ctx.restore();
  }

  private drawRider(road: RoadDef) {
    const { ctx, W, H } = this;
    const baseY = this.horizon + PLAYER_SCALE * CAMERA_HEIGHT * (H / 2);
    const s = clamp(H * 0.315, 156, 304);
    const lean = this.steer * 0.16 + this.riderLat * 0.08;
    const crank = this.weatherClock * (2.4 + this.speed * 0.017);
    const bob = Math.sin(crank * 2) * s * 0.006;
    const x = W / 2 + this.riderLat * W * 0.038;

    ctx.save();
    ctx.translate(x, baseY + bob);
    ctx.rotate(lean);

    if (this.phase === "crash") {
      const progress = clamp(1 - this.crashTimer / 1.15, 0, 1);
      ctx.translate(0, s * 0.8 * progress);
      ctx.rotate(this.crashDir * progress * 1.05);
    } else if (this.phase === "finish") {
      ctx.rotate(-0.03);
    }

    // Ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.beginPath();
    ctx.ellipse(0, 2, s * 0.29, s * 0.045, 0, 0, STEP_2);
    ctx.fill();

    const tire = "#0b1012";
    const rim = "#9aa0a0";
    const frame = "#1b2824";
    const jersey = "#e7dcc6";
    const jerseyShade = "#c9bfa9";
    const shorts = "#20272a";
    const brass = "#c9a25a";

    // Rear wheel. A narrow ellipse reads as a wheel seen from directly behind.
    ctx.strokeStyle = tire;
    ctx.lineWidth = s * 0.034;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.165, s * 0.083, s * 0.165, 0, 0, STEP_2);
    ctx.stroke();
    ctx.strokeStyle = rgba(rim, 0.72);
    ctx.lineWidth = Math.max(0.8, s * 0.006);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.165, s * 0.057, s * 0.12, 0, 0, STEP_2);
    ctx.stroke();
    const wheelAngle = crank * 0.55;
    for (let i = 0; i < 6; i++) {
      const a = wheelAngle + (i / 6) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.165);
      ctx.lineTo(Math.cos(a) * s * 0.057, -s * 0.165 + Math.sin(a) * s * 0.12);
      ctx.stroke();
    }
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(0, -s * 0.165, Math.max(1, s * 0.008), 0, STEP_2);
    ctx.fill();

    // Rear triangle and seatpost
    ctx.strokeStyle = frame;
    ctx.lineCap = "round";
    ctx.lineWidth = s * 0.026;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.165);
    ctx.lineTo(-s * 0.055, -s * 0.43);
    ctx.moveTo(0, -s * 0.165);
    ctx.lineTo(s * 0.055, -s * 0.43);
    ctx.stroke();
    ctx.lineWidth = s * 0.022;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(0, -s * 0.47);
    ctx.stroke();

    // Saddle
    ctx.fillStyle = "#171b1c";
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.474, s * 0.115, s * 0.026, 0, 0, STEP_2);
    ctx.fill();
    ctx.fillStyle = "#2b3031";
    ctx.beginPath();
    ctx.ellipse(-s * 0.025, -s * 0.477, s * 0.065, s * 0.012, 0, 0, STEP_2);
    ctx.fill();

    // Rear light
    ctx.fillStyle = this.brake ? "rgba(255, 92, 78, 0.95)" : "rgba(196, 64, 54, 0.7)";
    ctx.fillRect(-s * 0.016, -s * 0.45, s * 0.032, s * 0.012);
    if (this.brake) {
      const glow = ctx.createRadialGradient(0, -s * 0.444, 0, 0, -s * 0.444, s * 0.14);
      glow.addColorStop(0, "rgba(255, 72, 58, 0.28)");
      glow.addColorStop(1, "rgba(255, 72, 58, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-s * 0.16, -s * 0.58, s * 0.32, s * 0.28);
    }

    // Legs behind the torso, pedalling in opposition.
    const crankCenter = -s * 0.19;
    const crankR = s * 0.078;
    for (let leg = 0; leg < 2; leg++) {
      const phase = crank + (leg === 0 ? 0 : Math.PI);
      const pedalX = Math.cos(phase) * crankR * 0.72 + (leg === 0 ? -s * 0.055 : s * 0.055);
      const pedalY = crankCenter + Math.sin(phase) * crankR;
      const hipX = leg === 0 ? -s * 0.068 : s * 0.068;
      const kneeX = hipX + (leg === 0 ? -s * 0.1 : s * 0.1);
      const kneeY = -s * 0.31;
      ctx.strokeStyle = shorts;
      ctx.lineWidth = s * 0.074;
      ctx.beginPath();
      ctx.moveTo(hipX, -s * 0.445);
      ctx.quadraticCurveTo(kneeX, kneeY, pedalX, pedalY - s * 0.015);
      ctx.stroke();
      ctx.strokeStyle = leg === 0 ? "#191d1f" : "#252b2d";
      ctx.lineWidth = s * 0.058;
      ctx.beginPath();
      ctx.moveTo(kneeX, kneeY);
      ctx.lineTo(pedalX, pedalY - s * 0.01);
      ctx.stroke();
      ctx.fillStyle = "#0d1112";
      ctx.beginPath();
      ctx.ellipse(pedalX, pedalY, s * 0.042, s * 0.018, 0, 0, STEP_2);
      ctx.fill();
    }

    // Crank arms and pedals, glimpsed either side of the frame.
    ctx.strokeStyle = "#3d4645";
    ctx.lineWidth = s * 0.012;
    for (let leg = 0; leg < 2; leg++) {
      const phase = crank + (leg === 0 ? 0 : Math.PI);
      const pedalX = Math.cos(phase) * crankR * 0.72 + (leg === 0 ? -s * 0.055 : s * 0.055);
      const pedalY = crankCenter + Math.sin(phase) * crankR;
      ctx.beginPath();
      ctx.moveTo(0, crankCenter);
      ctx.lineTo(pedalX, pedalY);
      ctx.stroke();
    }

    // Torso: broad shoulders, narrow waist, subtle embroidered band.
    ctx.fillStyle = shorts;
    ctx.beginPath();
    ctx.moveTo(-s * 0.105, -s * 0.46);
    ctx.quadraticCurveTo(-s * 0.13, -s * 0.52, -s * 0.1, -s * 0.56);
    ctx.lineTo(s * 0.1, -s * 0.56);
    ctx.quadraticCurveTo(s * 0.13, -s * 0.52, s * 0.105, -s * 0.46);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = jersey;
    ctx.beginPath();
    ctx.moveTo(-s * 0.098, -s * 0.555);
    ctx.quadraticCurveTo(-s * 0.16, -s * 0.63, -s * 0.155, -s * 0.7);
    ctx.quadraticCurveTo(-s * 0.12, -s * 0.77, 0, -s * 0.785);
    ctx.quadraticCurveTo(s * 0.12, -s * 0.77, s * 0.155, -s * 0.7);
    ctx.quadraticCurveTo(s * 0.16, -s * 0.63, s * 0.098, -s * 0.555);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = jerseyShade;
    ctx.beginPath();
    ctx.moveTo(-s * 0.06, -s * 0.58);
    ctx.lineTo(-s * 0.02, -s * 0.58);
    ctx.lineTo(-s * 0.06, -s * 0.75);
    ctx.lineTo(-s * 0.1, -s * 0.69);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = brass;
    ctx.fillRect(-s * 0.007, -s * 0.752, s * 0.014, s * 0.185);
    ctx.fillStyle = "rgba(18, 24, 24, 0.22)";
    ctx.fillRect(-s * 0.098, -s * 0.595, s * 0.062, s * 0.006);
    ctx.fillRect(s * 0.036, -s * 0.595, s * 0.062, s * 0.006);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = Math.max(0.7, s * 0.0025);
    ctx.beginPath();
    ctx.moveTo(-s * 0.105, -s * 0.745);
    ctx.quadraticCurveTo(0, -s * 0.775, s * 0.105, -s * 0.745);
    ctx.stroke();

    // Neck and helmet.
    ctx.fillStyle = "#b98f70";
    ctx.fillRect(-s * 0.025, -s * 0.795, s * 0.05, s * 0.03);
    ctx.fillStyle = "#e3d8c4";
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.84, s * 0.073, s * 0.064, 0, 0, STEP_2);
    ctx.fill();
    ctx.fillStyle = "#283130";
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.865, s * 0.074, s * 0.028, 0, 0, Math.PI, true);
    ctx.fill();
    ctx.fillStyle = brass;
    ctx.fillRect(-s * 0.066, -s * 0.85, s * 0.132, s * 0.009);
    ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
    ctx.beginPath();
    ctx.ellipse(-s * 0.022, -s * 0.872, s * 0.022, s * 0.009, -0.2, 0, STEP_2);
    ctx.fill();

    // Arms: sleeves to the elbow, bare forearms, dark gloves on the bars.
    for (let arm = 0; arm < 2; arm++) {
      const dir = arm === 0 ? -1 : 1;
      const shoulderX = dir * s * 0.12;
      const shoulderY = -s * 0.71;
      const elbowX = dir * s * 0.17;
      const elbowY = -s * 0.628;
      const handX = dir * s * 0.148;
      const handY = -s * 0.728;
      ctx.strokeStyle = jersey;
      ctx.lineWidth = s * 0.061;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.quadraticCurveTo(dir * s * 0.16, -s * 0.685, elbowX, elbowY);
      ctx.stroke();
      ctx.strokeStyle = "#bd9375";
      ctx.lineWidth = s * 0.043;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.quadraticCurveTo(dir * s * 0.158, -s * 0.685, handX, handY);
      ctx.stroke();
      ctx.fillStyle = "#151a1b";
      ctx.beginPath();
      ctx.arc(handX, handY, s * 0.026, 0, STEP_2);
      ctx.fill();
    }

    // Handlebar and brake hoods sit in front of the hands.
    ctx.strokeStyle = "#101615";
    ctx.lineWidth = s * 0.026;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-s * 0.17, -s * 0.728);
    ctx.quadraticCurveTo(0, -s * 0.744, s * 0.17, -s * 0.728);
    ctx.stroke();
    ctx.strokeStyle = "#3c4744";
    ctx.lineWidth = s * 0.012;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.74);
    ctx.lineTo(0, -s * 0.67);
    ctx.stroke();

    if (this.phase === "finish") {
      ctx.strokeStyle = jersey;
      ctx.lineWidth = s * 0.062;
      ctx.beginPath();
      ctx.moveTo(s * 0.13, -s * 0.7);
      ctx.lineTo(s * 0.25, -s * 0.94);
      ctx.stroke();
      ctx.fillStyle = "#bd9375";
      ctx.beginPath();
      ctx.arc(s * 0.255, -s * 0.96, s * 0.029, 0, STEP_2);
      ctx.fill();
    }

    // A little speed shimmer at the shoulders, not a neon aura.
    if (this.speed > 320 && !this.calm) {
      ctx.strokeStyle = rgba(road.palette.edge, 0.12);
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const off = (this.weatherClock * 80 + i * 23) % 46;
        ctx.beginPath();
        ctx.moveTo(-s * 0.18 - off, -s * 0.78 + i * 5);
        ctx.lineTo(-s * 0.18 - off - 12, -s * 0.78 + i * 5);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawParticles() {
    const { ctx } = this;
    for (const p of this.particles) {
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, a) * 0.6;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, STEP_2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawWeather(road: RoadDef) {
    const { ctx } = this;
    for (const p of this.weather) {
      ctx.globalAlpha = p.alpha;
      if (road.weather === "rain" || road.weather === "wind") {
        ctx.strokeStyle = road.weather === "rain" ? "#d7e5f5" : "#e6ecec";
        ctx.lineWidth = road.weather === "rain" ? 1 : 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (road.weather === "rain" ? p.size * 0.22 : p.size), p.y + (road.weather === "rain" ? p.size : 1));
        ctx.stroke();
      } else {
        ctx.fillStyle = road.weather === "embers" ? "#ffb36c" : road.weather === "snow" ? "#ecf3ff" : "#f3dfb0";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, STEP_2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawSpeedLines(road: RoadDef) {
    if (this.speed < 280 || this.calm) return;
    const { ctx, W, H } = this;
    const strength = clamp((this.speed - 280) / 190, 0, 1);
    ctx.strokeStyle = rgba(road.palette.edge, 0.1 * strength);
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const y = H * 0.58 + hash01(i * 4.1) * H * 0.3;
      const len = 18 + hash01(i * 2.7) * 64;
      const drift = (this.weatherClock * 260 + hash01(i) * 200) % (W * 0.45);
      ctx.beginPath();
      ctx.moveTo(side < 0 ? 10 + drift : W - 10 - drift, y);
      ctx.lineTo(side < 0 ? 10 + drift - len : W - 10 - drift + len, y);
      ctx.stroke();
    }
  }

  private drawBolt() {
    const { ctx, W, H } = this;
    const x = W * (0.28 + hash01(Math.floor(this.weatherClock * 2)) * 0.44);
    ctx.strokeStyle = "rgba(226, 238, 255, 0.72)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, H * 0.08);
    let y = H * 0.08;
    let cx = x;
    for (let i = 0; i < 6; i++) {
      cx += (Math.random() - 0.5) * 34;
      y += H * 0.035;
      ctx.lineTo(cx, y);
    }
    ctx.stroke();
  }

  private drawVignette(p: RoadPalette) {
    const { ctx, W, H } = this;
    const vignette = ctx.createRadialGradient(W * 0.52, H * 0.52, H * 0.28, W * 0.5, H * 0.5, H * 0.92);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    const bottom = ctx.createLinearGradient(0, H * 0.8, 0, H);
    bottom.addColorStop(0, "rgba(0, 0, 0, 0)");
    bottom.addColorStop(1, rgba(p.deep, 0.3));
    ctx.fillStyle = bottom;
    ctx.fillRect(0, H * 0.8, W, H * 0.2);
  }
}
