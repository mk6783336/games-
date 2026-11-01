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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-paper/94 pb-[max(0.45rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
      aria-label="Mobile"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pt-1">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-[9px] font-medium tracking-[0.12em] uppercase transition-colors ${
                isActive ? "text-ink" : "text-mist-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`relative grid h-6 w-8 place-items-center ${isActive ? "text-accent" : ""}`}>
                  <Icon size={17} strokeWidth={1.8} />
                  {isActive && <span className="absolute -top-1 h-px w-3 bg-accent" aria-hidden="true" />}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
