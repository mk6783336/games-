import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  AUTH_COOKIE,
  GUEST_COOKIE,
  SESSION_DAYS,
  cookieOptions,
  ensureGuest,
  getPlayerState,
  hashPassword,
  hashToken,
  identityForClient,
  newId,
  newToken,
  rateLimit,
  requireIdentity,
  resolveIdentity,
  verifyPassword,
  type Identity,
} from "./auth";
import { closeDatabase, getDatabase } from "./db";
import { runMigrations } from "./migrate";

const configuredPort = Number(process.env.PORT);
const PORT = Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort < 65_536 ? configuredPort : 8787;
const app = express();
const db = await getDatabase();
// Vercel runs the schema migration out-of-band with the direct Neon URL;
// cold starts must not run DDL through the pooled connection.
if (!process.env.VERCEL) await runMigrations();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const allowed = new Set([
        process.env.APP_ORIGIN ?? "http://127.0.0.1:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
      ]);
      // Hosted deployments call the API same-origin, so their own Vercel
      // domains must pass the origin check for cookie-bearing writes.
      for (const host of [
        process.env.VERCEL_URL,
        process.env.VERCEL_BRANCH_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
      ]) {
        if (!host) continue;
        allowed.add(host.startsWith("http") ? host : `https://${host}`);
      }
      if (allowed.has(origin) || (process.env.NODE_ENV !== "production" && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed"));
    },
    credentials: true,
  }),
);
app.use((req, _res, next) => {
  // Vercel may hand the function an already-parsed body. Tell Express so its
  // JSON parser does not try to read the consumed stream.
  if (req.body !== undefined) (req as Request & { _body?: boolean })._body = true;
  next();
});
app.use(express.json({ limit: "512kb" }));
app.use(cookieParser());

const router = express.Router();

const gameStatSchema = z.object({
  plays: z.number().int().min(0),
  best: z.number().finite().nullable(),
  lastPlayed: z.number().finite().nullable(),
  coinsEarned: z.number().finite().min(0),
});

const playerStateSchema = z
  .object({
    version: z.literal(1),
    profile: z.object({
      name: z.string().trim().min(1).max(18),
      country: z.string().length(2),
      avatarHue: z.number().int().min(0).max(360),
      createdAt: z.number().finite().positive(),
    }),
    coins: z.number().finite().min(0).max(10_000_000),
    xp: z.number().finite().min(0).max(1_000_000_000),
    achievements: z.record(z.string(), z.number().finite()),
    stats: z.record(z.string(), gameStatSchema),
    room: z.object({}).passthrough(),
    dailies: z.record(z.string(), z.unknown()),
    challenges: z.array(z.unknown()).max(30),
    history: z.array(z.unknown()).max(60),
    settings: z
      .object({
        sound: z.boolean(),
        haptics: z.boolean(),
        reducedMotion: z.boolean(),
        publicLeaderboard: z.boolean(),
        allowChallenges: z.boolean(),
        analytics: z.boolean(),
      })
      .passthrough(),
  })
  .passthrough();

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});

const signUpSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(18),
});

const profilePatchSchema = z
  .object({
    name: z.string().trim().min(1).max(18).optional(),
    country: z.string().length(2).optional(),
    avatarHue: z.number().int().min(0).max(360).optional(),
  })
  .strict();

const progressSchema = z.object({
  state: playerStateSchema,
  revision: z.number().int().min(0),
});

