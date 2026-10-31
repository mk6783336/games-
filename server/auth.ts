import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Database } from "./db";

function scrypt(password: string, salt: string, keylen: number, options?: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options ?? {}, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
}

export const GUEST_COOKIE = "playflix_guest";
export const AUTH_COOKIE = "playflix_session";
export const GUEST_DAYS = 90;
export const SESSION_DAYS = 30;

const isProduction = process.env.NODE_ENV === "production";

export interface AccountRow {
  id: string;
  email: string;
  password_hash: string;
}

export interface ProfileRow {
  id: string;
  account_id: string | null;
  display_name: string;
  country: string;
  avatar_hue: number;
}

export type Identity =
  | { kind: "guest"; profile: ProfileRow; guestSessionId: string }
  | { kind: "account"; profile: ProfileRow; account: { id: string; email: string }; authSessionId: string };

export function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function newId() {
  return randomUUID();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$16384$8$1$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nRaw, rRaw, pRaw, salt, expectedHex] = parts;
  const expected = Buffer.from(expectedHex, "hex");
  try {
    const derived = await scrypt(password, salt, expected.length, {
      N: Number(nRaw),
      r: Number(rRaw),
      p: Number(pRaw),
      maxmem: 64 * 1024 * 1024,
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

interface RateEntry {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateEntry>();

export function rateLimit(key: string, limit = 12, windowMs = 15 * 60_000) {
  const now = Date.now();
  for (const [entryKey, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(entryKey);
  }
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}

interface SessionJoin {
  session_id: string;
  expires_at: Date | string;
  profile_id: string;
  display_name: string;
  country: string;
  avatar_hue: number;
  account_id?: string | null;
  email?: string;
}

async function getAccountIdentity(req: Request, db: Database): Promise<Identity | null> {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
  if (!token) return null;
  const result = await db.query<SessionJoin>(
    `SELECT s.id AS session_id, s.expires_at, p.id AS profile_id, p.display_name, p.country, p.avatar_hue,
            a.id AS account_id, a.email
       FROM auth_sessions s
       JOIN accounts a ON a.id = s.account_id
       JOIN profiles p ON p.account_id = a.id
      WHERE s.token_hash = $1`,
    [hashToken(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.query("DELETE FROM auth_sessions WHERE id = $1", [row.session_id]);
    return null;
  }
  return {
    kind: "account",
    authSessionId: row.session_id,
    account: { id: row.account_id!, email: row.email! },
    profile: {
      id: row.profile_id,
      account_id: row.account_id ?? null,
      display_name: row.display_name,
      country: row.country,
      avatar_hue: row.avatar_hue,
    },
  };
}

async function getGuestIdentity(req: Request, db: Database): Promise<Identity | null> {
  const token = req.cookies?.[GUEST_COOKIE] as string | undefined;
  if (!token) return null;
  const result = await db.query<SessionJoin>(
    `SELECT g.id AS session_id, g.expires_at, p.id AS profile_id, p.display_name, p.country, p.avatar_hue
       FROM guest_sessions g
       JOIN profiles p ON p.id = g.profile_id
      WHERE g.token_hash = $1`,
    [hashToken(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.query("DELETE FROM guest_sessions WHERE id = $1", [row.session_id]);
    return null;
  }
  return {
    kind: "guest",
    guestSessionId: row.session_id,
    profile: {
      id: row.profile_id,
      account_id: null,
      display_name: row.display_name,
      country: row.country,
      avatar_hue: row.avatar_hue,
    },
  };
}

export async function resolveIdentity(req: Request, db: Database): Promise<Identity | null> {
  return (await getAccountIdentity(req, db)) ?? (await getGuestIdentity(req, db));
}

export async function ensureGuest(req: Request, res: Response, db: Database): Promise<Identity> {
  const existing = await resolveIdentity(req, db);
  if (existing) return existing;

  const token = newToken();
  const profileId = newId();
  const sessionId = newId();
  const expiresAt = new Date(Date.now() + GUEST_DAYS * 24 * 60 * 60_000);
  await db.query(
    "INSERT INTO profiles (id, display_name, country, avatar_hue) VALUES ($1, $2, $3, $4)",
    [profileId, "PlayerOne", "US", 266],
  );
  await db.query(
    "INSERT INTO guest_sessions (id, token_hash, profile_id, expires_at) VALUES ($1, $2, $3, $4)",
    [sessionId, hashToken(token), profileId, expiresAt],
  );
  res.cookie(GUEST_COOKIE, token, cookieOptions(GUEST_DAYS * 24 * 60 * 60_000));
  const profile = await db.query<ProfileRow>(
    "SELECT id, account_id, display_name, country, avatar_hue FROM profiles WHERE id = $1",
    [profileId],
  );
  return { kind: "guest", guestSessionId: sessionId, profile: profile.rows[0] };
}

export function requireIdentity(db: Database) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identity = await ensureGuest(req, res, db);
    res.locals.identity = identity;
    next();
  };
}

export function identityForClient(identity: Identity) {
  return {
    kind: identity.kind,
    profileId: identity.profile.id,
    email: identity.kind === "account" ? identity.account.email : null,
    name: identity.profile.display_name,
    country: identity.profile.country,
    avatarHue: identity.profile.avatar_hue,
  };
}

export async function getPlayerState(db: Database, profileId: string) {
  const result = await db.query<{ revision: number; document: unknown; updated_at: string }>(
    "SELECT revision, document, updated_at FROM player_state WHERE profile_id = $1",
    [profileId],
  );
  const row = result.rows[0];
  return row
    ? { revision: Number(row.revision), state: row.document, updatedAt: row.updated_at }
    : { revision: 0, state: null, updatedAt: null };
}
