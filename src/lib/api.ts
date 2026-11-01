import type { PlayerState } from "./types";

export interface Identity {
  kind: "guest" | "account";
  profileId: string;
  email: string | null;
  name: string;
  country: string;
  avatarHue: number;
}

export interface MeResponse {
  identity: Identity;
  profile: { id: string; name: string; country: string; avatarHue: number };
  state: PlayerState | null;
  revision: number;
}

export interface ProgressResponse {
  revision: number;
  updatedAt: string;
}

export type SignUpInput = { name: string; email: string; password: string };
export type SignInInput = { email: string; password: string };

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function apiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    // Hosted builds (Vercel) serve the API as a same-origin function at /api.
    if (window.location.protocol === "https:") return `${window.location.origin}/api`;
    return `${window.location.protocol}//${window.location.hostname}:8787`;
  }
  return "http://127.0.0.1:8787";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/v1${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, "network_error", "Cannot reach the PLAYFLIX server. Check your connection and try again.");
  }

  const body = (await response.json().catch(() => null)) as
    | { error?: { code?: string; message?: string } }
    | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code ?? "request_failed",
      body?.error?.message ?? "The server could not complete that request.",
    );
  }
  return body as T;
}

export const api = {
  me: () => request<MeResponse>("/me"),
  saveProgress: (state: PlayerState, revision: number) =>
    request<ProgressResponse>("/progress", {
      method: "PUT",
      body: JSON.stringify({ state, revision }),
    }),
  updateProfile: (patch: { name?: string; country?: string; avatarHue?: number }) =>
    request<{ profile: MeResponse["profile"] }>("/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  signUp: (input: SignUpInput) =>
    request<MeResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  signIn: (input: SignInInput) =>
    request<MeResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  signOut: () => request<{ ok: true }>("/auth/signout", { method: "POST" }),
  deleteAccount: () => request<{ ok: true }>("/account", { method: "DELETE" }),
};
