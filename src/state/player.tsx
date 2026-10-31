import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { findNewAchievements } from "../lib/achievements";
import { captureEvent, identifyPlayer, initAnalytics, setAnalyticsConsent } from "../lib/analytics";
import { api, ApiError, type Identity, type MeResponse, type SignInInput, type SignUpInput } from "../lib/api";
import { getDaily } from "../lib/daily";
import { clearLegacyState, createInitialState, loadLegacyState } from "../lib/storage";
import type {
  GameId,
  HistoryEntry,
  PlayMode,
  PlayerState,
  Profile,
  RunResult,
  Settings,
} from "../lib/types";

export interface Toast {
  uid: string;
  achievementId: string;
}

export interface ChallengeInput {
  id: string;
  game: GameId;
  seed: number;
  target: number;
  from: string;
}

interface RecordRunInput {
  game: GameId;
  score: number;
  coins: number;
  mode: PlayMode;
  challengeId?: string | null;
}

interface RecordRoomInput {
  stage: number;
  timeMs: number;
  hintsThisChapter: number;
  hintsThisRun: number;
  daily: boolean;
  challengeId?: string | null;
  startedFromChapterOne: boolean;
  totalRunMs?: number | null;
}

export interface PlayerSyncState {
  status: "idle" | "saving" | "saved" | "error";
  message: string | null;
}

