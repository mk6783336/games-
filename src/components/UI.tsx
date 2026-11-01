import { useEffect, useState, type ReactNode } from "react";
import { Clock3, X } from "lucide-react";
import { formatCountdown, msUntilTomorrow } from "../lib/daily";

export function SectionHeading({
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
        <h2>{title}</h2>
        {description && <p className="mt-3 text-sm leading-relaxed text-mist-500 sm:text-[15px]">{description}</p>}
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
  const fill = tone === "gold" ? "bg-accent" : tone === "blue" ? "bg-electric" : "bg-accent-2";
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-card bg-paper-3 ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full origin-left rounded-card transition-transform duration-400 ease-out motion-reduce:transition-none motion-reduce:transition-none ${fill}`}
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
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
        className="absolute inset-0 cursor-default bg-shade/85"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className={`fade-up relative max-h-[88dvh] w-full overflow-y-auto rounded-t-card border-2 border-rule bg-paper-2 shadow-card sm:rounded-card ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-rule bg-paper-2 px-5 py-4">
          {title ? <h3>{title}</h3> : <span />}
          <button
            onClick={onClose}
            className="grid size-8 place-items-center text-mist-300 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
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
    <div className="rounded-card border border-rule bg-paper-2 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        {icon && <span className={tone === "gold" ? "text-gold" : "text-mist-500"}>{icon}</span>}
      </div>
      <div className={`mt-1.5 text-xl font-extrabold tabular-nums ${tone === "gold" ? "text-gold" : "text-ink"}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-mist-600">{hint}</div>}
    </div>
  );
}

export function EmptyBoard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-card border border-dashed border-rule bg-paper-2 px-6 py-10 text-center ${className}`}>
      <p className="text-sm font-bold text-mist-300">The board is waiting.</p>
      <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-mist-600">
        Finish a run to claim your place. Every score is one more reason to come back.
      </p>
    </div>
  );
}
