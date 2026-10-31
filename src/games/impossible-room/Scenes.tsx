import { useId } from "react";
import type { RoomId } from "./data";

interface SceneProps {
  flags: Record<string, boolean>;
  p: string;
}

function StudyScene({ flags, p }: SceneProps) {
  const open = Boolean(flags["study-unlocked"]);
  const drawerOpen = Boolean(flags["study-drawer"]);
  const candleTaken = Boolean(flags["taken:mantel"]);
  const keyTaken = Boolean(flags["taken:bookshelf"]);

  return (
    <svg viewBox="0 0 900 600" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${p}-wall`} x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#1d2326" />
          <stop offset="42%" stopColor="#151b1f" />
          <stop offset="100%" stopColor="#0a0e12" />
        </linearGradient>
        <linearGradient id={`${p}-floor`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#241c17" />
          <stop offset="100%" stopColor="#090a0c" />
        </linearGradient>
        <linearGradient id={`${p}-wood`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#68452c" />
          <stop offset="38%" stopColor="#422a1a" />
          <stop offset="100%" stopColor="#20140d" />
        </linearGradient>
        <linearGradient id={`${p}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe7a8" />
          <stop offset="50%" stopColor="#d9a94e" />
          <stop offset="100%" stopColor="#8a5c22" />
        </linearGradient>
        <radialGradient id={`${p}-lamp`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd88e" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#d39645" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#0a0e12" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${p}-keyglow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff2c4" />
          <stop offset="28%" stopColor="#f5c45a" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#f5c45a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-lightshaft`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe0a0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffe0a0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${p}-vignette`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#03050a" stopOpacity="0.85" />
          <stop offset="22%" stopColor="#03050a" stopOpacity="0" />
          <stop offset="78%" stopColor="#03050a" stopOpacity="0" />
          <stop offset="100%" stopColor="#03050a" stopOpacity="0.85" />
        </linearGradient>
        <filter id={`${p}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id={`${p}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id={`${p}-paper`} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#d8c9a6" />
          <path d="M0 7L7 0" stroke="#b8a681" strokeWidth="0.5" opacity="0.5" />
        </pattern>
      </defs>

      <rect width="900" height="600" fill={`url(#${p}-wall)`} />
      {/* wall moulding */}
      <g fill="none" stroke="#39413f" opacity="0.45">
        <rect x="42" y="88" width="230" height="300" />
        <rect x="58" y="104" width="198" height="268" opacity="0.6" />
        <rect x="628" y="88" width="230" height="300" />
        <rect x="644" y="104" width="198" height="268" opacity="0.6" />
        <path d="M0 388 H900" strokeWidth="2" />
        <path d="M0 404 H900" opacity="0.6" />
      </g>
      <rect y="404" width="900" height="196" fill={`url(#${p}-floor)`} />
      <g stroke="#3a2b20" strokeWidth="1" opacity="0.6">
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M${450 + (i - 4) * 55} 404 L${450 + (i - 4) * 200} 600`} />
        ))}
        <path d="M0 452 H900" opacity="0.6" />
        <path d="M0 506 H900" opacity="0.45" />
        <path d="M0 566 H900" opacity="0.3" />
      </g>

      {/* chandelier */}
      <g>
        <circle cx="450" cy="74" r="120" fill={`url(#${p}-lamp)`} opacity="0.55" filter={`url(#${p}-blur)`} />
        <path d="M450 0 V28" stroke="#5a492d" strokeWidth="2.5" />
        <path d="M450 30 C394 36 358 66 340 108 M450 30 C506 36 542 66 560 108 M450 30 C424 46 410 72 404 96 M450 30 C476 46 490 72 496 96" fill="none" stroke="#77603a" strokeWidth="2.5" />
        <g fill="#f8d795">
          <rect x="334" y="100" width="6" height="22" rx="2" />
          <rect x="554" y="100" width="6" height="22" rx="2" />
          <rect x="400" y="88" width="5" height="16" rx="2" />
          <rect x="490" y="88" width="5" height="16" rx="2" />
          <rect x="446" y="70" width="7" height="24" rx="2" />
        </g>
        <g fill="#ffeab7" filter={`url(#${p}-glow)`}>
          <circle cx="337" cy="98" r="6" />
          <circle cx="557" cy="98" r="6" />
          <circle cx="402" cy="84" r="5" />
          <circle cx="492" cy="84" r="5" />
          <circle cx="449" cy="66" r="6" />
        </g>
      </g>

      {/* painting */}
      <g>
        <path d="M132 118 h176 v214 h-176 z" fill="#0d0b08" />
        <rect x="140" y="126" width="160" height="198" fill={`url(#${p}-gold)`} opacity="0.28" />
        <rect x="148" y="134" width="144" height="182" fill="#182019" />
        <rect x="148" y="134" width="144" height="182" fill="none" stroke={`url(#${p}-gold)`} strokeWidth="2.5" />
        <ellipse cx="220" cy="196" rx="33" ry="42" fill="#2a2b22" />
        <path d="M162 310 C168 258 272 258 278 310 Z" fill="#20251f" />
        <path d="M188 170 C196 128 248 128 254 172 C248 150 200 148 188 170 Z" fill="#171a14" />
        <path d="M196 220 q24 16 48 0" stroke="#4c4738" strokeWidth="2" fill="none" />
        <g stroke="#c2a35e" strokeWidth="1" opacity="0.5">
          <path d="M190 140 h96" />
          <path d="M196 300 h84" />
        </g>
        {flags["study-code"] && (
          <g fill="#ffe6a8" filter={`url(#${p}-glow)`} fontFamily="Sora, sans-serif" fontWeight="700">
            <text x="220" y="165" textAnchor="middle" fontSize="15" opacity="0.9">4 · 9 · 2</text>
          </g>
        )}
      </g>

      {/* door */}
      <g>
        <path d="M316 492 V188 C316 120 368 76 450 76 C532 76 584 120 584 188 V492 Z" fill="#080a0b" />
        <path d="M330 492 V190 C330 128 376 90 450 90 C524 90 570 128 570 190 V492 Z" fill="#2a1c12" />
        {open ? (
          <g>
            <path d="M344 492 V194 C344 136 384 104 450 104 C516 104 556 136 556 194 V492 Z" fill="#06070a" />
            <path d="M344 492 V194 C344 150 380 122 426 112 L426 492 Z" fill={`url(#${p}-wood)`} opacity="0.55" />
            <path d="M360 492 L360 210 C360 170 388 144 424 132 L424 492 Z" fill={`url(#${p}-lightshaft)`} opacity="0.8" />
            <path d="M448 492 L540 540 L640 540 L556 492 Z" fill={`url(#${p}-lightshaft)`} opacity="0.45" />
            <path d="M430 492 L520 600 L690 600 L548 492 Z" fill={`url(#${p}-lightshaft)`} opacity="0.2" />
            <path d="M424 112 C480 110 530 142 546 186" fill="none" stroke="#b88647" strokeWidth="2" opacity="0.5" />
          </g>
        ) : (
          <g>
            <path d="M344 492 V194 C344 136 384 104 450 104 C516 104 556 136 556 194 V492 Z" fill={`url(#${p}-wood)`} />
            <g fill="none" stroke="#7a5834" strokeWidth="2" opacity="0.5">
              <path d="M368 220 h164 v104 h-164 z" />
              <path d="M380 232 h140 v80 h-140 z" opacity="0.55" />
              <path d="M368 348 h164 v108 h-164 z" />
              <path d="M380 360 h140 v84 h-140 z" opacity="0.55" />
              <path d="M450 104 V492" opacity="0.3" />
            </g>
            <path d="M450 98 C515 100 552 134 558 188" fill="none" stroke="#9f7544" strokeWidth="1.4" opacity="0.55" />
            <circle cx="530" cy="322" r="12" fill={`url(#${p}-gold)`} />
            <circle cx="530" cy="322" r="4" fill="#3a2711" />
            <circle cx="450" cy="350" r="46" fill={`url(#${p}-keyglow)`} filter={`url(#${p}-blur)`} opacity="0.8" />
            <ellipse cx="450" cy="350" rx="13" ry="17" fill="#090705" stroke={`url(#${p}-gold)`} strokeWidth="2" />
            <circle cx="450" cy="344" r="4" fill="#ffe9ac" filter={`url(#${p}-glow)`} />
            <path d="M447 348 h6 l2 12 h-10 z" fill="#ffe9ac" />
            {/* keypad */}
            <g>
              <rect x="562" y="286" width="30" height="64" rx="4" fill="#0b0f12" stroke="#6d7780" strokeWidth="1.5" />
              <rect x="568" y="294" width="18" height="9" rx="1.5" fill="#7fe1ff" opacity="0.65" filter={`url(#${p}-glow)`} />
              {[0, 1, 2].map((r) =>
                [0, 1, 2].map((c) => (
                  <circle key={`${r}-${c}`} cx={573 + c * 5.5} cy={312 + r * 8} r="1.4" fill="#87919b" />
                )),
              )}
            </g>
          </g>
        )}
        <path d="M316 492 V188 C316 120 368 76 450 76 C532 76 584 120 584 188 V492" fill="none" stroke="#4b3823" strokeWidth="8" opacity="0.8" />
        <path d="M306 492 V186 C306 114 362 64 450 64 C538 64 594 114 594 186 V492" fill="none" stroke="#241a11" strokeWidth="8" />
      </g>

      {/* bookshelf */}
      <g>
        <rect x="678" y="126" width="170" height="250" rx="3" fill="#1b140e" />
        <rect x="686" y="134" width="154" height="234" fill="#0e0b08" stroke="#4a3421" strokeWidth="2" />
        {[0, 1, 2, 3].map((shelf) => (
          <g key={shelf}>
            <rect x="686" y={134 + shelf * 58 + 48} width="154" height="6" fill="#4a3421" />
            {Array.from({ length: 8 }).map((_, i) => {
              const hue = ["#4b3a2a", "#313b35", "#3e2c31", "#2c3442", "#4a4130", "#2f3c31", "#413228", "#343a44"][i];
              const h = 30 + ((i * 7 + shelf * 3) % 15);
              const green = shelf === 1 && i === 4 && !keyTaken;
              return (
                <rect
                  key={i}
                  x={692 + i * 18 + (i > 3 ? 2 : 0)}
                  y={134 + shelf * 58 + 48 - h}
                  width={13}
                  height={h}
                  rx="1.5"
                  fill={green ? "#556b45" : hue}
                  opacity={green ? 1 : 0.85}
                />
              );
            })}
            {shelf === 1 && !keyTaken && (
              <g filter={`url(#${p}-glow)`}>
                <circle cx="772" cy="215" r="4" fill="#ffd780" />
                <path d="M772 218 v12" stroke="#ffd780" strokeWidth="1.5" />
                <circle cx="772" cy="232" r="2.5" fill="none" stroke="#ffd780" strokeWidth="1.5" />
              </g>
            )}
          </g>
        ))}
        <path d="M676 126 C716 112 810 112 850 127" fill="none" stroke="#5b4229" strokeWidth="4" />
      </g>

      {/* desk */}
      <g>
        <path d="M82 428 H306 V452 H82 Z" fill="#3d2919" />
        <path d="M92 452 H296 V516 H92 Z" fill="#2a1b11" />
        <path d="M104 464 H284 V504 H104 Z" fill="#1c120b" stroke="#4d351f" strokeWidth="2" />
        {drawerOpen ? (
          <g>
            <path d="M104 470 H284 L306 484 H126 Z" fill="#4a3220" />
            <path d="M126 484 V512 H306 V484 Z" fill="#332214" stroke="#5b3e26" strokeWidth="1.5" />
            <rect x="150" y="494" width="26" height="10" rx="2" fill="#c8a45a" opacity="0.5" />
          </g>
        ) : (
          <g>
            <circle cx="194" cy="484" r="5" fill="none" stroke="#c9a459" strokeWidth="1.5" />
            <path d="M194 484 v6" stroke="#c9a459" strokeWidth="1.5" />
          </g>
        )}
        <g fill={`url(#${p}-paper)`} opacity="0.85">
          <path d="M224 412 l52 -7 l6 34 l-52 7 z" />
          <path d="M240 400 l46 -4 l5 28 l-46 4 z" opacity="0.7" />
        </g>
        <g transform="translate(258 396)">
          <rect x="-8" y="0" width="16" height="9" rx="3" fill="#0b1118" stroke="#8a969f" strokeWidth="1" />
          <path d="M-8 4 h-14" stroke="#c6b075" strokeWidth="2" />
          <ellipse cx="8" cy="4" rx="3" ry="7" fill="#e6d6a5" opacity="0.8" />
        </g>
      </g>

      {/* fireplace */}
      <g>
        <rect x="628" y="372" width="228" height="20" rx="3" fill="#3e2a1a" />
        <rect x="644" y="392" width="196" height="132" rx="4" fill="#17100b" />
        <rect x="664" y="414" width="156" height="92" rx="2" fill="#070606" />
        <g opacity="0.55">
          <ellipse cx="742" cy="500" rx="62" ry="16" fill="#3a1d0d" />
          <path d="M706 496 C716 476 724 470 732 490 C738 470 750 466 756 492 C762 480 776 482 778 500" fill="#7c3b12" />
        </g>
        <rect x="654" y="356" width="180" height="16" rx="2" fill="#4e3721" />
        {!candleTaken && (
          <g>
            <rect x="712" y="332" width="12" height="26" rx="2" fill="#e9d9ab" />
            <path d="M712 332 c-4 -7 3 -9 6 -14 c3 5 10 7 6 14 z" fill="#f5c45a" />
            <g filter={`url(#${p}-glow)`}>
              <circle cx="718" cy="332" r="5" fill="#ffeab7" opacity="0.7" />
            </g>
          </g>
        )}
        <g fill="#bba06b" opacity="0.5">
          <rect x="756" y="342" width="38" height="26" rx="2" />
          <path d="M760 368 q12 18 24 0" fill="none" stroke="#bba06b" strokeWidth="1" />
        </g>
      </g>

      {/* rug */}
      <path d="M304 600 L330 490 H600 L636 600 Z" fill="#3c1f1c" opacity="0.65" />
      <path d="M326 590 L348 504 H582 L610 590 Z" fill="none" stroke="#7d4f35" strokeWidth="2" opacity="0.4" />
      <path d="M340 578 L358 518 H570 L592 578 Z" fill="none" stroke="#a06a42" strokeWidth="1" opacity="0.25" />

      {/* dust */}
      <g fill="#f4d697">
        <circle cx="398" cy="228" r="1.5" opacity="0.65" />
        <circle cx="506" cy="196" r="1.1" opacity="0.5" />
        <circle cx="482" cy="288" r="1.8" opacity="0.55" />
        <circle cx="352" cy="330" r="1.1" opacity="0.4" />
        <circle cx="566" cy="368" r="1.3" opacity="0.5" />
        <circle cx="628" cy="248" r="1" opacity="0.45" />
      </g>

      <rect width="900" height="600" fill={`url(#${p}-vignette)`} opacity="0.55" />
    </svg>
  );
}

function ClockworkScene({ flags, p }: SceneProps) {
  const open = Boolean(flags["hall-unlocked"]);
  const fixed = Boolean(flags["hall-clock"]);
  const grateOpen = Boolean(flags["hall-grate"]);
  const cabinetOpen = Boolean(flags["hall-cabinet"]);
  const screwTaken = Boolean(flags["taken:workbench"]);
  const gearTaken = Boolean(flags["hall-grate"]);

  return (
    <svg viewBox="0 0 900 600" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${p}-wall`} x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#16242a" />
          <stop offset="55%" stopColor="#0e181d" />
          <stop offset="100%" stopColor="#070b0f" />
        </linearGradient>
        <linearGradient id={`${p}-floor`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#141a1d" />
          <stop offset="100%" stopColor="#05070a" />
        </linearGradient>
        <linearGradient id={`${p}-brass`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1d48c" />
          <stop offset="50%" stopColor="#b1803b" />
          <stop offset="100%" stopColor="#5f421c" />
        </linearGradient>
        <linearGradient id={`${p}-door`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#363a3a" />
          <stop offset="55%" stopColor="#1b2021" />
          <stop offset="100%" stopColor="#0b0e10" />
        </linearGradient>
        <radialGradient id={`${p}-warm`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd58c" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#c58a3d" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0a0e12" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${p}-clockglow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe4a0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f5c45a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-opening`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c7e8ff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#7b9fb5" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={`${p}-vignette`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#030508" stopOpacity="0.85" />
          <stop offset="24%" stopColor="#030508" stopOpacity="0" />
          <stop offset="76%" stopColor="#030508" stopOpacity="0" />
          <stop offset="100%" stopColor="#030508" stopOpacity="0.85" />
        </linearGradient>
        <filter id={`${p}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id={`${p}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="900" height="600" fill={`url(#${p}-wall)`} />
      {/* wall beams */}
      <g fill="#0a0f12" opacity="0.8">
        <rect x="0" y="0" width="900" height="34" />
        <rect x="0" y="378" width="900" height="22" />
        {[80, 300, 600, 820].map((x) => <rect key={x} x={x} y="34" width="16" height="344" />)}
      </g>
      <g stroke="#2d3b3a" fill="none" opacity="0.4">
        <rect x="160" y="98" width="580" height="260" />
        <path d="M450 98 V358" />
        <path d="M160 228 H740" />
      </g>
      <rect y="400" width="900" height="200" fill={`url(#${p}-floor)`} />
      <g stroke="#26312f" opacity="0.45">
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M${450 + (i - 4) * 60} 400 L${450 + (i - 4) * 215} 600`} />
        ))}
        <path d="M0 448 H900" />
        <path d="M0 510 H900" opacity="0.7" />
        <path d="M0 570 H900" opacity="0.5" />
      </g>

      {/* hanging lights */}
      <g>
        <circle cx="450" cy="118" r="150" fill={`url(#${p}-warm)`} filter={`url(#${p}-blur)`} opacity="0.75" />
        <path d="M450 0 V64" stroke="#4c4433" strokeWidth="2" />
        <path d="M416 64 H484 L470 100 H430 Z" fill="#121a1c" stroke="#8d6e35" strokeWidth="2" />
        <rect x="432" y="100" width="36" height="16" rx="3" fill="#f5c45a" opacity="0.7" filter={`url(#${p}-glow)`} />
        <path d="M450 116 V138" stroke="#f5c45a" strokeWidth="1" opacity="0.35" />
        <g opacity="0.5" fill="none" stroke="#a58144">
          <path d="M300 40 a26 26 0 1 0 0.1 0" />
          <path d="M300 55 a11 11 0 1 1 0.1 0" />
          <path d="M610 26 a34 34 0 1 1 0.1 0" />
          <path d="M610 45 a15 15 0 1 0 0.1 0" />
        </g>
      </g>

      {/* portrait */}
      <g>
        <rect x="136" y="122" width="150" height="196" rx="3" fill="#3a2c18" />
        <rect x="146" y="132" width="130" height="176" fill="#161a17" />
        <ellipse cx="210" cy="188" rx="30" ry="38" fill="#2b2e25" />
        <path d="M158 306 C162 256 258 256 262 306 Z" fill="#20231d" />
        <path d="M182 160 C188 126 236 126 242 164 C232 144 192 142 182 160 Z" fill="#141711" />
        <path d="M188 210 q22 14 44 0" stroke="#5b5642" strokeWidth="1.6" fill="none" />
        <g fill={`url(#${p}-brass)`} opacity="0.7">
          <circle cx="140" cy="130" r="4" />
          <circle cx="282" cy="130" r="4" />
        </g>
        <rect x="158" y="316" width="108" height="12" rx="2" fill="#5e4828" />
      </g>

      {/* door */}
      <g>
        <path d="M314 492 V182 C314 118 364 76 450 76 C536 76 586 118 586 182 V492 Z" fill="#070909" />
        <path d="M330 492 V186 C330 128 374 92 450 92 C526 92 570 128 570 186 V492 Z" fill={`url(#${p}-door)`} />
        {open ? (
          <g>
            <path d="M344 492 V190 C344 138 382 106 450 106 C518 106 556 138 556 190 V492 Z" fill="#04070a" />
            <path d="M344 492 V190 C344 146 378 116 424 108 L424 492 Z" fill="#252b2b" opacity="0.9" />
            <path d="M424 108 C486 108 534 144 552 196 L552 492 H424 Z" fill={`url(#${p}-opening)`} opacity="0.35" />
            <path d="M448 492 L520 600 L670 600 L556 492 Z" fill="#c7e8ff" opacity="0.07" />
          </g>
        ) : (
          <g>
            <g fill="none" stroke="#495050" strokeWidth="1.5" opacity="0.45">
              <rect x="362" y="218" width="176" height="108" />
              <rect x="378" y="234" width="144" height="76" opacity="0.5" />
              <rect x="362" y="346" width="176" height="108" />
              <rect x="378" y="362" width="144" height="76" opacity="0.5" />
            </g>
            {/* missing handle plate */}
            <g>
              <rect x="524" y="300" width="20" height="34" rx="3" fill="#0e1213" stroke="#7f6234" strokeWidth="1.5" />
              <circle cx="530" cy="308" r="2" fill="#8d8a7c" />
              <circle cx="530" cy="326" r="2" fill="#8d8a7c" />
              <circle cx="538" cy="308" r="2" fill="#8d8a7c" />
              <circle cx="538" cy="326" r="2" fill="#8d8a7c" />
            </g>
            <path d="M330 186 C330 128 374 92 450 92 C526 92 570 128 570 186" fill="none" stroke="#5e4b2d" strokeWidth="3" opacity="0.5" />
          </g>
        )}
        <path d="M306 492 V180 C306 110 360 62 450 62 C540 62 594 110 594 180 V492" fill="none" stroke="#1c2222" strokeWidth="12" />
        <path d="M318 492 V182 C318 116 368 74 450 74 C532 74 582 116 582 182 V492" fill="none" stroke="#3c4746" strokeWidth="3" opacity="0.6" />
      </g>

      {/* grandfather clock */}
      <g>
        <ellipse cx="720" cy="210" rx="110" ry="130" fill={`url(#${p}-clockglow)`} opacity={fixed ? 0.55 : 0.12} filter={`url(#${p}-blur)`} />
        <path d="M662 492 V104 C662 82 680 66 704 60 H750 C774 66 792 82 792 104 V492 Z" fill="#24190f" />
        <path d="M674 492 V110 C674 92 688 80 708 74 H746 C766 80 780 92 780 110 V492 Z" fill="#382816" />
        <path d="M674 492 V110 C674 92 688 80 708 74 H746 C766 80 780 92 780 110 V492 Z" fill="none" stroke="#6d5028" strokeWidth="2" opacity="0.7" />
        {/* face */}
        <circle cx="727" cy="172" r="52" fill="#0c1011" stroke={`url(#${p}-brass)`} strokeWidth="4" />
        <circle cx="727" cy="172" r="43" fill="#111719" />
        <g stroke="#8e7a4e" strokeWidth="1" opacity="0.8">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <path key={i} d={`M${727 + Math.cos(a) * 34} ${172 + Math.sin(a) * 34} L${727 + Math.cos(a) * 39} ${172 + Math.sin(a) * 39}`} />;
          })}
        </g>
        <g stroke={fixed ? "#ffe2a0" : "#66706f"} strokeWidth="3" strokeLinecap="round" filter={fixed ? `url(#${p}-glow)` : undefined}>
          <path d="M727 172 L727 146" />
          <path d="M727 172 L748 183" />
        </g>
        <circle cx="727" cy="172" r="4" fill="#f5c45a" />
        {/* pendulum */}
        <rect x="692" y="250" width="70" height="150" rx="3" fill="#0d1112" stroke="#4c3b23" strokeWidth="1.5" />
        <g opacity="0.8">
          <path d="M727 260 V352" stroke="#b18a4b" strokeWidth="2" />
          <circle cx="727" cy="362" r="16" fill="none" stroke={`url(#${p}-brass)`} strokeWidth="4" />
        </g>
        {/* gears */}
        <g opacity="0.7">
          <circle cx="712" cy="430" r="18" fill="none" stroke="#8a6c39" strokeWidth="3" strokeDasharray="4 4" />
          <circle cx="736" cy="438" r="12" fill="none" stroke="#6f572d" strokeWidth="2" strokeDasharray="3 3" />
        </g>
        {fixed && (
          <g filter={`url(#${p}-glow)`} opacity="0.9">
            <circle cx="727" cy="172" r="47" fill="none" stroke="#f5c45a" strokeWidth="1" opacity="0.4" />
            <circle cx="727" cy="146" r="3" fill="#ffe6ac" />
          </g>
        )}
        <path d="M662 104 C662 82 680 66 704 60 H750 C774 66 792 82 792 104" fill="none" stroke={`url(#${p}-brass)`} strokeWidth="3" opacity="0.6" />
      </g>

      {/* symbol cabinet */}
      <g>
        <rect x="682" y="408" width="128" height="104" rx="3" fill="#2a1d11" />
        <rect x="692" y="418" width="108" height="84" fill={cabinetOpen ? "#080a0b" : "#18130d"} stroke="#6d522d" strokeWidth="2" />
        {cabinetOpen ? (
          <g>
            <path d="M692 418 L664 432 V528 L692 514 Z" fill="#2c1f12" stroke="#5b4326" strokeWidth="1.5" />
            <ellipse cx="746" cy="462" rx="34" ry="26" fill="#f5c45a" opacity="0.12" filter={`url(#${p}-blur)`} />
          </g>
        ) : (
          <g>
            {[0, 1, 2].map((row) =>
              [0, 1].map((col) => {
                const symbols = ["☾", "✦", "☀"];
                return (
                  <circle key={`${row}-${col}`} cx={714 + col * 64} cy={440 + row * 24} r="9" fill="#0b0d0d" stroke="#8a6b37" strokeWidth="1" opacity="0.8">
                    <title>{symbols[(row + col) % 3]}</title>
                  </circle>
                );
              }),
            )}
            <g fill="#c7a266" fontSize="9" textAnchor="middle" opacity="0.7">
              <text x="714" y="443">☾</text>
              <text x="778" y="443">✦</text>
              <text x="714" y="467">☀</text>
              <text x="778" y="467">☾</text>
              <text x="714" y="491">✦</text>
              <text x="778" y="491">☀</text>
            </g>
          </g>
        )}
      </g>

      {/* workbench */}
      <g>
        <path d="M94 414 H310 V436 H94 Z" fill="#33251a" />
        <path d="M112 436 V500 H132 V436 Z" fill="#241a12" />
        <path d="M272 436 V500 H292 V436 Z" fill="#241a12" />
        <rect x="150" y="398" width="46" height="16" rx="2" fill="#2c2f2c" stroke="#59615e" strokeWidth="1" />
        <g fill="#8b8d83" opacity="0.7">
          <circle cx="162" cy="406" r="5" />
          <circle cx="184" cy="406" r="5" />
        </g>
        {!screwTaken && (
          <g transform="translate(232 392) rotate(12)">
            <rect x="-18" y="-4" width="24" height="8" rx="3" fill="#573d20" />
            <path d="M6 0 H40" stroke="#b8b4a3" strokeWidth="3" />
            <path d="M40 0 l8 -2 v4 z" fill="#c8c4b2" />
            <path d="M-14 -2 v4 M-9 -2 v4 M-4 -2 v4" stroke="#2b1f11" strokeWidth="1" />
          </g>
        )}
        <g fill="#c2a56a" opacity="0.4">
          <circle cx="122" cy="408" r="2" />
          <circle cx="298" cy="405" r="1.6" />
        </g>
      </g>

      {/* floor grate */}
      <g>
        <ellipse cx="220" cy="524" rx="88" ry="30" fill="#050708" opacity="0.8" />
        <g transform={grateOpen ? "translate(-26 8) rotate(-8 220 524)" : undefined}>
          <rect x="160" y="508" width="120" height="34" rx="4" fill="#242b28" stroke="#776235" strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${172 + i * 24} 514 V536`} stroke="#4d5a52" strokeWidth="3" />
          ))}
          {[168, 272].map((x) => (
            <circle key={x} cx={x} cy={525} r="2.5" fill="#b09a66" />
          ))}
        </g>
        {grateOpen && (
          <g>
            <ellipse cx="220" cy="524" rx="56" ry="18" fill="#040606" />
            <path d="M182 522 q38 22 76 0" fill="none" stroke="#0c0f0f" strokeWidth="8" opacity="0.8" />
            {!gearTaken && (
              <g filter={`url(#${p}-glow)`}>
                <circle cx="220" cy="522" r="7" fill="none" stroke="#d7c28d" strokeWidth="2" strokeDasharray="3 2" />
              </g>
            )}
          </g>
        )}
      </g>

      {/* scattered blueprints */}
      <g fill="#c2c0ac" opacity="0.09">
        <path d="M390 548 l70 -14 l8 34 l-70 14 z" />
        <path d="M480 554 l48 -8 l6 26 l-48 8 z" />
      </g>

      <g fill="#ffe0a2">
        <circle cx="360" cy="240" r="1.2" opacity="0.4" />
        <circle cx="540" cy="300" r="1.5" opacity="0.35" />
        <circle cx="620" cy="210" r="1" opacity="0.3" />
      </g>

      <rect width="900" height="600" fill={`url(#${p}-vignette)`} opacity="0.5" />
    </svg>
  );
}

