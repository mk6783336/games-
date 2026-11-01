import { mulberry32 } from "../../lib/daily";

export interface RunSummary {
  score: number;
  collectedCoins: number;
  distance: number;
  durationMs: number;
}

export interface HudStats {
  score: number;
  coins: number;
  speed: number;
  distance: number;
}

export type EngineCue = "jump" | "slide" | "coin" | "hit" | "start";

export interface GameCallbacks {
  onHud: (stats: HudStats) => void;
  onEnd: (summary: RunSummary) => void;
  onCue: (cue: EngineCue) => void;
}

type Phase = "idle" | "countdown" | "running" | "paused" | "dying" | "over";
type HazardKind = "spike" | "crate" | "laser";

interface Hazard {
  kind: HazardKind;
  x: number;
  delay: number;
  passed: boolean;
  variant: number;
}

interface Coin {
  x: number;
  altitude: number;
  spin: number;
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

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
}

interface Building {
  x: number;
  w: number;
  h: number;
  windows: { x: number; y: number; w: number; h: number; lit: boolean; hue: number }[];
}

interface Player {
  altitude: number;
  vy: number;
  jumpsUsed: number;
  sliding: boolean;
  slideTime: number;
  runPhase: number;
}

const PLAYER_X = 0.23;
const GROUND_Y = 0.8;
const GRAVITY = 3.3;
const JUMP_V = 1.3;
const DOUBLE_JUMP_V = 1.08;
const SPEED_START = 0.4;
const SPEED_MAX = 0.78;

