import { useEffect } from "react";
import { ArrowLeft, ArrowRight, FileText, LifeBuoy, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Brand";

type Kind = "support" | "privacy" | "terms";

const CONTENT: Record<Kind, { eyebrow: string; title: string; intro: string }> = {
  support: {
    eyebrow: "Support",
    title: "You're not stuck. You're between solutions.",
    intro:
      "Answers to the questions players ask most. If something is broken, tell us where it hurts; fixes ship before new content does.",
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Your progress is yours.",
    intro:
      "PLAYFLIX is built to ask for as little as possible. This page explains exactly what is stored and where it lives.",
  },
  terms: {
    eyebrow: "Terms",
    title: "Fair play, clearly written.",
    intro:
      "The short version: play freely, play fairly, and don't abuse the platform or other players. The longer version is below.",
  },
};

const FAQ = [
  {
    q: "How do I control The Impossible Room?",
    a: "Tap or click any glowing point to inspect it. Select an item from the inventory, then tap an object to use it. Some items can be combined with each other using the Combine button. H opens hints, P pauses.",
  },
  {
    q: "How do I play One Chance?",
    a: "Jump with Space, ↑, W or by tapping the play area. Slide with ↓, S or the on-screen Slide button. You get one ground jump and one extra jump in the air. A single collision ends the run.",
  },
  {
    q: "Where is my progress saved?",
    a: "Your profile, chapter progress, records, achievements and preferences are stored in this browser using local storage. Clearing site data or using a different device or browser starts a fresh profile.",
  },
  {
    q: "When does the daily challenge reset?",
    a: "Every day at midnight in your local timezone. The One Chance daily uses a seed derived from the date, so every player gets the exact same run.",
  },
  {
    q: "How do friend challenges work?",
    a: "A challenge link contains the game, a seed and a target score. Opening the link registers the challenge on your profile. Finish the run and the result is compared instantly on your device.",
  },
  {
    q: "Does ONE CHANCE get easier if I fail?",
    a: "No. Difficulty always ramps with survival time. Every hazard is telegraphed at the right edge before it reaches you, and spawn spacing is tuned to keep every pattern survivable.",
  },
  {
    q: "Can I turn off sound or animation?",
    a: "Yes. Open your profile and adjust Sound effects and Reduced motion. Both settings apply immediately across every game.",
  },
  {
    q: "I found a bug. What should I do?",
    a: "Note the game, the chapter or score, and what you did right before it happened. This build stores data locally, so a hard refresh then repeating the steps is the most useful reproduction.",
  },
];

export default function InfoPage({ kind }: { kind: Kind }) {
  const content = CONTENT[kind];
  useEffect(() => {
    document.title = `${content.eyebrow} — PLAYFLIX`;
    return () => {
      document.title = "PLAYFLIX — Play. Challenge. Compete.";
    };
  }, [content.eyebrow]);

  const Icon = kind === "support" ? LifeBuoy : kind === "privacy" ? ShieldCheck : FileText;

  return (
    <div className="container-page pt-8 sm:pt-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-mist-500 transition hover:text-white">
        <ArrowLeft size={13} /> Back home
      </Link>

      <header className="mt-6 max-w-2xl">
        <span className="grid size-11 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
          <Icon size={20} />
        </span>
        <p className="label mt-5">{content.eyebrow}</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1] tracking-[-0.045em] text-white">{content.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-mist-400">{content.intro}</p>
        <p className="mt-2 text-[10px] font-semibold text-mist-600">Last updated, October 2026</p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="panel p-5 sm:p-7">
          {kind === "support" && (
            <div className="divide-y divide-white/6">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-4 first:pt-0 last:pb-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-semibold text-mist-100 marker:hidden">
                    {item.q}
                    <span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/10 text-mist-500 transition-transform duration-300 motion-reduce:transition-none group-open:rotate-45 group-open:border-accent/30 group-open:text-accent">+</span>
                  </summary>
                  <p className="mt-2.5 max-w-2xl text-[12px] leading-relaxed text-mist-500">{item.a}</p>
                </details>
              ))}
            </div>
          )}

          {kind === "privacy" && (
            <LegalSections
              sections={[
                {
                  title: "What we store",
                  body: "This build stores a local guest profile: your display name, country, avatar colour, settings, scores, chapter progress, achievements, daily history and friend-challenge records.",
                },
                {
                  title: "Where it lives",
                  body: "Your profile, progress and settings are kept in your browser's local storage on this device. There is no account, no sign-in and no cloud sync in this build. The only data that leaves your device is the product-analytics traffic described below, and only when it is switched on.",
                },
                {
                  title: "Product analytics",
                  body: "We use PostHog for product analytics: page views, which game and chapter you finish, scores, daily-challenge and achievement completions, and a random guest identifier, so we can see which parts of the games people reach. Events are tied to that guest identifier, never to an email or account. You can turn product analytics off from your profile at any time; when it is off, no events are sent.",
                },
                {
                  title: "Tracking and advertising",
                  body: "No advertising SDKs, fingerprinting, session recording or third-party trackers are loaded. The free-to-play model reserves space for advertising, but no ad code is present in this version.",
                },
                {
                  title: "Leaderboards",
                  body: "Leaderboards display a locally generated competitive roster alongside your own best score. Your name appears only if you keep the Public leaderboard setting on. Scores are not sent to a leaderboard server in this build.",
                },
                {
                  title: "Your controls",
                  body: "You can turn product analytics off, hide your leaderboard entry, disable friend-challenge links, or erase all progress from your profile at any time. Reset is immediate and cannot be undone.",
                },
                {
                  title: "Children and contact",
                  body: "PLAYFLIX is designed for a general audience and collects no personal data beyond the display name you choose and the guest analytics identifier described above. Because this build is fully local, there is no server-side record to request or delete beyond those analytics events.",
                },
              ]}
            />
          )}

          {kind === "terms" && (
            <LegalSections
              sections={[
                {
                  title: "Using PLAYFLIX",
                  body: "PLAYFLIX is a free gaming destination. You may play every game, share challenge links and appear on leaderboards. You may not attempt to disrupt the service, reverse-engineer security controls, or use the platform to harass other players.",
                },
                {
                  title: "Local profiles",
                  body: "This build uses local guest profiles rather than accounts. Your nickname and scores are not verified identities. Do not choose a display name that impersonates another person or contains abuse.",
                },
                {
                  title: "Scores and fair play",
                  body: "Scores are recorded by the game client. Submitting artificially modified scores, exploiting unintended behaviour or scripting inputs is not allowed. Leaderboards may be reset when live services and verified scoring ship.",
                },
                {
                  title: "Purchases",
                  body: "There are no real-money purchases, loot boxes or paid advantages in this build. Coins are a cosmetic progress currency only and have no monetary value.",
                },
                {
                  title: "Content and availability",
                  body: "Games, challenges and visual assets are owned by PLAYFLIX and provided as-is. Features may change during the launch period. We aim for high availability but cannot promise uninterrupted play.",
                },
                {
                  title: "Questions",
                  body: "For platform, privacy or press questions, use the support centre. It explains where data lives and how to reset it while the account system is still intentionally minimal.",
                },
              ]}
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <Logo size={30} subtitle />
            <p className="mt-3 text-[11px] leading-relaxed text-mist-500">
              Two complete games, built to be replayed. No filler, no pay-to-win.
            </p>
            <div className="mt-4 space-y-2">
              <Link to="/games" className="btn btn-primary w-full py-2.5 text-[11px]">Browse the games</Link>
              <Link to="/support" className="btn btn-ghost w-full py-2.5 text-[11px]">Support centre</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/7 bg-white/[0.02] p-4">
            <p className="text-[9px] font-bold text-mist-600">Need a human?</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-mist-500">
              A support inbox and account sync arrive in the next platform milestone. Until then, your profile holds every option to reset or recover play.
            </p>
            <Link to="/profile" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent">
              <span className="inline-flex items-center gap-1.5">Open profile <ArrowRight size={13} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LegalSections({ sections }: { sections: { title: string; body: string }[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section, i) => (
        <section key={section.title}>
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span className="text-[10px] font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
            {section.title}
          </h2>
          <p className="mt-2 pl-6 text-[12px] leading-relaxed text-mist-500">{section.body}</p>
        </section>
      ))}
    </div>
  );
}
