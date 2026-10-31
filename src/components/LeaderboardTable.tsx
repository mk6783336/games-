import { Crown, Trophy } from "lucide-react";
import { Avatar } from "./Brand";
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
    <div className="overflow-hidden">
      {showHeader && (
        <div className="grid grid-cols-[2.2rem_1fr_auto] gap-3 border-b border-white/6 px-2 pb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-mist-600 sm:grid-cols-[2.4rem_1fr_7rem_5.5rem]">
          <span>Rank</span>
          <span>Player</span>
          <span className="hidden sm:block">Region</span>
          <span className="text-right">{game === "impossible-room" ? "Escape" : "Score"}</span>
        </div>
      )}
      <ol>
        {visible.map((row, index) => {
          const rank = index + 1 + rankOffset;
          const medal =
            rank === 1 ? "#f5c45a" : rank === 2 ? "#cbd5e1" : rank === 3 ? "#d99565" : null;
          return (
            <li
              key={`${row.name}-${rank}`}
              className={`group grid grid-cols-[2.2rem_1fr_auto] items-center gap-3 rounded-xl px-2 transition-colors sm:grid-cols-[2.4rem_1fr_7rem_5.5rem] ${
                dense ? "py-2" : "py-2.5"
              } ${row.isYou ? "bg-violet-500/10 ring-1 ring-inset ring-violet-400/20" : "hover:bg-white/[0.035]"}`}
            >
              <span className="flex items-center justify-center">
                {rank === 1 ? (
                  <Crown size={17} style={{ color: medal ?? undefined }} fill="rgba(245,196,90,0.18)" />
                ) : rank <= 3 ? (
                  <Trophy size={15} style={{ color: medal ?? undefined }} />
                ) : (
                  <span className="font-display text-xs font-bold tabular-nums text-mist-600">{rank}</span>
                )}
              </span>
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={row.name} hue={row.avatarHue} size={dense ? 26 : 30} ring={false} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className={`truncate text-[13px] font-semibold ${row.isYou ? "text-violet-200" : "text-mist-100"}`}>
                      {row.name}
                    </span>
                    {row.isYou && (
                      <span className="rounded bg-violet-500/25 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-violet-200">
                        You
                      </span>
                    )}
                  </span>
                </span>
              </span>
              <span className="hidden items-center gap-1.5 text-[11px] text-mist-500 sm:flex">
                <span className="rounded border border-white/8 bg-white/[0.03] px-1 py-0.5 font-mono text-[8px] font-bold tracking-wider text-mist-500">{row.country}</span>
                <span className="truncate">{countryInfo(row.country).name}</span>
              </span>
              <span className={`text-right font-display font-bold tabular-nums ${row.isYou ? "text-violet-100" : "text-mist-300"}`} style={{ fontSize: dense ? 12 : 13 }}>
                {scoreText(game, row.score)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