export class OneChanceGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: GameCallbacks;
  private raf = 0;
  private last = 0;
  private ro: ResizeObserver | null = null;

  private W = 960;
  private H = 540;
  private U = 540;
  private dpr = 1;

  private phase: Phase = "idle";
  private rng = mulberry32(1);

  private score = 0;
  private coinCount = 0;
  private elapsed = 0;
  private distance = 0;
  private speedFactor = SPEED_START;
  private world = 0;
  private spawnTimer = 3;
  private coinTimer = 2.2;
  private spawnCount = 0;
  private countdown = 3;
  private deathTimer = 0;
  private shake = 0;
  private flash = 0;
  private hudTimer = 0;
  private ended = false;

  private player: Player = { altitude: 0, vy: 0, jumpsUsed: 0, sliding: false, slideTime: 0, runPhase: 0 };
  private hazards: Hazard[] = [];
  private coinList: Coin[] = [];
  private particles: Particle[] = [];
  private stars: Star[] = [];
  private buildingsFar: Building[] = [];
  private buildingsNear: Building[] = [];
  private speedLines: { y: number; len: number; speed: number; alpha: number }[] = [];

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.cb = callbacks;
    this.resize();
    this.generateScenery();
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);

    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => {
        this.resize();
        this.generateScenery();
      });
      this.ro.observe(canvas.parentElement ?? canvas);
    }
  }

  resize() {
    const rect = (this.canvas.parentElement ?? this.canvas).getBoundingClientRect();
    const w = Math.max(320, rect.width);
    const h = Math.max(260, rect.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = w;
    this.H = h;
    this.U = Math.min(w, h * 1.2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  start(seed: number) {
    this.rng = mulberry32(seed >>> 0);
    this.phase = "countdown";
    this.countdown = 3;
    this.score = 0;
    this.coinCount = 0;
    this.elapsed = 0;
    this.distance = 0;
    this.speedFactor = SPEED_START;
    this.spawnTimer = 3;
    this.coinTimer = 2.2;
    this.spawnCount = 0;
    this.deathTimer = 0;
    this.shake = 0;
    this.flash = 0;
    this.hudTimer = 0;
    this.ended = false;
    this.hazards = [];
    this.coinList = [];
    this.particles = [];
    this.player = { altitude: 0, vy: 0, jumpsUsed: 0, sliding: false, slideTime: 0, runPhase: 0 };
    this.last = performance.now();
    this.emitHud();
  }

  pause() {
    if (this.phase === "running") this.phase = "paused";
  }

  resume() {
    if (this.phase === "paused") {
      this.phase = "running";
      this.last = performance.now();
    }
  }

  showIdle() {
    this.phase = "idle";
    this.hazards = [];
    this.coinList = [];
    this.particles = [];
    this.last = performance.now();
  }

  jump() {
    if (this.phase !== "running") return;
    if (this.player.altitude <= 0.002) {
      this.player.vy = JUMP_V;
      this.player.jumpsUsed = 1;
      this.player.sliding = false;
      this.burst(this.playerX(), this.groundY(), 7, "#a78bfa", 0.6);
      this.cb.onCue("jump");
      return;
    }
    if (this.player.jumpsUsed < 2) {
      this.player.vy = DOUBLE_JUMP_V;
      this.player.jumpsUsed = 2;
      this.player.sliding = false;
      this.burst(this.playerX(), this.playerY(), 9, "#7dd3fc", 0.7);
      this.cb.onCue("jump");
    }
  }

  slide() {
    if (this.phase !== "running" || this.player.sliding) return;
    this.player.sliding = true;
    this.player.slideTime = 0.62;
    if (this.player.altitude > 0.01) {
      this.player.vy = Math.min(this.player.vy, -1.2);
    }
    this.burst(this.playerX() - this.U * 0.02, this.groundY() - this.U * 0.02, 8, "#e879f9", 0.4);
    this.cb.onCue("slide");
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

  private playerX() {
    return this.W * PLAYER_X;
  }

  private groundY() {
    return this.H * GROUND_Y;
  }

  private playerHeight() {
    return (this.player.sliding ? 0.075 : 0.15) * this.U;
  }

  private playerWidth() {
    return (this.player.sliding ? 0.062 : 0.05) * this.U;
  }

  private playerY() {
    return this.groundY() - this.player.altitude * this.U;
  }

  private emitHud() {
    this.cb.onHud({
      score: Math.floor(this.score),
      coins: this.coinCount,
      speed: this.speedFactor,
      distance: Math.floor(this.distance),
    });
  }

  private update(dt: number) {
    if (this.phase === "paused") return;

    if (this.phase === "idle") {
      this.world += 34 * dt;
      this.player.runPhase += dt * 8;
      this.particles = this.particles.filter((p) => (p.life -= dt) > 0);
      return;
    }

    if (this.phase === "countdown") {
      this.countdown -= dt;
      this.player.runPhase += dt * 9;
      if (this.countdown <= 0) {
        this.phase = "running";
        this.cb.onCue("start");
      }
      return;
    }

    if (this.phase === "dying") {
      this.deathTimer -= dt;
      this.shake = Math.max(0, this.shake - dt * 42);
      this.flash = Math.max(0, this.flash - dt * 2.8);
      this.updateParticles(dt);
      if (this.deathTimer <= 0) this.finishRun();
      return;
    }

    if (this.phase === "over") {
      this.updateParticles(dt);
      return;
    }

    // running
    this.elapsed += dt;
    this.speedFactor = Math.min(SPEED_MAX, SPEED_START + this.elapsed * 0.0052);
    this.world += this.speedFactor * this.W * dt;
    this.score += dt * 24;
    this.distance += dt * (this.speedFactor * 14);
    this.player.runPhase += dt * (8 + this.speedFactor * 8);

    if (this.player.sliding) {
      this.player.slideTime -= dt;
      if (this.player.slideTime <= 0) this.player.sliding = false;
    }

    if (this.player.altitude > 0 || this.player.vy > 0) {
      this.player.vy -= GRAVITY * dt;
      this.player.altitude += this.player.vy * dt;
      if (this.player.altitude <= 0) {
        if (this.player.vy < -0.4) {
          this.burst(this.playerX(), this.groundY(), 6, "#c4b5fd", 0.45);
        }
        this.player.altitude = 0;
        this.player.vy = 0;
        this.player.jumpsUsed = 0;
      }
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnHazard();
      this.spawnTimer = Math.max(0.74, 1.5 - this.elapsed * 0.011);
    }
    this.coinTimer -= dt;
    if (this.coinTimer <= 0) {
      this.spawnCoins();
      this.coinTimer = 2.2 + this.rng() * 2;
    }

    const dx = this.speedFactor * dt;
    for (const hazard of this.hazards) {
      if (hazard.delay > 0) {
        hazard.delay -= dt;
        continue;
      }
      hazard.x -= dx;
      if (!hazard.passed && hazard.x < PLAYER_X - 0.055) {
        hazard.passed = true;
        this.score += 12;
      }
    }
    this.hazards = this.hazards.filter((h) => h.x > -0.18);

    for (const coin of this.coinList) {
      if (coin.x > PLAYER_X - 0.02) {
        coin.x -= dx;
        coin.spin += dt * 5;
      }
    }
    this.coinList = this.coinList.filter((c) => c.x > -0.05);

    this.checkCollisions();
    this.updateParticles(dt);
    this.shake = Math.max(0, this.shake - dt * 30);

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.emitHud();
    }
  }

  private checkCollisions() {
    const px = this.playerX();
    const pyTop = this.playerY() - this.playerHeight();
    const pyBottom = this.playerY();
    const pw = this.playerWidth() * 0.82;
    const left = px - pw / 2;
    const right = px + pw / 2;
    const top = pyTop + this.playerHeight() * 0.12;
    const bottom = pyBottom - this.playerHeight() * 0.04;

    for (const hazard of this.hazards) {
      if (hazard.delay > 0) continue;
      const hx = hazard.x * this.W;
      const hw = this.hazardWidth(hazard.kind);
      const range = this.hazardRange(hazard.kind);
      if (right < hx - hw / 2 || left > hx + hw / 2) continue;
      if (bottom < range.top || top > range.bottom) continue;
      this.hit();
      return;
    }

    const radius = this.U * 0.023;
    this.coinList = this.coinList.filter((coin) => {
      const cx = coin.x * this.W;
      const cy = this.groundY() - coin.altitude * this.U;
      const closestX = Math.max(left, Math.min(cx, right));
      const closestY = Math.max(top, Math.min(cy, bottom));
      const d = Math.hypot(cx - closestX, cy - closestY);
      if (d < radius + this.U * 0.014) {
        this.score += 30;
        this.coinCount += 1;
        this.burst(cx, cy, 10, "#f5c45a", 0.7);
        this.cb.onCue("coin");
        return false;
      }
      return true;
    });
  }

  private hazardWidth(kind: HazardKind) {
    if (kind === "spike") return this.U * 0.16;
    if (kind === "crate") return this.U * 0.1;
    return this.U * 0.075;
  }

  private hazardRange(kind: HazardKind) {
    const ground = this.groundY();
    if (kind === "spike") return { top: ground - this.U * 0.075, bottom: ground + 2 };
    if (kind === "crate") return { top: ground - this.U * 0.115, bottom: ground };
    return { top: ground - this.U * 0.43, bottom: ground - this.U * 0.085 };
  }

  private spawnHazard() {
    // The first hazard is always a jump so a new runner can learn the rhythm.
    const roll = this.rng();
    const kind: HazardKind =
      this.spawnCount === 0 ? "spike" : roll < 0.46 ? "spike" : roll < 0.72 ? "crate" : "laser";
    this.spawnCount += 1;
    this.hazards.push({
      kind,
      x: 1.12,
      delay: 0.48 + this.rng() * 0.12,
      passed: false,
      variant: this.rng(),
    });
  }

  private spawnCoins() {
    const base = 0.1 + this.rng() * 0.16;
    const arc = this.rng() > 0.5;
    for (let i = 0; i < 3; i++) {
      this.coinList.push({
        x: 1.08 + i * 0.038,
        altitude: arc ? base + Math.sin((i / 2) * Math.PI) * 0.09 : base,
        spin: i * 0.7,
      });
    }
  }

  private hit() {
    if (this.phase !== "running") return;
    this.phase = "dying";
    this.deathTimer = 0.72;
    this.shake = 16;
    this.flash = 0.75;
    this.cb.onCue("hit");
    this.burst(this.playerX(), this.playerY() - this.playerHeight() * 0.5, 30, "#f0abfc", 1.2);
    this.emitHud();
  }

  private finishRun() {
    if (this.ended) return;
    this.ended = true;
    this.phase = "over";
    const summary: RunSummary = {
      score: Math.floor(this.score),
      collectedCoins: this.coinCount,
      distance: Math.floor(this.distance),
      durationMs: Math.floor(this.elapsed * 1000),
    };
    this.cb.onEnd(summary);
  }

  private burst(x: number, y: number, count: number, color: string, force: number) {
    for (let i = 0; i < count; i++) {
      const angle = this.rng() * Math.PI * 2;
      const speed = (40 + this.rng() * 160) * force * (this.U / 540);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60 * force,
        life: 0.35 + this.rng() * 0.5,
        max: 0.85,
        size: (1 + this.rng() * 3) * (this.U / 540),
        color,
      });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 380 * dt * (this.U / 540);
      p.vx *= 0.99;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private generateScenery() {
    const starRng = mulberry32(82731);
    this.stars = Array.from({ length: 46 }).map(() => ({
      x: starRng(),
      y: 0.04 + starRng() * 0.55,
      r: 0.5 + starRng() * 1.4,
      phase: starRng() * Math.PI * 2,
    }));
    this.buildingsFar = this.makeSkyline(44521, 0.12, 0.28);
    this.buildingsNear = this.makeSkyline(91273, 0.17, 0.43);
    const rng = mulberry32(3211);
    this.speedLines = Array.from({ length: 9 }).map(() => ({
      y: 0.14 + rng() * 0.55,
      len: 20 + rng() * 80,
      speed: 0.5 + rng() * 1.2,
      alpha: 0.08 + rng() * 0.18,
    }));
  }

  private makeSkyline(seed: number, minH: number, maxH: number): Building[] {
    const rng = mulberry32(seed);
    const buildings: Building[] = [];
    let x = 0;
    const span = this.W * 2;
    while (x < span) {
      const w = this.W * (0.035 + rng() * 0.065);
      const h = this.H * (minH + rng() * (maxH - minH));
      const windows: Building["windows"] = [];
      const cols = Math.max(1, Math.floor(w / (this.W * 0.014)));
      const rows = Math.max(2, Math.floor(h / (this.H * 0.045)));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rng() > 0.68) {
            windows.push({
              x: (c + 0.3) * (w / cols),
              y: (r + 0.3) * (h / rows),
              w: Math.max(1.5, (w / cols) * 0.35),
              h: Math.max(2, (h / rows) * 0.32),
              lit: rng() > 0.34,
              hue: rng() > 0.7 ? 194 : rng() > 0.45 ? 42 : 30,
            });
          }
        }
      }
      buildings.push({ x, w, h, windows });
      x += w + this.W * (0.006 + rng() * 0.018);
    }
    return buildings;
  }

  private draw() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);

    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 0.55 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawSky();
    this.drawSkylineLayer(this.buildingsFar, this.world * 0.055, "rgba(22,34,46,0.92)", 0.26, this.groundY() - this.U * 0.02);
    this.drawSkylineLayer(this.buildingsNear, this.world * 0.13, "rgba(6,10,15,0.98)", 0.38, this.groundY() + this.U * 0.01);
    this.drawGround();
    this.drawSpeedLines();

    if (this.phase !== "idle") {
      this.drawHazards();
      this.drawCoins();
    }
    this.drawPlayer();
    this.drawParticles();
    if (this.phase === "countdown") this.drawCountdown();
    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(244, 63, 94, ${this.flash * 0.28})`;
      ctx.fillRect(0, 0, this.W, this.H);
    }
    this.drawVignette();
  }

  private drawSky() {
    const ctx = this.ctx;
    const horizon = this.groundY();
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#05080d");
    sky.addColorStop(0.45, "#0b1420");
    sky.addColorStop(0.78, "#1a2a3c");
    sky.addColorStop(1, "#3a444e");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.W, horizon);

    const time = performance.now() / 1000;
    for (const star of this.stars) {
      const alpha = 0.22 + Math.sin(time * 0.8 + star.phase) * 0.18;
      ctx.fillStyle = `rgba(219, 232, 255, ${Math.max(0.05, alpha)})`;
      ctx.beginPath();
      ctx.arc(star.x * this.W, star.y * this.H, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const moonX = this.W * 0.79;
    const moonY = this.H * 0.17;
    const moonR = Math.min(this.W, this.H) * 0.085;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.2, moonX, moonY, moonR * 3.2);
    moonGlow.addColorStop(0, "rgba(190, 211, 232, 0.34)");
    moonGlow.addColorStop(0.5, "rgba(120, 145, 170, 0.1)");
    moonGlow.addColorStop(1, "rgba(20, 30, 40, 0)");
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3.2, 0, Math.PI * 2);
    ctx.fill();

    const moon = ctx.createRadialGradient(moonX - moonR * 0.25, moonY - moonR * 0.3, moonR * 0.1, moonX, moonY, moonR);
    moon.addColorStop(0, "rgba(238, 244, 250, 0.72)");
    moon.addColorStop(0.55, "rgba(172, 190, 208, 0.26)");
    moon.addColorStop(1, "rgba(58, 76, 96, 0.04)");
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // A faint planetary ring gives the empty sky a cinematic anchor.
    ctx.save();
    ctx.translate(moonX, moonY);
    ctx.rotate(-0.32);
    ctx.strokeStyle = "rgba(166, 188, 208, 0.13)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, moonR * 2.35, moonR * 0.58, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(196, 146, 96, 0.08)";
    ctx.beginPath();
    ctx.ellipse(0, 0, moonR * 2.85, moonR * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const aurora = ctx.createLinearGradient(this.W * 0.1, 0, this.W * 0.85, this.H * 0.62);
    aurora.addColorStop(0, "rgba(30, 60, 76, 0)");
    aurora.addColorStop(0.42, "rgba(52, 88, 104, 0.1)");
    aurora.addColorStop(0.62, "rgba(90, 130, 140, 0.05)");
    aurora.addColorStop(1, "rgba(10, 18, 26, 0)");
    ctx.fillStyle = aurora;
    ctx.beginPath();
    ctx.moveTo(0, this.H * 0.06);
    ctx.lineTo(this.W, this.H * 0.28);
    ctx.lineTo(this.W, this.H * 0.44);
    ctx.lineTo(0, this.H * 0.2);
    ctx.closePath();
    ctx.fill();

    const haze = ctx.createRadialGradient(this.W * 0.52, horizon, 0, this.W * 0.52, horizon, this.W * 0.6);
    haze.addColorStop(0, "rgba(214, 158, 96, 0.13)");
    haze.addColorStop(0.45, "rgba(96, 118, 138, 0.08)");
    haze.addColorStop(1, "rgba(5, 7, 10, 0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, horizon - this.H * 0.45, this.W, this.H * 0.45);
  }

  private drawSkylineLayer(buildings: Building[], offset: number, color: string, windowAlpha: number, baseY: number) {
    const ctx = this.ctx;
    const span = this.W * 2;
    const shift = offset % span;
    ctx.fillStyle = color;
    for (const b of buildings) {
      for (let repeat = 0; repeat < 2; repeat++) {
        const x = b.x - shift + repeat * span;
        if (x > this.W + 4 || x + b.w < -4) continue;
        ctx.fillRect(x, baseY - b.h, b.w, b.h);
        for (const w of b.windows) {
          if (!w.lit) continue;
          ctx.fillStyle = `hsla(${w.hue}, 52%, 62%, ${windowAlpha})`;
          ctx.fillRect(x + w.x, baseY - b.h + w.y, w.w, w.h);
        }
        ctx.fillStyle = color;
      }
    }
  }

  private drawGround() {
    const ctx = this.ctx;
    const ground = this.groundY();
    const floor = ctx.createLinearGradient(0, ground, 0, this.H);
    floor.addColorStop(0, "#0c1219");
    floor.addColorStop(0.55, "#06090d");
    floor.addColorStop(1, "#020304");
    ctx.fillStyle = floor;
    ctx.fillRect(0, ground, this.W, this.H - ground);

    const line = ctx.createLinearGradient(0, 0, this.W, 0);
    line.addColorStop(0, "rgba(143, 176, 196, 0.12)");
    line.addColorStop(0.28, "rgba(214, 167, 106, 0.75)");
    line.addColorStop(0.55, "rgba(230, 188, 132, 0.85)");
    line.addColorStop(0.8, "rgba(143, 176, 196, 0.45)");
    line.addColorStop(1, "rgba(143, 176, 196, 0.08)");
    ctx.save();
    ctx.fillStyle = line;
    ctx.fillRect(0, ground - 1.5, this.W, 3);
    ctx.restore();

    const spacing = this.U * 0.12;
    const offset = (this.world * 0.9) % spacing;
    ctx.fillStyle = "rgba(190, 160, 116, 0.12)";
    for (let x = -offset; x < this.W; x += spacing) {
      ctx.fillRect(x, ground + this.U * 0.035, this.U * 0.004, this.U * 0.018);
    }
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 4; i++) {
      const y = ground + this.U * (0.09 + i * 0.065);
      ctx.fillRect(0, y, this.W, 1);
    }
    // distant city reflection
    const reflect = ctx.createLinearGradient(0, ground, 0, this.H);
    reflect.addColorStop(0, "rgba(214, 158, 96, 0.08)");
    reflect.addColorStop(1, "rgba(214, 158, 96, 0)");
    ctx.fillStyle = reflect;
    ctx.fillRect(0, ground, this.W, this.H - ground);
  }

  private drawSpeedLines() {
    const ctx = this.ctx;
    const offset = (this.world * 1.6) % this.W;
    ctx.lineCap = "round";
    for (const line of this.speedLines) {
      ctx.strokeStyle = `rgba(168, 190, 255, ${line.alpha})`;
      ctx.lineWidth = 1;
      const x = (this.W - ((offset * line.speed) % (this.W + 120))) + line.len;
      ctx.beginPath();
      ctx.moveTo(x, line.y * this.H);
      ctx.lineTo(x - line.len, line.y * this.H);
      ctx.stroke();
    }
  }

  private drawHazards() {
    const ctx = this.ctx;
    const ground = this.groundY();
    for (const hazard of this.hazards) {
      if (hazard.x > 1.16 || hazard.x < -0.12) continue;
      const x = hazard.x * this.W;
      const w = this.hazardWidth(hazard.kind);
      const pulse = 0.65 + Math.sin(performance.now() / 130 + hazard.variant * 4) * 0.2;

      if (hazard.delay > 0) {
        // Telegraph at the edge before the object starts moving.
        this.drawWarning(hazard);
        continue;
      }

      if (hazard.kind === "spike") {
        const h = this.U * 0.075;
        ctx.save();
        const grad = ctx.createLinearGradient(x - w / 2, ground, x + w / 2, ground - h);
        grad.addColorStop(0, "#4a2118");
        grad.addColorStop(0.55, "#b26f46");
        grad.addColorStop(1, "#f0c89a");
        ctx.fillStyle = grad;
        for (let i = 0; i < 3; i++) {
          const sw = w / 3;
          const sx = x - w / 2 + i * sw;
          ctx.beginPath();
          ctx.moveTo(sx, ground + 1);
          ctx.lineTo(sx + sw / 2, ground - h);
          ctx.lineTo(sx + sw, ground + 1);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = "rgba(244, 206, 164, 0.85)";
        ctx.fillRect(x - w / 2, ground - 2, w, 2);
        ctx.restore();
      } else if (hazard.kind === "crate") {
        const h = this.U * 0.115;
        ctx.save();
        const body = ctx.createLinearGradient(x, ground - h, x, ground);
        body.addColorStop(0, "#26333d");
        body.addColorStop(1, "#0a1016");
        ctx.fillStyle = body;
        ctx.fillRect(x - w / 2, ground - h, w, h);
        ctx.strokeStyle = "rgba(170, 196, 214, 0.55)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - w / 2 + 1, ground - h + 1, w - 2, h - 2);
        ctx.strokeStyle = "rgba(229, 177, 95, 0.3)";
        ctx.beginPath();
        ctx.moveTo(x - w / 2 + 4, ground - 4);
        ctx.lineTo(x + w / 2 - 4, ground - h + 4);
        ctx.moveTo(x + w / 2 - 4, ground - 4);
        ctx.lineTo(x - w / 2 + 4, ground - h + 4);
        ctx.stroke();
        ctx.fillStyle = `rgba(245, 196, 90, ${0.5 + pulse * 0.3})`;
        ctx.fillRect(x - w * 0.2, ground - h - 2, w * 0.4, 2);
        ctx.restore();
      } else {
        const beamTop = ground - this.U * 0.43;
        const beamBottom = ground - this.U * 0.085;
        const beamH = beamBottom - beamTop;
        ctx.save();
        const beam = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
        beam.addColorStop(0, "rgba(230, 140, 90, 0.03)");
        beam.addColorStop(0.5, `rgba(240, 176, 120, ${0.3 + pulse * 0.2})`);
        beam.addColorStop(1, "rgba(230, 140, 90, 0.06)");
        ctx.fillStyle = beam;
        ctx.fillRect(x - w / 2, beamTop, w, beamH);
        ctx.strokeStyle = "rgba(240, 176, 120, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - w / 2, beamTop, w, beamH);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = `rgba(255, 226, 190, ${0.14 + pulse * 0.12})`;
          ctx.fillRect(x - w / 2 + 2, beamTop + 6 + i * (beamH / 6.5), w - 4, 1.5);
        }
        ctx.fillStyle = "rgba(245, 196, 90, 0.9)";
        ctx.fillRect(x - w / 2, ground - this.U * 0.012, w, 3);
        ctx.fillStyle = "rgba(30, 16, 48, 0.9)";
        ctx.fillRect(x - w / 2 - 2, beamTop - 5, w + 4, 6);
        ctx.restore();
      }
    }

    // ground glow that hints the required action
    for (const hazard of this.hazards) {
      if (hazard.delay > 0 || hazard.x > 0.95) continue;
      const x = hazard.x * this.W;
      const laneY = hazard.kind === "laser" ? ground - this.U * 0.5 : ground - this.U * 0.12;
      const glow = ctx.createRadialGradient(x, laneY, 0, x, laneY, this.U * 0.13);
      glow.addColorStop(0, hazard.kind === "laser" ? "rgba(232,121,249,0.18)" : "rgba(167,139,250,0.14)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - this.U * 0.16, laneY - this.U * 0.16, this.U * 0.32, this.U * 0.32);
    }
  }

  private drawWarning(hazard: Hazard) {
    const ctx = this.ctx;
    const ground = this.groundY();
    const isLaser = hazard.kind === "laser";
    const color = isLaser ? "#f0abfc" : "#c4b5fd";
    const pulse = 0.55 + Math.sin(performance.now() / 110) * 0.25;
    const x = this.W - this.U * 0.075;
    const y = isLaser ? ground - this.U * 0.58 : ground - this.U * 0.26;

    ctx.save();
    ctx.globalAlpha = 0.7 + pulse * 0.3;
    const grad = ctx.createLinearGradient(0, y - this.U * 0.075, 0, y + this.U * 0.075);
    grad.addColorStop(0, "rgba(10,14,30,0)");
    grad.addColorStop(0.35, isLaser ? "rgba(232,121,249,0.18)" : "rgba(139,92,246,0.16)");
    grad.addColorStop(1, "rgba(10,14,30,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(this.W - this.U * 0.12, y - this.U * 0.07, this.U * 0.12, this.U * 0.14);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      const cx = x - i * 9;
      ctx.beginPath();
      ctx.moveTo(cx, y - 7);
      ctx.lineTo(cx - 8, y);
      ctx.lineTo(cx, y + 7);
      ctx.stroke();
    }
    ctx.font = `700 ${Math.max(8, this.U * 0.018)}px Manrope, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillStyle = color;
    ctx.fillText(isLaser ? "SLIDE" : "JUMP", x - 24, y + 3);
    ctx.restore();
  }

  private drawCoins() {
    const ctx = this.ctx;
    for (const coin of this.coinList) {
      if (coin.x > 1.12 || coin.x < -0.05) continue;
      const x = coin.x * this.W;
      const y = this.groundY() - coin.altitude * this.U;
      const r = this.U * 0.021;
      const squash = 0.35 + Math.abs(Math.cos(coin.spin)) * 0.65;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(squash, 1);
      ctx.shadowColor = "rgba(245, 196, 90, 0.9)";
      ctx.shadowBlur = 16;
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, 0, 0, r);
      grad.addColorStop(0, "#fff2c4");
      grad.addColorStop(0.55, "#f5c45a");
      grad.addColorStop(1, "#af7826");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 242, 196, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawPlayer() {
    const ctx = this.ctx;
    const x = this.playerX();
    const ground = this.groundY();
    const feet = this.playerY();
    const u = this.U;
    const h = this.playerHeight();
    const sliding = this.player.sliding;
    const airborne = this.player.altitude > 0.002;

    // ground shadow
    const shadowScale = Math.max(0.2, 1 - this.player.altitude * 1.8);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(x, ground + 2, u * 0.045 * shadowScale, u * 0.013 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // motion ghosts: two, faint, but never a neon aura
    for (let i = 2; i >= 1; i--) {
      ctx.save();
      ctx.globalAlpha = 0.05 * i;
      this.drawRunner(x - i * u * 0.032, feet, u, h, sliding, airborne, this.player.runPhase - i * 0.4, "#c9a06a");
      ctx.restore();
    }

    this.drawRunner(x, feet, u, h, sliding, airborne, this.player.runPhase, "#a8bdcf");
  }

  private drawRunner(
    x: number,
    feet: number,
    u: number,
    h: number,
    sliding: boolean,
    airborne: boolean,
    phase: number,
    rim: string,
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, feet);

    const dark = "#05090e";
    const far = "#0b131b";
    const headR = Math.max(5, h * 0.072);
    const headY = -h + headR * 1.1;
    const shoulderY = -h * 0.79;
    const hipY = -h * 0.46;

    if (sliding) {
      // low, forward, one arm skimming the roof
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.3, h * 0.3, h * 0.115, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(h * 0.26, -h * 0.4, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = far;
      ctx.lineWidth = h * 0.085;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-h * 0.04, -h * 0.24);
      ctx.lineTo(-h * 0.2, -h * 0.14);
      ctx.lineTo(-h * 0.32, -h * 0.06);
      ctx.moveTo(-h * 0.02, -h * 0.2);
      ctx.lineTo(h * 0.08, -h * 0.08);
      ctx.lineTo(h * 0.16, 0);
      ctx.stroke();
      ctx.strokeStyle = dark;
      ctx.lineWidth = h * 0.055;
      ctx.beginPath();
      ctx.moveTo(h * 0.13, -h * 0.34);
      ctx.lineTo(h * 0.24, -h * 0.2);
      ctx.lineTo(h * 0.3, -h * 0.12);
      ctx.stroke();
      ctx.strokeStyle = `${rim}66`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(h * 0.2, -h * 0.42);
      ctx.quadraticCurveTo(-h * 0.02, -h * 0.4, -h * 0.14, -h * 0.3);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const idle = this.phase === "idle" || this.phase === "countdown";
    const swing = airborne ? 0.82 : idle ? 0.5 : Math.sin(phase);
    const swing2 = airborne ? -0.4 : idle ? -0.42 : Math.sin(phase + Math.PI);

    const hip = { x: 0, y: hipY };
    const shoulder = { x: h * 0.025, y: shoulderY };

    const farKnee = { x: h * 0.075 - swing2 * h * 0.075, y: hipY + h * 0.22 };
    const farFoot = { x: -swing2 * h * 0.125 - h * 0.01, y: airborne ? hipY + h * 0.36 : 0 };
    const nearKnee = { x: h * 0.03 + swing * h * 0.085, y: hipY + h * 0.24 };
    const nearFoot = { x: swing * h * 0.14 + h * 0.02, y: airborne ? hipY + h * 0.4 : 0 };

    // far leg sits behind the jacket
    ctx.strokeStyle = far;
    ctx.lineWidth = h * 0.07;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(hip.x - h * 0.015, hip.y);
    ctx.lineTo(farKnee.x, farKnee.y);
    ctx.lineTo(farFoot.x, farFoot.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(farFoot.x, farFoot.y);
    ctx.lineTo(farFoot.x + h * 0.08, farFoot.y);
    ctx.stroke();

    // far arm
    ctx.strokeStyle = far;
    ctx.lineWidth = h * 0.05;
    ctx.beginPath();
    ctx.moveTo(shoulder.x - h * 0.025, shoulder.y + h * 0.04);
    ctx.lineTo(shoulder.x - h * 0.12, shoulder.y + h * 0.14);
    ctx.lineTo(shoulder.x - h * 0.15, shoulder.y + h * 0.28);
    ctx.stroke();

    // jacket: hood, shoulders, short hem
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(shoulder.x - h * 0.06, shoulder.y + h * 0.02);
    ctx.quadraticCurveTo(shoulder.x - h * 0.08, shoulder.y - h * 0.1, shoulder.x - h * 0.01, shoulder.y - h * 0.13);
    ctx.quadraticCurveTo(shoulder.x + h * 0.08, shoulder.y - h * 0.09, shoulder.x + h * 0.075, shoulder.y + h * 0.03);
    ctx.lineTo(hip.x + h * 0.055, hip.y + h * 0.01);
    ctx.quadraticCurveTo(hip.x + h * 0.02, hip.y + h * 0.08, hip.x - h * 0.055, hip.y + h * 0.05);
    ctx.lineTo(shoulder.x - h * 0.07, shoulder.y + h * 0.16);
    ctx.closePath();
    ctx.fill();

    // backpack behind the shoulder
    ctx.fillStyle = far;
    ctx.beginPath();
    ctx.roundRect(shoulder.x - h * 0.14, shoulder.y + h * 0.02, h * 0.08, h * 0.17, h * 0.02);
    ctx.fill();

    // hood and face
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(shoulder.x + h * 0.03, headY, headR * 1.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(shoulder.x + h * 0.075, headY + headR * 0.08, headR * 0.5, headR * 0.62, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = "#010203";
    ctx.fill();

    // a single pale glint, not a glowing visor
    ctx.strokeStyle = "rgba(201, 216, 228, 0.72)";
    ctx.lineWidth = Math.max(1, u * 0.0022);
    ctx.beginPath();
    ctx.moveTo(shoulder.x + h * 0.035, headY - headR * 0.04);
    ctx.lineTo(shoulder.x + h * 0.1, headY - headR * 0.06);
    ctx.stroke();

    // near leg
    ctx.strokeStyle = dark;
    ctx.lineWidth = h * 0.082;
    ctx.beginPath();
    ctx.moveTo(hip.x + h * 0.005, hip.y);
    ctx.lineTo(nearKnee.x, nearKnee.y);
    ctx.lineTo(nearFoot.x, nearFoot.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(nearFoot.x, nearFoot.y);
    ctx.lineTo(nearFoot.x + h * 0.09, nearFoot.y);
    ctx.stroke();

    // knee highlight keeps the stride legible on a dark roof
    ctx.strokeStyle = `${rim}55`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hip.x + h * 0.01, hip.y + h * 0.02);
    ctx.lineTo(nearKnee.x, nearKnee.y + h * 0.01);
    ctx.stroke();

    // near arm
    ctx.strokeStyle = dark;
    ctx.lineWidth = h * 0.055;
    ctx.beginPath();
    ctx.moveTo(shoulder.x + h * 0.03, shoulder.y + h * 0.05);
    ctx.lineTo(shoulder.x + h * 0.13, shoulder.y + h * 0.16);
    ctx.lineTo(shoulder.x + h * 0.16, shoulder.y + h * 0.31);
    ctx.stroke();

    // cool rim along the hood and back
    ctx.strokeStyle = `${rim}66`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(shoulder.x + h * 0.03, headY, headR * 1.12, Math.PI * 1.15, Math.PI * 1.78);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(shoulder.x - h * 0.055, shoulder.y + h * 0.04);
    ctx.quadraticCurveTo(hip.x - h * 0.06, hip.y - h * 0.1, hip.x - h * 0.05, hip.y + h * 0.04);
    ctx.stroke();

    ctx.restore();
  }

  private drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / p.max));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawCountdown() {
    const ctx = this.ctx;
    const n = Math.ceil(Math.max(0.001, this.countdown));
    const progress = 1 - (this.countdown - Math.floor(this.countdown));
    const scale = 0.85 + Math.sin(Math.min(1, progress) * Math.PI) * 0.18;
    ctx.save();
    ctx.fillStyle = "rgba(4,6,15,0.34)";
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.translate(this.W / 2, this.H * 0.46);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${this.U * 0.15}px Archivo, sans-serif`;
    ctx.fillStyle = "rgba(242,239,230,0.94)";
    ctx.fillText(String(n), 0, 0);
    ctx.font = `500 ${this.U * 0.02}px "Instrument Sans", sans-serif`;
    ctx.fillStyle = "rgba(201,196,184,0.75)";
    ctx.fillText("GET READY", 0, this.U * 0.09);
    ctx.restore();
  }

  private drawVignette() {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(this.W / 2, this.H * 0.5, this.H * 0.2, this.W / 2, this.H * 0.5, Math.max(this.W, this.H) * 0.72);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.7, "rgba(0,0,0,0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);

    const top = ctx.createLinearGradient(0, 0, 0, this.H * 0.16);
    top.addColorStop(0, "rgba(3,4,10,0.5)");
    top.addColorStop(1, "rgba(3,4,10,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, this.W, this.H * 0.16);
  }
}