type Handler = (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>;

function route(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function fail(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request.";
}

function clientError(res: Response, error: z.ZodError) {
  return fail(res, 400, "invalid_request", validationMessage(error));
}

async function mePayload(identity: Identity) {
  const progress = await getPlayerState(db, identity.profile.id);
  return {
    identity: identityForClient(identity),
    profile: {
      id: identity.profile.id,
      name: identity.profile.display_name,
      country: identity.profile.country,
      avatarHue: identity.profile.avatar_hue,
    },
    state: progress.state,
    revision: progress.revision,
  };
}

async function createAuthSession(accountId: string, res: Response) {
  const token = newToken();
  const id = newId();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000);
  await db.query(
    "INSERT INTO auth_sessions (id, token_hash, account_id, expires_at) VALUES ($1, $2, $3, $4)",
    [id, hashToken(token), accountId, expiresAt],
  );
  res.cookie(AUTH_COOKIE, token, cookieOptions(SESSION_DAYS * 24 * 60 * 60_000));
  return token;
}

async function copyStateIfEmpty(fromProfileId: string, toProfileId: string) {
  const source = await getPlayerState(db, fromProfileId);
  const target = await getPlayerState(db, toProfileId);
  if (!source.state || target.state) return false;
  await db.query(
    "INSERT INTO player_state (profile_id, revision, document) VALUES ($1, 0, $2)",
    [toProfileId, source.state],
  );
  return true;
}

router.get(
  "/health",
  route(async (_req, res) => {
    const ping = await db.query<{ ok: number }>("SELECT 1 AS ok");
    res.json({ ok: ping.rows[0]?.ok === 1, database: db.label, time: new Date().toISOString() });
  }),
);

router.get(
  "/me",
  route(async (req, res) => {
    const identity = await ensureGuest(req, res, db);
    res.json(await mePayload(identity));
  }),
);

router.get(
  "/progress",
  requireIdentity(db),
  route(async (_req, res) => {
    const identity = res.locals.identity as Identity;
    res.json(await getPlayerState(db, identity.profile.id));
  }),
);

router.put(
  "/progress",
  requireIdentity(db),
  route(async (req, res) => {
    const parsed = progressSchema.safeParse(req.body);
    if (!parsed.success) return clientError(res, parsed.error);
    const identity = res.locals.identity as Identity;
    const { state, revision } = parsed.data;
    const profile = state.profile;

    const write = await db.query<{ revision: number; updated_at: string }>(
      `INSERT INTO player_state (profile_id, revision, document)
       VALUES ($1, 1, $2)
       ON CONFLICT (profile_id) DO UPDATE
         SET document = EXCLUDED.document,
             revision = player_state.revision + 1,
             updated_at = now()
         WHERE player_state.revision = $3
       RETURNING revision, updated_at`,
      [identity.profile.id, JSON.stringify(state), revision],
    );

    if (!write.rows.length) {
      const current = await getPlayerState(db, identity.profile.id);
      return res.status(409).json({
        error: { code: "revision_conflict", message: "Progress changed in another session." },
        revision: current.revision,
        state: current.state,
      });
    }

    await db.query(
      `UPDATE profiles
          SET display_name = $2, country = $3, avatar_hue = $4, updated_at = now()
        WHERE id = $1`,
      [identity.profile.id, profile.name, profile.country, profile.avatarHue],
    );

    for (const [gameId, stat] of Object.entries(state.stats as Record<string, { plays: number; best: number | null; coinsEarned: number; lastPlayed: number | null }>)) {
      if (gameId !== "impossible-room" && gameId !== "one-chance") continue;
      await db.query(
        `INSERT INTO player_progress (profile_id, game_id, plays, best, coins_earned, last_played_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (profile_id, game_id) DO UPDATE
           SET plays = EXCLUDED.plays,
               best = EXCLUDED.best,
               coins_earned = EXCLUDED.coins_earned,
               last_played_at = EXCLUDED.last_played_at`,
        [
          identity.profile.id,
          gameId,
          stat.plays,
          stat.best,
          stat.coinsEarned,
          stat.lastPlayed ? new Date(stat.lastPlayed) : null,
        ],
      );
    }

    res.json({ revision: write.rows[0].revision, updatedAt: write.rows[0].updated_at });
  }),
);

router.patch(
  "/profile",
  requireIdentity(db),
  route(async (req, res) => {
    const parsed = profilePatchSchema.safeParse(req.body);
    if (!parsed.success) return clientError(res, parsed.error);
    const identity = res.locals.identity as Identity;
    const patch = parsed.data;
    if (!Object.keys(patch).length) return fail(res, 400, "invalid_request", "No profile fields supplied.");

    const row = await db.query<{ id: string; display_name: string; country: string; avatar_hue: number }>(
      `UPDATE profiles
          SET display_name = COALESCE($2, display_name),
              country = COALESCE($3, country),
              avatar_hue = COALESCE($4, avatar_hue),
              updated_at = now()
        WHERE id = $1
        RETURNING id, display_name, country, avatar_hue`,
      [identity.profile.id, patch.name ?? null, patch.country ?? null, patch.avatarHue ?? null],
    );
    const profile = row.rows[0];

    // Keep the state document's embedded profile in step with the profile row,
    // and bump the revision so a client holding an older snapshot cannot
    // silently overwrite this change on its next save.
    const progress = await getPlayerState(db, identity.profile.id);
    if (progress.state) {
      const document = progress.state as Record<string, unknown> & { profile?: Record<string, unknown> };
      const nextDocument = {
        ...document,
        profile: {
          ...(document.profile ?? {}),
          name: profile.display_name,
          country: profile.country,
          avatarHue: profile.avatar_hue,
        },
      };
      await db.query(
        "UPDATE player_state SET document = $2, revision = revision + 1, updated_at = now() WHERE profile_id = $1",
        [identity.profile.id, JSON.stringify(nextDocument)],
      );
    }

    res.json({ profile: { id: profile.id, name: profile.display_name, country: profile.country, avatarHue: profile.avatar_hue } });
  }),
);

router.post(
  "/auth/signup",
  route(async (req, res) => {
    const parsed = signUpSchema.safeParse(req.body);
    if (!parsed.success) return clientError(res, parsed.error);
    const { name, email, password } = parsed.data;
    const limit = rateLimit(`signup:${req.ip}:${email}`, 8);
    if (!limit.allowed) return fail(res, 429, "rate_limited", "Too many attempts. Try again later.");

    const existing = await db.query("SELECT id FROM accounts WHERE lower(email) = $1", [email]);
    if (existing.rows.length) return fail(res, 409, "email_in_use", "An account already uses that email.");

    const guest = await resolveIdentity(req, db);
    const accountId = newId();
    const passwordHash = await hashPassword(password);
    await db.query("INSERT INTO accounts (id, email, password_hash) VALUES ($1, $2, $3)", [accountId, email, passwordHash]);

    let profileId: string;
    if (guest?.kind === "guest" && !guest.profile.account_id) {
      profileId = guest.profile.id;
      await db.query("UPDATE profiles SET account_id = $2, display_name = $3, updated_at = now() WHERE id = $1", [
        profileId,
        accountId,
        name,
      ]);
      await db.query("DELETE FROM guest_sessions WHERE profile_id = $1", [profileId]);
      res.clearCookie(GUEST_COOKIE, cookieOptions(0));
    } else {
      profileId = newId();
      await db.query(
        "INSERT INTO profiles (id, account_id, display_name, country, avatar_hue) VALUES ($1, $2, $3, $4, $5)",
        [profileId, accountId, name, "US", 266],
      );
    }

    const token = await createAuthSession(accountId, res);
    req.cookies[AUTH_COOKIE] = token;
    const identity = await resolveIdentity(req, db);
    if (!identity) return fail(res, 500, "session_error", "Account was created but the session could not be loaded.");
    res.status(201).json(await mePayload(identity));
  }),
);

router.post(
  "/auth/signin",
  route(async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) return clientError(res, parsed.error);
    const { email, password } = parsed.data;
    const limit = rateLimit(`signin:${req.ip}:${email}`, 10);
    if (!limit.allowed) return fail(res, 429, "rate_limited", "Too many attempts. Try again later.");

    const result = await db.query<{ id: string; email: string; password_hash: string }>(
      "SELECT id, email, password_hash FROM accounts WHERE lower(email) = $1",
      [email],
    );
    const account = result.rows[0];
    if (!account || !(await verifyPassword(password, account.password_hash))) {
      return fail(res, 401, "invalid_credentials", "Email or password is incorrect.");
    }

    const existingProfile = await db.query<{ id: string }>("SELECT id FROM profiles WHERE account_id = $1", [account.id]);
    let profileId = existingProfile.rows[0]?.id;
    if (!profileId) {
      profileId = newId();
      await db.query(
        "INSERT INTO profiles (id, account_id, display_name, country, avatar_hue) VALUES ($1, $2, $3, $4, $5)",
        [profileId, account.id, account.email.split("@")[0]?.slice(0, 18) || "PlayerOne", "US", 266],
      );
    }

    const guest = await resolveIdentity(req, db);
    if (guest?.kind === "guest" && guest.profile.id !== profileId) {
      await copyStateIfEmpty(guest.profile.id, profileId);
    }

    const token = await createAuthSession(account.id, res);
    req.cookies[AUTH_COOKIE] = token;
    const identity = await resolveIdentity(req, db);
    if (!identity) return fail(res, 500, "session_error", "Signed in, but the session could not be loaded.");
    res.json(await mePayload(identity));
  }),
);

