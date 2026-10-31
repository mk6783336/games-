import { useId } from "react";
import { Link } from "react-router-dom";

export function Logo({
  className = "",
  size = 34,
  wordmark = true,
  subtitle = false,
  linkTo = "/",
}: {
  className?: string;
  size?: number;
  wordmark?: boolean;
  subtitle?: boolean;
  linkTo?: string | null;
}) {
  const rawId = useId();
  const gid = `brand-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="relative grid shrink-0 place-items-center"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 44 44" width={size} height={size} className="relative z-10 overflow-visible">
          <defs>
            <linearGradient id={`${gid}-a`} x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="34%" stopColor="#a855f7" />
              <stop offset="72%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id={`${gid}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M8.5 3.5h26.8c1 0 1.6 1.1 1.1 2L28.3 19.4c-.4.8.2 1.7 1 1.7h3.8c1.7 0 2.5 2 1.3 3.2L14.6 40.1c-1.6 1.5-3.9-.7-2.7-2.5l8-12.4c.5-.8-.1-1.8-1-1.8H7.1c-1.5 0-2.3-1.7-1.3-2.8L7.4 4.6c.2-.6.6-1.1 1.1-1.1Z"
            fill={`url(#${gid}-a)`}
          />
          <path
            d="M13 7h17.2l-6.3 10.5H30c.8 0 1.2 1 .6 1.6L17 31.2l4.6-8.4H13.9c-.8 0-1.2-1-.6-1.6L13 7Z"
            fill={`url(#${gid}-b)`}
            opacity="0.5"
          />
        </svg>
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full blur-xl opacity-60"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 68%)" }}
        />
      </span>
      {wordmark && (
        <span className="flex flex-col leading-none">
          <span
            className="font-display font-extrabold uppercase tracking-[-0.045em] text-white"
            style={{ fontSize: size * 0.62, transform: "skewX(-6deg)" }}
          >
            PLAY<span className="violet-text">FLIX</span>
          </span>
          {subtitle && (
            <span
              className="mt-1 font-semibold uppercase text-mist-500"
              style={{ fontSize: Math.max(6.5, size * 0.18), letterSpacing: "0.31em" }}
            >
              Play · Challenge · Compete
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (!linkTo) return content;
  return (
    <Link to={linkTo} aria-label="PLAYFLIX home" className="group inline-flex">
      {content}
    </Link>
  );
}

export function Avatar({
  name,
  hue = 266,
  size = 40,
  ring = true,
  className = "",
}: {
  name: string;
  hue?: number;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const initials = name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "P";

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `radial-gradient(120% 120% at 28% 16%, hsl(${hue} 92% 74%) 0%, hsl(${hue + 24} 74% 48%) 42%, hsl(${hue + 44} 72% 24%) 100%)`,
        boxShadow: ring ? `0 0 0 2px rgba(255,255,255,0.08), 0 0 0 4px hsla(${hue}, 80%, 60%, 0.16)` : undefined,
      }}
      aria-hidden="true"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_85%,rgba(4,6,16,0.55),transparent_58%)]" />
      <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{initials}</span>
    </span>
  );
}