interface PlayerContextValue {
  state: PlayerState;
  identity: Identity | null;
  sync: PlayerSyncState;
  toasts: Toast[];
  dismissToast: (uid: string) => void;
  updateProfile: (patch: Partial<Pick<Profile, "name" | "country" | "avatarHue">>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  recordRun: (input: RecordRunInput) => RunResult;
  recordRoomStage: (input: RecordRoomInput) => RunResult;
  registerChallenge: (input: ChallengeInput) => void;
  resetProgress: () => void;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  retrySync: () => void;
  retryBoot: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const emptyResult = (): RunResult => ({ coins: 0, xp: 0, newAchievements: [], newBest: false });

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>(() => createInitialState());
  const stateRef = useRef(state);
  const identityRef = useRef<Identity | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [sync, setSync] = useState<PlayerSyncState>({ status: "idle", message: null });
  const [bootStatus, setBootStatus] = useState<"loading" | "ready" | "error">("loading");
  const [bootError, setBootError] = useState<string | null>(null);
  const revisionRef = useRef(0);
  const pendingSaveRef = useRef<PlayerState | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);
  const bootPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timers.current.forEach((t) => window.clearTimeout(t));
      if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(state.settings.reducedMotion);
  }, [state.settings.reducedMotion]);

  const flushSave = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    let failed = false;

    try {
      // Publish may happen while a request is in flight, so keep draining until
      // the latest state has been written instead of dropping the last edit.
      while (pendingSaveRef.current) {
        const next = pendingSaveRef.current;
        pendingSaveRef.current = null;
        if (mountedRef.current) setSync({ status: "saving", message: null });

        try {
          const saved = await api.saveProgress(next, revisionRef.current);
          revisionRef.current = saved.revision;
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            try {
              const latest = await api.me();
              if (latest.state) {
                stateRef.current = latest.state;
                if (mountedRef.current) setState(latest.state);
              }
              revisionRef.current = latest.revision;
              failed = true;
              if (mountedRef.current) {
                setSync({ status: "error", message: "Progress changed in another session. The latest saved state was loaded." });
              }
              break;
            } catch {
              // Fall through to the generic retry message below.
            }
          }
          failed = true;
          pendingSaveRef.current = next;
          if (mountedRef.current) {
            setSync({
              status: "error",
              message: error instanceof ApiError ? error.message : "Progress could not be saved. Retry before leaving.",
            });
          }
          break;
        }
      }
      if (mountedRef.current && !failed && !pendingSaveRef.current) {
        setSync({ status: "saved", message: null });
      }
    } finally {
      savingRef.current = false;
    }
  }, []);

  const scheduleSave = useCallback(
    (next: PlayerState) => {
      pendingSaveRef.current = next;
      if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        void flushSave();
      }, 350);
    },
    [flushSave],
  );

  const publish = useCallback(
    (next: PlayerState) => {
      stateRef.current = next;
      setState(next);
      scheduleSave(next);
    },
    [scheduleSave],
  );

  const adoptMe = useCallback((me: MeResponse) => {
    let next = me.state ?? createInitialState();
    if (me.identity.kind === "account") {
      next = {
        ...next,
        profile: {
          ...next.profile,
          name: me.profile.name,
          country: me.profile.country,
          avatarHue: me.profile.avatarHue,
        },
      };
    }
    stateRef.current = next;
    setState(next);
    revisionRef.current = me.revision;
    identityRef.current = me.identity;
    setIdentity(me.identity);
    setBootStatus("ready");
    setBootError(null);
    setSync({ status: "saved", message: null });
    setAnalyticsConsent(next.settings.analytics);
    identifyPlayer(next, identityRef.current);
    return next;
  }, []);

  const loadFresh = useCallback(
    async (seedOverride?: PlayerState) => {
      let me = await api.me();
      if (!me.state) {
        const seed = seedOverride ?? createInitialState();
        if (me.identity.kind === "account") {
          seed.profile = {
            ...seed.profile,
            name: me.profile.name,
            country: me.profile.country,
            avatarHue: me.profile.avatarHue,
          };
        }
        const saved = await api.saveProgress(seed, me.revision);
        me = { ...me, state: seed, revision: saved.revision };
      }
      return adoptMe(me);
    },
    [adoptMe],
  );

  const boot = useCallback(() => {
    if (bootPromiseRef.current) return bootPromiseRef.current;
    const promise = (async () => {
      setBootStatus("loading");
      setBootError(null);
      const legacy = loadLegacyState();
      const next = await loadFresh(legacy ?? undefined);
      clearLegacyState();
      initAnalytics(next.settings.analytics);
      identifyPlayer(next, identityRef.current);
      captureEvent("app_opened", {
        returning_player: next.profile.createdAt < Date.now() - 60_000,
      });
    })()
      .catch((error) => {
        if (!mountedRef.current) return;
        setBootStatus("error");
        setBootError(error instanceof ApiError ? error.message : "Could not load your player profile. Check the API server and try again.");
      })
      .finally(() => {
        bootPromiseRef.current = null;
      });
    bootPromiseRef.current = promise;
    return promise;
  }, [loadFresh]);

  useEffect(() => {
    void boot();
  }, [boot]);

  const retryBoot = useCallback(() => {
    bootPromiseRef.current = null;
    void boot();
  }, [boot]);

  const retrySync = useCallback(() => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void flushSave();
  }, [flushSave]);

  const signUp = useCallback(
    async (input: SignUpInput) => {
      await flushSave();
      const me = await api.signUp(input);
      const next = adoptMe(me);
      clearLegacyState();
      initAnalytics(next.settings.analytics);
      identifyPlayer(next, identityRef.current);
      captureEvent("account_created", { country: next.profile.country });
    },
    [adoptMe, flushSave],
  );

  const signIn = useCallback(
    async (input: SignInInput) => {
      await flushSave();
      const me = await api.signIn(input);
      const next = adoptMe(me);
      initAnalytics(next.settings.analytics);
      identifyPlayer(next, identityRef.current);
      captureEvent("account_signed_in", { has_server_progress: Boolean(me.state) });
    },
    [adoptMe, flushSave],
  );

  const signOut = useCallback(async () => {
    await flushSave();
    await api.signOut();
    const next = await loadFresh();
    identifyPlayer(next, identityRef.current);
    captureEvent("account_signed_out");
  }, [flushSave, loadFresh]);

  const deleteAccount = useCallback(async () => {
    await flushSave();
    await api.deleteAccount();
    const next = await loadFresh();
    identifyPlayer(next, identityRef.current);
    captureEvent("account_deleted");
  }, [flushSave, loadFresh]);

  const pushToasts = useCallback((ids: string[]) => {
    if (!ids.length) return;
    const now = Date.now();
    const next = ids.map((achievementId, i) => ({ uid: `${achievementId}-${now}-${i}`, achievementId }));
    setToasts((prev) => [...prev, ...next]);
    next.forEach((toast) => {
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.uid !== toast.uid));
      }, 4800);
      timers.current.push(timer);
    });
  }, []);

  const finalise = useCallback(
    (draft: PlayerState) => {
      const unlocked = findNewAchievements(draft);
      unlocked.forEach((id) => {
        draft.achievements[id] = Date.now();
      });
      if (unlocked.length) {
        draft.coins += unlocked.length * 50;
        pushToasts(unlocked);
      }
      return unlocked;
    },
    [pushToasts],
  );

  const updateProfile = useCallback(
    (patch: Partial<Pick<Profile, "name" | "country" | "avatarHue">>) => {
      const next = structuredClone(stateRef.current);
      const name = patch.name != null ? patch.name.trim().slice(0, 18) : next.profile.name;
      next.profile = {
        ...next.profile,
        ...patch,
        name: name || "PlayerOne",
      };
      publish(next);
      identifyPlayer(next, identityRef.current);
      captureEvent("profile_updated", {
        changed_name: patch.name != null,
        changed_country: patch.country != null,
        country: next.profile.country,
      });
    },
    [publish],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const next = structuredClone(stateRef.current);
      next.settings = { ...next.settings, ...patch };
      publish(next);
      if (patch.analytics != null) {
        setAnalyticsConsent(patch.analytics);
        captureEvent("analytics_consent_changed", { analytics_enabled: patch.analytics });
      }
    },
    [publish],
  );

  const registerChallenge = useCallback(
    (input: ChallengeInput) => {
      const current = stateRef.current;
      if (current.challenges.some((c) => c.id === input.id)) return;
      const next = structuredClone(current);
      next.challenges = [
        {
          id: input.id,
          game: input.game,
          seed: input.seed,
          target: input.target,
          from: input.from,
          createdAt: Date.now(),
          score: null,
          beat: false,
        },
        ...next.challenges,
      ].slice(0, 30);
      publish(next);
    },
    [publish],
  );

  const applyDaily = useCallback((draft: PlayerState, game: GameId, score: number) => {
    const daily = getDaily(game);
    const key = daily.key;
    const existing = draft.dailies[key];
    const completed = game === "one-chance" ? score >= daily.target : score <= daily.target;
    const alreadyRewarded = existing?.completed ?? false;
    const record = {
      date: daily.date,
      game,
      score:
        existing == null
          ? score
          : game === "one-chance"
            ? Math.max(existing.score, score)
            : Math.min(existing.score, score),
      completed: alreadyRewarded || completed,
    };
    draft.dailies[key] = record;
    if (completed && !alreadyRewarded) {
      draft.coins += daily.reward;
      draft.xp += 100;
      return daily.reward;
    }
    return 0;
  }, []);

  const recordRun = useCallback(
    ({ game, score, coins, mode, challengeId }: RecordRunInput): RunResult => {
      if (!Number.isFinite(score) || score < 0) return emptyResult();
      const draft = structuredClone(stateRef.current);
      const stat = draft.stats[game];
      const prevBest = stat.best;
      const newBest = prevBest == null || score > prevBest;

      // Every run pays something, even a short first attempt.
      const baseCoins = Math.max(5, Math.round(coins) + Math.floor(score / 120));
      const xp = Math.floor(score / 8) + 25;
      draft.coins += baseCoins;
      draft.xp += xp;
      stat.plays += 1;
      stat.lastPlayed = Date.now();
      stat.coinsEarned += baseCoins;
      if (newBest) stat.best = score;

      let dailyCoins = 0;
      if (mode === "daily") dailyCoins = applyDaily(draft, game, score);

      if (challengeId) {
        const challenge = draft.challenges.find((c) => c.id === challengeId);
        if (challenge) {
          const beat = game === "one-chance" ? score > challenge.target : score < challenge.target;
          challenge.score = score;
          challenge.beat = beat;
        }
      }

      const runEntry: HistoryEntry = { game, score, at: Date.now(), mode };
      draft.history = [runEntry, ...draft.history].slice(0, 60);
      const unlocked = finalise(draft);
      publish(draft);

      captureEvent("game_run_completed", {
        game,
        mode,
        score,
        new_best: newBest,
        first_play: stat.plays === 1,
        from_challenge: Boolean(challengeId),
        coins_awarded: baseCoins + dailyCoins + unlocked.length * 50,
        xp_awarded: xp,
        achievements_unlocked: unlocked.length,
      });
      if (dailyCoins > 0) {
        captureEvent("daily_challenge_completed", { game, score, reward: dailyCoins });
      }
      if (unlocked.length) {
        captureEvent("achievements_unlocked", { game, achievements: unlocked, count: unlocked.length });
      }

      return {
        coins: baseCoins + dailyCoins + unlocked.length * 50,
        xp,
        newAchievements: unlocked,
        newBest,
      };
    },
    [applyDaily, finalise, publish],
  );

  const recordRoomStage = useCallback(
    (input: RecordRoomInput): RunResult => {
      const {
        stage,
        timeMs,
        hintsThisChapter,
        hintsThisRun,
        daily,
        challengeId,
        startedFromChapterOne,
        totalRunMs,
      } = input;
      if (!Number.isFinite(timeMs) || timeMs <= 0) return emptyResult();

      const draft = structuredClone(stateRef.current);
      const stat = draft.stats["impossible-room"];
      const previousFastest = draft.room.fastestEscapeMs;
      let fullEscape = false;
      let newBest = false;

      if (!draft.room.completedLevels.includes(stage)) draft.room.completedLevels.push(stage);
      draft.room.completedLevels.sort((a, b) => a - b);
      draft.room.bestTimes[stage] =
        draft.room.bestTimes[stage] == null ? timeMs : Math.min(draft.room.bestTimes[stage], timeMs);
      draft.room.unlocked = Math.min(3, Math.max(draft.room.unlocked, stage + 1));
      draft.room.hintsUsed += Math.max(0, hintsThisChapter);
      stat.plays += 1;
      stat.lastPlayed = Date.now();

      let baseCoins = stage === 3 ? 300 : 90;
      if (hintsThisChapter === 0) baseCoins += 40;

      if (stage === 3 && startedFromChapterOne && totalRunMs != null && totalRunMs > 0) {
        fullEscape = true;
        draft.room.totalEscapes += 1;
        draft.room.lastEscapeHints = hintsThisRun;
        const isNewBest = previousFastest == null || totalRunMs < previousFastest;
        if (isNewBest) {
          draft.room.fastestEscapeMs = totalRunMs;
          stat.best = totalRunMs;
          newBest = true;
        }
      }

      draft.coins += baseCoins;
      const xp = 140 * stage + 100;
      draft.xp += xp;
      stat.coinsEarned += baseCoins;

      let dailyCoins = 0;
      if (daily && stage === 1) dailyCoins = applyDaily(draft, "impossible-room", timeMs);

      if (challengeId && stage === 1) {
        const challenge = draft.challenges.find((c) => c.id === challengeId);
        if (challenge) {
          challenge.score = timeMs;
          challenge.beat = timeMs < challenge.target;
        }
      }

      const roomEntry: HistoryEntry = {
        game: "impossible-room",
        score: timeMs,
        at: Date.now(),
        mode: fullEscape ? "solo" : daily ? "daily" : challengeId ? "challenge" : "solo",
      };
      draft.history = [roomEntry, ...draft.history].slice(0, 60);

      const unlocked = finalise(draft);
      publish(draft);

      captureEvent("room_chapter_completed", {
        chapter: stage,
        time_ms: timeMs,
        hints_used: Math.max(0, hintsThisChapter),
        full_escape: fullEscape,
        new_best: newBest,
        first_play: stat.plays === 1,
        from_daily: daily,
        from_challenge: Boolean(challengeId),
        coins_awarded: baseCoins + dailyCoins + unlocked.length * 50,
        xp_awarded: xp,
        achievements_unlocked: unlocked.length,
      });
      if (dailyCoins > 0) {
        captureEvent("daily_challenge_completed", { game: "impossible-room", score: timeMs, reward: dailyCoins });
      }
      if (unlocked.length) {
        captureEvent("achievements_unlocked", {
          game: "impossible-room",
          achievements: unlocked,
          count: unlocked.length,
        });
      }

      return {
        coins: baseCoins + dailyCoins + unlocked.length * 50,
        xp,
        newAchievements: unlocked,
        newBest,
      };
    },
    [applyDaily, finalise, publish],
  );

  const resetProgress = useCallback(() => {
    const current = stateRef.current;
    const fresh = createInitialState();
    fresh.profile = { ...current.profile };
    fresh.settings = { ...current.settings };
    publish(fresh);
    captureEvent("progress_reset");
  }, [publish]);

  const dismissToast = useCallback((uid: string) => {
    setToasts((prev) => prev.filter((t) => t.uid !== uid));
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      state,
      identity,
      sync,
      toasts,
      dismissToast,
      updateProfile,
      updateSettings,
      recordRun,
      recordRoomStage,
      registerChallenge,
      resetProgress,
      signUp,
      signIn,
      signOut,
      deleteAccount,
      retrySync,
      retryBoot,
    }),
    [
      state,
      identity,
      sync,
      toasts,
      dismissToast,
      updateProfile,
      updateSettings,
      recordRun,
      recordRoomStage,
      registerChallenge,
      resetProgress,
      signUp,
      signIn,
      signOut,
      deleteAccount,
      retrySync,
      retryBoot,
    ],
  );

  if (bootStatus !== "ready") {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#05070f] px-5 py-10">
        <div className="panel w-full max-w-md p-6 text-center">
          <p className="eyebrow justify-center">PLAYFLIX · Player service</p>
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.03em] text-white">
            {bootStatus === "error" ? "The arena is out of reach." : "Connecting your profile."}
          </h1>
          {bootStatus === "error" ? (
            <>
              <p className="mt-3 text-[12px] leading-relaxed text-mist-500">
                {bootError ?? "The player service did not respond."}
              </p>
              <button onClick={retryBoot} className="btn btn-primary mt-5 w-full py-3 text-xs">
                <RefreshCw size={13} /> Try again
              </button>
              <p className="mt-3 text-[10px] text-mist-600">
                Start the API with <code className="text-mist-400">npm run server</code> and keep it running beside the web app.
              </p>
            </>
          ) : (
            <p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-mist-400">
              <Loader2 size={15} className="animate-spin text-violet-300" /> Loading saved progress and identity…
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {sync.status === "error" && (
        <div
          role="alert"
          className="fixed inset-x-3 bottom-20 z-[90] mx-auto flex max-w-md items-start gap-2.5 rounded-xl border border-orange-400/30 bg-[#1a1206]/95 px-3.5 py-3 text-[11px] text-orange-100/90 shadow-2xl backdrop-blur-xl md:bottom-5"
        >
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-orange-300" />
          <span className="min-w-0 flex-1 leading-relaxed">
            <strong className="font-bold text-orange-100">Progress not saved.</strong> {sync.message ?? "The server did not accept the last write."}
          </span>
          <button onClick={retrySync} className="shrink-0 rounded-md border border-orange-300/30 px-2 py-1 text-[10px] font-bold text-orange-100 hover:bg-orange-300/10">
            Retry
          </button>
        </div>
      )}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
