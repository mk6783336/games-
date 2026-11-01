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
            <clipPath id={`${gid}-clip`}>
              <rect x="1" y="1" width="42" height="42" rx="8" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${gid}-clip)`}>
            <rect x="1" y="1" width="42" height="42" rx="8" className="fill-paper-3" />
            <path
              d="M8.5 3.5h26.8c1 0 1.6 1.1 1.1 2L28.3 19.4c-.4.8.2 1.7 1 1.7h3.8c1.7 0 2.5 2 1.3 3.2L14.6 40.1c-1.6 1.5-3.9-.7-2.7-2.5l8-12.4c.5-.8-.1-1.8-1-1.8H7.1c-1.5 0-2.3-1.7-1.3-2.8L7.4 4.6c.2-.6.6-1.1 1.1-1.1Z"
              className="fill-gold"
            />
            <path
              d="M13 7h17.2l-6.3 10.5H30c.8 0 1.2 1 .6 1.6L17 31.2l4.6-8.4H13.9c-.8 0-1.2-1-.6-1.6L13 7Z"
              fill="#05070f"
              opacity="0.28"
            />
          </g>
        </svg>
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
              className="mt-1 font-semibold text-mist-500"
              style={{ fontSize: Math.max(8, size * 0.2) }}
            >
              Play, challenge, compete
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
  const initials =
    name
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
        background: `radial-gradient(120% 120% at 28% 16%, hsl(${hue} 74% 62%) 0%, hsl(${hue} 66% 44%) 46%, hsl(${hue} 70% 24%) 100%)`,
        boxShadow: ring ? `0 0 0 2px var(--color-paper), 0 0 0 4px hsl(${hue} 70% 55% / 0.35)` : undefined,
      }}
      aria-hidden="true"
    >
      <span className="relative score-legible">{initials}</span>
    </span>
  );
}
