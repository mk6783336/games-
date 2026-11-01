import type { ReactNode } from "react";
import {
  CalendarCheck,
  Coins,
  Cog,
  DoorOpen,
  Feather,
  Flame,
  Gamepad2,
  Lock,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import type { AchievementDef, AchievementTier } from "../lib/achievements";

const ICONS: Record<string, ReactNode> = {
  sparkles: <Sparkles size={18} />,
  door: <DoorOpen size={18} />,
  cog: <Cog size={18} />,
  trophy: <Trophy size={18} />,
  feather: <Feather size={18} />,
  timer: <Timer size={18} />,
  flame: <Flame size={18} />,
  zap: <Zap size={18} />,
  calendar: <CalendarCheck size={18} />,
  swords: <Swords size={18} />,
  coins: <Coins size={18} />,
  gamepad: <Gamepad2 size={18} />,
};

const TIER: Record<AchievementTier, string> = {
  gold: "border-gold/35 bg-gold/10 text-gold",
  silver: "border-slate-300/25 bg-slate-300/10 text-slate-200",
  bronze: "border-orange-400/25 bg-orange-400/10 text-orange-300",
};

export function AchievementIcon({
  icon,
  tier,
  locked = false,
  size = "md",
}: {
  icon: string;
  tier: AchievementTier;
  locked?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? "size-14 rounded-2xl [&_svg]:size-6" : size === "sm" ? "size-9 rounded-xl [&_svg]:size-4" : "size-11 rounded-xl";
  return (
    <span
      className={`relative grid shrink-0 place-items-center border ${dims} ${
        locked ? "border-white/8 bg-white/[0.03] text-mist-600" : TIER[tier]
      }`}
    >
      {locked ? <Lock size={size === "lg" ? 18 : 14} /> : ICONS[icon] ?? <Trophy size={18} />}
    </span>
  );
}

export function AchievementRow({
  def,
  unlocked,
}: {
  def: AchievementDef;
  unlocked: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${unlocked ? "border-white/8 bg-white/[0.035]" : "border-white/5 bg-white/[0.015]"}`}>
      <AchievementIcon icon={def.icon} tier={def.tier} locked={!unlocked} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] font-bold ${unlocked ? "text-mist-100" : "text-mist-500"}`}>{def.name}</p>
        <p className="truncate text-[11px] text-mist-600">{def.description}</p>
      </div>
      <span className={`shrink-0 text-[9px] font-extrabold ${unlocked ? "text-gold" : "text-mist-600"}`}>
        {unlocked ? "Earned" : "Locked"}
      </span>
    </div>
  );
}
