import { useId } from "react";

function ids(raw: string) {
  return raw.replace(/[^a-zA-Z0-9]/g, "");
}

/* ------------------------------------------------------------------ */
/* CYCLE — night alpine pass: violet dusk, luminous road, one rider.  */
/* ------------------------------------------------------------------ */
export function CycleCardArt({ className = "" }: { className?: string }) {
  const id = ids(useId());
  const stars = Array.from({ length: 64 }, (_, i) => ({
    cx: (i * 211) % 1580,
    cy: 40 + ((i * 137) % 330),
    r: i % 9 === 0 ? 1.9 : i % 3 === 0 ? 1.4 : 0.9,
    d: ((i * 53) % 42) / 10,
  }));
  const pines = Array.from({ length: 30 }, (_, i) => {
    const x = 20 + i * 55 + ((i * 37) % 19);
    const h = 26 + ((i * 53) % 40);
    return { x, h, w: h * 0.32 };
  });

  return (
    <svg viewBox="0 0 1600 900" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05070f" />
          <stop offset="0.34" stopColor="#0d1330" />
          <stop offset="0.6" stopColor="#241f52" />
          <stop offset="0.82" stopColor="#4a3f8c" />
          <stop offset="1" stopColor="#7f6ec4" />
        </linearGradient>
        <linearGradient id={`${id}-aurora`} x1="0" y1="0" x2="1" y2="0.25">
          <stop offset="0" stopColor="#8d87f2" stopOpacity="0" />
          <stop offset="0.3" stopColor="#8d87f2" stopOpacity="0.4" />
          <stop offset="0.55" stopColor="#5fb9e6" stopOpacity="0.34" />
          <stop offset="0.78" stopColor="#c976a3" stopOpacity="0.2" />
          <stop offset="1" stopColor="#8d87f2" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#e9e6ff" stopOpacity="0.9" />
          <stop offset="0.22" stopColor="#a99ef2" stopOpacity="0.34" />
          <stop offset="1" stopColor="#8d87f2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d3a7e" />
          <stop offset="0.55" stopColor="#282760" />
          <stop offset="1" stopColor="#191838" />
        </linearGradient>
        <linearGradient id={`${id}-farCold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9b3ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#6f66c9" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`${id}-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#201d4a" />
          <stop offset="1" stopColor="#100e2a" />
        </linearGradient>
        <linearGradient id={`${id}-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12102a" />
          <stop offset="1" stopColor="#05060e" />
        </linearGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d87f2" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8d87f2" stopOpacity="0.18" />
          <stop offset="1" stopColor="#8d87f2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-road`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cfe0ff" stopOpacity="0.1" />
          <stop offset="0.45" stopColor="#dfe9ff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#8d87f2" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={`${id}-lamp`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#bfe3ff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#8cb4f2" stopOpacity="0.3" />
          <stop offset="1" stopColor="#8cb4f2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-vignette`} cx="46%" cy="48%" r="72%">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#010207" stopOpacity="0.74" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill={`url(#${id}-sky)`} />

      {/* stars */}
      <g fill="#dcd8ff">
        {stars.map((s, i) => (
          <circle
            key={i}
            className="art-twinkle"
            style={{ animationDelay: `${s.d}s` }}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
          />
        ))}
      </g>

      {/* aurora ribbons */}
      <g opacity="0.5" filter="url(#none)" />
      <path
        className="art-clouds"
        d="M-60 210 C360 160 720 220 1080 170 C1320 138 1500 180 1660 150"
        fill="none"
        stroke={`url(#${id}-aurora)`}
        strokeWidth="64"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        className="art-clouds"
        style={{ animationDelay: "-14s", animationDuration: "40s" }}
        d="M-60 150 C420 120 820 190 1240 140"
        fill="none"
        stroke="#5fb9e6"
        strokeWidth="18"
        strokeLinecap="round"
        opacity="0.14"
      />

      {/* moon */}
      <circle className="art-halo" cx="1148" cy="230" r="300" fill={`url(#${id}-moon)`} />
      <circle cx="1148" cy="230" r="40" fill="#efedff" opacity="0.95" />
      <path d="M1136 206 a26 26 0 0 0 24 48 a34 34 0 0 1 -24 -48 Z" fill="#c9c2ff" opacity="0.35" />

      {/* far snow ridge, violet-lit */}
      <path
        d="M0 622 L120 548 L214 588 L330 470 L438 566 L520 506 L610 596 L726 486 L806 552 L900 452 L996 560 L1086 494 L1194 588 L1300 516 L1410 580 L1510 512 L1600 566 L1600 900 L0 900 Z"
        fill={`url(#${id}-far)`}
      />
      <g fill={`url(#${id}-farCold)`} opacity="0.8">
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
      <g fill="#0b0a20" opacity="0.92" className="art-grass">
        {pines.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${688 + (i % 4) * 9})`}>
            <path d={`M0 0 L${p.w} ${p.h} L${-p.w} ${p.h} Z`} />
          </g>
        ))}
      </g>

      {/* valley shadow */}
      <path d="M0 760 C240 722 420 748 640 724 C880 698 1100 742 1320 712 C1450 694 1528 708 1600 698 L1600 900 L0 900 Z" fill={`url(#${id}-near)`} />

      {/* the road: one luminous switchback cut into the near ridge */}
      <path
        d="M-30 900 C170 862 312 812 470 792 C650 768 780 742 940 716 C1090 692 1210 674 1360 648 C1460 630 1540 620 1630 604"
        fill="none"
        stroke="#06050f"
        strokeWidth="26"
        opacity="0.72"
      />
      <path
        d="M-30 900 C170 862 312 812 470 792 C650 768 780 742 940 716 C1090 692 1210 674 1360 648 C1460 630 1540 620 1630 604"
        fill="none"
        stroke={`url(#${id}-road)`}
        strokeWidth="3"
      />
      <g>
        {[
          [300, 812, 1.9],
          [560, 736, 2.2],
          [820, 712, 1.7],
          [1080, 688, 2.4],
          [1330, 652, 1.6],
          [1520, 616, 2.1],
        ].map(([x, y, r]) => (
          <g key={x} className="art-glow">
            <ellipse cx={x} cy={y} rx={r * 16} ry={r * 7} fill={`url(#${id}-lamp)`} opacity="0.5" />
            <circle cx={x} cy={y} r={r * 2.6} fill="#cfe4ff" />
          </g>
        ))}
      </g>

      {/* rider, rim-lit by violet moonlight, headlamp burning */}
      <g transform="translate(915 722) scale(1.24)">
        <g className="art-bob-slow">
          <ellipse cx="8" cy="2" rx="104" ry="9" fill="#000" opacity="0.55" />
          {/* headlamp cone */}
          <path d="M58 -84 L236 -36 L236 -92 L58 -96 Z" fill="#bfe3ff" opacity="0.09" />
          <g fill="none" stroke="#04050c" strokeLinecap="round">
            <circle cx="-46" cy="-30" r="30" strokeWidth="6" />
            <circle cx="64" cy="-30" r="30" strokeWidth="6" />
            <circle cx="-46" cy="-30" r="30" strokeWidth="1.2" stroke="#8d87f2" strokeOpacity="0.55" />
            <circle cx="64" cy="-30" r="30" strokeWidth="1.2" stroke="#8d87f2" strokeOpacity="0.55" />
            <path d="M-46 -30 L-6 -34 L-16 -62 M-6 -34 L42 -52 L64 -30 M-16 -62 L42 -52 M-6 -34 L-22 -6" strokeWidth="4" />
            <path d="M-46 -30 L-20 -10 L-6 -34" strokeWidth="3" opacity="0.8" />
          </g>
          <g fill="#08091a" stroke="#8d87f2" strokeWidth="1.5" strokeOpacity="0.7">
            <path d="M-22 -60 C-18 -76 -4 -88 12 -92 C28 -96 38 -88 40 -76 L32 -62 L-8 -54 Z" />
            <circle cx="34" cy="-104" r="13" />
            <path d="M23 -108 C25 -120 43 -122 48 -111 L45 -103 Z" />
            <path d="M46 -104 C52 -104 56 -100 56 -96 L44 -94 Z" fill="#08091a" />
            <path d="M-14 -84 C-24 -82 -28 -72 -24 -62 L-12 -60 L-6 -78 Z" fill="#08091a" />
            <path d="M30 -84 C38 -78 44 -70 46 -62" fill="none" strokeWidth="8" strokeLinecap="round" />
            <path d="M-8 -58 C4 -46 6 -32 -2 -16 L-18 -4" fill="none" strokeWidth="9" strokeLinecap="round" />
            <path d="M-2 -60 C8 -52 16 -40 12 -22 L2 -8" fill="none" strokeWidth="9" strokeLinecap="round" />
          </g>
          {/* rim light */}
          <path d="M23 -110 C27 -122 43 -124 50 -112" fill="none" stroke="#dfe4ff" strokeWidth="1.3" opacity="0.7" />
          <path d="M-18 -78 C-6 -86 8 -90 20 -88" fill="none" stroke="#9a94ff" strokeWidth="1.1" opacity="0.5" />
          {/* wheel spokes catch light */}
          <g stroke="#a9a1ff" strokeWidth="1" opacity="0.4" fill="none">
            <path d="M-46 -58 L-46 -2 M-74 -30 L-18 -30 M-66 -48 L-26 -12 M-26 -48 L-66 -12" />
            <path d="M64 -58 L64 -2 M34 -30 L94 -30 M44 -48 L84 -12 M84 -48 L44 -12" />
          </g>
        </g>
      </g>

      {/* foreground grass */}
      <g className="art-grass" stroke="#050610" strokeWidth="3" fill="none" opacity="0.92">
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

/* ------------------------------------------------------------------ */
/* ONE CHANCE — rainy neon rooftop: violet city, one gap, one courier. */
/* ------------------------------------------------------------------ */
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
  const stars = Array.from({ length: 30 }, (_, i) => ({
    cx: 70 + ((i * 127) % 1460),
    cy: 60 + ((i * 71) % 290),
    r: i % 5 === 0 ? 1.6 : 1,
    d: ((i * 37) % 42) / 10,
  }));

  return (
    <svg viewBox="0 0 1600 900" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04060e" />
          <stop offset="0.5" stopColor="#0b1022" />
          <stop offset="0.82" stopColor="#1d1b44" />
          <stop offset="1" stopColor="#373070" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#e9e6ff" stopOpacity="0.85" />
          <stop offset="0.24" stopColor="#a99ef2" stopOpacity="0.3" />
          <stop offset="1" stopColor="#8d87f2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2a5e" />
          <stop offset="1" stopColor="#12122c" />
        </linearGradient>
        <linearGradient id={`${id}-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#181734" />
          <stop offset="1" stopColor="#05060f" />
        </linearGradient>
        <linearGradient id={`${id}-roof`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#262351" />
          <stop offset="0.1" stopColor="#131230" />
          <stop offset="1" stopColor="#06070f" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#cfc8ff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#cfc8ff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-vignette`} cx="54%" cy="42%" r="70%">
          <stop offset="0.42" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#010206" stopOpacity="0.78" />
        </radialGradient>
        <radialGradient id={`${id}-lampV`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#c9b9ff" stopOpacity="0.8" />
          <stop offset="0.4" stopColor="#8d87f2" stopOpacity="0.26" />
          <stop offset="1" stopColor="#8d87f2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-lampM`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ff9ecf" stopOpacity="0.75" />
          <stop offset="0.42" stopColor="#c976a3" stopOpacity="0.2" />
          <stop offset="1" stopColor="#c976a3" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill={`url(#${id}-sky)`} />
      <circle className="art-halo" cx="1180" cy="168" r="290" fill={`url(#${id}-moon)`} />
      <circle cx="1180" cy="168" r="26" fill="#efedff" opacity="0.85" />
      <g fill="#dcd8ff">
        {stars.map((s, i) => (
          <circle
            key={i}
            className="art-twinkle"
            style={{ animationDelay: `${s.d}s` }}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
          />
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
            className={w.amber ? "art-flicker" : undefined}
            style={w.amber ? { animationDelay: `${((i * 17) % 11) * 0.29}s` } : undefined}
            x={w.x}
            y={w.y}
            width={w.w}
            height={w.h}
            fill={w.amber ? "#9f8ff2" : "#5f8fd4"}
            opacity={w.amber ? 0.6 : 0.3}
          />
        ))}
      </g>

      {/* neon signs, restrained magenta + electric */}
      <g className="art-glow">
        <rect x="486" y="444" width="5" height="94" fill="#e77fb3" opacity="0.7" />
        <ellipse cx="490" cy="490" rx="60" ry="80" fill={`url(#${id}-lampM)`} opacity="0.4" />
      </g>
      <g className="art-glow" style={{ animationDelay: "1.9s" }}>
        <rect x="1180" y="420" width="84" height="4" fill="#6fb6ff" opacity="0.8" />
        <ellipse cx="1222" cy="428" rx="70" ry="30" fill={`url(#${id}-lampV)`} opacity="0.45" />
      </g>

      {/* near skyline */}
      <g fill={`url(#${id}-near)`}>
        <path d="M0 900 L0 620 L120 620 L120 570 L210 570 L210 690 L330 690 L330 610 L420 610 L420 660 L560 660 L560 590 L650 590 L650 700 L800 700 L800 630 L900 630 L900 690 L1040 690 L1040 600 L1150 600 L1150 680 L1300 680 L1300 590 L1400 590 L1400 650 L1500 650 L1500 600 L1600 600 L1600 900 Z" />
      </g>
      <g>
        {nearWindows.map((w, i) => (
          <rect
            key={i}
            className={w.amber ? "art-flicker" : undefined}
            style={w.amber ? { animationDelay: `${((i * 13) % 9) * 0.37}s` } : undefined}
            x={w.x}
            y={w.y}
            width={w.w}
            height={w.h}
            fill={w.amber ? "#b3a4f5" : "#6f9fd4"}
            opacity={w.amber ? 0.6 : 0.22}
          />
        ))}
      </g>

      {/* antenna and water tank */}
      <g stroke="#05060f" fill="#0a0c1c">
        <path d="M1320 600 L1320 540 L1360 540 L1360 600 Z" />
        <path d="M1368 600 L1368 556 L1420 556 L1420 600 Z" />
        <path d="M240 590 L240 550 L286 550 L286 590 Z" />
        <path d="M1052 630 L1052 570 M1052 570 L1086 552 M1052 570 L1018 552" fill="none" strokeWidth="4" />
      </g>
      {/* red beacon on antenna */}
      <g className="art-pulse-strong">
        <circle cx="1052" cy="566" r="2.6" fill="#ff6d9e" />
        <ellipse cx="1052" cy="566" rx="9" ry="9" fill={`url(#${id}-lampM)`} />
      </g>

      {/* rooftop in the foreground, split by a gap */}
      <path d="M0 900 L0 742 L600 742 L600 900 Z" fill={`url(#${id}-roof)`} />
      <path d="M760 900 L760 726 L1600 726 L1600 900 Z" fill={`url(#${id}-roof)`} />
      <g stroke="#4a4788" strokeWidth="2" opacity="0.4">
        <path d="M0 742 L600 742 M760 726 L1600 726" />
        <path d="M48 742 L48 900 M160 742 L160 900 M300 742 L300 900 M470 742 L470 900" opacity="0.35" />
        <path d="M840 726 L840 900 M1040 726 L1040 900 M1240 726 L1240 900 M1460 726 L1460 900" opacity="0.35" />
      </g>

      {/* city glow through the gap */}
      <rect x="600" y="726" width="160" height="174" fill="#0a0c1e" />
      <ellipse className="art-glow" cx="680" cy="838" rx="150" ry="90" fill={`url(#${id}-lampV)`} opacity="0.4" />

      {/* rooftop neon strip */}
      <g>
        <rect x="1046" y="540" width="92" height="4" fill="#8fb0ff" opacity="0.75" />
        <ellipse className="art-glow" style={{ animationDelay: "1.4s" }} cx="1092" cy="548" rx="80" ry="40" fill={`url(#${id}-lampV)`} opacity="0.5" />
        <rect x="150" y="642" width="44" height="3" fill="#5f8fd4" opacity="0.55" />
      </g>

      {/* moonbeam */}
      <path className="art-beam" d="M1180 194 L1000 900 L1600 900 L1600 260 Z" fill={`url(#${id}-beam)`} />

      {/* rain, two depths */}
      <g className="art-rain" stroke="#c6c9e6" strokeWidth="1.4" opacity="0.18">
        {Array.from({ length: 46 }, (_, i) => (
          <path key={i} d={`M${-60 + i * 38} ${-20 + ((i * 31) % 120)} l-26 190`} />
        ))}
      </g>

      {/* the runner, caught between roofs */}
      <g transform="translate(1040 726) scale(1.18)">
        <g className="art-bob">
          <ellipse cx="-20" cy="6" rx="86" ry="8" fill="#000" opacity="0.5" />
          <g stroke="#05060f" strokeLinecap="round" strokeLinejoin="round">
            <path d="M-8 -34 C-26 -26 -42 -14 -52 2 L-64 4" fill="none" strokeWidth="13" />
            <path d="M0 -36 C18 -28 30 -16 40 -2 L54 0" fill="none" strokeWidth="13" />
            <path d="M-14 -38 C-8 -54 2 -76 18 -88 L30 -78 C18 -66 8 -48 4 -36 Z" fill="#05060f" />
            <path d="M14 -88 C18 -104 36 -112 48 -102 C58 -94 58 -80 50 -72 L32 -70 L18 -78 Z" fill="#05060f" />
            <path d="M20 -92 C26 -108 44 -114 54 -104" fill="none" strokeWidth="14" />
            <path d="M22 -80 C36 -74 44 -64 46 -52" fill="none" strokeWidth="10" />
            <path d="M12 -70 C2 -62 -8 -56 -18 -54" fill="none" strokeWidth="9" />
          </g>
          {/* coat tails */}
          <path d="M-10 -40 C-32 -34 -48 -42 -56 -58 C-44 -60 -34 -56 -26 -50 C-22 -44 -16 -40 -10 -40 Z" fill="#06070f" />
          <path d="M-8 -36 C-28 -24 -40 -10 -48 2 C-32 0 -20 -8 -8 -20 Z" fill="#06070f" opacity="0.9" />
          {/* violet rim light */}
          <path d="M20 -92 C26 -108 44 -114 54 -104 C64 -94 62 -78 50 -72" fill="none" stroke="#b3a4f5" strokeWidth="1.6" opacity="0.75" />
          <path d="M-14 -38 C-6 -58 4 -76 18 -88" fill="none" stroke="#8d87f2" strokeWidth="1.3" opacity="0.55" />
        </g>
      </g>

      {/* rain in the foreground, wet edge highlights */}
      <g className="art-rain art-rain-fg" stroke="#b0b4dd" strokeWidth="2" opacity="0.26">
        {Array.from({ length: 24 }, (_, i) => (
          <path key={i} d={`M${i * 70} 640 l-14 120`} />
        ))}
      </g>
      <rect width="1600" height="900" fill={`url(#${id}-vignette)`} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* THE IMPOSSIBLE ROOM — midnight study, moonbeam, a door that glows.  */
/* ------------------------------------------------------------------ */
export function RoomCardArt({ className = "" }: { className?: string }) {
  const id = ids(useId());
  return (
    <svg viewBox="0 0 1600 900" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#191226" />
          <stop offset="0.55" stopColor="#120e1c" />
          <stop offset="1" stopColor="#09070f" />
        </linearGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1526" />
          <stop offset="1" stopColor="#0a0810" />
        </linearGradient>
        <linearGradient id={`${id}-door`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d2917" />
          <stop offset="0.45" stopColor="#2b1c10" />
          <stop offset="1" stopColor="#170f08" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#d9e4ee" stopOpacity="0.8" />
          <stop offset="0.35" stopColor="#8d87f2" stopOpacity="0.28" />
          <stop offset="1" stopColor="#8d87f2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#cfd6ef" stopOpacity="0.32" />
          <stop offset="0.55" stopColor="#c3c2e4" stopOpacity="0.1" />
          <stop offset="1" stopColor="#c3c2e4" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-key`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd98f" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#eab45f" stopOpacity="0.32" />
          <stop offset="1" stopColor="#d4903c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-candle`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd98f" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#e2a355" stopOpacity="0.18" />
          <stop offset="1" stopColor="#e2a355" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-vignette`} cx="50%" cy="46%" r="72%">
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#020207" stopOpacity="0.82" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill={`url(#${id}-wall)`} />

      {/* wall panels */}
      <g stroke="#33255a" strokeWidth="2" opacity="0.28">
        <rect x="70" y="120" width="430" height="560" fill="none" />
        <rect x="1080" y="150" width="450" height="522" fill="none" />
        <path d="M70 120 L500 120 M1080 150 L1530 150" />
      </g>

      {/* moonlight window, camera left */}
      <g>
        <ellipse className="art-halo" cx="330" cy="290" rx="330" ry="300" fill={`url(#${id}-moon)`} />
        <rect x="214" y="128" width="236" height="348" fill="#0d1420" stroke="#43355c" strokeWidth="6" />
        <rect x="226" y="140" width="212" height="324" fill="#182035" />
        <path d="M226 302 L438 302 M332 140 L332 464" stroke="#0a0c16" strokeWidth="8" />
        <rect x="226" y="140" width="212" height="324" fill="#c9dceb" opacity="0.06" />
        <path className="art-beam" d="M438 302 L670 760 L1240 760 L1240 540 Z" fill={`url(#${id}-beam)`} />
        <g fill="#d9e6f0" opacity="0.32">
          {Array.from({ length: 18 }, (_, i) => (
            <circle
              key={i}
              className="art-dust"
              style={{ animationDelay: `${((i * 53) % 90) / 10}s` }}
              cx={330 + ((i * 67) % 420)}
              cy={360 + ((i * 61) % 300)}
              r={i % 4 === 0 ? 1.8 : 1}
            />
          ))}
        </g>
      </g>

      {/* floor */}
      <rect y="690" width="1600" height="210" fill={`url(#${id}-floor)`} />
      <g stroke="#3a2c52" strokeWidth="1" opacity="0.25">
        <path d="M0 742 L1600 742 M0 806 L1600 806 M0 868 L1600 868" />
        <path d="M220 690 L120 900 M540 690 L480 900 M1060 690 L1120 900 M1380 690 L1480 900" opacity="0.5" />
      </g>

      {/* door */}
      <g>
        <path d="M600 760 L600 300 C600 210 690 150 800 150 C910 150 1000 210 1000 300 L1000 760 Z" fill="#0c0806" stroke="#46304d" strokeWidth="10" />
        <path d="M632 748 L632 306 C632 232 708 182 800 182 C892 182 968 232 968 306 L968 748 Z" fill={`url(#${id}-door)`} stroke="#5f4027" strokeWidth="3" />
        <path d="M660 748 L660 312 C660 254 722 214 800 214 C878 214 940 254 940 312 L940 748 Z" fill="none" stroke="#755030" strokeWidth="2" opacity="0.55" />
        <g fill="none" stroke="#54381f" strokeWidth="2" opacity="0.65">
          <rect x="690" y="330" width="220" height="180" />
          <rect x="718" y="358" width="164" height="124" />
          <rect x="690" y="548" width="220" height="160" />
        </g>
        <circle cx="800" cy="284" r="10" fill="#c9974a" opacity="0.85" />
        <g className="art-pulse-strong">
          <ellipse cx="800" cy="512" rx="150" ry="120" fill={`url(#${id}-key)`} />
          <path d="M800 484 C814 484 824 496 824 510 C824 522 816 532 806 535 L806 552 L794 552 L794 535 C784 532 776 522 776 510 C776 496 786 484 800 484 Z" fill="#f2c37a" />
          <circle cx="800" cy="509" r="7" fill="#20150b" />
          <rect x="794" y="535" width="12" height="20" fill="#20150b" opacity="0.65" />
        </g>
      </g>

      {/* candelabra left of the door */}
      <g>
        <path d="M560 690 L560 660 M540 690 L580 690" stroke="#57411f" strokeWidth="6" fill="none" />
        <path d="M544 660 C552 636 568 636 576 660 Z" fill="#463320" stroke="#6a4c26" strokeWidth="2" />
        {[548, 572].map((x, i) => (
          <g key={x} className="art-flicker" style={{ animationDelay: `${i * 0.9}s` }}>
            <ellipse cx={x} cy={630} rx="34" ry="46" fill={`url(#${id}-candle)`} opacity="0.6" />
            <path d={`M${x} 638 L${x} 646`} stroke="#ffd98f" strokeWidth="3" strokeLinecap="round" />
            <path d={`M${x} 632 C${x - 3} 620 ${x + 3} 616 ${x} 606`} fill="none" stroke="#ffc46a" strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
          </g>
        ))}
      </g>

      {/* console and clock to the right of the door */}
      <g>
        <rect x="1032" y="300" width="96" height="220" fill="#150f1d" stroke="#42314f" strokeWidth="3" />
        <rect x="1046" y="314" width="68" height="58" fill="#1c2740" />
        <g fill="#8faef2" opacity="0.7">
          <rect x="1056" y="322" width="12" height="4" />
          <rect x="1056" y="332" width="20" height="3" />
          <rect x="1056" y="340" width="9" height="3" />
        </g>
        <circle cx="1080" cy="404" r="22" fill="#0d0b16" stroke="#4c3a58" strokeWidth="3" />
        <circle className="art-glow" cx="1080" cy="404" r="3" fill="#c9974a" />
      </g>

      {/* bookshelf right */}
      <g>
        <rect x="1190" y="230" width="300" height="430" fill="#0f0b17" stroke="#42314f" strokeWidth="4" />
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            <rect x="1210" y={262 + row * 96} width="260" height="72" fill="#090610" />
            {Array.from({ length: 13 }, (_, i) => (
              <rect
                key={i}
                x={1216 + i * 19}
                y={266 + row * 96 + (i % 3) * 3}
                width={i % 5 === 0 ? 13 : 10}
                height={60 - (i % 4) * 5}
                fill={["#3b2a4c", "#2a3040", "#4a3420", "#232a33", "#5a3b22"][i % 5]}
                opacity="0.78"
              />
            ))}
          </g>
        ))}
        <rect x="1210" y="418" width="260" height="10" fill="#2a1e3a" opacity="0.7" />
      </g>

      {/* desk lamp and desk camera left */}
      <g>
        <rect x="350" y="600" width="210" height="18" fill="#2c1f33" stroke="#4b3752" strokeWidth="2" />
        <path d="M380 618 L368 760 M530 618 L542 760" stroke="#241a2b" strokeWidth="8" />
        <ellipse cx="470" cy="640" rx="110" ry="26" fill="#000" opacity="0.35" />
        <path d="M430 600 C430 570 470 556 500 570 C526 582 526 600 520 600" fill="#1e2c44" stroke="#5b6d8f" strokeWidth="2" />
        <ellipse className="art-flicker" cx="514" cy="596" rx="8" ry="4" fill="#ffdaa0" />
        <ellipse className="art-flicker" style={{ animationDelay: "0.6s" }} cx="470" cy="606" rx="150" ry="46" fill={`url(#${id}-candle)`} opacity="0.35" />
        <rect x="452" y="572" width="56" height="14" fill="#d8cbb4" transform="rotate(-6 480 580)" opacity="0.85" />
        <rect x="440" y="586" width="74" height="8" fill="#b9a68e" transform="rotate(3 477 590)" opacity="0.6" />
      </g>

      {/* rug */}
      <path d="M620 780 L1000 780 L1080 900 L540 900 Z" fill="#241226" stroke="#4a2a44" strokeWidth="2" />
      <path d="M660 800 L960 800 L1020 880 L600 880 Z" fill="none" stroke="#7a4462" strokeWidth="2" opacity="0.55" />
      <path d="M700 820 L920 820 L958 856 L662 856 Z" fill="none" stroke="#8a5270" strokeWidth="1.5" opacity="0.4" />

      {/* suspended dust in the beam */}
      <g fill="#ecdfc8" opacity="0.5">
        {Array.from({ length: 22 }, (_, i) => (
          <circle
            key={i}
            className="art-dust"
            style={{ animationDelay: `${((i * 41) % 88) / 10}s` }}
            cx={480 + ((i * 83) % 600)}
            cy={420 + ((i * 53) % 260)}
            r={i % 5 === 0 ? 1.8 : 1}
          />
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
