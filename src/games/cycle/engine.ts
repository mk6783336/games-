import { mulberry32 } from "../../lib/daily";

export type CycleCue = "fuel" | "crash" | "clear" | "start" | "air" | "flip" | "coin";

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

export type CycleWeather = "pollen" | "snow" | "embers";

export interface RoadDef {
  number: number;
  name: string;
  subtitle: string;
  length: number;
  difficulty: number;
  /** Cinematic scene flags consumed by the renderer. */
  night?: boolean;
  weather?: CycleWeather;
  palette: RoadPalette;
}

export const ROADS: RoadDef[] = [
  {
    number: 1,
    name: "Green Hills",
    subtitle: "Gentle slopes to learn the throttle.",
    length: 48_000,
    difficulty: 1,
    weather: "pollen",
    palette: {
      skyTop: "#123f78",
      skyBottom: "#8fd0ea",
      sun: "#ffedd2",
      glow: "rgba(255, 237, 210, 0.42)",
      ridgeFar: "#8fbf8f",
      ridgeMid: "#5f9e46",
      ridgeNear: "#3f7128",
      ground: "#4f7d33",
      deep: "#23401a",
      edge: "#a4d16a",
      fog: "#cfe8d8",
    },
  },
  {
    number: 2,
    name: "Dusty Canyon",
    subtitle: "Red rock and loose gravel.",
    length: 55_000,
    difficulty: 2,
    palette: {
      skyTop: "#6e3b56",
      skyBottom: "#f2a65e",
      sun: "#ffd9a0",
      glow: "rgba(255, 160, 90, 0.5)",
      ridgeFar: "#b06a4a",
      ridgeMid: "#7c4436",
      ridgeNear: "#4c281f",
      ground: "#9a5a36",
      deep: "#3f1f14",
      edge: "#e8b078",
      fog: "#d99a6c",
    },
  },
  {
    number: 3,
    name: "Alpine Ridge",
    subtitle: "Steep climbs with thin air.",
    length: 62_000,
    difficulty: 3,
    night: true,
    weather: "snow",
    palette: {
      skyTop: "#050a1c",
      skyBottom: "#2a3f66",
      sun: "#dfe8ff",
      glow: "rgba(160, 190, 255, 0.35)",
      ridgeFar: "#9db4c0",
      ridgeMid: "#6b8a99",
      ridgeNear: "#3d5566",
      ground: "#57687a",
      deep: "#1a242e",
      edge: "#cfe2f0",
      fog: "#8fa8b8",
    },
  },
  {
    number: 4,
    name: "Mud Bog",
    subtitle: "Sticky mud and hidden ruts.",
    length: 58_000,
    difficulty: 4,
    weather: "pollen",
    palette: {
      skyTop: "#2f3d2f",
      skyBottom: "#6d7f5e",
      sun: "#dfead2",
      glow: "rgba(210, 230, 200, 0.25)",
      ridgeFar: "#55684a",
      ridgeMid: "#3d4d2e",
      ridgeNear: "#26301c",
      ground: "#4a3a28",
      deep: "#191309",
      edge: "#6b5a3d",
      fog: "#6d7f66",
    },
  },
  {
    number: 5,
    name: "Volcano Rim",
    subtitle: "Hot ground, long drops.",
    length: 65_000,
    difficulty: 5,
    night: true,
    weather: "embers",
    palette: {
      skyTop: "#0b0406",
      skyBottom: "#3d1410",
      sun: "#ff5a2b",
      glow: "rgba(255, 90, 30, 0.55)",
      ridgeFar: "#7c341c",
      ridgeMid: "#4c2010",
      ridgeNear: "#260f06",
      ground: "#341809",
      deep: "#0d0503",
      edge: "#ff7a3c",
      fog: "#5c2a18",
    },
  },
];

export interface CycleHud {
  distance: number;
  fuel: number;
  speed: number;
  altitude: number;
  airTime: number;
  coins: number;
  score: number;
}

export interface CycleSummary {
  distance: number;
  coins: number;
  score: number;
  bestAirTime: number;
  flips: number;
  topSpeed: number;
  durationMs: number;
}

export interface CycleCallbacks {
  onHud: (hud: CycleHud) => void;
  onEnd: (summary: CycleSummary) => void;
  onCue: (cue: CycleCue) => void;
}

/* ------------------------------------------------------------------ physics */

const GRAVITY = 980;
const FUEL_CAPACITY = 100;
const FUEL_BURN_RATE = 1.8;
const COIN_VALUE = 25;
const AIR_TIME_BONUS = 50;
const FLIP_BONUS = 200;
const MAX_SPEED = 850;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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

/* ------------------------------------------------------------------ world */

interface TerrainPoint {
  x: number;
  y: number;
  angle: number;
}

interface Obstacle {
  x: number;
  y: number;
  kind: "rock" | "log" | "ramp";
  width: number;
  height: number;
  hit: boolean;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface FuelPickup {
  x: number;
  y: number;
  collected: boolean;
}

interface World {
  terrain: TerrainPoint[];
  obstacles: Obstacle[];
  coins: Coin[];
  fuelPickups: FuelPickup[];
  finishX: number;
}

function buildWorld(road: number, seed: number): World {
  const difficulty = ROADS[road - 1]?.difficulty ?? 1;
  const length = ROADS[road - 1]?.length ?? 48_000;
  const rng = mulberry32((seed + road * 1000) >>> 0);
  const terrain: TerrainPoint[] = [];
  const obstacles: Obstacle[] = [];
  const coins: Coin[] = [];
  const fuelPickups: FuelPickup[] = [];

  // Generate terrain with increasingly dramatic hills
  const step = 40;
  const pointCount = Math.floor(length / step);
  let y = 300;

  for (let i = 0; i <= pointCount; i++) {
    const x = i * step;
    const t = x / length;

    // Base terrain: multiple sine waves for natural hills
    const hillFreq1 = 0.00015 + difficulty * 0.00003;
    const hillFreq2 = 0.0004 + difficulty * 0.00008;
    const hillFreq3 = 0.0009 + difficulty * 0.0001;

    const hill1 = Math.sin(x * hillFreq1) * (80 + difficulty * 25);
    const hill2 = Math.sin(x * hillFreq2 + 1.5) * (45 + difficulty * 15);
    const hill3 = Math.sin(x * hillFreq3 + 3.0) * (22 + difficulty * 8);

    // Overall upward trend
    const climb = t * 200 * difficulty;

    y = 280 + hill1 + hill2 + hill3 + climb;

    // Sharp jumps every so often on harder roads
    if (difficulty >= 3 && i % Math.floor(45 / difficulty) === 0 && i > 10) {
      y += 60 + rng() * 80;
    }

    const prevY = terrain.length > 0 ? terrain[terrain.length - 1].y : y;
    const angle = Math.atan2(y - prevY, step);

    terrain.push({ x, y, angle });
  }

  // Place obstacles
  const obstacleSpacing = 300 - difficulty * 30;
  for (let x = 400; x < length - 200; x += obstacleSpacing + rng() * 200) {
    const idx = Math.floor(x / step);
    if (idx >= terrain.length) continue;
    const point = terrain[idx];
    const roll = rng();

    let kind: Obstacle["kind"];
    if (road <= 2) {
      kind = roll < 0.5 ? "rock" : "log";
    } else if (road === 3) {
      kind = roll < 0.4 ? "rock" : roll < 0.7 ? "log" : "ramp";
    } else {
      kind = roll < 0.3 ? "rock" : roll < 0.55 ? "log" : "ramp";
    }

    obstacles.push({
      x: point.x,
      y: point.y,
      kind,
      width: kind === "rock" ? 30 + rng() * 20 : kind === "log" ? 60 + rng() * 30 : 80,
      height: kind === "rock" ? 25 + rng() * 15 : kind === "log" ? 20 : 40,
      hit: false,
    });
  }

  // Place coins in arcs and lines
  for (let x = 300; x < length - 100; x += 200 + rng() * 150) {
    const idx = Math.floor(x / step);
    if (idx >= terrain.length) continue;
    const point = terrain[idx];
    const count = 3 + Math.floor(rng() * 5);
    const arcHeight = 40 + rng() * 80;

    for (let c = 0; c < count; c++) {
      const t = c / (count - 1);
      const coinX = x + t * 120;
      const coinY = point.y - Math.sin(t * Math.PI) * arcHeight - 50;
      coins.push({ x: coinX, y: coinY, collected: false });
    }
  }

  // Place fuel pickups
  for (let x = 800; x < length - 400; x += 600 + rng() * 400) {
    const idx = Math.floor(x / step);
    if (idx >= terrain.length) continue;
    const point = terrain[idx];
    fuelPickups.push({ x: point.x, y: point.y - 60, collected: false });
  }

  return { terrain, obstacles, coins, fuelPickups, finishX: length };
}

/* ------------------------------------------------------------------ bike */

interface BikeState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  onGround: boolean;
  airTime: number;
  rotationAccum: number;
}

