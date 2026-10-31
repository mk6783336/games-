import { useEffect } from "react";
import { ArrowUpRight, Coins, Instagram, LogIn, MessageCircle, Trophy, Youtube } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { usePlayer } from "../state/player";
import { achievementById } from "../lib/achievements";
import { Logo, Avatar } from "./Brand";
import { MobileNav } from "./MobileNav";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/games", label: "Games" },
  { to: "/challenges", label: "Challenges" },
  { to: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  const { state, identity } = usePlayer();
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070f]/70 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo size={32} subtitle={false} />
        <nav className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                  isActive ? "bg-white/[0.07] text-white" : "text-mist-500 hover:text-mist-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && <span className="absolute inset-x-0 -bottom-[5px] mx-auto h-0.5 w-4 rounded-full bg-violet-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {identity?.kind === "guest" && (
            <Link
              to="/account"
              title="Sign in or create an account"
              className="flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-bold text-violet-100 transition hover:border-violet-400/45 hover:bg-violet-500/20"
            >
              <LogIn size={13} />
              <span className="hidden lg:inline">Sign in</span>
            </Link>
          )}
          <Link
            to="/profile"
            className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.07] px-2.5 py-1.5 text-xs font-bold text-gold transition hover:border-gold/40 hover:bg-gold/[0.12]"
            aria-label={`${state.coins.toLocaleString()} coins`}
          >
            <Coins size={14} />
            <span className="tabular-nums">{state.coins.toLocaleString()}</span>
          </Link>
          <Link to="/profile" aria-label="Open profile" className="rounded-full transition hover:opacity-90">
            <Avatar name={state.profile.name} hue={state.profile.avatarHue} size={32} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/[0.06] bg-[#04060d]/70 pb-24 pt-12 md:pb-10">
      <div className="container-page">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo size={34} subtitle />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-mist-500">
              Two exceptional games. One global arena. Play free, chase the board, and bring your friends into the run.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { icon: MessageCircle, label: "Community", to: "/support" },
                { icon: Instagram, label: "Instagram", to: "/support" },
                { icon: Youtube, label: "YouTube", to: "/support" },
              ].map(({ icon: Icon, label, to }) => (
                <Link
                  key={label}
                  to={to}
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-mist-500 transition hover:border-violet-400/30 hover:text-white"
                >
                  <Icon size={16} />
                </Link>
              ))}
            </div>
          </div>
          <FooterColumn
            title="Play"
            links={[
              { label: "All games", to: "/games" },
              { label: "The Impossible Room", to: "/games/impossible-room" },
              { label: "One Chance", to: "/games/one-chance" },
              { label: "Daily challenges", to: "/challenges" },
            ]}
          />
          <FooterColumn
            title="Compete"
            links={[
              { label: "Leaderboards", to: "/leaderboard" },
              { label: "Friend challenges", to: "/challenges" },
              { label: "Your profile", to: "/profile" },
              { label: "Achievements", to: "/profile" },
            ]}
          />
          <FooterColumn
            title="Platform"
            links={[
              { label: "Support", to: "/support" },
              { label: "Privacy", to: "/privacy" },
              { label: "Terms", to: "/terms" },
              { label: "Community rules", to: "/support" },
            ]}
          />
        </div>
        <hr className="rule mt-10" />
        <div className="mt-5 flex flex-col items-start justify-between gap-3 text-[11px] text-mist-600 sm:flex-row sm:items-center">
          <p>© 2026 PLAYFLIX. Play · Challenge · Compete.</p>
          <p className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-400" /> All systems online</span>
            <span className="text-white/15">/</span>
            Made for players everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-mist-600">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="group inline-flex items-center gap-1 text-[13px] text-mist-500 transition hover:text-white">
              {l.label}
              <ArrowUpRight size={11} className="opacity-0 transition group-hover:opacity-60" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AchievementToasts() {
  const { toasts, dismissToast } = usePlayer();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
      {toasts.map((toast) => {
        const def = achievementById(toast.achievementId);
        if (!def) return null;
        return (
          <button
            key={toast.uid}
            onClick={() => dismissToast(toast.uid)}
            className="pointer-events-auto fade-up flex w-full max-w-sm items-center gap-3 rounded-2xl border border-gold/30 bg-[#141021]/95 p-3.5 text-left shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              <Trophy size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-[9px] font-extrabold uppercase tracking-[0.2em] text-gold/80">Achievement unlocked</span>
              <span className="block truncate text-sm font-bold text-white">{def.name}</span>
              <span className="block text-[11px] text-mist-500">+50 coins</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SiteLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <AchievementToasts />
    </div>
  );
}
