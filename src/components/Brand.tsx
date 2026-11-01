import { useId } from "react";
import { Link } from "react-router-dom";

export function Logo({
  className = "",
  size = 30,
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
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className="relative grid shrink-0 place-items-center border border-white/15"
        style={{ width: size, height: size, borderRadius: 2 }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62}>
          <defs>
            <linearGradient id={`${gid}-gold`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f0c984" />
              <stop offset="1" stopColor="#c99340" />
            </linearGradient>
          </defs>
          <path d="M6 3h13.5L12.4 13.5h5.6L9.4 29l3.4-10H4.6z" fill={`url(#${gid}-gold)`} />
        </svg>
      </span>
      {wordmark && (
        <span className="flex flex-col leading-none">
          <span
            className="font-display font-semibold uppercase text-ink"
            style={{ fontSize: size * 0.46, letterSpacing: "0.16em" }}
          >
            Playflix
          </span>
          {subtitle && (
            <span
              className="mt-1.5 font-body text-mist-600"
              style={{ fontSize: Math.max(7, size * 0.17), letterSpacing: "0.22em" }}
            >
              PLAY · CHALLENGE · COMPETE
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

/** A flat monogram. No gradient bubbles, no decorative portraits. */
export function Avatar({
  name,
  hue = 266,
  size = 40,
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
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "P";

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center border bg-transparent font-display font-semibold uppercase text-ink ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.32),
        letterSpacing: "0.08em",
        borderRadius: 2,
        borderColor: `hsl(${hue} 22% 34% / 0.75)`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
