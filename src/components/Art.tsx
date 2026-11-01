import { useId } from "react";

function ids(raw: string) {
  return raw.replace(/[^a-zA-Z0-9]/g, "");
}

/** Alpine dusk: a single rider on the last ridge, valley already in shadow. */
export function CycleCardArt({ className = "" }: { className?: string }) {
  const id = ids(useId());
  const pines = Array.from({ length: 26 }, (_, i) => {
    const x = 40 + i * 62 + ((i * 37) % 23);
    const h = 34 + ((i * 53) % 46);
    return { x, h, w: h * 0.3 };
  });

  return (
    <svg viewBox="0 0 1600 900" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1118" />
          <stop offset="0.42" stopColor="#1d2b33" />
          <stop offset="0.72" stopColor="#6b5b4c" />
          <stop offset="1" stopColor="#b98a5c" />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffe3ad" stopOpacity="0.95" />
          <stop offset="0.18" stopColor="#f5c584" stopOpacity="0.8" />
          <stop offset="0.52" stopColor="#d99a5c" stopOpacity="0.24" />
          <stop offset="1" stopColor="#a4653a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d8a8f" />
          <stop offset="0.55" stopColor="#4d5a60" />
          <stop offset="1" stopColor="#2d3840" />
        </linearGradient>
        <linearGradient id={`${id}-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26333a" />
          <stop offset="1" stopColor="#131a1f" />
        </linearGradient>
        <linearGradient id={`${id}-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10161a" />
          <stop offset="1" stopColor="#070a0c" />
        </linearGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#caa079" stopOpacity="0" />
          <stop offset="0.55" stopColor="#c79a73" stopOpacity="0.2" />
          <stop offset="1" stopColor="#c79a73" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-road`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e8c79b" stopOpacity="0.1" />
          <stop offset="0.4" stopColor="#f3d4a8" stopOpacity="0.85" />
          <stop offset="1" stopColor="#b58a5e" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id={`${id}-vignette`} cx="46%" cy="48%" r="72%">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.72" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill={`url(#${id}-sky)`} />
      <ellipse cx="1010" cy="596" rx="540" ry="360" fill={`url(#${id}-sun)`} />
      <circle cx="1010" cy="596" r="42" fill="#ffe6b4" opacity="0.92" />

      {/* thin weather bands */}
      <g opacity="0.28" fill="none" stroke="#e2c8a6" strokeWidth="1">
        <path d="M-40 300 C360 276 660 318 1040 296 C1260 282 1460 306 1640 292" />
        <path d="M-40 342 C330 322 700 356 1100 332 C1320 318 1470 340 1640 326" opacity="0.6" />
        <path d="M-40 246 C400 230 780 260 1180 244" opacity="0.4" />
      </g>

      {/* far snow ridge */}
      <path
        d="M0 622 L120 548 L214 588 L330 470 L438 566 L520 506 L610 596 L726 486 L806 552 L900 452 L996 560 L1086 494 L1194 588 L1300 516 L1410 580 L1510 512 L1600 566 L1600 900 L0 900 Z"
        fill={`url(#${id}-far)`}
      />
      <g fill="#d9e0e2" opacity="0.5">
        <path d="M300 497 L330 470 L360 500 L344 492 L330 508 L316 490 Z" />
        <path d="M700 512 L726 486 L752 518 L738 508 L726 522 L712 506 Z" />
        <path d="M878 478 L900 452 L922 482 L908 474 L900 490 L888 472 Z" />
        <path d="M1484 532 L1510 512 L1534 538 L1520 530 L1510 544 L1498 528 Z" />
      </g>

      <rect y="520" width="1600" height="250" fill={`url(#${id}-haze)`} />

      {/* mid ridge with pines */}
      <path
        d="M0 704 C150 668 282 690 410 660 C548 628 654 668 782 642 C930 612 1052 668 1190 638 C1330 608 1470 654 1600 626 L1600 900 L0 900 Z"
        fill={`url(#${id}-mid)`}
      />
      <g fill="#0d1316" opacity="0.9">
        {pines.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${688 + (i % 4) * 9})`}>
            <path d={`M0 0 L${p.w} ${p.h} L${-p.w} ${p.h} Z`} />
          </g>
        ))}
      </g>

      {/* valley shadow */}
      <path d="M0 760 C240 722 420 748 640 724 C880 698 1100 742 1320 712 C1450 694 1528 708 1600 698 L1600 900 L0 900 Z" fill={`url(#${id}-near)`} />

      {/* the road: one bright switchback cut into the near ridge */}
      <path
        d="M-30 900 C170 862 312 812 470 792 C650 768 780 742 940 716 C1090 692 1210 674 1360 648 C1460 630 1540 620 1630 604"
        fill="none"
        stroke="#15100c"
        strokeWidth="26"
        opacity="0.6"
      />
      <path
        d="M-30 900 C170 862 312 812 470 792 C650 768 780 742 940 716 C1090 692 1210 674 1360 648 C1460 630 1540 620 1630 604"
        fill="none"
        stroke={`url(#${id}-road)`}
        strokeWidth="3"
      />
      <g stroke="#ffe1b4" strokeWidth="2" opacity="0.35">
        {[300, 560, 820, 1080, 1330, 1520].map((x, i) => (
          <path key={x} d={`M${x} ${i < 2 ? 812 - i * 14 : 760 - i * 24} v-14`} />
        ))}
      </g>

      {/* rider, rim-lit by the last light */}
      <g transform="translate(900 722) scale(1.18)">
        <ellipse cx="8" cy="2" rx="104" ry="9" fill="#000" opacity="0.5" />
        <g fill="none" stroke="#07090a" strokeLinecap="round">
          <circle cx="-46" cy="-30" r="30" strokeWidth="6" />
          <circle cx="64" cy="-30" r="30" strokeWidth="6" />
          <path d="M-46 -30 L-6 -34 L-16 -62 M-6 -34 L42 -52 L64 -30 M-16 -62 L42 -52 M-6 -34 L-22 -6" strokeWidth="4" />
          <path d="M-46 -30 L-20 -10 L-6 -34" strokeWidth="3" opacity="0.8" />
        </g>
        <g fill="#0a0d0f" stroke="#eac28a" strokeWidth="1.5" strokeOpacity="0.65">
          {/* torso, hips on the saddle, shoulders forward over the bar */}
          <path d="M-22 -60 C-18 -76 -4 -88 12 -92 C28 -96 38 -88 40 -76 L32 -62 L-8 -54 Z" />
          {/* head and helmet */}
          <circle cx="34" cy="-104" r="13" />
          <path d="M23 -108 C25 -120 43 -122 48 -111 L45 -103 Z" />
          <path d="M46 -104 C52 -104 56 -100 56 -96 L44 -94 Z" fill="#0a0d0f" />
          {/* backpack */}
          <path d="M-14 -84 C-24 -82 -28 -72 -24 -62 L-12 -60 L-6 -78 Z" fill="#0a0d0f" />
          {/* arm to the bar */}
          <path d="M30 -84 C38 -78 44 -70 46 -62" fill="none" strokeWidth="8" strokeLinecap="round" />
          {/* legs driving the cranks */}
          <path d="M-8 -58 C4 -46 6 -32 -2 -16 L-18 -4" fill="none" strokeWidth="9" strokeLinecap="round" />
          <path d="M-2 -60 C8 -52 16 -40 12 -22 L2 -8" fill="none" strokeWidth="9" strokeLinecap="round" />
        </g>
        <path d="M23 -110 C27 -122 43 -124 50 -112" fill="none" stroke="#ffe0b0" strokeWidth="1.2" opacity="0.65" />
        <path d="M-18 -78 C-6 -86 8 -90 20 -88" fill="none" stroke="#ffe0b0" strokeWidth="1" opacity="0.35" />
      </g>

      {/* foreground grass */}
      <g stroke="#07090a" strokeWidth="3" fill="none" opacity="0.9">
        {Array.from({ length: 42 }, (_, i) => {
          const x = i * 40 + ((i * 17) % 13);
          const h = 16 + ((i * 29) % 34);
          return <path key={i} d={`M${x} 900 q${i % 2 ? 6 : -6} -${h} ${i % 2 ? 16 : -14} -${h + 10}`} />;
        })}
      </g>

      <rect width="1600" height="900" fill={`url(#${id}-vignette)`} />
    </svg>
  );
}

/** Rain on the rooftops: one courier, one gap, a city that never looks up. */
export function RunnerCardArt({ className = "" }: { className?: string }) {
  const id = ids(useId());
  const farWindows = Array.from({ length: 70 }, (_, i) => ({
    x: 30 + ((i * 173) % 1540),
    y: 300 + ((i * 47) % 300),
    w: i % 7 === 0 ? 7 : 4,
    h: i % 5 === 0 ? 9 : 6,
    amber: i % 3 === 0,
  }));
  const nearWindows = Array.from({ length: 38 }, (_, i) => ({
    x: 40 + ((i * 211) % 1520),
    y: 470 + ((i * 37) % 210),
    w: 5,
    h: 7,
    amber: i % 4 !== 0,
  }));

  return (
    <svg viewBox="0 0 1600 900" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05080d" />
          <stop offset="0.5" stopColor="#0c1420" />
          <stop offset="0.82" stopColor="#1a2531" />
          <stop offset="1" stopColor="#2d3741" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#dfeaf6" stopOpacity="0.9" />
          <stop offset="0.24" stopColor="#aebfd2" stopOpacity="0.35" />
          <stop offset="1" stopColor="#8aa3bd" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2834" />
          <stop offset="1" stopColor="#0d151d" />
        </linearGradient>
        <linearGradient id={`${id}-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1117" />
          <stop offset="1" stopColor="#05080b" />
        </linearGradient>
        <linearGradient id={`${id}-roof`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#202a33" />
          <stop offset="0.1" stopColor="#101820" />
          <stop offset="1" stopColor="#070b10" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#cfe0ef" stopOpacity="0.16" />
          <stop offset="1" stopColor="#cfe0ef" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-vignette`} cx="54%" cy="42%" r="70%">
          <stop offset="0.42" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.78" />
        </radialGradient>
        <radialGradient id={`${id}-lamp`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffc87a" stopOpacity="0.8" />
          <stop offset="0.4" stopColor="#f4a95c" stopOpacity="0.22" />
          <stop offset="1" stopColor="#f4a95c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill={`url(#${id}-sky)`} />
      <circle cx="1180" cy="168" r="290" fill={`url(#${id}-moon)`} />
      <circle cx="1180" cy="168" r="26" fill="#e6eef7" opacity="0.8" />
      <g fill="#dbe7f2" opacity="0.55">
        {Array.from({ length: 30 }, (_, i) => (
          <circle key={i} cx={70 + ((i * 127) % 1460)} cy={60 + ((i * 71) % 290)} r={i % 5 === 0 ? 1.6 : 1} />
        ))}
      </g>

      {/* far city */}
      <g fill={`url(#${id}-far)`}>
        <path d="M0 640 L0 470 L84 470 L84 522 L150 522 L150 430 L232 430 L232 560 L318 560 L318 500 L400 500 L400 590 L486 590 L486 444 L570 444 L570 536 L660 536 L660 486 L742 486 L742 600 L830 600 L830 452 L916 452 L916 540 L1006 540 L1006 492 L1090 492 L1090 570 L1180 570 L1180 420 L1264 420 L1264 530 L1352 530 L1352 476 L1440 476 L1440 560 L1524 560 L1524 438 L1600 438 L1600 640 Z" />
      </g>
      <g>
        {farWindows.map((w, i) => (
          <rect
            key={i}
            x={w.x}
            y={w.y}
            width={w.w}
            height={w.h}
            fill={w.amber ? "#c79a5e" : "#7d9cb4"}
            opacity={w.amber ? 0.55 : 0.3}
          />
        ))}
      </g>

      {/* near skyline */}
      <g fill={`url(#${id}-near)`}>
        <path d="M0 900 L0 620 L120 620 L120 570 L210 570 L210 690 L330 690 L330 610 L420 610 L420 660 L560 660 L560 590 L650 590 L650 700 L800 700 L800 630 L900 630 L900 690 L1040 690 L1040 600 L1150 600 L1150 680 L1300 680 L1300 590 L1400 590 L1400 650 L1500 650 L1500 600 L1600 600 L1600 900 Z" />
      </g>
      <g>
        {nearWindows.map((w, i) => (
          <rect
            key={i}
            x={w.x}
            y={w.y}
            width={w.w}
            height={w.h}
            fill={w.amber ? "#e0a862" : "#7fa6c4"}
            opacity={w.amber ? 0.55 : 0.22}
          />
        ))}
      </g>

      {/* industrial rooftop details */}
      <g stroke="#05080b" fill="#0a1016">
        <path d="M1320 600 L1320 540 L1360 540 L1360 600 Z" />
        <path d="M1368 600 L1368 556 L1420 556 L1420 600 Z" />
        <path d="M240 590 L240 550 L286 550 L286 590 Z" />
        <path d="M1052 630 L1052 570 M1052 570 L1086 552 M1052 570 L1018 552" fill="none" stroke="#0a1016" strokeWidth="4" />
      </g>

      {/* rooftop in the foreground, split by a gap */}
      <path d="M0 900 L0 742 L600 742 L600 900 Z" fill={`url(#${id}-roof)`} />
      <path d="M760 900 L760 726 L1600 726 L1600 900 Z" fill={`url(#${id}-roof)`} />
      <g stroke="#3a4650" strokeWidth="2" opacity="0.45">
        <path d="M0 742 L600 742 M760 726 L1600 726" />
        <path d="M48 742 L48 900 M160 742 L160 900 M300 742 L300 900 M470 742 L470 900" opacity="0.3" />
        <path d="M840 726 L840 900 M1040 726 L1040 900 M1240 726 L1240 900 M1460 726 L1460 900" opacity="0.3" />
      </g>

      {/* city glow through the gap */}
      <rect x="600" y="726" width="160" height="174" fill="#0b1119" />
      <ellipse cx="680" cy="838" rx="150" ry="90" fill={`url(#${id}-lamp)`} opacity="0.35" />

      {/* neon practicals, amber + cold only */}
      <g>
        <rect x="1046" y="540" width="92" height="4" fill="#d8a461" opacity="0.65" />
        <ellipse cx="1092" cy="548" rx="80" ry="40" fill={`url(#${id}-lamp)`} opacity="0.45" />
        <rect x="150" y="642" width="44" height="3" fill="#8fb3cc" opacity="0.5" />
      </g>

      {/* volumetric light and rain */}
      <path d="M1180 194 L1000 900 L1600 900 L1600 260 Z" fill={`url(#${id}-beam)`} />
      <g stroke="#c8d8e6" strokeWidth="1.4" opacity="0.18">
        {Array.from({ length: 46 }, (_, i) => (
          <path key={i} d={`M${-60 + i * 38} ${-20 + ((i * 31) % 120)} l-26 190`} />
        ))}
      </g>

      {/* the runner, caught between roofs */}
      <g transform="translate(1040 726) scale(1.18)">
        <ellipse cx="-20" cy="6" rx="86" ry="8" fill="#000" opacity="0.45" />
        <g stroke="#05070a" strokeLinecap="round" strokeLinejoin="round">
          {/* trailing leg */}
          <path d="M-8 -34 C-26 -26 -42 -14 -52 2 L-64 4" fill="none" strokeWidth="13" />
          {/* driving leg */}
          <path d="M0 -36 C18 -28 30 -16 40 -2 L54 0" fill="none" strokeWidth="13" />
          {/* torso */}
          <path d="M-14 -38 C-8 -54 2 -76 18 -88 L30 -78 C18 -66 8 -48 4 -36 Z" fill="#05070a" />
          {/* hood and head */}
          <path d="M14 -88 C18 -104 36 -112 48 -102 C58 -94 58 -80 50 -72 L32 -70 L18 -78 Z" fill="#05070a" />
          <path d="M20 -92 C26 -108 44 -114 54 -104" fill="none" strokeWidth="14" />
          {/* arms */}
          <path d="M22 -80 C36 -74 44 -64 46 -52" fill="none" strokeWidth="10" />
          <path d="M12 -70 C2 -62 -8 -56 -18 -54" fill="none" strokeWidth="9" />
        </g>
        {/* coat tails */}
        <path d="M-10 -40 C-32 -34 -48 -42 -56 -58 C-44 -60 -34 -56 -26 -50 C-22 -44 -16 -40 -10 -40 Z" fill="#06080b" stroke="#8fb3cc" strokeWidth="1" strokeOpacity="0.22" />
        <path d="M-8 -36 C-28 -24 -40 -10 -48 2 C-32 0 -20 -8 -8 -20 Z" fill="#06080b" opacity="0.9" />
        <path d="M20 -92 C26 -108 44 -114 54 -104 C64 -94 62 -78 50 -72" fill="none" stroke="#d5e4f0" strokeWidth="1.5" opacity="0.6" />
        <path d="M-14 -38 C-6 -58 4 -76 18 -88" fill="none" stroke="#c79a5e" strokeWidth="1.2" opacity="0.3" />
      </g>

      {/* rain in the foreground, wet edge highlights */}
      <g stroke="#b9cbd9" strokeWidth="2" opacity="0.26">
        {Array.from({ length: 24 }, (_, i) => (
          <path key={i} d={`M${i * 70} 640 l-14 120`} />
        ))}
      </g>
      <rect width="1600" height="900" fill={`url(#${id}-vignette)`} />
    </svg>
  );
}

/** A study at midnight: the door is lit, the room is not. */
export function RoomCardArt({ className = "" }: { className?: string }) {
  const id = ids(useId());
  return (
    <svg viewBox="0 0 1600 900" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17120d" />
          <stop offset="0.55" stopColor="#100d0a" />
          <stop offset="1" stopColor="#080706" />
        </linearGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c1510" />
          <stop offset="1" stopColor="#0a0807" />
        </linearGradient>
        <linearGradient id={`${id}-door`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2414" />
          <stop offset="0.45" stopColor="#2a1a10" />
          <stop offset="1" stopColor="#180f09" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#d8e4ee" stopOpacity="0.8" />
          <stop offset="0.35" stopColor="#9fb6c8" stopOpacity="0.3" />
          <stop offset="1" stopColor="#7f98aa" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#d6e4ef" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="#c3d6e4" stopOpacity="0.1" />
          <stop offset="1" stopColor="#c3d6e4" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-key`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd98f" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#eab45f" stopOpacity="0.32" />
          <stop offset="1" stopColor="#d4903c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-vignette`} cx="50%" cy="46%" r="72%">
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.82" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill={`url(#${id}-wall)`} />

      {/* wall panels */}
      <g stroke="#2a2118" strokeWidth="2" opacity="0.4">
        <rect x="70" y="120" width="430" height="560" fill="none" />
        <rect x="1080" y="150" width="450" height="522" fill="none" />
        <path d="M70 120 L500 120 M1080 150 L1530 150" />
      </g>

      {/* moonlight window, camera left */}
      <g>
        <ellipse cx="330" cy="290" rx="330" ry="300" fill={`url(#${id}-moon)`} />
        <rect x="214" y="128" width="236" height="348" fill="#0d1419" stroke="#40382c" strokeWidth="6" />
        <rect x="226" y="140" width="212" height="324" fill="#162029" />
        <path d="M226 302 L438 302 M332 140 L332 464" stroke="#0a0d10" strokeWidth="8" />
        <rect x="226" y="140" width="212" height="324" fill="#c9dceb" opacity="0.06" />
        <path d="M438 302 L670 760 L1240 760 L1240 540 Z" fill={`url(#${id}-beam)`} />
        <g fill="#d9e6f0" opacity="0.3">
          {Array.from({ length: 18 }, (_, i) => (
            <circle key={i} cx={330 + ((i * 67) % 420)} cy={360 + ((i * 61) % 300)} r={i % 4 === 0 ? 1.8 : 1} />
          ))}
        </g>
      </g>

      {/* floor */}
      <rect y="690" width="1600" height="210" fill={`url(#${id}-floor)`} />
      <g stroke="#3a2c1f" strokeWidth="1" opacity="0.3">
        <path d="M0 742 L1600 742 M0 806 L1600 806 M0 868 L1600 868" />
        <path d="M220 690 L120 900 M540 690 L480 900 M1060 690 L1120 900 M1380 690 L1480 900" opacity="0.5" />
      </g>

      {/* door */}
      <g>
        <path d="M600 760 L600 300 C600 210 690 150 800 150 C910 150 1000 210 1000 300 L1000 760 Z" fill="#0b0806" stroke="#3d2b1a" strokeWidth="10" />
        <path d="M632 748 L632 306 C632 232 708 182 800 182 C892 182 968 232 968 306 L968 748 Z" fill={`url(#${id}-door)`} stroke="#5a4027" strokeWidth="3" />
        <path d="M660 748 L660 312 C660 254 722 214 800 214 C878 214 940 254 940 312 L940 748 Z" fill="none" stroke="#6f5030" strokeWidth="2" opacity="0.55" />
        <g fill="none" stroke="#4c3520" strokeWidth="2" opacity="0.65">
          <rect x="690" y="330" width="220" height="180" />
          <rect x="718" y="358" width="164" height="124" />
          <rect x="690" y="548" width="220" height="160" />
        </g>
        <circle cx="800" cy="284" r="10" fill="#c9974a" opacity="0.85" />
        <g>
          <ellipse cx="800" cy="512" rx="150" ry="120" fill={`url(#${id}-key)`} />
          <path d="M800 484 C814 484 824 496 824 510 C824 522 816 532 806 535 L806 552 L794 552 L794 535 C784 532 776 522 776 510 C776 496 786 484 800 484 Z" fill="#f2c37a" />
          <circle cx="800" cy="509" r="7" fill="#20150b" />
          <rect x="794" y="535" width="12" height="20" fill="#20150b" opacity="0.65" />
        </g>
      </g>

      {/* console and clock to the right of the door */}
      <g>
        <rect x="1032" y="300" width="96" height="220" fill="#120d09" stroke="#3a2b1d" strokeWidth="3" />
        <rect x="1046" y="314" width="68" height="58" fill="#1c2733" />
        <g fill="#6e8b9e" opacity="0.7">
          <rect x="1056" y="322" width="12" height="4" />
          <rect x="1056" y="332" width="20" height="3" />
          <rect x="1056" y="340" width="9" height="3" />
        </g>
        <circle cx="1080" cy="404" r="22" fill="#0c0a08" stroke="#4c3a26" strokeWidth="3" />
        <circle cx="1080" cy="404" r="3" fill="#c9974a" />
      </g>

      {/* bookshelf right */}
      <g>
        <rect x="1190" y="230" width="300" height="430" fill="#0e0b08" stroke="#3a2b1d" strokeWidth="4" />
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            <rect x="1210" y={262 + row * 96} width="260" height="72" fill="#080605" />
            {Array.from({ length: 13 }, (_, i) => (
              <rect
                key={i}
                x={1216 + i * 19}
                y={266 + row * 96 + (i % 3) * 3}
                width={i % 5 === 0 ? 13 : 10}
                height={60 - (i % 4) * 5}
                fill={["#3b2a1c", "#2a3038", "#4a3420", "#232a2b", "#5a3b22"][i % 5]}
                opacity="0.75"
              />
            ))}
          </g>
        ))}
        <rect x="1210" y="418" width="260" height="10" fill="#2a1e14" />
      </g>

      {/* desk lamp and desk camera left */}
      <g>
        <rect x="350" y="600" width="210" height="18" fill="#2c1f14" stroke="#4b3724" strokeWidth="2" />
        <path d="M380 618 L368 760 M530 618 L542 760" stroke="#241a11" strokeWidth="8" />
        <ellipse cx="470" cy="640" rx="110" ry="26" fill="#000" opacity="0.35" />
        <path d="M430 600 C430 570 470 556 500 570 C526 582 526 600 520 600" fill="#1c2a33" stroke="#51616b" strokeWidth="2" />
        <ellipse cx="514" cy="596" rx="8" ry="4" fill="#ffdaa0" />
        <rect x="452" y="572" width="56" height="14" fill="#d8cbb4" transform="rotate(-6 480 580)" opacity="0.85" />
        <rect x="440" y="586" width="74" height="8" fill="#b9a68e" transform="rotate(3 477 590)" opacity="0.6" />
      </g>

      {/* rug */}
      <path d="M620 780 L1000 780 L1080 900 L540 900 Z" fill="#24120e" stroke="#4a2a1e" strokeWidth="2" />
      <path d="M660 800 L960 800 L1020 880 L600 880 Z" fill="none" stroke="#7a4430" strokeWidth="2" opacity="0.55" />
      <path d="M700 820 L920 820 L958 856 L662 856 Z" fill="none" stroke="#8a5238" strokeWidth="1.5" opacity="0.4" />

      {/* suspended dust in the beam */}
      <g fill="#ecdfc8" opacity="0.5">
        {Array.from({ length: 22 }, (_, i) => (
          <circle key={i} cx={480 + ((i * 83) % 600)} cy={420 + ((i * 53) % 260)} r={i % 5 === 0 ? 1.8 : 1} />
        ))}
      </g>

      <rect width="1600" height="900" fill={`url(#${id}-vignette)`} />
    </svg>
  );
}

export function GameArt({
  art,
  className = "",
}: {
  art: "room" | "runner" | "cycle";
  className?: string;
}) {
  if (art === "room") return <RoomCardArt className={className} />;
  if (art === "cycle") return <CycleCardArt className={className} />;
  return <RunnerCardArt className={className} />;
}
