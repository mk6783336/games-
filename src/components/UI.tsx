import { useEffect, useState, type ReactNode } from "react";
import { Clock3, X } from "lucide-react";
import { formatCountdown, msUntilTomorrow } from "../lib/daily";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-mist-500 sm:text-[15px]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({
  value,
  className = "",
  tone = "violet",
}: {
  value: number;
  className?: string;
  tone?: "violet" | "gold" | "blue";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const fill =
    tone === "gold"
      ? "linear-gradient(90deg,#ffe9ad,#f5c45a)"
      : tone === "blue"
        ? "linear-gradient(90deg,#38bdf8,#5b8cff)"
        : "linear-gradient(90deg,#8b5cf6,#5b8cff)";
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-white/8 ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${clamped}%`, background: fill }} />
    </div>
  );
}

export function Countdown({ className = "" }: { className?: string }) {
  const [remaining, setRemaining] = useState(() => msUntilTomorrow());
  useEffect(() => {
    const t = window.setInterval(() => setRemaining(msUntilTomorrow()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${className}`}>
      <Clock3 size={13} />
      {formatCountdown(remaining)}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Dialog"}>
      <button
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default bg-[#02030a]/80 backdrop-blur-md"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className={`fade-up relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0b0f20]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] sm:rounded-3xl ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/5 bg-[#0b0f20]/95 px-5 py-4 backdrop-blur">
          {title ? <h3 className="font-display text-lg font-bold text-white">{title}</h3> : <span />}
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "gold";
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-mist-600">{label}</span>
        {icon && <span className={tone === "gold" ? "text-gold" : "text-mist-500"}>{icon}</span>}
      </div>
      <div className={`mt-1.5 font-display text-xl font-bold tabular-nums ${tone === "gold" ? "text-gold" : "text-white"}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-mist-600">{hint}</div>}
    </div>
  );
}

export function EmptyBoard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center ${className}`}>
      <p className="font-display text-sm font-semibold text-mist-300">The board is waiting.</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-mist-600">
        Finish a run to claim your place. Every score is one more reason to come back.
      </p>
    </div>
  );
}
