import { levelFromXp } from "./games";
import type { PostHog } from "posthog-js";
import type { Identity } from "./api";
import type { PlayerState } from "./types";

/**
 * Product analytics for PLAYFLIX.
 *
 * The PostHog SDK is only downloaded when `VITE_POSTHOG_KEY` is configured at
 * build time, and every event is gated on the player's "Product analytics"
 * setting, so a guest can opt out at any time and nothing is sent afterwards.
 */

const API_KEY = import.meta.env.VITE_POSTHOG_KEY?.trim();
const API_HOST = import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
const VISITOR_KEY = "playflix.visitor.v1";

/** True when a PostHog project key is configured for this build. */
export const analyticsConfigured = Boolean(API_KEY);

let posthog: PostHog | null = null;
let loading = false;
let allowed = true;

interface Capture {
  event: string;
  properties?: Record<string, unknown>;
}

let pendingIdentify: { distinctId: string; properties: Record<string, unknown> } | null = null;
const pendingCaptures: Capture[] = [];

function guestId(): string {
  try {
    const stored = localStorage.getItem(VISITOR_KEY);
    if (stored) return stored;
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `guest_${crypto.randomUUID()}`
        : `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    // Storage can be unavailable (private browsing, blocked cookies).
    return `guest_session_${Date.now().toString(36)}`;
  }
}

function flushPending() {
  if (!posthog) return;
  if (!allowed) {
    pendingIdentify = null;
    pendingCaptures.length = 0;
    return;
  }
  if (pendingIdentify) {
    posthog.identify(pendingIdentify.distinctId, pendingIdentify.properties);
    pendingIdentify = null;
  }
  pendingCaptures.splice(0).forEach((item) => posthog?.capture(item.event, item.properties));
}

export function initAnalytics(consent: boolean) {
  allowed = consent;
  if (loading || posthog || !API_KEY) return;
  loading = true;

  void import("posthog-js")
    .then(({ default: sdk }) => {
      sdk.init(API_KEY, {
        api_host: API_HOST,
        // Pageviews are captured manually on SPA route changes.
        capture_pageview: false,
        autocapture: false,
        person_profiles: "identified_only",
        disable_session_recording: true,
        opt_out_capturing_by_default: !allowed,
        persistence: "localStorage+cookie",
        loaded: (instance) => {
          if (!allowed) instance.opt_out_capturing();
        },
      });
      posthog = sdk;
      flushPending();
    })
    .catch(() => {
      // Analytics must never break the game.
      pendingIdentify = null;
      pendingCaptures.length = 0;
    })
    .finally(() => {
      loading = false;
    });
}

/** Apply the player's analytics setting to the live PostHog client. */
export function setAnalyticsConsent(consent: boolean) {
  allowed = consent;
  if (!consent) {
    pendingIdentify = null;
    pendingCaptures.length = 0;
  }
  if (!posthog) return;
  if (consent) posthog.opt_in_capturing();
  else posthog.opt_out_capturing();
}

/**
 * Tie the player to a stable distinct id so funnels and retention work.
 * Accounts use a server profile id (never an email); guests use the local visitor id.
 */
export function identifyPlayer(state: PlayerState, identity: Identity | null = null) {
  if (!allowed) return;
  const isAccount = identity?.kind === "account";
  const distinctId = isAccount ? `account_${identity.profileId}` : guestId();
  const properties: Record<string, unknown> = {
    player_name: state.profile.name,
    country: state.profile.country,
    avatar_hue: state.profile.avatarHue,
    level: levelFromXp(state.xp).level,
    xp: state.xp,
    coins: state.coins,
    is_guest: !isAccount,
    joined_at: new Date(state.profile.createdAt).toISOString(),
  };
  if (posthog) {
    posthog.identify(distinctId, properties);
  } else if (API_KEY) {
    pendingIdentify = { distinctId, properties };
  }
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!allowed) return;
  if (posthog) {
    posthog.capture(event, properties);
  } else if (API_KEY) {
    pendingCaptures.push({ event, properties });
  }
}

export function capturePageview(path: string) {
  captureEvent("$pageview", {
    path,
    $current_url: window.location.href,
  });
}