router.post(
  "/auth/signout",
  route(async (req, res) => {
    const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
    if (token) await db.query("DELETE FROM auth_sessions WHERE token_hash = $1", [hashToken(token)]);
    res.clearCookie(AUTH_COOKIE, cookieOptions(0));
    res.json({ ok: true });
  }),
);

router.delete(
  "/account",
  requireIdentity(db),
  route(async (_req, res) => {
    const identity = res.locals.identity as Identity;
    if (identity.kind !== "account") return fail(res, 403, "account_required", "Sign in to delete an account.");
    await db.query("DELETE FROM accounts WHERE id = $1", [identity.account.id]);
    res.clearCookie(AUTH_COOKIE, cookieOptions(0));
    res.json({ ok: true });
  }),
);

app.use("/v1", router);

app.use((req, res) => {
  fail(res, 404, "not_found", `No API route for ${req.method} ${req.path}.`);
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  if (message === "Origin not allowed") return fail(res, 403, "origin_not_allowed", message);
  console.error("[api] unhandled", error);
  if (!res.headersSent) fail(res, 500, "internal_error", "The server could not complete that request.");
});

export default app;

// Vercel imports this module inside its function runtime, where the platform
// owns the listener. Only a real Node process binds the local port.
const server = process.env.VERCEL
  ? null
  : app.listen(PORT, "127.0.0.1", () => {
      console.log(`[api] PLAYFLIX API listening on http://127.0.0.1:${PORT} using ${db.label}`);
    });

async function shutdown(signal: string) {
  if (!server) return;
  console.log(`[api] ${signal}, shutting down`);
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

if (server) {
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
