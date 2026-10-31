import { Gamepad2, Home as HomeIcon, Swords, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/challenges", label: "Challenges", icon: Swords },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#070a17]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-2xl md:hidden"
      aria-label="Mobile"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pt-1.5">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex flex-col items-center gap-1 rounded-xl py-2 text-[9.5px] font-bold uppercase tracking-[0.08em] transition ${
                isActive ? "text-violet-200" : "text-mist-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`grid h-7 w-11 place-items-center rounded-full transition ${isActive ? "bg-violet-500/15" : ""}`}>
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 1.9} />
                </span>
                {label}
                {isActive && <span className="absolute top-0 h-[2px] w-6 rounded-full bg-violet-400" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
