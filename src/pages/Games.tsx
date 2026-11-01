import { ArrowRight, Gamepad2, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { GAME_LIST } from "../lib/games";
import { GameCard } from "../components/GameCard";

export default function Games() {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
                    <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[0.98] tracking-[-0.05em] text-white">
            Three worlds.<br /><span className="violet-text">One arena.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-mist-500">
            A launch lineup with nothing to skip. A slow-burn escape room, a split-second survival run and a five-road climb from forest to storm. All free, all complete, all want your best score.
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-center">
            <p className="font-display text-2xl font-extrabold text-white">03</p>
            <p className="text-[9px] font-bold text-mist-600">Launch games</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-center">
            <p className="font-display text-2xl font-extrabold text-white">∞</p>
            <p className="text-[9px] font-bold text-mist-600">Retries</p>
          </div>
        </div>
      </div>

      <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {GAME_LIST.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <div className="panel mt-6 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold/[0.08] text-gold">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-white">No filler, ever</p>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-mist-600">
              Every game in the library ships complete, tested and playable. No unfinished launches, no padding the shelves with games that do not earn their place.
            </p>
          </div>
        </div>
        <Link to="/challenges" className="btn btn-ghost shrink-0 px-4 py-2.5 text-[11px]">
          Today's challenges <ArrowRight size={13} />
        </Link>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: <Layers size={17} />, title: "Deep by design", body: "Inventory combinations, connected chapters, adaptive hazards; built to reward mastery." },
          { icon: <Sparkles size={17} />, title: "One more run", body: "Fast restarts, saved progress and a daily seed that makes every day a new contest." },
          { icon: <Gamepad2 size={17} />, title: "Any screen", body: "Thumb-friendly controls on mobile, keyboard-ready on desktop, readable everywhere." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-white/7 bg-white/[0.02] p-5">
            <span className="grid size-9 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/[0.07] text-violet-300">{item.icon}</span>
            <p className="mt-3 text-sm font-bold text-mist-100">{item.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-mist-600">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
