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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-paper-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Mobile"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pt-1.5">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex flex-col items-center gap-1 rounded-card py-2 text-[10.5px] font-bold transition ${
                isActive ? "text-ink" : "text-mist-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid h-7 w-11 place-items-center rounded-card transition ${
                    isActive ? "bg-accent text-accent-ink" : ""
                  }`}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 1.9} />
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
