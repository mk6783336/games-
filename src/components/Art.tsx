import { useId } from "react";

/** Cinematic hero: a hooded player lit by the glow of the run ahead. */
export function HeroArt({ className = "" }: { className?: string }) {
  const raw = useId();
  const id = raw.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg
      viewBox="0 0 1000 760"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.55" />
          <stop offset="42%" stopColor="#4f46e5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#05070f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#05070f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-cloak`} x1="20%" y1="0%" x2="76%" y2="100%">
          <stop offset="0%" stopColor="#232b51" />
          <stop offset="28%" stopColor="#151a35" />
          <stop offset="72%" stopColor="#0a0d1d" />
          <stop offset="100%" stopColor="#05070f" />
        </linearGradient>
        <linearGradient id={`${id}-hood`} x1="12%" y1="4%" x2="86%" y2="86%">
          <stop offset="0%" stopColor="#3b3f72" />
          <stop offset="36%" stopColor="#1b2142" />
          <stop offset="100%" stopColor="#090c19" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`${id}-pad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a3159" />
          <stop offset="50%" stopColor="#11162c" />
          <stop offset="100%" stopColor="#080b18" />
        </linearGradient>
        <linearGradient id={`${id}-floorline`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5b8cff" stopOpacity="0" />
          <stop offset="50%" stopColor="#7c6cff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-soft`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
        <filter id={`${id}-glow`} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* atmospheric depth */}
      <ellipse cx="720" cy="330" rx="390" ry="340" fill={`url(#${id}-halo)`} />
      <ellipse cx="690" cy="300" rx="180" ry="180" fill={`url(#${id}-core)`} opacity="0.7" filter={`url(#${id}-soft)`} />

      {/* concentric portal rings */}
      <g fill="none" stroke="#8b6cff" opacity="0.22">
        <ellipse cx="700" cy="330" rx="286" ry="286" strokeWidth="1" />
        <ellipse cx="700" cy="330" rx="236" ry="236" strokeWidth="1.4" strokeDasharray="2 16" opacity="0.7" />
        <ellipse cx="700" cy="330" rx="330" ry="330" strokeWidth="0.8" strokeDasharray="40 26 4 26" opacity="0.5" />
      </g>
      <g fill="none" stroke="#38bdf8" opacity="0.16">
        <circle cx="700" cy="330" r="205" strokeWidth="0.7" />
        <path d="M468 520 Q700 610 952 512" strokeWidth="1" />
        <path d="M492 572 Q700 660 920 566" strokeWidth="0.8" />
      </g>

      {/* perspective floor */}
      <g stroke={`url(#${id}-floorline)`} strokeWidth="1" opacity="0.6">
        {Array.from({ length: 13 }).map((_, i) => {
          const y = 556 + i * i * 2.35;
          return <path key={i} d={`M${-40 + i * 18} ${y} L${1040 - i * 18} ${y}`} opacity={0.55 - i * 0.03} />;
        })}
        {Array.from({ length: 15 }).map((_, i) => (
          <path key={`v${i}`} d={`M${700 + (i - 7) * 62} 548 L${700 + (i - 7) * 210} 800`} opacity={0.22} />
        ))}
      </g>

      {/* drifting shards */}
      <g opacity="0.8">
        <rect x="252" y="176" width="7" height="26" rx="3" fill="#c084fc" opacity="0.55" transform="rotate(24 255 189)" />
        <rect x="884" y="238" width="5" height="18" rx="2.5" fill="#38bdf8" opacity="0.6" transform="rotate(-18 886 247)" />
        <rect x="826" y="128" width="4" height="12" rx="2" fill="#e9d5ff" opacity="0.5" />
        <circle cx="312" cy="318" r="2.4" fill="#a78bfa" opacity="0.8" />
        <circle cx="901" cy="392" r="2" fill="#7dd3fc" opacity="0.7" />
        <circle cx="420" cy="238" r="1.6" fill="#f5c45a" opacity="0.8" />
        <circle cx="862" cy="178" r="1.8" fill="#c4b5fd" opacity="0.8" />
        <circle cx="598" cy="130" r="1.4" fill="#93c5fd" opacity="0.7" />
      </g>

      {/* hooded figure */}
      <g>
        <ellipse cx="700" cy="650" rx="260" ry="46" fill="#02040b" opacity="0.8" filter={`url(#${id}-soft)`} />
        <path
          d="M404 780 C446 620 492 515 574 448 C536 372 548 258 628 200 C720 132 834 194 838 302 C841 368 812 416 776 448 C858 508 918 628 962 780 Z"
          fill={`url(#${id}-cloak)`}
        />
        {/* shoulder rim light */}
        <path
          d="M574 448 C536 372 548 258 628 200 C663 173 705 160 748 165"
          fill="none"
          stroke={`url(#${id}-rim)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M776 448 C858 508 918 628 962 780"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.2"
          opacity="0.22"
        />
        {/* hood volume */}
        <path
          d="M626 356 C600 286 636 196 716 178 C800 159 858 224 848 310 C842 360 814 388 782 400 C744 414 676 406 626 356 Z"
          fill={`url(#${id}-hood)`}
        />
        <path
          d="M626 356 C600 286 636 196 716 178 C800 159 858 224 848 310 C842 360 814 388 782 400"
          fill="none"
          stroke={`url(#${id}-rim)`}
          strokeWidth="2.4"
          opacity="0.85"
        />
        {/* face void */}
        <ellipse cx="736" cy="294" rx="61" ry="74" fill="#03050c" />
        <ellipse cx="736" cy="300" rx="48" ry="56" fill="#010206" />
        <path d="M706 280 l32 6" stroke="#7dd3fc" strokeWidth="5.5" strokeLinecap="round" filter={`url(#${id}-glow)`} />
        <path d="M740 288 l28 5" stroke="#60a5fa" strokeWidth="5.5" strokeLinecap="round" filter={`url(#${id}-glow)`} />
        <ellipse cx="736" cy="294" rx="72" ry="84" fill="none" stroke="#6d5efc" strokeWidth="1" opacity="0.22" />

        {/* fold detail */}
        <path d="M474 688 C536 594 584 548 616 522" stroke="#232a4b" strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M860 690 C824 602 790 552 762 510" stroke="#1a203c" strokeWidth="2.5" fill="none" opacity="0.8" />
        <path d="M596 468 C660 510 740 512 806 470" stroke="#0b0f1f" strokeWidth="3" fill="none" opacity="0.9" />

        {/* arms */}
        <path d="M594 500 C622 488 670 500 700 528 L672 590 C636 574 604 558 578 540 Z" fill="#121730" />
        <path d="M850 500 C820 488 770 500 742 528 L770 590 C806 574 838 558 862 540 Z" fill="#10152b" />
        <path d="M590 502 C620 489 668 501 700 530" stroke="#4b4e86" strokeWidth="1.2" fill="none" opacity="0.6" />

        {/* controller halo */}
        <ellipse cx="720" cy="548" rx="118" ry="64" fill="#7c3aed" opacity="0.26" filter={`url(#${id}-soft)`} />
        {/* controller */}
        <g transform="translate(720 542)">
          <path
            d="M-104 -8 C-116 -42 -94 -53 -66 -47 L-22 -33 C-8 -29 8 -29 22 -33 L66 -47 C94 -53 116 -42 104 -8 C96 18 104 42 88 52 C72 62 54 44 40 26 L24 12 C12 4 -12 4 -24 12 L-40 26 C-54 44 -72 62 -88 52 C-104 42 -96 18 -104 -8 Z"
            fill={`url(#${id}-pad)`}
            stroke="#6d6cb4"
            strokeWidth="1.3"
            opacity="0.98"
          />
          <path
            d="M-104 -8 C-116 -42 -94 -53 -66 -47 L-22 -33"
            stroke="#a78bfa"
            strokeWidth="1.6"
            fill="none"
            opacity="0.75"
          />
          <path
            d="M104 -8 C116 -42 94 -53 66 -47 L22 -33"
            stroke="#38bdf8"
            strokeWidth="1.4"
            fill="none"
            opacity="0.7"
          />
          <circle cx="-54" cy="-6" r="15" fill="#0b0f20" stroke="#3d4677" strokeWidth="1.5" />
          <circle cx="-54" cy="-8" r="8" fill="#1c2340" stroke="#5b8cff" strokeWidth="1" />
          <circle cx="54" cy="-8" r="12" fill="#0b0f20" stroke="#3d4677" strokeWidth="1.5" />
          <circle cx="54" cy="-10" r="5" fill="#1c2340" />
          <g fill="#8b5cf6">
            <circle cx="28" cy="-14" r="3.4" />
            <circle cx="38" cy="-6" r="3.4" />
            <circle cx="18" cy="-6" r="3.4" />
            <circle cx="28" cy="2" r="3.4" />
          </g>
          <rect x="-7" y="-4" width="14" height="4" rx="2" fill="#2a3358" />
          <rect x="-62" y="-42" width="18" height="4" rx="2" fill="#f5c45a" opacity="0.55" />
          <rect x="-62" y="-34" width="10" height="3" rx="1.5" fill="#7dd3fc" opacity="0.4" />
        </g>

        {/* hands */}
        <path d="M620 516 C636 510 660 520 670 540 C678 556 668 574 646 580 C626 585 608 572 604 552 C601 536 607 522 620 516 Z" fill="#0d1227" stroke="#3c4577" strokeWidth="1" />
        <path d="M822 516 C806 510 782 520 772 540 C764 556 774 574 796 580 C816 585 834 572 838 552 C841 536 835 522 822 516 Z" fill="#0b1024" stroke="#3c4577" strokeWidth="1" />
      </g>

      {/* controller glow particles */}
      <g>
        <circle cx="612" cy="520" r="2" fill="#c4b5fd" filter={`url(#${id}-glow)`} />
        <circle cx="846" cy="492" r="1.6" fill="#7dd3fc" filter={`url(#${id}-glow)`} />
        <circle cx="760" cy="604" r="1.8" fill="#f0abfc" opacity="0.9" />
      </g>
    </svg>
  );
}

