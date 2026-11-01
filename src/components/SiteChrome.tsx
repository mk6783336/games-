import { useEffect, useRef, useState } from "react";
import { Coins, Instagram, LogIn, MessageCircle, Trophy, Youtube } from "lucide-react";
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
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 140 && y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-rule bg-paper transition-transform duration-300 motion-reduce:transition-none ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo size={32} subtitle={false} />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative rounded-card px-3 py-2 text-[13px] font-semibold transition-colors ${
                  isActive ? "text-accent" : "text-mist-500 hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[7px] h-0.5 bg-accent" aria-hidden="true" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {identity?.kind === "guest" && (
            <Link to="/account" title="Sign in or create an account" className="btn btn-sm btn-ghost">
              <LogIn size={14} />
              <span className="hidden lg:inline">Sign in</span>
            </Link>
          )}
          <Link
            to="/profile"
            className="chip border-gold/40 text-gold transition-colors hover:border-gold"
            aria-label={`${state.coins.toLocaleString()} coins`}
          >
            <Coins size={14} />
            <span className="num">{state.coins.toLocaleString()}</span>
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
    <footer className="relative mt-20 border-t border-rule bg-paper-2 pb-24 pt-14 md:pb-10">
      <div className="container-page">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <p className="display text-[clamp(1.6rem,3vw,2.1rem)] leading-[1.05] text-ink">
              Play free. Chase the board.
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-500">
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
                  className="grid size-9 place-items-center rounded-card border border-rule bg-paper-3 text-mist-500 transition-colors hover:border-accent-2 hover:text-ink"
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
              { label: "Cycle", to: "/games/cycle" },
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
        <div className="mt-5 flex flex-col items-start justify-between gap-3 text-xs text-mist-600 sm:flex-row sm:items-center">
          <p>© 2026 PLAYFLIX. Play, challenge, compete.</p>
          <p className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" /> All systems online
            </span>
            <span>Made for players everywhere</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <p className="label">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-sm text-mist-500 transition-colors hover:text-ink hover:underline"
            >
              {l.label}
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
            className="pointer-events-auto fade-up flex w-full max-w-sm items-center gap-3 rounded-card border-2 border-gold/40 bg-paper-3 p-3.5 text-left shadow-card"
          >
            <span className="grid size-10 shrink-0 place-items-center text-gold">
              <Trophy size={18} />
            </span>
            <span className="min-w-0">
              <span className="label block text-gold">Achievement unlocked</span>
              <span className="block truncate text-sm font-bold text-ink">{def.name}</span>
              <span className="block text-xs text-mist-500">+50 coins</span>
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-card focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-ink"
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