/* ------------------------------------------------------------------ game */

type Phase = "idle" | "riding" | "paused" | "crashed" | "finished";

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

  private phase: Phase = "idle";
  private world: World | null = null;
  private previewRoad = 0;

  // Bike physics state
  private bike: BikeState = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVel: 0,
    onGround: false,
    airTime: 0,
    rotationAccum: 0,
  };

  // Camera
  private camX = 0;
  private camY = 0;

  // Game state
  private fuel = FUEL_CAPACITY;
  private distance = 0;
  private coins = 0;
  private score = 0;
  private topSpeed = 0;
  private bestAirTime = 0;
  private flips = 0;
  private runElapsed = 0;

  // Input state
  private gasPressed = false;
  private brakePressed = false;
  private tiltLeft = false;
  private tiltRight = false;

  // Rendering
  private shake = 0;
  private particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
    size: number;
    color: string;
  }[] = [];

  private ended = false;

  // Cached sky layers, rebuilt whenever the road changes.
  private sceneRoad = -1;
  private scene: SceneCache = { stars: [], clouds: [] };
  private wheelRot = 0;
  private stallTimer = 0;
  private stalling = false;

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
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  preview(roadNumber: number) {
    const idx = clamp(roadNumber, 1, ROADS.length) - 1;
    this.previewRoad = idx;
    this.phase = "idle";
    this.world = buildWorld(idx + 1, 20261);

    // Place bike at start
    const startTerrain = this.world.terrain[10];
    this.bike = {
      x: 100,
      y: startTerrain ? startTerrain.y - 40 : 300,
      vx: 0,
      vy: 0,
      angle: startTerrain ? startTerrain.angle : 0,
      angularVel: 0,
      onGround: true,
      airTime: 0,
      rotationAccum: 0,
    };

    this.camX = this.bike.x - this.W * 0.3;
    this.camY = this.bike.y - this.H * 0.6;
    this.fuel = FUEL_CAPACITY;
    this.distance = 0;
    this.coins = 0;
    this.score = 0;
    this.topSpeed = 0;
    this.bestAirTime = 0;
    this.flips = 0;
    this.stallTimer = 0;
    this.stalling = false;
    this.runElapsed = 0;
    this.ended = false;
    this.emitHud();
  }

  start(roadNumber: number, seed: number) {
    const idx = clamp(roadNumber, 1, ROADS.length) - 1;
    this.world = buildWorld(idx + 1, seed >>> 0);

    const startTerrain = this.world.terrain[10];
    this.bike = {
      x: 100,
      y: startTerrain ? startTerrain.y - 40 : 300,
      vx: 0,
      vy: 0,
      angle: startTerrain ? startTerrain.angle : 0,
      angularVel: 0,
      onGround: true,
      airTime: 0,
      rotationAccum: 0,
    };

    this.camX = this.bike.x - this.W * 0.3;
    this.camY = this.bike.y - this.H * 0.6;
    this.fuel = FUEL_CAPACITY;
    this.distance = 0;
    this.coins = 0;
    this.score = 0;
    this.topSpeed = 0;
    this.bestAirTime = 0;
    this.flips = 0;
    this.stallTimer = 0;
    this.stalling = false;
    this.runElapsed = 0;
    this.gasPressed = false;
    this.brakePressed = false;
    this.tiltLeft = false;
    this.tiltRight = false;
    this.shake = 0;
    this.particles = [];
    this.ended = false;
    this.phase = "riding";
    this.emitHud();
    this.cb.onCue("start");
  }

  pause() {
    if (this.phase === "riding") {
      this.phase = "paused";
      this.gasPressed = false;
      this.brakePressed = false;
      this.tiltLeft = false;
      this.tiltRight = false;
    }
  }

  resume() {
    if (this.phase === "paused") {
      this.phase = "riding";
      this.last = performance.now();
    }
  }

  setGas(active: boolean) {
    this.gasPressed = active;
  }

  setBrake(active: boolean) {
    this.brakePressed = active;
  }

  setTiltLeft(active: boolean) {
    this.tiltLeft = active;
  }

  setTiltRight(active: boolean) {
    this.tiltRight = active;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
  }

  private loop(now: number) {
    const dt = Math.min(0.04, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }

  private get calm() {
    return typeof document !== "undefined" && document.documentElement.dataset.reducedMotion === "true";
  }

  private currentRoad(): RoadDef {
    return ROADS[this.previewRoad] ?? ROADS[0];
  }

  private update(dt: number) {
    if (this.phase !== "riding") {
      this.updateParticles(dt);
      return;
    }

    this.runElapsed += dt;

    // Get terrain height at bike position
    const terrainY = this.getTerrainY(this.bike.x);
    const terrainAngle = this.getTerrainAngle(this.bike.x);

    // Apply gravity
    if (!this.bike.onGround) {
      this.bike.vy += GRAVITY * dt;
    }

    // Gas pedal: accelerate along terrain
    if (this.gasPressed && this.fuel > 0) {
      const acceleration = this.bike.onGround ? 420 : 180;
      this.bike.vx += Math.cos(terrainAngle) * acceleration * dt;
      this.fuel = Math.max(0, this.fuel - FUEL_BURN_RATE * dt);
    }

    // Brake/reverse
    if (this.brakePressed) {
      const deceleration = this.bike.onGround ? 650 : 100;
      this.bike.vx -= Math.cos(terrainAngle) * deceleration * dt;
    }

    // Air control (tilt)
    if (!this.bike.onGround) {
      const tiltTorque = 3.2;
      if (this.tiltLeft) {
        this.bike.angularVel -= tiltTorque * dt;
      }
      if (this.tiltRight) {
        this.bike.angularVel += tiltTorque * dt;
      }
      this.bike.angularVel *= 0.98;
    }

    // Air time tracking
    if (!this.bike.onGround) {
      this.bike.airTime += dt;
      this.bike.rotationAccum += this.bike.angularVel * dt;
      this.bestAirTime = Math.max(this.bestAirTime, this.bike.airTime);
    } else {
      if (this.bike.airTime > 0.5) {
        // Check for flips
        const flipCount = Math.floor(Math.abs(this.bike.rotationAccum) / (Math.PI * 1.7));
        if (flipCount > 0) {
          this.flips += flipCount;
          this.score += FLIP_BONUS * flipCount;
          this.cb.onCue("flip");
        }
        if (this.bike.airTime > 1.0) {
          this.score += AIR_TIME_BONUS * this.bike.airTime;
          this.cb.onCue("air");
        }
      }
      this.bike.airTime = 0;
      this.bike.rotationAccum = 0;
    }

    // Update velocity
    this.bike.vx *= 0.995;
    this.bike.vx = clamp(this.bike.vx, -MAX_SPEED * 0.3, MAX_SPEED);
    this.bike.x += this.bike.vx * dt;
    this.wheelRot += (this.bike.vx / 16) * dt;

    // Ground collision
    const newY = terrainY - 35;
    if (this.bike.y >= newY && this.bike.vy >= 0) {
      // Landing
      if (!this.bike.onGround && this.bike.vy > 200) {
        this.shake = Math.min(12, this.bike.vy * 0.015);
      }
      this.bike.y = newY;
      this.bike.vy = 0;
      this.bike.onGround = true;
      this.bike.angle = terrainAngle;
      this.bike.angularVel *= 0.3;
    } else {
      this.bike.onGround = false;
      this.bike.y += this.bike.vy * dt;
    }

    // Update camera (chase camera)
    const targetCamX = this.bike.x - this.W * 0.3;
    const targetCamY = this.bike.y - this.H * 0.55;
    const camEase = 1 - Math.exp(-dt * 4);
    this.camX += (targetCamX - this.camX) * camEase;
    this.camY += (targetCamY - this.camY) * camEase;

    // Speed effects
    const speed = Math.abs(this.bike.vx);
    this.topSpeed = Math.max(this.topSpeed, speed);
    this.shake *= Math.max(0, 1 - dt * 3);

    // Speed lines when fast
    if (speed > 400 && !this.calm) {
      this.shake = Math.max(this.shake, speed * 0.004);
    }

    // Collect coins
    if (this.world) {
      for (const coin of this.world.coins) {
        if (coin.collected) continue;
        const dx = coin.x - this.bike.x;
        const dy = coin.y - this.bike.y;
        if (Math.abs(dx) < 40 && Math.abs(dy) < 40) {
          coin.collected = true;
          this.coins += 1;
          this.score += COIN_VALUE;
          this.cb.onCue("coin");
          this.spawnParticle(coin.x, coin.y, "#ffd700", 12);
        }
      }

      // Collect fuel
      for (const pickup of this.world.fuelPickups) {
        if (pickup.collected) continue;
        const dx = pickup.x - this.bike.x;
        const dy = pickup.y - this.bike.y;
        if (Math.abs(dx) < 45 && Math.abs(dy) < 45) {
          pickup.collected = true;
          this.fuel = Math.min(FUEL_CAPACITY, this.fuel + 35);
          this.stallTimer = 0;
          this.cb.onCue("fuel");
          this.spawnParticle(pickup.x, pickup.y, "#ff4444", 18);
        }
      }

      // Check obstacles
      for (const obstacle of this.world.obstacles) {
        if (obstacle.hit) continue;
        const dx = obstacle.x - this.bike.x;
        const dy = (obstacle.y - obstacle.height * 0.5) - this.bike.y;
        if (Math.abs(dx) < obstacle.width * 0.5 + 20 && Math.abs(dy) < 35) {
          if (obstacle.kind === "ramp") {
            // Ramp: launch upward
            this.bike.vy = -380;
            this.bike.onGround = false;
            obstacle.hit = true;
          } else {
            // Rock/log: a hard bump — the wheel clips it, the rider hops over.
            // No instant death; losing speed is the punishment.
            this.bike.vy = -260;
            this.bike.onGround = false;
            this.bike.vx *= 0.55;
            obstacle.hit = true;
            this.shake = 9;
            this.spawnBurst(
              obstacle.x,
              obstacle.y - obstacle.height * 0.5,
              12,
              mixHex(this.currentRoad().palette.ground, "#ffffff", 0.25),
              0.9,
            );
          }
        }
      }

      // Check finish
      if (this.bike.x >= this.world.finishX) {
        this.finish();
        return;
      }
    }

    // Fuel depletion: the engine coughs out for good. The bike coasts a final
    // stretch, then the run ends no matter what — a mid-slope pickup can't
    // restart a dead engine, and a long slope can't keep the ride alive.
    if (this.fuel <= 0 && !this.stalling) this.stalling = true;
    if (this.stalling) {
      this.stallTimer += dt;
      if (
        this.stallTimer > 4 ||
        (this.stallTimer > 0.6 && this.bike.onGround && Math.abs(this.bike.vx) < 5)
      ) {
        this.crash();
        return;
      }
    }

    this.distance = Math.max(this.distance, this.bike.x);
    this.score = Math.floor(this.distance * 0.1) + this.coins * COIN_VALUE + this.flips * FLIP_BONUS;

    this.updateParticles(dt);
    this.emitHud();
  }

  private getTerrainY(x: number): number {
    if (!this.world) return 300;
    const terrain = this.world.terrain;
    const idx = Math.floor(x / 40);
    if (idx < 0) return terrain[0]?.y ?? 300;
    if (idx >= terrain.length - 1) return terrain[terrain.length - 1]?.y ?? 300;
    const t = (x - terrain[idx].x) / 40;
    return terrain[idx].y * (1 - t) + terrain[idx + 1].y * t;
  }

  private getTerrainAngle(x: number): number {
    if (!this.world) return 0;
    const terrain = this.world.terrain;
    const idx = Math.floor(x / 40);
    if (idx < 1 || idx >= terrain.length - 1) return 0;
    return terrain[idx].angle;
  }

  private spawnBurst(x: number, y: number, count: number, color: string, power: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = (80 + Math.random() * 200) * power;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 100,
        life: 0,
        max: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  private crash() {
    if (this.phase !== "riding") return;
    this.phase = "crashed";
    this.shake = 14;
    this.spawnBurst(this.bike.x, this.bike.y, 25, "#ff4444", 1.2);
    this.spawnBurst(this.bike.x, this.bike.y, 15, "#ffffff", 0.8);
    this.cb.onCue("crash");

    setTimeout(() => {
      if (!this.ended) {
        this.ended = true;
        this.cb.onEnd(this.summary());
      }
    }, 900);
  }

  private finish() {
    if (this.phase !== "riding") return;
    this.phase = "finished";
    this.score += 1000;
    this.spawnBurst(this.bike.x, this.bike.y, 40, "#ffd700", 1.5);

    setTimeout(() => {
      if (!this.ended) {
        this.ended = true;
        this.cb.onEnd(this.summary());
      }
    }, 1200);
  }

  private summary(): CycleSummary {
    return {
      distance: Math.floor(this.distance),
      coins: this.coins,
      score: Math.floor(this.score),
      bestAirTime: this.bestAirTime,
      flips: this.flips,
      topSpeed: Math.floor(this.topSpeed * 0.08),
      durationMs: Math.round(this.runElapsed * 1000),
    };
  }

  private spawnParticle(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 100,
        life: 0,
        max: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      p.vx *= 0.98;
    }
    this.particles = this.particles.filter((p) => p.life < p.max).slice(-200);
  }

  private emitHud() {
    const speed = Math.abs(this.bike.vx) * 0.08;
    const altitude = Math.max(0, 400 - this.bike.y);
    this.cb.onHud({
      distance: Math.floor(this.distance),
      fuel: Math.round(this.fuel),
      speed: Math.round(speed),
      altitude: Math.floor(altitude),
      airTime: this.bike.airTime,
      coins: this.coins,
      score: Math.floor(this.score),
    });
  }

  /* ---------------------------------------------------------------- draw */

  private ensureScene(road: RoadDef) {
    if (this.sceneRoad === road.number) return;
    this.sceneRoad = road.number;
    this.scene = buildScene(road.number);
  }

  private rand(seed: number) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  private draw() {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const road = this.currentRoad();
    this.ensureScene(road);

    // Shake applied to the world layer only.
    const sx = this.shake > 0.3 && !this.calm ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake > 0.3 && !this.calm ? (Math.random() - 0.5) * this.shake : 0;

    this.drawSky(road);
    this.drawRidges(road);

    ctx.save();
    ctx.translate(sx - this.camX, sy - this.camY);

    if (this.world) {
      this.drawScenery(road);
      this.drawTerrain(road);


      this.drawObstacles(road);
      this.drawCoins();
      this.drawFuelPickups();
      this.drawFinishLine(road);
      this.drawBike(road);
    }

    this.drawParticlesWorld();

    ctx.restore();

    // Foreground atmosphere
    this.drawWeather(road);
    this.drawSpeedLines();
    this.drawGrade(road);
    this.drawVignette();
  }

  private drawSky(road: RoadDef) {
    const { ctx, W, H } = this;
    const p = road.palette;

    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, p.skyTop);
    sky.addColorStop(1, p.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars on night roads
    if (road.night) {
      const tw = performance.now() * 0.001;
      ctx.save();
      for (let i = 0; i < this.scene.stars.length; i++) {
        const s = this.scene.stars[i];
        const x = (s.x + i * 7) % (W + 20) - 10;
        const twinkle = 0.55 + 0.45 * Math.sin(tw * (1.2 + s.r) + i * 1.7);
        ctx.globalAlpha = clamp(twinkle, 0.12, 1) * 0.85;
        ctx.fillStyle = "#e8efff";
        ctx.beginPath();
        ctx.arc(x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (road.number === 3) {
        // Aurora curtains, slow breathing bands
        const t = performance.now() * 0.00006;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let band = 0; band < 3; band++) {
          const baseY = H * (0.16 + band * 0.07);
          const amp = 26 + band * 10;
          const hue = 150 + band * 26;
          const g = ctx.createLinearGradient(0, baseY - 70, 0, baseY + 70);
          g.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
          g.addColorStop(0.45, `hsla(${hue}, 85%, 62%, ${0.09 + band * 0.02})`);
          g.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(-10, baseY + 70);
          for (let x = -10; x <= W + 10; x += 24) {
            const y = baseY + Math.sin(x * 0.006 + t * 40 + band * 2.1) * amp;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(W + 10, baseY + 70);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Celestial body + halo
    const sunX = W * 0.76;
    const sunY = H * 0.17;
    const halo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.34);
    halo.addColorStop(0, p.glow);
    halo.addColorStop(0.35, p.glow);
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sunX, sunY, H * 0.34, 0, Math.PI * 2);
    ctx.fill();
    // God rays — short, subtle fans that stay near the celestial body
    ctx.globalAlpha = road.night ? 0.05 : 0.07;
    for (let r = 0; r < 5; r++) {
      const ang = 0.35 + r * 0.32 + Math.sin(performance.now() * 0.0001 + r) * 0.01;
      const len = H * (0.16 + 0.04 * r);
      ctx.fillStyle = p.glow;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(ang) * len, sunY + Math.sin(ang) * len);
      ctx.lineTo(sunX + Math.cos(ang + 0.06) * len, sunY + Math.sin(ang + 0.06) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = p.sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, road.night ? 30 : 34, 0, Math.PI * 2);
    ctx.fill();
    if (road.night) {
      // Moon craters
      ctx.fillStyle = "rgba(150, 170, 210, 0.45)";
      ctx.beginPath();
      ctx.arc(sunX - 8, sunY - 6, 6, 0, Math.PI * 2);
      ctx.arc(sunX + 9, sunY + 3, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Clouds — slow cinematic drift, parallax-lite
    const now = performance.now() * 0.001;
    ctx.save();
    for (let i = 0; i < this.scene.clouds.length; i++) {
      const c = this.scene.clouds[i];
      const x = ((c.x + now * c.v + i * 260) % (W + 420)) - 210;
      const y = c.y;
      ctx.globalAlpha = c.o;
      ctx.fillStyle = road.night ? mixHex(p.ridgeFar, p.skyTop, 0.55) : mixHex(p.fog, p.skyBottom, 0.25);
      for (let puff = 0; puff < 4; puff++) {
        const px = x + puff * c.s * 0.55 - c.s;
        const py = y + Math.sin(puff * 1.7 + i) * c.s * 0.16;
        const pr = c.s * (0.5 + 0.25 * Math.sin(puff * 2.3 + i * 0.9));
        ctx.beginPath();
        ctx.ellipse(px, py, pr * 1.5, pr * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawRidges(road: RoadDef) {
    const { ctx, W, H } = this;
    const p = road.palette;

    const layers = [
      { color: mixHex(p.ridgeFar, p.skyBottom, 0.55), base: H * 0.46, amp: H * 0.2, speed: 0.06, f1: 0.0011, f2: 0.0042 },
      { color: mixHex(p.ridgeFar, p.skyBottom, 0.28), base: H * 0.52, amp: H * 0.16, speed: 0.11, f1: 0.0013, f2: 0.005 },
      { color: mixHex(p.ridgeMid, p.skyBottom, 0.12), base: H * 0.57, amp: H * 0.12, speed: 0.18, f1: 0.0016, f2: 0.0058 },
      { color: p.ridgeNear, base: H * 0.62, amp: H * 0.1, speed: 0.27, f1: 0.002, f2: 0.007 },
    ];

    for (let l = 0; l < layers.length; l++) {
      const L = layers[l];
      const scroll = this.camX * L.speed;
      ctx.beginPath();
      ctx.moveTo(-10, H);
      for (let x = -10; x <= W + 10; x += 6) {
        const wx = x + scroll;
        const r =
          Math.sin(wx * L.f1) * L.amp +
          Math.sin(wx * L.f2 + 1.5) * L.amp * 0.5 +
          Math.sin(wx * L.f2 * 2.3 + 3.1) * L.amp * 0.25;
        ctx.lineTo(x, L.base - Math.abs(r));
      }
      ctx.lineTo(W + 10, H);
      ctx.closePath();
      ctx.fillStyle = L.color;
      ctx.fill();

      // Rim light on the ridge line, atmospheric haze between layers
      ctx.beginPath();
      let first = true;
      for (let x = -10; x <= W + 10; x += 8) {
        const wx = x + scroll;
        const r =
          Math.sin(wx * L.f1) * L.amp +
          Math.sin(wx * L.f2 + 1.5) * L.amp * 0.5 +
          Math.sin(wx * L.f2 * 2.3 + 3.1) * L.amp * 0.25;
        if (first) {
          ctx.moveTo(x, L.base - Math.abs(r));
          first = false;
        } else ctx.lineTo(x, L.base - Math.abs(r));
      }
      ctx.strokeStyle = rgba(p.glow, 0.16 * (1 - l / layers.length));
      ctx.lineWidth = l === layers.length - 1 ? 2 : 1;
      ctx.stroke();
      if (l < layers.length - 1) {
        const haze = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.68);
        haze.addColorStop(0, "rgba(0,0,0,0)");
        haze.addColorStop(1, rgba(p.fog, 0.06));
        ctx.fillStyle = haze;
        ctx.fillRect(0, H * 0.42, W, H * 0.26);
      }
    }
  }

  private drawTerrain(road: RoadDef) {
    const { ctx } = this;
    const terrain = this.world?.terrain;
    if (!terrain || terrain.length < 2) return;

    const p = road.palette;
    const startIdx = Math.max(0, Math.floor((this.camX - 100) / 40));
    const endIdx = Math.min(terrain.length - 1, Math.ceil((this.camX + this.W + 100) / 40));

    // Visible slice, extended horizontally so the ground never "cuts" inside the frame
    const first = terrain[startIdx];
    const last = terrain[endIdx];
    const leftX = Math.min(first.x, this.camX - 150);
    const rightX = Math.max(last.x, this.camX + this.W + 150);
    const pts: { x: number; y: number }[] = [];
    if (leftX !== first.x) pts.push({ x: leftX, y: first.y });
    for (let i = startIdx; i <= endIdx; i++) pts.push(terrain[i] as { x: number; y: number });
    if (rightX !== last.x) pts.push({ x: rightX, y: last.y });

    // Soil body with depth grade
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y + 2000);
    ctx.lineTo(pts[0].x, pts[0].y + 2000);
    ctx.closePath();

    const groundGrad = ctx.createLinearGradient(0, 200, 0, 800);
    groundGrad.addColorStop(0, mixHex(p.ground, p.edge, 0.35));
    groundGrad.addColorStop(0.12, p.ground);
    groundGrad.addColorStop(1, p.deep);
    ctx.fillStyle = groundGrad;
    ctx.fill();

    // Under-surface shadow (reads as a soft inner slope)
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y + 7);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y + 7);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      ctx.lineTo(pts[i].x, pts[i].y + 26);
    }
    ctx.closePath();
    ctx.fillStyle = rgba(p.deep, 0.35);
    ctx.fill();

    // Lit trail edge — bright like a path catching the light
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = rgba(p.edge, 0.85);
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.strokeStyle = rgba(p.edge, 0.35);
    ctx.lineWidth = 7;
    ctx.stroke();

    // Soil speckle / rocks scattered deterministically
    ctx.save();
    for (let i = startIdx; i <= endIdx; i++) {
      if (i % 2 !== 0) continue;
      const t = terrain[i];
      const h = Math.abs(Math.sin(i * 91.3 + road.number * 7.7)) * 43758.5453;
      const r1 = h - Math.floor(h);
      if (r1 < 0.45) continue;
      const r2 = Math.abs(Math.sin(i * 47.9 + 13.1)) * 24634.6345;
      const rr = r2 - Math.floor(r2);
      ctx.fillStyle = rgba(mixHex(p.deep, p.edge, 0.2), 0.5);
      ctx.beginPath();
      ctx.ellipse(
        t.x + (rr - 0.5) * 30,
        t.y + 30 + r1 * 130,
        1.5 + rr * 2.5,
        1 + r1 * 1.5,
        r1 * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();

    // Glowing cracks on volcano ground
    if (road.number === 5) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = startIdx; i <= endIdx; i += 3) {
        const t = terrain[i];
        const flick = 0.4 + 0.6 * Math.abs(Math.sin(performance.now() * 0.002 + i));
        ctx.strokeStyle = rgba("#ff5a2b", 0.35 * flick);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y + 24);
        ctx.lineTo(t.x + 14, t.y + 34);
        ctx.lineTo(t.x + 4, t.y + 44);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawScenery(road: RoadDef) {
    // Backdrop props sitting behind the trail, in world space.
    const terrain = this.world?.terrain;
    if (!terrain) return;
    const { ctx } = this;
    const p = road.palette;
    const kind = road.number;
    const startIdx = Math.max(0, Math.floor((this.camX - 200) / 40));
    const endIdx = Math.min(terrain.length - 1, Math.ceil((this.camX + this.W + 200) / 40));

    for (let i = startIdx; i <= endIdx; i += 5) {
      const t = terrain[i];
      const h = Math.abs(Math.sin(i * 173.7 + kind * 31.3)) * 43758.5453;
      const r1 = h - Math.floor(h);
      if (r1 < 0.35) continue;
      const r2 = Math.abs(Math.sin(i * 97.1 + kind)) * 24634.6345;
      const rr = r2 - Math.floor(r2);
      const scale = 0.7 + rr * 0.9;
      const sway = Math.sin(performance.now() * 0.0009 + i) * 2;

      ctx.save();
      ctx.translate(t.x, t.y + 2);

      if (kind === 1 || kind === 3 || kind === 4) {
        // Pine / dead tree
        ctx.fillStyle = rgba(kind === 4 ? mixHex(p.deep, p.edge, 0.15) : mixHex(p.deep, p.edge, 0.4), 0.85);
        ctx.fillRect(-2 * scale, -40 * scale, 4 * scale, 42 * scale);
        if (kind === 4) {
          // Dead branches
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 2 * scale;
          ctx.beginPath();
          ctx.moveTo(0, -30 * scale);
          ctx.lineTo(12 * scale + sway, -40 * scale);
          ctx.moveTo(0, -22 * scale);
          ctx.lineTo(-11 * scale, -32 * scale);
          ctx.stroke();
        } else {
          for (let tier = 0; tier < 3; tier++) {
            const w = (20 - tier * 5) * scale;
            const y = -(12 + tier * 12) * scale;
            ctx.beginPath();
            ctx.moveTo(-w, y);
            ctx.lineTo(0, y - 16 * scale);
            ctx.lineTo(w, y);
            ctx.closePath();
            ctx.fill();
          }
        }
      } else if (kind === 2) {
        // Rock spire
        ctx.fillStyle = rgba(mixHex(p.deep, p.ridgeNear, 0.5), 0.9);
        ctx.beginPath();
        ctx.moveTo(-14 * scale, 0);
        ctx.lineTo(-4 * scale, -55 * scale);
        ctx.lineTo(7 * scale, -40 * scale);
        ctx.lineTo(16 * scale, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(p.edge, 0.25);
        ctx.beginPath();
        ctx.moveTo(-4 * scale, -55 * scale);
        ctx.lineTo(7 * scale, -40 * scale);
        ctx.lineTo(9 * scale, -18 * scale);
        ctx.lineTo(2 * scale, -30 * scale);
        ctx.closePath();
        ctx.fill();
      } else {
        // Jagged volcano spire with ember-tip glow
        ctx.fillStyle = rgba(mixHex(p.deep, p.edge, 0.2), 0.92);
        ctx.beginPath();
        ctx.moveTo(-13 * scale, 0);
        ctx.lineTo(-2 * scale, -52 * scale);
        ctx.lineTo(8 * scale, -30 * scale);
        ctx.lineTo(14 * scale, 0);
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = rgba(p.edge, 0.5 + 0.3 * Math.sin(performance.now() * 0.003 + i));
        ctx.beginPath();
        ctx.arc(-2 * scale, -52 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }
  }

  private drawObstacles(road: RoadDef) {
    if (!this.world) return;
    const { ctx } = this;
    void road;

    for (const obstacle of this.world.obstacles) {
      if (obstacle.hit && obstacle.kind !== "ramp") continue;
      if (obstacle.x < this.camX - 100 || obstacle.x > this.camX + this.W + 100) continue;

      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);

      if (obstacle.kind === "rock") {
        const g = ctx.createLinearGradient(-obstacle.width * 0.5, 0, obstacle.width * 0.4, -obstacle.height);
        g.addColorStop(0, mixHex(road.palette.deep, road.palette.edge, 0.15));
        g.addColorStop(0.55, mixHex(road.palette.ground, "#900920", 0.25));
        g.addColorStop(1, mixHex(road.palette.edge, road.palette.deep, 0.35));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width * 0.5, 0);
        ctx.lineTo(-obstacle.width * 0.3, -obstacle.height);
        ctx.lineTo(-obstacle.width * 0.05, -obstacle.height * 1.08);
        ctx.lineTo(obstacle.width * 0.3, -obstacle.height * 0.9);
        ctx.lineTo(obstacle.width * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = mixHex(road.palette.edge, road.palette.deep, 0.2);
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Crack detail
        ctx.strokeStyle = rgba(road.palette.deep, 0.7);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.lineTo(-2, -obstacle.height * 0.55);
        ctx.lineTo(-10, -obstacle.height * 0.8);
        ctx.stroke();
      } else if (obstacle.kind === "log") {
        // Bark body
        ctx.fillStyle = mixHex("#46311f", road.palette.ground, 0.2);
        ctx.beginPath();
        ctx.ellipse(0, -obstacle.height * 0.5, obstacle.width * 0.5, obstacle.height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Bark lines
        ctx.strokeStyle = rgba("#2c1d10", 0.7);
        ctx.lineWidth = 1.4;
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.ellipse(0, -obstacle.height * 0.5, obstacle.width * 0.5, obstacle.height * 0.5, 0, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        }
        // Lit top
        ctx.strokeStyle = rgba(mixHex(road.palette.edge, "#ffedd2", 0.4), 0.55);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, -obstacle.height * 0.5, obstacle.width * 0.5, obstacle.height * 0.5, 0, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (obstacle.kind === "ramp") {
        const grad = ctx.createLinearGradient(-obstacle.width * 0.5, 0, obstacle.width * 0.5, -obstacle.height);
        grad.addColorStop(0, "#5c3a1c");
        grad.addColorStop(0.55, "#8b5a2b");
        grad.addColorStop(1, "#c07a3a");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width * 0.5, 0);
        ctx.lineTo(obstacle.width * 0.5, 0);
        ctx.lineTo(obstacle.width * 0.5, -obstacle.height);
        ctx.closePath();
        ctx.fill();
        // Plank slats
        ctx.strokeStyle = rgba("#3d2408", 0.5);
        ctx.lineWidth = 1.3;
        for (let s = 1; s < 4; s++) {
          const yy = (-obstacle.height * s) / 4;
          const xx = obstacle.width * 0.5 - (obstacle.width * s) / 8;
          ctx.beginPath();
          ctx.moveTo(-obstacle.width * 0.5, yy);
          ctx.lineTo(xx, yy - 2);
          ctx.stroke();
        }
        // Chevron warns
        ctx.strokeStyle = rgba("#ffd76a", 0.8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width * 0.5 + obstacle.width * 0.3, -obstacle.height * 0.35);
        ctx.lineTo(-obstacle.width * 0.5 + obstacle.width * 0.5, -obstacle.height * 0.5);
        ctx.lineTo(-obstacle.width * 0.5 + obstacle.width * 0.5, -obstacle.height * 0.7);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private drawCoins() {
    if (!this.world) return;
    const { ctx } = this;
    const t = performance.now();

    for (const coin of this.world.coins) {
      if (coin.collected) continue;
      if (coin.x < this.camX - 50 || coin.x > this.camX + this.W + 50) continue;

      const bob = Math.sin(t * 0.003 + coin.x * 0.01) * 3;
      const spin = Math.abs(Math.cos(t * 0.004 + coin.x * 0.02));
      const rx = 8 * (0.28 + 0.72 * spin);

      ctx.save();
      ctx.translate(coin.x, coin.y + bob);

      // Glow
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
      glow.addColorStop(0, "rgba(255, 215, 90, 0.5)");
      glow.addColorStop(1, "rgba(255, 215, 90, 0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // Coin body
      const gold = ctx.createLinearGradient(0, -9, 0, 9);
      gold.addColorStop(0, "#ffe79b");
      gold.addColorStop(0.5, "#ffd42e");
      gold.addColorStop(1, "#b8860b");
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(rx, 1.6), 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = gold;
      ctx.fill();
      ctx.strokeStyle = "#8a6508";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Rim highlight + sparkle
      ctx.strokeStyle = "rgba(255, 245, 200, 0.65)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(rx - 2.2, 0.8), 6.4, 0, -1.9, 0.8);
      ctx.stroke();
      ctx.globalAlpha = 0.75 * spin;
      ctx.fillStyle = "#fffbe0";
      ctx.beginPath();
      ctx.arc(-rx * 0.3, -3.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFuelPickups() {
    if (!this.world) return;
    const { ctx } = this;
    const t = performance.now();

    for (const pickup of this.world.fuelPickups) {
      if (pickup.collected) continue;
      if (pickup.x < this.camX - 50 || pickup.x > this.camX + this.W + 50) continue;

      const bob = Math.sin(t * 0.004 + pickup.x * 0.02) * 4;
      const rot = Math.sin(t * 0.002 + pickup.x * 0.015) * 0.12;

      ctx.save();
      ctx.translate(pickup.x, pickup.y + bob);
      ctx.rotate(rot);

      // Halo pulse
      const pulse = 18 + Math.sin(t * 0.005 + pickup.x) * 3;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, pulse);
      glow.addColorStop(0, "rgba(255, 70, 50, 0.55)");
      glow.addColorStop(1, "rgba(255, 70, 50, 0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // Canister
      const body = ctx.createLinearGradient(-12, 0, 12, 0);
      body.addColorStop(0, "#8f1717");
      body.addColorStop(0.4, "#e02828");
      body.addColorStop(1, "#7a0f0f");
      ctx.fillStyle = body;
      ctx.strokeStyle = "#4d0808";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-12, -14, 24, 28, 4);
      ctx.fill();
      ctx.stroke();

      // Neck + cap
      ctx.fillStyle = "#2e2e34";
      ctx.fillRect(-5, -18, 10, 5);
      ctx.fillStyle = "#56565f";
      ctx.fillRect(-7, -21, 14, 4);

      // Stripe + drop emblem
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.9;
      ctx.fillRect(-2, -9, 4, 18);
      ctx.fillStyle = "#ff4a4a";
      ctx.beginPath();
      ctx.arc(0, 3, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFinishLine(road: RoadDef) {
    void road;
    if (!this.world) return;
    const { ctx } = this;
    const finishX = this.world.finishX;
    if (finishX < this.camX - 100 || finishX > this.camX + this.W + 200) return;

    const terrainY = this.getTerrainY(finishX);
    ctx.save();
    ctx.translate(finishX, terrainY);

    // Halo behind the gate
    ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(16, -90, 0, 16, -90, 130);
    halo.addColorStop(0, "rgba(120, 240, 180, 0.35)");
    halo.addColorStop(1, "rgba(120, 240, 180, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(16, -90, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Poles
    ctx.fillStyle = "#0f1118";
    ctx.fillRect(-4, -165, 9, 165);
    ctx.fillRect(31, -165, 9, 165);
    ctx.fillStyle = "#2b2f3d";
    ctx.fillRect(-3, -160, 7, 160);
    ctx.fillRect(32, -160, 7, 160);

    // Checkered banner
    const cell = 6;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        const x = -4 + col * cell;
        const y = -160 + row * cell;
        ctx.fillStyle = (row + col) % 2 === 0 ? "#f2f5fa" : "#14161f";
        ctx.fillRect(x, y, cell, cell);
      }
    }
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-4, -160, 42, 30);

    ctx.fillStyle = "#7cf7c0";
    ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FINISH", 17, -172);

    ctx.restore();
  }

  private drawBike(road: RoadDef) {
    const { ctx } = this;
    const b = this.bike;
    const groundY = this.getTerrainY(b.x);
    const air = Math.max(0, groundY - b.y);

    // Contact shadow, scaling with air time
    const sh = clamp(1 - air / 280, 0.12, 1);
    ctx.save();
    ctx.globalAlpha = 0.4 * sh;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(b.x, groundY - 2, 18 + 26 * (1 - sh), 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(b.x, b.y);
    const visualAngle = b.onGround
      ? b.angle
      : Math.atan2(b.vy, Math.max(60, Math.abs(b.vx))) * 0.55;
    ctx.rotate(visualAngle);

    const spin = this.wheelRot;
    const crank = spin * 0.6;
    const night = road.night ?? false;
    const accent = night ? "#9fa8ff" : mixHex(road.palette.edge, "#ffffff", 0.15);

    // Headlight cone (night roads)
    if (night) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const cone = ctx.createLinearGradient(20, -20, 150, 10);
      cone.addColorStop(0, "rgba(220, 235, 255, 0.28)");
      cone.addColorStop(1, "rgba(220, 235, 255, 0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(24, -20);
      ctx.lineTo(160, 8);
      ctx.lineTo(160, 42);
      ctx.lineTo(24, -8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* -- rear wheel -- */
    this.drawWheel(-22, 16, spin, accent);
    /* -- front wheel -- */
    this.drawWheel(22, 16, spin, accent);

    // Frame: chainstay, seat tube, top + down tube, fork
    ctx.lineCap = "round";
    ctx.strokeStyle = "#23252f";
    ctx.lineWidth = 6.5;
    this.framePath();
    ctx.stroke();
    ctx.strokeStyle = mixHex("#3d4054", road.palette.edge, 0.25);
    ctx.lineWidth = 3;
    this.framePath();
    ctx.stroke();

    // Drivetrain: crank + pedals + chain hint
    ctx.strokeStyle = "#8b8f9a";
    ctx.lineWidth = 3;
    for (let leg = 0; leg < 2; leg++) {
      const phi = crank + leg * Math.PI;
      const px = -6 + Math.cos(phi) * 8;
      const py = 16 + Math.sin(phi) * 8;
      ctx.beginPath();
      ctx.moveTo(-6, 16);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.fillStyle = "#1b1d26";
      ctx.fillRect(px - 3, py - 1.5, 6, 3);
    }

    // Seat + handlebars
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(-13, -28);
    ctx.stroke(); // seat post
    ctx.fillStyle = "#15161e";
    ctx.beginPath();
    ctx.roundRect(-19, -31, 13, 5.5, 2.5);
    ctx.fill(); // saddle
    ctx.beginPath();
    ctx.moveTo(16, -14);
    ctx.lineTo(20, -26);
    ctx.stroke(); // stem
    ctx.beginPath();
    ctx.moveTo(12, -27);
    ctx.lineTo(27, -24);
    ctx.stroke(); // bar

    /* -- rider -- */
    const hip = { x: -9, y: -16 };
    const shoulder = { x: 8, y: -37 };
    const kit = "#16182a";

    // Far leg (behind frame, darker)
    const backPedal = { x: -6 + Math.cos(crank + Math.PI) * 8, y: 16 + Math.sin(crank + Math.PI) * 8 };
    this.drawLeg(hip, backPedal, "#0f1020", 4.6);

    // Torso
    ctx.strokeStyle = kit;
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(shoulder.x, shoulder.y);
    ctx.stroke();
    // Jersey accent stripe
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hip.x + 1, hip.y - 2.5);
    ctx.lineTo(shoulder.x + 1, shoulder.y - 2.5);
    ctx.stroke();

    // Near leg
    const frontPedal = { x: -6 + Math.cos(crank) * 8, y: 16 + Math.sin(crank) * 8 };
    this.drawLeg(hip, frontPedal, "#1e2140", 5);

    // Arm to the bar
    ctx.strokeStyle = "#1e2140";
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y + 1);
    ctx.lineTo(19, -25);
    ctx.stroke();

    // Backpack
    ctx.fillStyle = "#232638";
    ctx.beginPath();
    ctx.roundRect(hip.x - 16, hip.y - 16, 10, 14, 3.5);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(hip.x - 15.5, hip.y - 12, 9, 3);
    ctx.globalAlpha = 1;

    // Head + helmet with visor
    const hx = shoulder.x + 3;
    const hy = shoulder.y - 8;
    ctx.fillStyle = "#e8bc98";
    ctx.beginPath();
    ctx.arc(hx, hy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(hx, hy - 0.5, 7.4, Math.PI * 0.95, Math.PI * 2.15);
    ctx.fill();
    ctx.fillStyle = "#10111a";
    ctx.beginPath();
    ctx.moveTo(hx + 2, hy + 1);
    ctx.lineTo(hx + 8, hy - 3);
    ctx.lineTo(hx + 7, hy + 1);
    ctx.closePath();
    ctx.fill(); // visor

    ctx.restore();
  }

  private drawWheel(cx: number, cy: number, rot: number, accent: string) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    // Tire
    ctx.strokeStyle = "#0d0e14";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
    ctx.stroke();
    // Knobby tread hint
    ctx.strokeStyle = "#191b26";
    ctx.lineWidth = 2;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 13.5, Math.sin(a) * 13.5);
      ctx.lineTo(Math.cos(a) * 15.4, Math.sin(a) * 15.4);
      ctx.stroke();
    }
    // Rim
    ctx.strokeStyle = "#3a3f4e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
    // Spokes
    ctx.strokeStyle = "#565d70";
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.stroke();
    }
    ctx.restore();
    // Hub glow
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = rgba(accent, 0.5);
    ctx.beginPath();
    ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private framePath() {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(-22, 16); // rear hub
    ctx.lineTo(-6, 16); // BB
    ctx.lineTo(-8, -14); // seat tube
    ctx.lineTo(16, -14); // top tube
    ctx.lineTo(22, 16); // fork
    ctx.lineTo(16, -14);
    ctx.lineTo(-6, 16); // down tube back to BB
    ctx.moveTo(-6, 16);
    ctx.lineTo(-22, 16); // chainstay
  }

  private drawLeg(hip: { x: number; y: number }, pedal: { x: number; y: number }, color: string, w: number) {
    const { ctx } = this;
    const mx = (hip.x + pedal.x) / 2;
    const my = (hip.y + pedal.y) / 2;
    // Knee pushed forward/up of the hip-pedal segment
    const knee = { x: mx + 7, y: my - 6 };
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(knee.x, knee.y);
    ctx.lineTo(pedal.x, pedal.y);
    ctx.stroke();
    // Shoe
    ctx.fillStyle = "#0c0d14";
    ctx.beginPath();
    ctx.ellipse(pedal.x + 1.5, pedal.y + 1, 3.6, 2.2, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawParticlesWorld() {
    const { ctx } = this;
    for (const p of this.particles) {
      if (p.life >= p.max) continue;
      ctx.save();
      ctx.globalAlpha = 1 - p.life / p.max;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - p.life / p.max), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawWeather(road: RoadDef) {
    if (!road.weather) return;
    if (this.calm) return;
    const { ctx, W, H } = this;
    const t = performance.now() * 0.001;
    ctx.save();

    if (road.weather === "pollen") {
      ctx.fillStyle = "rgba(255, 240, 200, 0.5)";
      for (let i = 0; i < 34; i++) {
        const x = this.rand(i * 3.1) * (W + 60) - 30;
        const drift = Math.sin(t * 0.4 + i * 1.3) * 26;
        const y = (this.rand(i * 7.7 + 90) * (H + 60) + t * (26 + this.rand(i) * 30) + drift) % (H + 60) - 30;
        ctx.globalAlpha = 0.16 + 0.3 * Math.abs(Math.sin(t * 1.2 + i));
        ctx.beginPath();
        ctx.arc(x + drift, y, 1.1 + this.rand(i * 1.9) * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (road.weather === "snow") {
      for (let i = 0; i < 60; i++) {
        const sp = 60 + this.rand(i * 2.3) * 110;
        const x = this.rand(i * 5.9) * (W + 80) - 40 + Math.sin(t * 0.7 + i) * 34 - this.bike.vx * 0.03;
        const y = (this.rand(i * 9.1) * (H + 80) + t * sp) % (H + 80) - 40;
        ctx.globalAlpha = 0.25 + this.rand(i * 3.7) * 0.5;
        ctx.fillStyle = "#eef4ff";
        ctx.beginPath();
        ctx.arc(x, y, 1 + this.rand(i * 1.3) * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (road.weather === "embers") {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 40; i++) {
        const sp = 90 + this.rand(i * 2.3) * 140;
        const x = this.rand(i * 7.3) * (W + 40) - 20 + Math.sin(t * 0.9 + i * 2.2) * 30;
        const y = H + 20 - ((this.rand(i * 4.9) * H + t * sp) % (H + 40));
        const flick = Math.abs(Math.sin(t * 2.4 + i * 1.7));
        ctx.globalAlpha = (0.22 + flick * 0.5) * (0.4 + 0.6 * Math.abs(Math.sin(t + i)));
        ctx.fillStyle = i % 3 === 0 ? "#ffb35c" : "#ff6a35";
        ctx.beginPath();
        ctx.arc(x, y, 1 + this.rand(i) * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawSpeedLines() {
    const { ctx, W, H } = this;
    const speed = Math.abs(this.bike.vx);
    if (speed < 300 || this.calm) return;

    const intensity = clamp((speed - 300) / 500, 0, 1);
    const t = performance.now() * 0.001;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.2})`;
    for (let i = 0; i < 9; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x0 = side === 1 ? W * 0.45 : W * 0.55;
      const len = 60 + this.rand(i * 3.3) * 120 * intensity;
      const y = H * (0.3 + this.rand(i * 7.1) * 0.55);
      const phase = (t * (2 + intensity * 3) + this.rand(i * 1.7) * 6) % 1.6;
      const px = x0 + side * phase * W * 0.5;
      ctx.globalAlpha = clamp(intensity * (1 - Math.abs(phase - 0.8) / 0.8), 0, 1) * 0.5;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px - side * len, y + 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawGrade(road: RoadDef) {
    // Cinematic color grade: warm light pooling in the horizon, cool shadows on top.
    const { ctx, W, H } = this;
    const top = ctx.createLinearGradient(0, 0, 0, H * 0.35);
    top.addColorStop(0, rgba(road.night ? "#05070f" : "#0a1230", 0.3));
    top.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, H * 0.35);
  }

  private drawVignette() {
    const { ctx, W, H } = this;
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.52, H * 0.32, W * 0.5, H * 0.52, H * 0.95);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(2, 3, 8, 0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }
}

interface Star {
  x: number;
  y: number;
  r: number;
}
interface CloudDef {
  x: number;
  y: number;
  s: number;
  v: number;
  o: number;
}

interface SceneCache {
  stars: Star[];
  clouds: CloudDef[];
}

function buildScene(road: number): SceneCache {
  const stars: Star[] = [];
  for (let i = 0; i < 90; i++) {
    const h = Math.abs(Math.sin(i * 127.1 + road * 31.7)) * 43758.5453;
    const r1 = h - Math.floor(h);
    const h2 = Math.abs(Math.sin(i * 269.5 + road)) * 24634.6345;
    const r2 = h2 - Math.floor(h2);
    stars.push({ x: r1 * 2000, y: r2 * 700, r: 0.6 + r1 * 1.4 });
  }
  const clouds: CloudDef[] = [];
  for (let i = 0; i < 7; i++) {
    const h = Math.abs(Math.sin(i * 41.3 + road * 5.1)) * 43758.5453;
    const r1 = h - Math.floor(h);
    const h2 = Math.abs(Math.sin(i * 97.9 + road)) * 24634.6345;
    const r2 = h2 - Math.floor(h2);
    clouds.push({ x: r1 * 2200, y: 90 + r2 * 260, s: 44 + r1 * 60, v: 5 + r2 * 10, o: 0.16 + r1 * 0.22 });
  }
  return { stars, clouds };
}