/** Escape-room key art: an ornate study door lit only by its keyhole. */
export function RoomCardArt({ className = "" }: { className?: string }) {
  const raw = useId();
  const id = raw.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg viewBox="0 0 900 560" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-wall`} x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#1b2434" />
          <stop offset="45%" stopColor="#121a27" />
          <stop offset="100%" stopColor="#080d16" />
        </linearGradient>
        <radialGradient id={`${id}-lamp`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd28a" stopOpacity="0.9" />
          <stop offset="38%" stopColor="#e5a552" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0a0f1a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-keyglow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe8ae" stopOpacity="1" />
          <stop offset="26%" stopColor="#f5c45a" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#f5c45a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-door`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a3a25" />
          <stop offset="32%" stopColor="#3a2618" />
          <stop offset="72%" stopColor="#26170f" />
          <stop offset="100%" stopColor="#160d08" />
        </linearGradient>
        <linearGradient id={`${id}-doorlight`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a9773f" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3a2518" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-floor`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#151a20" />
          <stop offset="100%" stopColor="#070a11" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe9b0" />
          <stop offset="55%" stopColor="#d9a950" />
          <stop offset="100%" stopColor="#95652a" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="900" height="560" fill={`url(#${id}-wall)`} />
      {/* wall paneling */}
      <g opacity="0.5" stroke="#41505c" strokeWidth="1" fill="none">
        <rect x="42" y="94" width="178" height="248" rx="4" />
        <rect x="54" y="106" width="154" height="224" rx="2" opacity="0.5" />
        <rect x="680" y="94" width="178" height="248" rx="4" />
        <rect x="692" y="106" width="154" height="224" rx="2" opacity="0.5" />
        <path d="M0 352 H900" />
        <path d="M0 314 H900" opacity="0.35" />
      </g>
      <g fill="#0d131d" opacity="0.9">
        <rect x="0" y="352" width="900" height="16" />
        <rect x="0" y="368" width="900" height="192" fill={`url(#${id}-floor)`} />
      </g>
      {/* floor perspective */}
      <g stroke="#2a3038" strokeWidth="1" opacity="0.55">
        {Array.from({ length: 11 }).map((_, i) => (
          <path key={i} d={`M${450 + (i - 5) * 46} 368 L${450 + (i - 5) * 160} 560`} />
        ))}
        <path d="M0 420 H900" opacity="0.5" />
        <path d="M0 482 H900" opacity="0.4" />
        <path d="M0 534 H900" opacity="0.25" />
      </g>

      {/* side portraits */}
      <g opacity="0.85">
        <rect x="112" y="126" width="116" height="150" rx="3" fill="#1a1510" stroke={`url(#${id}-gold)`} strokeWidth="3" />
        <rect x="122" y="136" width="96" height="130" fill="#20221c" />
        <ellipse cx="170" cy="180" rx="26" ry="32" fill="#2f2c22" />
        <path d="M138 252 C142 218 198 218 202 252 Z" fill="#26251d" />
        <rect x="672" y="126" width="116" height="150" rx="3" fill="#1a1510" stroke={`url(#${id}-gold)`} strokeWidth="3" opacity="0.7" />
        <rect x="682" y="136" width="96" height="130" fill="#191d1c" />
        <ellipse cx="730" cy="182" rx="24" ry="30" fill="#252a26" />
        <path d="M700 252 C704 220 756 220 760 252 Z" fill="#1e221f" />
      </g>

      {/* side furniture silhouettes */}
      <g fill="#0a0e14">
        <path d="M30 352 V268 h106 v84 z" />
        <path d="M46 268 h74 l-8 -18 H54 Z" opacity="0.8" />
        <rect x="22" y="214" width="8" height="42" fill="#2b2319" />
        <ellipse cx="26" cy="208" rx="17" ry="9" fill="#3a2d1c" opacity="0.7" />
        <path d="M764 352 V274 h116 v78 z" />
        <rect x="778" y="254" width="88" height="8" rx="2" fill="#241c14" />
      </g>

      {/* doorway */}
      <g>
        <path d="M302 406 V188 C302 124 350 84 450 84 C550 84 598 124 598 188 V406 Z" fill="#0b0d12" />
        <path d="M318 406 V190 C318 134 358 100 450 100 C542 100 582 134 582 190 V406 Z" fill="#1a1611" />
        <path d="M334 406 V194 C334 146 370 116 450 116 C530 116 566 146 566 194 V406 Z" fill={`url(#${id}-door)`} />
        <path d="M334 406 V194 C334 146 370 116 450 116 C530 116 566 146 566 194 V406 Z" fill={`url(#${id}-doorlight)`} />
        {/* door panels */}
        <g fill="none" stroke="#6b4c30" strokeWidth="2" opacity="0.5">
          <rect x="360" y="150" width="180" height="104" rx="6" />
          <rect x="374" y="164" width="152" height="76" rx="3" opacity="0.6" />
          <rect x="360" y="278" width="180" height="104" rx="6" />
          <rect x="374" y="292" width="152" height="76" rx="3" opacity="0.6" />
          <path d="M450 116 V406" opacity="0.35" />
        </g>
        {/* lintel ornaments */}
        <path d="M312 100 C356 56 544 56 588 100" fill="none" stroke="#8a6a3a" strokeWidth="2" opacity="0.5" />
        <circle cx="450" cy="80" r="9" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="2" opacity="0.8" />
        <path d="M450 66 l5 14 -5 14 -5 -14 Z" fill={`url(#${id}-gold)`} opacity="0.9" />
        {/* handle */}
        <circle cx="536" cy="300" r="13" fill={`url(#${id}-gold)`} />
        <circle cx="536" cy="300" r="5" fill="#3a2a14" />
        {/* keyhole */}
        <circle cx="450" cy="326" r="58" fill={`url(#${id}-keyglow)`} filter={`url(#${id}-blur)`} />
        <ellipse cx="450" cy="326" rx="17" ry="21" fill="#0a0806" stroke={`url(#${id}-gold)`} strokeWidth="2.5" />
        <circle cx="450" cy="320" r="5" fill="#ffe9b0" filter={`url(#${id}-glow)`} />
        <path d="M447 324 h6 l3 14 h-12 Z" fill="#ffe9b0" filter={`url(#${id}-glow)`} />
        <path d="M450 344 V396" stroke="#f5c45a" strokeWidth="1" opacity="0.22" />
      </g>

      {/* chandelier */}
      <g opacity="0.92">
        <circle cx="450" cy="46" r="76" fill={`url(#${id}-lamp)`} opacity="0.35" filter={`url(#${id}-blur)`} />
        <path d="M450 0 V28" stroke="#5e4a2c" strokeWidth="2" />
        <path d="M450 28 C410 32 386 54 372 84 M450 28 C490 32 514 54 528 84" fill="none" stroke="#7a6238" strokeWidth="2" opacity="0.8" />
        <g fill="#f5c45a">
          <ellipse cx="372" cy="86" rx="3" ry="7" />
          <ellipse cx="528" cy="86" rx="3" ry="7" />
          <ellipse cx="410" cy="52" rx="3" ry="6" />
          <ellipse cx="490" cy="52" rx="3" ry="6" />
          <ellipse cx="450" cy="40" rx="3" ry="7" />
        </g>
        <g fill="#ffe6a8" filter={`url(#${id}-glow)`} opacity="0.9">
          <circle cx="372" cy="82" r="5" />
          <circle cx="528" cy="82" r="5" />
          <circle cx="410" cy="48" r="4" />
          <circle cx="490" cy="48" r="4" />
          <circle cx="450" cy="36" r="5" />
        </g>
      </g>

      {/* rug */}
      <path d="M310 560 L340 456 H560 L590 560 Z" fill="#42231f" opacity="0.6" />
      <path d="M330 546 L354 470 H546 L570 546 Z" fill="none" stroke="#8a5a3a" opacity="0.35" />
      <path d="M322 532 L342 486 H558 L578 532 Z" fill="#582d27" opacity="0.35" />

      {/* dust motes */}
      <g fill="#f5d190">
        <circle cx="384" cy="236" r="1.6" opacity="0.7" />
        <circle cx="510" cy="196" r="1.2" opacity="0.5" />
        <circle cx="472" cy="270" r="2" opacity="0.6" />
        <circle cx="416" cy="318" r="1.1" opacity="0.5" />
        <circle cx="554" cy="344" r="1.4" opacity="0.4" />
      </g>
    </svg>
  );
}

/** One Chance key art: a runner against a neon skyline. */
export function RunnerCardArt({ className = "" }: { className?: string }) {
  const raw = useId();
  const id = raw.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg viewBox="0 0 900 560" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#0a1030" />
          <stop offset="34%" stopColor="#16184a" />
          <stop offset="64%" stopColor="#271a58" />
          <stop offset="100%" stopColor="#0a0d20" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#b9d7ff" />
          <stop offset="55%" stopColor="#4f7df7" />
          <stop offset="100%" stopColor="#1c2b66" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-horizon`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d946ef" stopOpacity="0.42" />
          <stop offset="48%" stopColor="#7c3aed" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#070a17" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-city1`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1c2250" />
          <stop offset="100%" stopColor="#0a0e22" />
        </linearGradient>
        <linearGradient id={`${id}-city2`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10142f" />
          <stop offset="100%" stopColor="#05070f" />
        </linearGradient>
        <linearGradient id={`${id}-platform`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a2450" />
          <stop offset="100%" stopColor="#0a0b18" />
        </linearGradient>
        <linearGradient id={`${id}-neonline`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="48%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
        <linearGradient id={`${id}-trail`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d946ef" stopOpacity="0" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.9" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${id}-soft`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      <rect width="900" height="560" fill={`url(#${id}-sky)`} />
      <ellipse cx="680" cy="330" rx="300" ry="220" fill={`url(#${id}-horizon)`} filter={`url(#${id}-soft)`} />
      <circle cx="690" cy="128" r="86" fill={`url(#${id}-moon)`} opacity="0.65" />
      <circle cx="690" cy="128" r="40" fill="#0d1430" opacity="0.9" />
      <circle cx="690" cy="128" r="41" fill="none" stroke="#7dd3fc" strokeWidth="1" opacity="0.35" />

      {/* stars */}
      <g fill="#cfd9ff">
        {[
          [90, 72, 1.3], [182, 128, 1], [268, 64, 1.6], [356, 102, 1.1], [478, 56, 1.2],
          [560, 118, 1], [742, 62, 1.4], [820, 108, 1], [862, 176, 1.2], [132, 190, 0.9],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} opacity={0.35 + (i % 4) * 0.13} />
        ))}
      </g>

      {/* far skyline */}
      <g fill={`url(#${id}-city1)`} opacity="0.85">
        <path d="M0 348 V282 h42 v-24 h30 v-30 h36 v54 h26 V236 h34 v112 z" />
        <path d="M166 348 V262 h24 v-36 h38 v36 h26 V244 h32 v104 z" opacity="0.9" />
        <path d="M554 348 V272 h34 v-30 h24 v30 h30 V228 h36 v120 z" />
        <path d="M692 348 V254 h28 v-26 h34 v26 h18 V238 h36 v110 z" />
        <path d="M818 348 V276 h30 v-44 h34 v44 h18 v72 z" />
      </g>
      <g fill="#8fb8ff" opacity="0.5">
        {[
          [30, 292], [58, 268], [92, 311], [112, 252], [196, 244], [214, 286], [248, 264],
          [592, 262], [572, 302], [632, 246], [714, 252], [744, 292], [778, 268], [838, 258],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="4" height="6" opacity={0.35 + (i % 3) * 0.2} />
        ))}
      </g>
      <g fill="#f0abfc" opacity="0.5">
        <rect x="76" y="282" width="5" height="7" />
        <rect x="270" y="230" width="4" height="6" />
        <rect x="612" y="288" width="4" height="7" />
        <rect x="764" y="246" width="5" height="6" />
      </g>

      {/* near skyline */}
      <g fill={`url(#${id}-city2)`}>
        <path d="M0 380 V312 h54 v-20 h34 v20 h30 v68 z" />
        <path d="M126 380 V326 h48 v-16 h26 v16 h28 v54 z" opacity="0.9" />
        <path d="M586 380 V316 h38 v-24 h30 v24 h44 v64 z" />
        <path d="M724 380 V334 h44 v-18 h32 v18 h22 v46 z" opacity="0.9" />
      </g>

      {/* ground / platforms */}
      <path d="M0 440 H900 V560 H0 Z" fill="#070a16" />
      <g>
        <rect x="0" y="424" width="292" height="18" rx="4" fill={`url(#${id}-platform)`} />
        <rect x="0" y="424" width="292" height="2.5" fill={`url(#${id}-neonline)`} opacity="0.65" />
        <rect x="392" y="424" width="236" height="18" rx="4" fill={`url(#${id}-platform)`} />
        <rect x="392" y="424" width="236" height="2.5" fill={`url(#${id}-neonline)`} opacity="0.5" />
        <rect x="704" y="424" width="196" height="18" rx="4" fill={`url(#${id}-platform)`} />
        <rect x="704" y="424" width="196" height="2.5" fill={`url(#${id}-neonline)`} opacity="0.65" />
      </g>
      {/* spikes in pits */}
      <g fill="#d8b4fe">
        <path d="M318 424 l16 -34 l16 34 Z" opacity="0.9" />
        <path d="M350 424 l13 -26 l13 26 Z" opacity="0.7" />
        <path d="M652 424 l16 -32 l16 32 Z" opacity="0.9" />
        <path d="M684 424 l12 -24 l12 24 Z" opacity="0.7" />
      </g>
      <g filter={`url(#${id}-glow)`} opacity="0.55" fill="#a78bfa">
        <circle cx="334" cy="396" r="2" />
        <circle cx="668" cy="398" r="2" />
      </g>

      {/* coins */}
      <g filter={`url(#${id}-glow)`}>
        <circle cx="592" cy="366" r="9" fill="#f5c45a" />
        <circle cx="592" cy="366" r="4.5" fill="#fff1c6" opacity="0.8" />
        <circle cx="770" cy="336" r="8" fill="#f5c45a" opacity="0.85" />
        <circle cx="218" cy="368" r="7" fill="#f5c45a" opacity="0.7" />
      </g>

      {/* speed trails */}
      <g stroke={`url(#${id}-trail)`} strokeLinecap="round">
        <path d="M250 386 H360" strokeWidth="2.5" opacity="0.55" />
        <path d="M210 404 H330" strokeWidth="1.5" opacity="0.35" />
        <path d="M286 366 H360" strokeWidth="1" opacity="0.3" />
      </g>

      {/* runner */}
      <g transform="translate(500 300)">
        <ellipse cx="34" cy="140" rx="78" ry="14" fill="#02030a" opacity="0.6" />
        <g stroke="#e9d5ff" strokeWidth="1.2" fill="#0b0a18" strokeLinejoin="round">
          <circle cx="36" cy="18" r="15" />
          <path d="M32 34 C44 34 54 42 58 54 L64 76 C66 86 58 92 50 90 L34 84 L22 90 C14 94 6 86 10 76 L20 54 C24 42 26 34 32 34 Z" />
          <path d="M28 84 C20 106 24 122 4 136 L16 142 C40 128 44 108 48 94 Z" />
          <path d="M48 84 C58 104 64 118 88 128 L78 138 C52 134 40 114 34 96 Z" />
          <path d="M28 46 C12 50 0 62 -12 72 L-4 84 C14 76 26 70 36 66 Z" />
          <path d="M52 48 C66 56 70 70 84 78 L76 88 C60 82 48 74 40 66 Z" />
        </g>
        <g fill="none" stroke="#c084fc" strokeWidth="2" filter={`url(#${id}-glow)`} opacity="0.85">
          <circle cx="36" cy="18" r="15" />
          <path d="M32 34 C44 34 54 42 58 54 L64 76" />
        </g>
        <g fill="#38bdf8" filter={`url(#${id}-glow)`}>
          <circle cx="42" cy="16" r="2.5" />
        </g>
      </g>

      {/* foreground haze */}
      <rect x="0" y="472" width="900" height="88" fill="#05070f" opacity="0.55" />
    </svg>
  );
}

export function GameArt({
  art,
  className = "",
}: {
  art: "room" | "runner";
  className?: string;
}) {
  return art === "room" ? <RoomCardArt className={className} /> : <RunnerCardArt className={className} />;
}
