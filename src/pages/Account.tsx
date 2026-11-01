import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Cloud,
  Gamepad2,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Brand";
import { usePlayer } from "../state/player";

type Mode = "signup" | "signin";

export default function Account() {
  const { identity, sync, state, signIn, signUp, signOut, deleteAccount, retrySync } = usePlayer();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const bests = [
    { label: "One Chance", value: state.stats["one-chance"].best },
    { label: "The Impossible Room", value: state.room.fastestEscapeMs },
  ];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        await signUp({ name: name.trim() || email.split("@")[0] || "PlayerOne", email: email.trim(), password });
      } else {
        await signIn({ email: email.trim(), password });
      }
      setPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The account request failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut();
      setNotice("Signed out. You are back in a guest session on this device.");
      setPassword("");
      setEmail("");
      setName("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      setConfirmDelete(false);
      setPassword("");
      setEmail("");
      setName("");
      setNotice("Account deleted. All account progress was removed and you are now in a guest session.");
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "Could not delete the account.");
    } finally {
      setDeleting(false);
    }
  }

  if (identity?.kind === "account") {
    return (
      <div className="container-page pt-10 sm:pt-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="mt-3 font-display text-[clamp(2.4rem,7vw,4.3rem)] font-extrabold leading-[0.94] tracking-[-0.055em] text-white">
            Your run is<br />
            <span className="gold-text">synced.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-mist-500">
            This account is the home of your progress. Sign in on another device with the same email and password to continue.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
            <section className="panel panel-glow p-6">
              <div className="flex items-center gap-4">
                <Avatar name={state.profile.name} hue={state.profile.avatarHue} size={56} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-mist-600">Signed in as</p>
                  <p className="mt-1 truncate font-display text-xl font-bold text-white">{state.profile.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-mist-500">{identity.email}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {bests.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3">
                    <p className="text-[8px] font-semibold text-mist-600">{item.label}</p>
                    <p className="mt-1 font-display text-lg font-bold tabular-nums text-gold">
                      {item.value == null ? "—" : item.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.045] px-3 py-2.5 text-[10px] text-emerald-200/80">
                <Cloud size={13} className="shrink-0" />
                <span>Progress, records and settings are saved to your account.</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/profile" className="btn btn-primary flex-1 py-2.5 text-[11px]">
                  Open profile <ArrowRight size={13} />
                </Link>
                <button onClick={handleSignOut} disabled={busy} className="btn btn-ghost px-4 py-2.5 text-[11px]">
                  {busy ? <Loader2 size={13} className="animate-spin motion-reduce:animate-none" /> : <LogOut size={13} />} Sign out
                </button>
              </div>
              {error && <p className="mt-3 text-[11px] text-rose-300">{error}</p>}
            </section>

            <section className="panel p-6">
              <p className="label"><Sparkles size={12} /> Account details</p>
              <dl className="mt-4 divide-y divide-white/6 text-[11px]">
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-mist-500">Status</dt>
                  <dd className="flex items-center gap-1.5 font-semibold text-emerald-300"><Check size={12} /> Active</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-mist-500">Email</dt>
                  <dd className="max-w-[15rem] truncate text-right font-semibold text-mist-200">{identity.email}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-mist-500">Server sync</dt>
                  <dd className="font-semibold text-mist-200">
                    {sync.status === "saving" ? "Saving…" : sync.status === "error" ? "Needs attention" : "Up to date"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-mist-500">Privacy</dt>
                  <dd className="font-semibold text-mist-200">Public leaderboard {state.settings.publicLeaderboard ? "on" : "off"}</dd>
                </div>
              </dl>
              {sync.status === "error" && (
                <div className="mt-4 rounded-xl border border-orange-400/20 bg-orange-400/[0.04] p-3">
                  <p className="text-[10px] leading-relaxed text-orange-200/80">{sync.message ?? "Progress could not be saved."}</p>
                  <button onClick={retrySync} className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-orange-200 hover:text-white">
                    <RefreshCw size={11} /> Retry sync
                  </button>
                </div>
              )}
              <p className="mt-4 text-[10px] leading-relaxed text-mist-600">
                Passwords are hashed with scrypt on the PLAYFLIX server. Account email verification and additional sign-in providers are the next security milestone.
              </p>
            </section>
          </div>

          <section className="mt-5 rounded-2xl border border-red-400/15 bg-red-400/[0.035] p-5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-red-200/90"><Trash2 size={12} /> Delete account</p>
            <p className="mt-1 max-w-xl text-[10px] leading-relaxed text-red-200/50">
              Permanently deletes the account, its email and every saved run. Guest sessions on other devices are not affected. This cannot be undone.
            </p>
            {confirmDelete ? (
              <div className="mt-3 space-y-2.5">
                <p className="text-[11px] font-semibold text-red-100">Are you sure? This removes all of your account progress.</p>
                {deleteError && <p className="text-[10px] text-rose-300">{deleteError}</p>}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-2 text-[10px] font-bold text-red-100 transition hover:bg-red-500/30 disabled:opacity-60"
                  >
                    {deleting ? <Loader2 size={11} className="animate-spin motion-reduce:animate-none" /> : <Trash2 size={11} />} Yes, delete everything
                  </button>
                  <button onClick={() => { setConfirmDelete(false); setDeleteError(null); }} disabled={deleting} className="btn btn-ghost px-3 py-2 text-[10px]">
                    Keep my account
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-400/25 bg-red-400/[0.07] px-3 py-2 text-[10px] font-bold text-red-200 transition hover:bg-red-400/[0.12]"
              >
                <Trash2 size={11} /> Delete account
              </button>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page pt-10 sm:pt-14">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div>
            <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4.6rem)] font-extrabold leading-[0.93] tracking-[-0.055em] text-white">
              Keep your<br />
              <span className="gold-text">progress.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-mist-500">
              You are playing as a guest. Your progress is already saved to a secure guest session on this device; create an account to carry it across devices and keep it safe.
            </p>

            {notice && (
              <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-3 text-[11px] leading-relaxed text-emerald-200/80">
                {notice}
              </div>
            )}

            <div className="mt-7 hidden gap-2 sm:grid sm:grid-cols-2">
              {[
                { icon: Cloud, title: "Progress sync", body: "Continue on another browser or device." },
                { icon: Trophy, title: "Records kept", body: "Bests, chapters and achievements stay yours." },
                { icon: ShieldCheck, title: "Guest-safe upgrade", body: "Your current guest progress moves into the new account." },
                { icon: Gamepad2, title: "No reset", body: "Nothing in either launch game is wiped by signing up." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                  <Icon size={15} className="text-accent" />
                  <p className="mt-2 text-[11px] font-bold text-mist-200">{title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-mist-600">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-[10px] text-mist-600">
              <span className="flex items-center gap-1.5"><CoinsLabel /> {state.coins.toLocaleString()} coins</span>
              <span className="flex items-center gap-1.5"><Trophy size={12} className="text-gold" /> {state.stats["one-chance"].best ?? "—"} One Chance best</span>
            </div>
          </div>

          <section className="panel panel-glow p-5 sm:p-6">
            <div className="flex rounded-xl border border-white/8 bg-white/[0.025] p-1">
              {(["signup", "signin"] as Mode[]).map((value) => (
                <button
                  key={value}
                  onClick={() => { setMode(value); setError(null); }}
                  className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-bold transition ${
                    mode === value ? "bg-accent/20 text-accent" : "text-mist-500 hover:text-mist-200"
                  }`}
                  aria-pressed={mode === value}
                >
                  {value === "signup" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              {mode === "signup" && (
                <label className="block">
                  <span className="text-[9px] font-semibold text-mist-600">Display name</span>
                  <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-white/10 bg-paper-3 px-3 py-2.5 focus-within:border-accent/50">
                    <UserRound size={14} className="text-mist-600" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={18}
                      placeholder="Your player name"
                      className="w-full bg-transparent text-[12px] text-mist-100 outline-none placeholder:text-mist-700"
                      autoComplete="nickname"
                    />
                  </span>
                </label>
              )}

              <label className="block">
                <span className="text-[9px] font-semibold text-mist-600">Email</span>
                <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-white/10 bg-paper-3 px-3 py-2.5 focus-within:border-accent/50">
                  <Mail size={14} className="text-mist-600" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-[12px] text-mist-100 outline-none placeholder:text-mist-700"
                    autoComplete="email"
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-[9px] font-semibold text-mist-600">Password</span>
                <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-white/10 bg-paper-3 px-3 py-2.5 focus-within:border-accent/50">
                  <LockKeyhole size={14} className="text-mist-600" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={200}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    className="w-full bg-transparent text-[12px] text-mist-100 outline-none placeholder:text-mist-700"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </span>
              </label>

              {error && (
                <div role="alert" className="rounded-lg border border-rose-400/25 bg-rose-400/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-rose-200/90">
                  {error}
                </div>
              )}

              <button type="submit" disabled={busy} className="btn btn-primary w-full py-3 text-xs">
                {busy ? <Loader2 size={14} className="animate-spin motion-reduce:animate-none" /> : mode === "signup" ? <ArrowRight size={14} /> : <UserRound size={14} />}
                {mode === "signup" ? "Create account" : "Sign in"}
              </button>

              <p className="text-center text-[9px] leading-relaxed text-mist-600">
                {mode === "signup"
                  ? "Your current guest progress is carried into the new account."
                  : "Signing in loads the progress saved to that account."}
              </p>
            </form>

            <div className="mt-5 flex items-start gap-2 border-t border-white/8 pt-4 text-[9px] leading-relaxed text-mist-600">
              <ShieldCheck size={12} className="mt-0.5 shrink-0 text-emerald-300/70" />
              Passwords are hashed on the server. We do not send or store plaintext passwords.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CoinsLabel() {
  return <span className="grid size-3 place-items-center rounded-full bg-gold text-[8px] font-black text-accent-ink">P</span>;
}
