import { ArrowLeft, DoorOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
        <DoorOpen size={28} />
      </span>
      <p className="label mt-5">404, Wrong room</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">This door doesn't open.</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist-500">
        The page you were looking for isn't here. The games, however, are exactly where you left them.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-primary px-5 py-3 text-xs"><ArrowLeft size={13} /> Back home</Link>
        <Link to="/games" className="btn btn-ghost px-5 py-3 text-xs">Browse games</Link>
      </div>
    </div>
  );
}
