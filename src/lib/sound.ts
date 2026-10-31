type Cue = "click" | "success" | "error" | "unlock" | "jump" | "coin" | "hit" | "start" | "slide";

let audio: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audio) {
    try {
      audio = new Ctor();
    } catch {
      return null;
    }
  }
  return audio;
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function sweep(ctx: AudioContext, from: number, to: number, start: number, duration: number, type: OscillatorType, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/**
 * Lightweight synthesised cues — no audio files, no network, and every call is
 * triggered by a user interaction. Respects the player's sound preference.
 */
export function playCue(cue: Cue, enabled: boolean) {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  const t = ctx.currentTime + 0.005;

  switch (cue) {
    case "click":
      tone(ctx, 620, t, 0.045, "triangle", 0.035);
      break;
    case "success":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, f, t + i * 0.075, 0.28, "triangle", 0.045));
      break;
    case "unlock":
      sweep(ctx, 180, 420, t, 0.35, "sine", 0.05);
      tone(ctx, 640, t + 0.28, 0.4, "triangle", 0.04);
      break;
    case "error":
      sweep(ctx, 200, 110, t, 0.22, "square", 0.03);
      break;
    case "jump":
      sweep(ctx, 300, 620, t, 0.13, "sine", 0.04);
      break;
    case "slide":
      sweep(ctx, 500, 210, t, 0.12, "triangle", 0.025);
      break;
    case "coin":
      tone(ctx, 980, t, 0.06, "sine", 0.035);
      tone(ctx, 1470, t + 0.055, 0.09, "sine", 0.025);
      break;
    case "hit":
      sweep(ctx, 160, 62, t, 0.3, "sawtooth", 0.045);
      break;
    case "start":
      [392, 523.25, 659.25].forEach((f, i) => tone(ctx, f, t + i * 0.1, 0.2, "triangle", 0.04));
      break;
  }
}
