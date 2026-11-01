import { useEffect, useRef, useState } from "react";
import { Coins, LogIn, Trophy } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { usePlayer } from "../state/player";
import { achievementById } from "../lib/achievements";
import { Logo } from "./Brand";
import { MobileNav } from "./MobileNav";

const NAV = [
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
      setHidden(y > 160 && y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-rule/80 bg-paper/92 backdrop-blur-xl transition-transform duration-500 motion-reduce:transition-none ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="container-page flex h-[68px] items-center justify-between gap-4">
        <Logo size={28} subtitle={false} />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <NavLink
            to="/games"
            className={({ isActive }) =>
              `label transition-colors hover:text-ink ${isActive ? "text-ink" : "text-mist-500"}`
            }
          >
            Games
          </NavLink>
          {NAV.slice(1).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `label transition-colors hover:text-ink ${isActive ? "text-ink" : "text-mist-500"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/profile"
            className="hidden items-center gap-1.5 text-[11px] font-semibold tabular-nums text-mist-400 transition-colors hover:text-accent sm:flex"
            aria-label={`${state.coins.toLocaleString()} coins`}
          >
            <Coins size={12} className="text-accent" />
            {state.coins.toLocaleString()}
          </Link>
          {identity?.kind === "guest" ? (
            <Link to="/account" className="label flex items-center gap-1.5 text-mist-400 transition-colors hover:text-ink">
              <LogIn size={12} className="hidden sm:block" />
              Sign in
            </Link>
          ) : (
            <Link to="/profile" className="label text-mist-400 transition-colors hover:text-ink">
              Profile
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule pb-28 pt-16 md:pb-12">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div>
            <Logo size={26} />
            <p className="mt-6 max-w-xs font-display text-[clamp(1.5rem,2.6vw,2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-ink">
              Three games. One arena.
              <span className="serif block text-mist-500">No filler.</span>
            </p>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-mist-600">
              A cinematic escape room, a one-life rooftop run and a five-road alpine climb. Free to play, built to be mastered.
            </p>
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
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-rule pt-5 text-[10px] text-mist-600 sm:flex-row sm:items-center">
          <p>© 2026 PLAYFLIX. Play, challenge, compete.</p>
          <p className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-success" aria-hidden="true" /> All systems online
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
      <ul className="mt-5 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-[12px] text-mist-500 transition-colors hover:text-ink">
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
            className="pointer-events-auto fade-up flex w-full max-w-sm items-center gap-3 rounded-[3px] border border-accent/30 bg-paper-2 p-3.5 text-left"
          >
            <span className="grid size-9 shrink-0 place-items-center border border-accent/25 text-accent">
              <Trophy size={15} />
            </span>
            <span className="min-w-0">
              <span className="label block !text-accent">Achievement unlocked</span>
              <span className="block truncate text-sm font-semibold text-ink">{def.name}</span>
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[2px] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-ink"
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