function ObservatoryScene({ flags, p }: SceneProps) {
  const open = Boolean(flags["observatory-unlocked"]);
  const lensFixed = Boolean(flags["observatory-lens"]);
  const lensTaken = Boolean(flags["taken:desk"]);

  return (
    <svg viewBox="0 0 900 600" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${p}-wall`} x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#171c38" />
          <stop offset="52%" stopColor="#0d1226" />
          <stop offset="100%" stopColor="#060914" />
        </linearGradient>
        <linearGradient id={`${p}-sky`} x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#0f1a44" />
          <stop offset="45%" stopColor="#251a56" />
          <stop offset="100%" stopColor="#080d22" />
        </linearGradient>
        <linearGradient id={`${p}-brass`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4d995" />
          <stop offset="52%" stopColor="#b98d45" />
          <stop offset="100%" stopColor="#5c411c" />
        </linearGradient>
        <linearGradient id={`${p}-door`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a3251" />
          <stop offset="55%" stopColor="#151c33" />
          <stop offset="100%" stopColor="#090d19" />
        </linearGradient>
        <radialGradient id={`${p}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3cf" />
          <stop offset="45%" stopColor="#dfc489" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#dfc489" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-beaml`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a5c8ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a5c8ff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${p}-warm`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd88e" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffd88e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-vignette`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#03050c" stopOpacity="0.9" />
          <stop offset="24%" stopColor="#03050c" stopOpacity="0" />
          <stop offset="76%" stopColor="#03050c" stopOpacity="0" />
          <stop offset="100%" stopColor="#03050c" stopOpacity="0.9" />
        </linearGradient>
        <filter id={`${p}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${p}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <rect width="900" height="600" fill={`url(#${p}-wall)`} />
      {/* dome */}
      <path d="M0 0 H900 V320 C760 250 600 218 450 218 C300 218 140 250 0 320 Z" fill="#0a0f20" />
      <g fill="none" stroke="#28334f" strokeWidth="2" opacity="0.55">
        <path d="M0 300 C160 240 300 210 450 210 C600 210 740 240 900 300" />
        <path d="M60 270 C210 200 320 172 450 172 C580 172 690 200 840 270" opacity="0.5" />
        <path d="M450 0 V210" />
        <path d="M180 0 L320 214" />
        <path d="M720 0 L580 214" opacity="0.7" />
        <path d="M0 120 C180 56 300 40 450 40 C600 40 720 56 900 120" opacity="0.35" />
      </g>
      {/* sky aperture */}
      <g>
        <path d="M290 0 H610 V184 C530 156 372 156 290 184 Z" fill={`url(#${p}-sky)`} />
        <path d="M290 -10 H610 V190 C530 162 372 162 290 190 Z" fill="none" stroke="#42527e" strokeWidth="4" opacity="0.6" />
        <circle cx="534" cy="64" r="52" fill={`url(#${p}-moon)`} opacity="0.55" />
        <circle cx="534" cy="64" r="24" fill="#f4e8c4" opacity="0.6" />
        <circle cx="526" cy="58" r="20" fill="#101733" opacity="0.8" />
        <g fill="#e7ecff">
          {[
            [330, 42, 1.6], [356, 96, 1], [382, 30, 1.2], [422, 74, 1], [466, 36, 1.4],
            [502, 108, 1], [566, 124, 1.2], [588, 48, 1.5], [612, 140, 0.9], [404, 146, 1.1],
            [316, 132, 0.8], [548, 22, 1],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} opacity={0.3 + (i % 4) * 0.15} />
          ))}
        </g>
        <g stroke="#9fb8e8" strokeWidth="0.8" opacity="0.35" fill="none">
          <path d="M330 42 L382 30 L422 74 L466 36 L502 108" />
          <path d="M502 108 L548 22 L588 48 L612 140" />
        </g>
      </g>

      {/* walls / floor */}
      <path d="M0 326 C150 258 310 228 450 228 C590 228 750 258 900 326 V600 H0 Z" fill={`url(#${p}-wall)`} />
      <g stroke="#28324c" fill="none" opacity="0.45">
        <path d="M0 330 C160 262 310 232 450 232 C590 232 740 262 900 330" strokeWidth="3" />
        <path d="M0 350 C160 284 310 252 450 252 C590 252 740 284 900 350" />
        <path d="M0 450 H900" opacity="0.5" />
      </g>
      <ellipse cx="450" cy="552" rx="330" ry="74" fill="#080c18" />
      <ellipse cx="450" cy="548" rx="264" ry="54" fill="none" stroke="#354160" strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="450" cy="548" rx="178" ry="34" fill="none" stroke="#354160" strokeWidth="1" opacity="0.4" />
      <g stroke="#354160" strokeWidth="1" opacity="0.3">
        <path d="M450 474 V600" />
        <path d="M300 530 H600" />
        <path d="M250 560 H650" />
      </g>

      {/* star chart */}
      <g>
        <rect x="94" y="128" width="186" height="202" rx="3" fill="#0d1324" stroke="#42527a" strokeWidth="2" />
        <rect x="104" y="138" width="166" height="182" fill="#0a1020" />
        <g stroke="#7090c4" strokeWidth="0.8" opacity="0.5">
          <path d="M116 290 L160 258 L206 274 L248 214" fill="none" />
          <path d="M174 162 L206 274 L154 320" fill="none" opacity="0.5" />
          <path d="M132 234 L206 218 L242 252" fill="none" opacity="0.4" />
        </g>
        <g fill="#d7e6ff" filter={`url(#${p}-glow)`} opacity="0.8">
          <circle cx="116" cy="290" r="2" />
          <circle cx="160" cy="258" r="1.6" />
          <circle cx="206" cy="274" r="2.2" />
          <circle cx="248" cy="214" r="1.5" />
          <circle cx="174" cy="162" r="1.3" />
          <circle cx="132" cy="234" r="1.2" />
        </g>
        <g fill="#7b8cb5" opacity="0.55">
          <rect x="118" y="316" width="42" height="2" />
          <rect x="118" y="324" width="70" height="2" />
        </g>
        <path d="M94 128 l-8 -10 h202 l-8 10 z" fill="#1b2842" />
        <circle cx="100" cy="135" r="2.5" fill={`url(#${p}-brass)`} />
        <circle cx="274" cy="135" r="2.5" fill={`url(#${p}-brass)`} />
        <g stroke="#5f7cab" strokeWidth="1" opacity="0.5">
          <path d="M246 138 v-6 h18 v6" fill="none" />
        </g>
      </g>

      {/* door */}
      <g>
        <circle cx="450" cy="338" r="134" fill={`url(#${p}-warm)`} opacity={open ? 0.4 : 0.1} filter={`url(#${p}-blur)`} />
        <ellipse cx="450" cy="340" rx="116" ry="124" fill="#080c16" stroke="#3f4b6b" strokeWidth="10" />
        <ellipse cx="450" cy="340" rx="103" ry="112" fill={`url(#${p}-door)`} stroke="#59678c" strokeWidth="2" />
        {open ? (
          <g>
            <ellipse cx="450" cy="340" rx="92" ry="101" fill="#060b1a" />
            <ellipse cx="450" cy="340" rx="92" ry="101" fill={`url(#${p}-sky)`} opacity="0.9" />
            <g fill="#dbe8ff" opacity="0.9" filter={`url(#${p}-glow)`}>
              <circle cx="414" cy="300" r="1.6" />
              <circle cx="470" cy="280" r="1.3" />
              <circle cx="496" cy="330" r="1.8" />
              <circle cx="438" cy="352" r="1.2" />
              <circle cx="478" cy="386" r="1.5" />
            </g>
            <ellipse cx="450" cy="340" rx="92" ry="101" fill="none" stroke={`url(#${p}-brass)`} strokeWidth="3" opacity="0.7" />
            <path d="M450 440 V560 L590 590 L600 500 Z" fill="#a5c8ff" opacity="0.07" />
          </g>
        ) : (
          <g>
            <g fill="none" stroke="#55648a" strokeWidth="2" opacity="0.7">
              <ellipse cx="450" cy="340" rx="78" ry="84" />
              <ellipse cx="450" cy="340" rx="54" ry="58" />
              <ellipse cx="450" cy="340" rx="30" ry="33" />
            </g>
            {/* dial rings */}
            <g fill={`url(#${p}-brass)`}>
              {Array.from({ length: 12 }).map((_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return <circle key={i} cx={450 + Math.cos(a) * 96} cy={340 + Math.sin(a) * 103} r="4" opacity="0.8" />;
              })}
            </g>
            <g stroke={`url(#${p}-brass)`} strokeWidth="3" strokeLinecap="round" opacity="0.9">
              <path d="M450 340 L450 282" />
              <path d="M450 340 L502 366" />
              <path d="M450 340 L402 382" />
            </g>
            <circle cx="450" cy="340" r="11" fill={`url(#${p}-brass)`} />
            <circle cx="450" cy="340" r="4" fill="#1c2436" />
            <g fill="#a8b4d0" fontSize="9" fontFamily="Sora, sans-serif" opacity="0.6" textAnchor="middle">
              <text x="450" y="256">7</text>
              <text x="546" y="344">2</text>
              <text x="450" y="438">9</text>
            </g>
          </g>
        )}
        <g fill="#59678c" opacity="0.7">
          <circle cx="336" cy="338" r="3" />
          <circle cx="564" cy="338" r="3" />
          <circle cx="450" cy="222" r="3" />
          <circle cx="450" cy="456" r="3" />
        </g>
      </g>

      {/* telescope */}
      <g>
        <ellipse cx="692" cy="452" rx="90" ry="20" fill="#02040a" opacity="0.6" />
        <g stroke="#5f4b2b" strokeWidth="6" strokeLinecap="round">
          <path d="M692 448 L650 522" />
          <path d="M692 448 L730 522" />
          <path d="M692 448 L700 528" />
        </g>
        <g transform="rotate(-32 692 386)">
          <rect x="610" y="368" width="190" height="36" rx="18" fill="#202a44" stroke={`url(#${p}-brass)`} strokeWidth="3" />
          <rect x="596" y="360" width="34" height="52" rx="8" fill="#2b3858" stroke={`url(#${p}-brass)`} strokeWidth="2.5" />
          <rect x="790" y="374" width="26" height="24" rx="6" fill="#131b2e" stroke="#957338" strokeWidth="2" />
          <rect x="690" y="354" width="18" height="10" rx="3" fill="#b99752" opacity="0.8" />
          <circle cx="618" cy="386" r="9" fill="#0b1220" stroke={`url(#${p}-brass)`} strokeWidth="2" />
          {lensFixed && (
            <circle cx="618" cy="386" r="5" fill="#9fc6ff" opacity="0.9" filter={`url(#${p}-glow)`} />
          )}
        </g>
        <g fill="#7f6233" opacity="0.6">
          <rect x="672" y="430" width="40" height="8" rx="2" />
        </g>
      </g>

      {/* map table */}
      <g>
        <path d="M84 410 H306 V432 H84 Z" fill="#24293a" />
        <path d="M100 432 V512 H120 V432 Z" fill="#181d2b" />
        <path d="M272 432 V512 H292 V432 Z" fill="#181d2b" />
        <g fill="#b9c1d4" opacity="0.14">
          <path d="M142 388 l64 -8 l6 32 l-64 8 z" />
          <path d="M214 392 l54 -4 l5 24 l-54 4 z" />
        </g>
        <g stroke="#8aa0c9" strokeWidth="0.8" opacity="0.35">
          <path d="M150 404 l26 -8 l18 12 l20 -16" fill="none" />
          <circle cx="150" cy="404" r="1.5" />
          <circle cx="194" cy="392" r="1.5" />
        </g>
        <rect x="150" y="432" width="42" height="12" rx="2" fill="#2b3248" />
        {!lensTaken ? (
          <g>
            <rect x="206" y="430" width="48" height="16" rx="4" fill="#2b3350" stroke="#5e6b90" strokeWidth="1" />
            <circle cx="230" cy="438" r="5" fill="#9fc0ea" opacity="0.7" />
          </g>
        ) : (
          <rect x="206" y="433" width="48" height="8" rx="3" fill="#151a28" />
        )}
        <g transform="translate(264 396)">
          <rect x="-12" y="0" width="24" height="14" rx="3" fill="#2a3550" />
          <path d="M-6 6 h12" stroke="#c7a45d" strokeWidth="2" />
        </g>
      </g>

      {/* armillary sphere */}
      <g>
        <ellipse cx="756" cy="548" rx="64" ry="16" fill="#02040a" opacity="0.65" />
        <path d="M756 540 V468" stroke="#8f6e37" strokeWidth="5" />
        <path d="M724 548 H788" stroke="#6f5528" strokeWidth="4" />
        <g transform="translate(756 442)" fill="none" stroke={`url(#${p}-brass)`} strokeWidth="2.5" opacity="0.9">
          <ellipse rx="54" ry="34" transform="rotate(-18)" />
          <ellipse rx="34" ry="54" transform="rotate(24)" />
          <ellipse rx="48" ry="48" />
          <ellipse rx="20" ry="20" opacity="0.6" />
          <path d="M-62 0 H62" opacity="0.4" />
        </g>
        <circle cx="756" cy="442" r="5" fill="#f5c45a" filter={`url(#${p}-glow)`} />
      </g>

      {/* floor stars */}
      <g fill="#ffe5a0" opacity="0.5">
        <circle cx="380" cy="500" r="1.2" />
        <circle cx="520" cy="540" r="1" />
        <circle cx="344" cy="562" r="1.4" />
        <circle cx="610" cy="516" r="1" />
      </g>

      <rect width="900" height="600" fill={`url(#${p}-vignette)`} opacity="0.55" />
    </svg>
  );
}

export function RoomScene({
  roomId,
  flags,
  className = "",
}: {
  roomId: RoomId;
  flags: Record<string, boolean>;
  className?: string;
}) {
  const raw = useId();
  const p = raw.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <div className={className}>
      {roomId === "study" && <StudyScene flags={flags} p={p} />}
      {roomId === "clockwork" && <ClockworkScene flags={flags} p={p} />}
      {roomId === "observatory" && <ObservatoryScene flags={flags} p={p} />}
    </div>
  );
}
