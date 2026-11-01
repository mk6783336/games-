import { countryInfo, formatDuration } from "../lib/games";
import type { GameId, LeaderboardEntry } from "../lib/types";

function scoreText(game: GameId, score: number) {
  return game === "impossible-room" ? formatDuration(score) : score.toLocaleString("en-US");
}

export function LeaderboardTable({
  rows,
  game,
  limit,
  dense = false,
  showHeader = true,
  rankOffset = 0,
}: {
  rows: LeaderboardEntry[];
  game: GameId;
  limit?: number;
  dense?: boolean;
  showHeader?: boolean;
  rankOffset?: number;
}) {
  const visible = limit ? rows.slice(0, limit) : rows;

  return (
    <div>
      {showHeader && (
        <div className="grid grid-cols-[2rem_1fr_auto] gap-3 border-b border-rule pb-2.5 text-[9px] font-medium uppercase tracking-[0.16em] text-mist-600 sm:grid-cols-[2.2rem_1fr_7rem_5rem]">
          <span>#</span>
          <span>Player</span>
          <span className="hidden sm:block">Region</span>
          <span className="text-right">{game === "impossible-room" ? "Escape" : "Score"}</span>
        </div>
      )}
      <ol>
        {visible.map((row, index) => {
          const rank = index + 1 + rankOffset;
          return (
            <li
              key={`${row.name}-${rank}`}
              className={`grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-rule/70 sm:grid-cols-[2.2rem_1fr_7rem_5rem] ${
                dense ? "py-2" : "py-3"
              } ${row.isYou ? "text-ink" : "text-mist-300"}`}
            >
              <span
                className={`font-display text-[11px] font-medium tabular-nums ${
                  rank === 1 ? "text-accent" : "text-mist-600"
                }`}
              >
                {String(rank).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span className={`truncate text-[12px] ${row.isYou ? "font-semibold text-ink" : "font-normal"}`}>
                  {row.name}
                </span>
                {row.isYou && (
                  <span className="border border-accent/30 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-accent">
                    You
                  </span>
                )}
              </span>
              <span className="hidden min-w-0 items-center gap-2 text-[10px] text-mist-600 sm:flex">
                <span className="w-5 text-[9px] font-semibold uppercase tracking-[0.08em] text-mist-500">
                  {row.country}
                </span>
                <span className="truncate">{countryInfo(row.country).name}</span>
              </span>
              <span
                className={`text-right font-display font-medium tabular-nums tracking-[-0.02em] ${
                  row.isYou ? "text-accent" : "text-mist-300"
                }`}
                style={{ fontSize: dense ? 11 : 12 }}
              >
                {scoreText(game, row.score)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
