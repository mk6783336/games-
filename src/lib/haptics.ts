export type HapticStyle = "light" | "medium" | "heavy";

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 12,
  medium: 24,
  heavy: [22, 32, 44],
};

/**
 * Vibration is optional and only fires where the browser supports it.
 * It is a no-op on desktop, iOS Safari without support, and when disabled.
 */
export function haptic(style: HapticStyle, enabled: boolean) {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(PATTERNS[style]);
  } catch {
    // Some browsers expose vibrate but reject it without a user gesture.
  }
}
