import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  Box,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Cog,
  Combine,
  DoorOpen,
  Eye,
  EyeOff,
  Flame,
  Grip,
  KeyRound,
  Lightbulb,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Wrench,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AchievementToasts } from "../components/SiteChrome";
import { Logo } from "../components/Brand";
import { Modal } from "../components/UI";
import { achievementById } from "../lib/achievements";
import { parseChallenge } from "../lib/challenges";
import { getDaily } from "../lib/daily";
import { formatDuration } from "../lib/games";
import { playCue } from "../lib/sound";
import { haptic } from "../lib/haptics";
import type { PlayMode, RunResult } from "../lib/types";
import { usePlayer } from "../state/player";
import { ITEMS, combineItems, getRoom, type Hotspot, type ItemDef, type ItemId, type RoomDef } from "../games/impossible-room/data";
import { PuzzleModal } from "../games/impossible-room/Puzzles";
import { RoomScene } from "../games/impossible-room/Scenes";

type Phase = "intro" | "playing" | "complete" | "escaped";

const ITEM_ICONS: Record<ItemDef["icon"], typeof KeyRound> = {
  key: KeyRound,
  box: Box,
  candle: Flame,
  flame: Flame,
  wrench: Wrench,
  cog: Cog,
  grip: Grip,
  lens: CircleDot,
};

const TINTS: Record<ItemDef["tint"], string> = {
  gold: "border-gold/30 bg-gold/[0.08] text-gold",
  blue: "border-blue-400/25 bg-blue-500/[0.08] text-blue-300",
  warm: "border-orange-400/25 bg-orange-500/[0.07] text-orange-300",
  steel: "border-slate-300/20 bg-slate-300/[0.06] text-slate-300",
};

const ROMAN = ["", "I", "II", "III"];

function ItemGlyph({ item, size = 15 }: { item: ItemId; size?: number }) {
  const Icon = ITEM_ICONS[ITEMS[item].icon];
  return <Icon size={size} />;
}

function InspectorContent({
  room,
  hotspot,
  flags,
  selectedItem,
  onClose,
  onTake,
  onUse,
  onPuzzle,
  onExit,
}: {
  room: RoomDef;
  hotspot: Hotspot;
  flags: Record<string, boolean>;
  selectedItem: ItemId | null;
  onClose: () => void;
  onTake: (hotspot: Hotspot) => void;
  onUse: (hotspot: Hotspot, item: ItemId) => void;
  onPuzzle: (id: string) => void;
  onExit: () => void;
}) {
  const taken = Boolean(flags[`taken:${hotspot.id}`]);
  const activeLook = hotspot.afterFlag && flags[hotspot.afterFlag.flag] ? hotspot.afterFlag.look : hotspot.look;
  const solvedPuzzle = hotspot.puzzle ? Boolean(flags[room.puzzles[hotspot.puzzle]?.successFlag]) : false;
  const exitOpen = Boolean(flags[room.exitFlag]);
  const useDone = hotspot.use?.setFlag ? Boolean(flags[hotspot.use.setFlag]) : false;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold text-gold/80">Inspection</p>
          <h2 className="mt-0.5 font-display text-base font-bold text-white">{hotspot.label}</h2>
        </div>
        <button onClick={onClose} aria-label="Close inspection" className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-500 hover:text-white focus-visible:outline-2 focus-visible:outline-accent">
          <X size={13} />
        </button>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-mist-400">{activeLook}</p>

      <div className="mt-4 space-y-2">
        {hotspot.take && !taken && (
          <button onClick={() => onTake(hotspot)} className="btn btn-primary w-full py-2.5 text-[11px]">
            <Backpack size={13} /> {hotspot.takeLabel ?? `Take ${ITEMS[hotspot.take].name}`}
          </button>
        )}
        {hotspot.take && taken && (
          <p className="flex items-center gap-1.5 rounded-lg border border-white/7 bg-white/[0.025] px-2.5 py-2 text-[10px] text-mist-600">
            <Check size={11} /> Taken, {ITEMS[hotspot.take].name}
          </p>
        )}

        {hotspot.use && !useDone && !exitOpen && (
          selectedItem ? (
            <button
              onClick={() => onUse(hotspot, selectedItem)}
              className={`btn w-full py-2.5 text-[11px] ${selectedItem === hotspot.use.item ? "btn-primary" : "btn-ghost"}`}
            >
              <ItemGlyph item={selectedItem} /> Use {ITEMS[selectedItem].name}
            </button>
          ) : (
            <p className="rounded-lg border border-white/7 bg-white/[0.025] px-2.5 py-2 text-[10px] leading-relaxed text-mist-600">
              Select an item from your inventory, then tap the room; or use it here.
            </p>
          )
        )}

        {hotspot.puzzle && !solvedPuzzle && (
          <button onClick={() => onPuzzle(hotspot.puzzle!)} className="btn btn-primary w-full py-2.5 text-[11px]">
            <Lock size={13} /> Examine the mechanism
          </button>
        )}

        {hotspot.id === room.doorId && exitOpen && (
          <button onClick={onExit} className="btn btn-gold w-full py-2.5 text-[11px]">
            <DoorOpen size={14} /> Step through the door <ArrowRight size={13} />
          </button>
        )}

        {solvedPuzzle && hotspot.id !== room.doorId && (
          <p className="flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-2.5 py-2 text-[10px] text-emerald-300/80">
            <Check size={11} /> Mechanism solved
          </p>
        )}
      </div>

      <div className="mt-auto pt-4">
        <p className="text-[9px] text-mist-600">
          {selectedItem ? `Holding, ${ITEMS[selectedItem].name}` : "Tap another point to keep searching"}
        </p>
      </div>
    </div>
  );
}

function CombineModal({
  open,
  onClose,
  items,
  onCombine,
}: {
  open: boolean;
  onClose: () => void;
  items: ItemId[];
  onCombine: (a: ItemId, b: ItemId) => boolean;
}) {
  const [picked, setPicked] = useState<ItemId[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPicked([]);
      setError("");
    }
  }, [open]);

  const toggle = (item: ItemId) => {
    setError("");
    setPicked((prev) => {
      if (prev.includes(item)) return prev.filter((i) => i !== item);
      if (prev.length >= 2) return [prev[1], item];
      return [...prev, item];
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Combine items">
      <p className="text-[12px] leading-relaxed text-mist-400">
        Some objects are more useful together. Pick two from your inventory.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {items.map((item) => {
          const selected = picked.includes(item);
          return (
            <button
              key={item}
              onClick={() => toggle(item)}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                selected ? "border-accent/50 bg-accent/10" : "border-white/8 bg-white/[0.02] hover:border-white/20"
              }`}
              aria-pressed={selected}
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg border ${TINTS[ITEMS[item].tint]}`}>
                <ItemGlyph item={item} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-bold text-mist-100">{ITEMS[item].name}</span>
                <span className="block truncate text-[9px] text-mist-600">tap to select</span>
              </span>
              {selected && <Check size={13} className="ml-auto shrink-0 text-accent" />}
            </button>
          );
        })}
      </div>
      {items.length < 2 && (
        <p className="mt-3 text-[10px] text-mist-600">You need at least two items to try a combination.</p>
      )}
      {error && <p className="mt-3 text-center text-[11px] font-semibold text-red-300/80">{error}</p>}
      <div className="mt-5 flex gap-2">
        <button onClick={onClose} className="btn btn-ghost flex-1 py-2.5 text-xs">Cancel</button>
        <button
          disabled={picked.length !== 2}
          onClick={() => {
            const ok = onCombine(picked[0], picked[1]);
            if (!ok) setError("Those two don't belong together.");
          }}
          className="btn btn-primary flex-1 py-2.5 text-xs"
        >
          <Combine size={13} /> Combine
        </button>
      </div>
    </Modal>
  );
}

export default function ImpossibleRoom() {
  const { state, recordRoomStage, registerChallenge, updateSettings } = usePlayer();
  const [searchParams] = useSearchParams();
  const soundOn = state.settings.sound;
  const hapticsOn = state.settings.haptics;

  const cue = (type: Parameters<typeof playCue>[0]) => {
    playCue(type, soundOn);
    if (hapticsOn) {
      haptic(type === "error" ? "heavy" : type === "success" || type === "unlock" ? "medium" : "light", true);
    }
  };

  const rawMode = searchParams.get("mode");
  const mode: PlayMode = rawMode === "daily" || rawMode === "challenge" ? rawMode : "solo";
  const challenge = parseChallenge("impossible-room", searchParams);
  const daily = getDaily("impossible-room");
  const dailyRecord = state.dailies[daily.key];
  const requestedChapter = Number(searchParams.get("chapter"));
  const initialChapter =
    mode === "solo"
      ? Math.min(
          state.room.unlocked,
          Math.min(3, Math.max(1, Number.isFinite(requestedChapter) && requestedChapter > 0 ? requestedChapter : state.room.unlocked)),
        )
      : 1;

  const [chapter, setChapter] = useState(initialChapter);
  const [phase, setPhase] = useState<Phase>("intro");
  const [runInProgress, setRunInProgress] = useState(false);
  const [fullRunEligible, setFullRunEligible] = useState(mode === "solo" && initialChapter === 1);
  const [startedAtChapterOne, setStartedAtChapterOne] = useState(initialChapter === 1);
  const [chapterTimes, setChapterTimes] = useState<Record<number, number>>({});
  const [hintsByChapter, setHintsByChapter] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [inventory, setInventory] = useState<ItemId[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemId | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [paused, setPaused] = useState(false);
  const [combineOpen, setCombineOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [finishedTime, setFinishedTime] = useState<number | null>(null);
  const [totalEscapeMs, setTotalEscapeMs] = useState<number | null>(null);
  const [labelsOn, setLabelsOn] = useState(false);
  const completing = useRef(false);
  const registeredChallenge = useRef<string | null>(null);

  const room = getRoom(chapter);
  const activeHotspot = room.hotspots.find((h) => h.id === inspectId) ?? null;
  const activePuzzle = puzzleId ? room.puzzles[puzzleId] : null;
  const hintCount = hintsByChapter[chapter] ?? 0;
  const totalHints = Object.values(hintsByChapter).reduce((a, b) => a + b, 0);
  const exitOpen = Boolean(flags[room.exitFlag]);

  useEffect(() => {
    document.title = "The Impossible Room — PLAYFLIX";
    return () => {
      document.title = "PLAYFLIX — Play. Challenge. Compete.";
    };
  }, []);

  useEffect(() => {
    if (mode === "challenge" && challenge && registeredChallenge.current !== challenge.id) {
      registeredChallenge.current = challenge.id;
      registerChallenge({
        id: challenge.id,
        game: "impossible-room",
        seed: challenge.seed,
        target: challenge.target,
        from: challenge.from,
      });
    }
  }, [mode, challenge, registerChallenge]);

  // Chapter timer. It keeps counting through inspections and puzzles, stops on pause.
  useEffect(() => {
    if (phase !== "playing" || paused) return;
    const id = window.setInterval(() => setElapsed((e) => e + 100), 100);
    return () => window.clearInterval(id);
  }, [phase, paused]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "playing" || paused || puzzleId || showHints || combineOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setShowHints(true);
      } else if (e.key === "p" || e.key === "P") {
        setPaused(true);
      } else if (e.key === "Escape" && inspectId) {
        setInspectId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, paused, puzzleId, showHints, combineOpen, inspectId]);

  const resetRuntime = () => {
    setFlags({});
    setInventory([]);
    setSelectedItem(null);
    setInspectId(null);
    setPuzzleId(null);
    setShowHints(false);
    setCombineOpen(false);
    setNotice(null);
    setElapsed(0);
    setResult(null);
    setFinishedTime(null);
    setTotalEscapeMs(null);
    setPaused(false);
    completing.current = false;
  };

  const beginRun = () => {
    if (!runInProgress) {
      setChapterTimes({});
      setHintsByChapter({});
      setStartedAtChapterOne(chapter === 1);
      setFullRunEligible(mode === "solo" && chapter === 1);
      setRunInProgress(true);
    }
    resetRuntime();
    setPhase("playing");
    cue("start");
  };

  const startFresh = (targetChapter: number) => {
    setChapter(targetChapter);
    setRunInProgress(false);
    setFullRunEligible(false);
    setStartedAtChapterOne(targetChapter === 1);
    setChapterTimes({});
    setHintsByChapter({});
    resetRuntime();
    setPhase("intro");
  };

  const selectChapter = (n: number) => {
    if (runInProgress || phase !== "intro" || n > state.room.unlocked) return;
    setChapter(n);
    setFlags({});
    setInventory([]);
    setSelectedItem(null);
    setInspectId(null);
    setElapsed(0);
    setNotice(null);
  };

  const goNextChapter = () => {
    if (chapter >= 3) return;
    setChapter(chapter + 1);
    resetRuntime();
    setPhase("intro");
  };

  const completeStage = () => {
    if (phase !== "playing" || completing.current) return;
    completing.current = true;
    const timeMs = Math.max(1000, Math.round(elapsed));
    const times = { ...chapterTimes, [chapter]: timeMs };
    let fullTotal: number | null = null;
    if (chapter === 3 && fullRunEligible && startedAtChapterOne && times[1] && times[2]) {
      fullTotal = times[1] + times[2] + times[3];
    }

    const res = recordRoomStage({
      stage: chapter,
      timeMs,
      hintsThisChapter: hintCount,
      hintsThisRun: totalHints,
      daily: mode === "daily" && chapter === 1,
      challengeId: mode === "challenge" && chapter === 1 ? challenge?.id ?? null : null,
      startedFromChapterOne: Boolean(fullRunEligible && startedAtChapterOne && fullTotal != null),
      totalRunMs: fullTotal,
    });

    setChapterTimes(times);
    setTotalEscapeMs(fullTotal);
    setResult(res);
    setFinishedTime(timeMs);
    setInspectId(null);
    setSelectedItem(null);
    setPaused(false);
    setPhase(mode === "solo" && chapter === 3 ? "escaped" : "complete");
    cue("unlock");
  };

  const takeItem = (hotspot: Hotspot) => {
    if (!hotspot.take || flags[`taken:${hotspot.id}`]) return;
    const item = hotspot.take;
    setFlags((prev) => ({ ...prev, [`taken:${hotspot.id}`]: true }));
    setInventory((prev) => (prev.includes(item) ? prev : [...prev, item]));
    setNotice(`Acquired: ${ITEMS[item].name}. ${ITEMS[item].description}`);
    cue("coin");
  };

  const useItem = (hotspot: Hotspot, item: ItemId) => {
    const use = hotspot.use;
    if (!use || use.item !== item) {
      setNotice(`${ITEMS[item].name} doesn't belong there.`);
      setInspectId(hotspot.id);
      cue("error");
      return;
    }
    if (use.setFlag && flags[use.setFlag]) {
      setNotice("That's already been done.");
      return;
    }
    setFlags((prev) => ({ ...prev, ...(use.setFlag ? { [use.setFlag]: true } : {}) }));
    if (use.give) {
      setInventory((prev) => (prev.includes(use.give!) ? prev : [...prev, use.give!]));
    }
    if (use.consume) {
      setInventory((prev) => prev.filter((i) => i !== item));
    }
    setSelectedItem(null);
    setInspectId(null);
    setNotice(`${use.text}${use.give ? ` Acquired: ${ITEMS[use.give].name}.` : ""}`);
    cue("success");
  };

  const interact = (hotspot: Hotspot) => {
    if (phase !== "playing") return;
    if (selectedItem) {
      useItem(hotspot, selectedItem);
      return;
    }
    cue("click");
    if (hotspot.id === room.doorId && exitOpen) {
      setInspectId(hotspot.id);
      return;
    }
    if (hotspot.puzzle && !flags[room.puzzles[hotspot.puzzle]?.successFlag]) {
      setPuzzleId(hotspot.puzzle);
      return;
    }
    setInspectId(hotspot.id);
  };

  const handlePuzzleSolved = () => {
    if (!puzzleId) return;
    const puzzle = room.puzzles[puzzleId];
    if (!puzzle) return;
    setFlags((prev) => ({ ...prev, [puzzle.successFlag]: true }));
    if (puzzle.give) {
      setInventory((prev) => (prev.includes(puzzle.give!) ? prev : [...prev, puzzle.give!]));
    }
    if (puzzle.successFlag === room.exitFlag) {
      setNotice("The way out is open. Inspect the door when you're ready to leave.");
    } else {
      setNotice(puzzle.successText);
    }
  };

  const handleCombine = (a: ItemId, b: ItemId) => {
    const resultItem = combineItems(a, b);
    if (!resultItem) {
      cue("error");
      return false;
    }
    setInventory((prev) => [...prev.filter((i) => i !== a && i !== b), resultItem]);
    setSelectedItem(null);
    setNotice(`You combine ${ITEMS[a].name.toLowerCase()} and ${ITEMS[b].name.toLowerCase()} → ${ITEMS[resultItem].name}. ${ITEMS[resultItem].description}`);
    setCombineOpen(false);
    cue("success");
    return true;
  };

  const revealHint = () => {
    if (hintCount >= room.hints.length) return;
    setHintsByChapter((prev) => ({ ...prev, [chapter]: hintCount + 1 }));
    cue("click");
  };

  const restartChapter = () => {
    startFresh(chapter);
    cue("click");
  };

  const unlockedDefs = (result?.newAchievements ?? []).flatMap((id) => {
    const def = achievementById(id);
    return def ? [def] : [];
  });

  const dailyPassed = finishedTime != null && finishedTime <= daily.target;
  const challengePassed = finishedTime != null && challenge != null && finishedTime < challenge.target;
  const isFinalMode = mode !== "solo";

  const inspector = activeHotspot ? (
    <InspectorContent
      room={room}
      hotspot={activeHotspot}
      flags={flags}
      selectedItem={selectedItem}
      onClose={() => setInspectId(null)}
      onTake={takeItem}
      onUse={useItem}
      onPuzzle={(id) => setPuzzleId(id)}
      onExit={completeStage}
    />
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-shade">
      <AchievementToasts />

      {/* Top HUD */}
      <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-white/8 bg-shade/90 px-2.5 backdrop-blur-xl sm:px-4">
        <Link
          to="/games/impossible-room"
          aria-label="Back to game overview"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-mist-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-white sm:text-xs">The Impossible Room</p>
          <p className="truncate text-[9px] font-semibold text-mist-600">
            Chapter {ROMAN[chapter]}, {room.name}
            {mode !== "solo" && <span className="text-gold">, {mode === "daily" ? "Daily" : "Challenge"}</span>}
          </p>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex" aria-label={`Chapter ${chapter} of 3`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 w-5 origin-left rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none ${n === chapter ? "scale-x-100 bg-gold" : n < chapter ? "scale-x-[0.375] bg-gold/40" : "scale-x-[0.375] bg-white/15"}`} />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-mist-200">
          <Clock3 size={12} className="text-gold" />
          <span className="font-display text-[11px] font-bold tabular-nums">{formatDuration(elapsed)}</span>
        </div>
        <button
          onClick={() => setShowHints(true)}
          className="relative grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-mist-400 transition hover:text-gold"
          aria-label="Hints"
        >
          <Lightbulb size={15} />
          {hintCount > 0 && (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-gold text-[8px] font-extrabold text-accent-ink">{hintCount}</span>
          )}
        </button>
        <button
          onClick={() => setPaused(true)}
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-mist-400 transition hover:text-white"
          aria-label="Pause"
        >
          <Pause size={15} />
        </button>
      </header>

      {/* Scene */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-30 blur-2xl">
          <RoomScene roomId={room.id} flags={flags} className="h-full w-full scale-110" />
        </div>
        <div className="pointer-events-none absolute inset-0 vignette-deep" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-2 p-2 sm:p-3">
          <div
            className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-xl border border-white/12 shadow-cinema md:w-[min(100%,calc((100dvh-10rem)*1.5))]"
            onClick={() => setInspectId(null)}
          >
            <RoomScene roomId={room.id} flags={flags} className="absolute inset-0 h-full w-full" />
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5" />
            <div className="pointer-events-none absolute inset-0 vignette-soft" />

            <div className="absolute left-2.5 top-2.5 z-20 hidden sm:left-3.5 sm:top-3.5 md:block">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[8px] font-bold text-white/70 backdrop-blur-md">
                <span className="size-1 rounded-full bg-gold" /> {room.objective}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLabelsOn((v) => !v);
              }}
              className="absolute right-2.5 top-2.5 z-20 grid size-7 place-items-center rounded-full border border-white/10 bg-black/40 text-white/60 backdrop-blur-md transition hover:text-white sm:right-3.5 sm:top-3.5"
              aria-label={labelsOn ? "Hide object labels" : "Show object labels"}
            >
              {labelsOn ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>

            {/* hotspots */}
            {room.hotspots.map((hs) => {
              const taken = Boolean(flags[`taken:${hs.id}`]);
              const done = taken || (hs.puzzle ? Boolean(flags[room.puzzles[hs.puzzle]?.successFlag]) : false);
              return (
                <button
                  key={hs.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    interact(hs);
                  }}
                  className="group absolute z-20 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center"
                  style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                  aria-label={`${hs.label}${done ? " (explored)" : ""}`}
                >
                  <span className={`absolute size-7 rounded-full border ${done ? "border-white/15" : hs.ambient ? "border-white/20" : "animate-pulse motion-reduce:animate-none border-gold/40"}`} />
                  <span
                    className={`relative size-2.5 rounded-full glow-gold transition group-hover:scale-125 ${
                      done ? "bg-white/35" : hs.ambient ? "bg-white/50" : "bg-gold"
                    }`}
                  />
                  <span
                    className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-shade/90 px-1.5 py-0.5 text-[8px] font-semibold text-white/80 backdrop-blur transition-opacity ${
                      labelsOn ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {hs.label}
                  </span>
                </button>
              );
            })}

            {exitOpen && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 gold-rim" />
            )}

            {notice && (
              <div onClick={(e) => e.stopPropagation()} className="absolute inset-x-2 bottom-2 z-30 hidden items-start gap-2 rounded-lg border border-gold/25 bg-shade/95 px-3 py-2.5 text-[10px] leading-relaxed text-mist-200 shadow-xl backdrop-blur-md sm:inset-x-auto sm:left-3 sm:max-w-md md:flex">
                <Sparkles size={13} className="mt-0.5 shrink-0 text-gold" />
                <span>{notice}</span>
                <button onClick={(e) => { e.stopPropagation(); setNotice(null); }} className="ml-1 shrink-0 text-mist-600 hover:text-white" aria-label="Dismiss message">
                  <X size={11} />
                </button>
              </div>
            )}

            {inspector && (
              <div className="absolute bottom-2 right-2 top-2 z-30 hidden w-72 overflow-y-auto rounded-xl border border-white/12 bg-shade/90 p-4 shadow-2xl backdrop-blur-xl md:block" onClick={(e) => e.stopPropagation()}>
                {inspector}
              </div>
            )}
          </div>

          {/* Mobile / tablet field journal */}
          <div className="panel relative w-full min-h-[10rem] flex-1 overflow-y-auto rounded-xl p-4 md:hidden">
            {inspector ?? (
              <div className="flex h-full min-h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                                        <h2 className="mt-1 font-display text-[15px] font-bold leading-snug text-white">{room.objective}</h2>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/20 bg-gold/[0.06] font-display text-base font-extrabold text-gold">{ROMAN[chapter]}</span>
                </div>

                {notice ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-gold/20 bg-gold/[0.04] px-3 py-2.5">
                    <Sparkles size={12} className="mt-0.5 shrink-0 text-gold" />
                    <p className="text-[11px] leading-relaxed text-mist-300">{notice}</p>
                  </div>
                ) : (
                  <p className="mt-2.5 text-[11px] leading-relaxed text-mist-500">
                    Search carefully. Tap a glowing point to inspect it, then collect or use what you find.
                  </p>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/7 bg-white/[0.025] px-2.5 py-2">
                    <p className="text-[8px] font-bold text-mist-600">Carrying</p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-mist-300">{inventory.length ? inventory.map((i) => ITEMS[i].name).join(", ") : "Nothing yet"}</p>
                  </div>
                  <div className="rounded-lg border border-white/7 bg-white/[0.025] px-2.5 py-2">
                    <p className="text-[8px] font-bold text-mist-600">Explored</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-mist-300">
                      {room.hotspots.filter((h) => flags[`taken:${h.id}`] || (h.puzzle && flags[room.puzzles[h.puzzle]?.successFlag])).length} / {room.hotspots.length} points
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/7 bg-white/[0.025] px-2.5 py-2">
                    <p className="text-[8px] font-bold text-mist-600">Hints</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-mist-300">{hintCount} / {room.hints.length} used</p>
                  </div>
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-mist-600">{room.intro}</p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="flex items-center gap-1.5 text-[9px] text-mist-600"><span className="size-1.5 rounded-full bg-gold" /> Tap a glowing point</span>
                  <button onClick={() => setShowHints(true)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[9px] font-bold text-mist-300">
                    <Lightbulb size={11} /> Need a hint?
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory */}
      {phase === "playing" && (
      <div className="relative z-30 shrink-0 border-t border-white/8 bg-shade/95 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        {selectedItem && (
          <div className="flex items-center justify-between gap-3 border-b border-accent/20 bg-accent/[0.06] px-3 py-1.5">
            <p className="flex min-w-0 items-center gap-1.5 text-[10px] text-accent">
              <ItemGlyph item={selectedItem} size={12} />
              <span className="font-medium">{ITEMS[selectedItem].name}</span>
              <span className="truncate text-accent/50">. Tap an object in the room to use it</span>
            </p>
            <button onClick={() => setSelectedItem(null)} className="shrink-0 text-[9px] font-medium text-accent/70 hover:text-accent">Cancel</button>
          </div>
        )}
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-2.5 py-2">
          <div className="flex shrink-0 items-center gap-1.5 text-[9px] font-bold text-mist-600">
            <Backpack size={13} /> <span className="hidden sm:inline">Inventory</span>
          </div>
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {inventory.length === 0 ? (
              <p className="text-[10px] text-mist-600">Empty. Search the room.</p>
            ) : (
              inventory.map((item) => {
                const selected = selectedItem === item;
                return (
                  <button
                    key={item}
                    onClick={() => {
                      setSelectedItem(selected ? null : item);
                      cue("click");
                    }}
                    className={`flex shrink-0 items-center gap-1.5 border px-2 py-1.5 transition ${
                      selected ? "border-accent/60 bg-accent/10" : `${TINTS[ITEMS[item].tint]} hover:brightness-125`
                    }`}
                    aria-pressed={selected}
                    aria-label={`${ITEMS[item].name}${selected ? ", selected" : ""}`}
                  >
                    <ItemGlyph item={item} size={14} />
                    <span className="text-[10px] font-semibold text-mist-100">{ITEMS[item].name}</span>
                  </button>
                );
              })
            )}
          </div>
          <button
            onClick={() => setCombineOpen(true)}
            disabled={inventory.length < 2}
            className="flex shrink-0 items-center gap-1.5 border border-rule px-2.5 py-1.5 text-[10px] font-medium text-mist-400 transition hover:text-ink disabled:opacity-35"
            aria-label="Combine two items"
          >
            <Combine size={13} /> <span className="hidden sm:inline">Combine</span>
          </button>
        </div>
      </div>
      )}

      {/* Intro overlay */}
      {phase === "intro" && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-shade/94 backdrop-blur-md">
          <div className="pointer-events-none fixed inset-0 opacity-30">
            <RoomScene roomId={room.id} flags={{}} className="h-full w-full scale-[1.16] translate-x-[6%]" />
            <div className="absolute inset-0 vignette-deep" />
          </div>
          <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-5 sm:px-6 sm:py-8">
            <div className="flex items-center justify-between">
              <Logo size={28} />
              <Link to="/games/impossible-room" className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-semibold text-mist-400 transition hover:text-white">
                <ArrowLeft size={12} /> Leave
              </Link>
            </div>

            <div className="my-auto py-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip border-accent/25 text-accent">Chapter {ROMAN[chapter]} / III</span>
                {mode === "daily" && <span className="chip border-gold/30 text-gold"><Target size={10} /> Daily, under {formatDuration(daily.target)}</span>}
                {mode === "challenge" && challenge && <span className="chip border-white/15">Challenge from {challenge.from}, beat {formatDuration(challenge.target)}</span>}
                {mode === "solo" && state.room.completedLevels.includes(chapter) && <span className="chip border-success/30 text-success"><Check size={10} /> Cleared</span>}
              </div>

              <h1 className="mt-5 font-display text-[clamp(2.6rem,8vw,4.8rem)] font-medium uppercase leading-[0.9] tracking-[-0.05em] text-ink">
                {room.name}
              </h1>
              <p className="serif mt-3 text-[clamp(1.1rem,2vw,1.4rem)] text-mist-400">{room.subtitle}</p>
              <p className="mt-5 max-w-lg text-[13px] leading-relaxed text-mist-400">{room.intro}</p>

              <div className="mt-7 border-l border-accent/50 pl-4">
                <p className="label !text-accent">Objective</p>
                <p className="mt-1.5 text-[13px] font-medium text-ink-2">{room.objective}</p>
              </div>

              {mode === "daily" && dailyRecord && (
                <p className="mt-3 text-[11px] text-mist-500">
                  {dailyRecord.completed ? "Already cleared today." : "Attempt recorded."} Best today: <span className="font-semibold text-mist-200">{formatDuration(dailyRecord.score)}</span>
                </p>
              )}
              {mode === "challenge" && !challenge && (
                <p className="mt-3 rounded-lg border border-orange-400/20 bg-orange-400/[0.05] px-3 py-2 text-[10px] text-orange-200/80">
                  This challenge link is incomplete. You can still play the chapter solo.
                </p>
              )}

              {mode === "solo" && !runInProgress && (
                <div className="mt-6">
                  <p className="label mb-3">Start from</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((n) => {
                      const r = getRoom(n);
                      const locked = n > state.room.unlocked;
                      return (
                        <button
                          key={n}
                          onClick={() => selectChapter(n)}
                          disabled={locked}
                          className={`border bg-shade/45 p-3 text-left backdrop-blur-sm transition ${
                            chapter === n ? "border-accent/45 bg-accent/[0.09]" : "border-rule hover:border-white/25"
                          } disabled:cursor-not-allowed disabled:opacity-35`}
                        >
                          <span className={`label !text-[8px] ${chapter === n ? "!text-accent" : ""}`}>Chapter {ROMAN[n]}</span>
                          <span className="mt-1.5 block min-h-[30px] text-[11px] font-medium leading-snug text-ink-2 line-clamp-2">{r.name}</span>
                          <span className="mt-1 block text-[8px] text-mist-600">{locked ? "Locked" : state.room.completedLevels.includes(n) ? `Best ${formatDuration(state.room.bestTimes[n] ?? 0)}` : "Unplayed"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                <button onClick={beginRun} className="btn btn-primary flex-1 py-3.5 text-sm">
                  <Play size={15} fill="currentColor" /> {runInProgress ? "Continue" : "Enter the room"}
                </button>
                {mode !== "solo" && (
                  <Link to="/challenges" className="btn btn-ghost justify-center px-4 py-3.5 text-xs">
                    Back to challenges
                  </Link>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] text-mist-600">
                <span>Tap glowing points to inspect</span>
                <span className="text-white/10">/</span>
                <span>Select items, then tap objects</span>
                <span className="text-white/10">/</span>
                <span>Combine items from the inventory</span>
                <span className="text-white/10">/</span>
                <span><span className="keycap mr-1">H</span> for a hint</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results overlay */}
      {(phase === "complete" || phase === "escaped") && result && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-shade/94 backdrop-blur-md">
          <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-8">
            <div className="panel panel-glow fade-up relative overflow-hidden p-6 text-center sm:p-8">
              <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
              <div className={`relative mx-auto grid size-16 place-items-center rounded-full border ${phase === "escaped" ? "border-gold/40 bg-gold/10 text-gold" : "border-accent/30 bg-accent/10 text-accent"}`}>
                {phase === "escaped" ? <Trophy size={30} /> : <Check size={30} />}
              </div>
              <p className="mt-4 text-[9px] font-extrabold text-gold/80">
                {phase === "escaped" ? "The Impossible Room" : `Chapter ${ROMAN[chapter]}`}
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-[-0.03em] text-white">
                {phase === "escaped" ? "You escaped." : "Chapter cleared."}
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
                {phase === "escaped"
                  ? "The last door closes behind you. Whatever the room was keeping, it has let go."
                  : "The mechanism gives way. There is another room beyond this one."}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-3">
                  <p className="text-[8px] font-bold text-mist-600">Chapter time</p>
                  <p className="mt-1 font-display text-lg font-extrabold tabular-nums text-white">{formatDuration(finishedTime ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-3">
                  <p className="text-[8px] font-bold text-mist-600">Escape time</p>
                  <p className={`mt-1 font-display text-lg font-extrabold tabular-nums ${phase === "escaped" ? "text-gold" : "text-mist-500"}`}>
                    {phase === "escaped" ? (totalEscapeMs ? formatDuration(totalEscapeMs) : "—") : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-3">
                  <p className="text-[8px] font-bold text-mist-600">Hints</p>
                  <p className="mt-1 font-display text-lg font-extrabold tabular-nums text-white">{totalHints}</p>
                </div>
              </div>

              {isFinalMode && (
                <div className={`mt-3 rounded-xl border px-3.5 py-3 text-left ${(mode === "daily" ? dailyPassed : challengePassed) ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-orange-400/20 bg-orange-400/[0.04]"}`}>
                  <p className={`flex items-center gap-1.5 text-[10px] font-bold ${(mode === "daily" ? dailyPassed : challengePassed) ? "text-emerald-300" : "text-orange-300"}`}>
                    {(mode === "daily" ? dailyPassed : challengePassed) ? <Check size={12} /> : <Target size={12} />}
                    {mode === "daily" ? (dailyPassed ? "Daily challenge complete" : "Daily target missed") : (challengePassed ? "You beat the challenge" : "The challenge stands")}
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-mist-500">
                    {mode === "daily"
                      ? `Target: under ${formatDuration(daily.target)}, Your time ${formatDuration(finishedTime ?? 0)}${dailyPassed ? `, +${daily.reward} coins` : ""}`
                      : challenge
                        ? `${challenge.from}'s time to beat: ${formatDuration(challenge.target)}, You: ${formatDuration(finishedTime ?? 0)}`
                        : "Challenge data missing."}
                  </p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-[11px]">
                <span className="flex items-center gap-1 text-gold"><Sparkles size={12} /> +{result.coins} coins</span>
                <span className="h-3 w-px bg-white/10" />
                <span className="text-mist-400">+{result.xp} XP</span>
                {result.newBest && <><span className="h-3 w-px bg-white/10" /><span className="font-bold text-gold">New record</span></>}
              </div>

              {unlockedDefs.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {unlockedDefs.map((def) => (
                    <div key={def.id} className="flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/[0.05] px-3 py-2 text-left">
                      <Trophy size={13} className="shrink-0 text-gold" />
                      <span className="text-[10px] font-bold text-gold">{def.name}</span>
                      <span className="truncate text-[9px] text-mist-600">{def.description}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-2">
                {mode === "solo" && chapter < 3 && (
                  <button onClick={goNextChapter} className="btn btn-primary w-full py-3 text-xs">
                    Continue to Chapter {ROMAN[chapter + 1]} <ChevronRight size={14} />
                  </button>
                )}
                {mode !== "solo" ? (
                  <>
                    <Link to="/challenges" className="btn btn-primary w-full py-3 text-xs">
                      Back to challenges <ArrowRight size={14} />
                    </Link>
                    <button onClick={() => startFresh(1)} className="btn btn-ghost w-full py-2.5 text-[11px]">
                      <RotateCcw size={12} /> Try this chapter again
                    </button>
                  </>
                ) : (
                  <>
                    {phase === "escaped" ? (
                      <>
                        <Link to="/challenges" className="btn btn-primary w-full py-3 text-xs">
                          Challenge a friend <ChevronRight size={14} />
                        </Link>
                        <button onClick={() => startFresh(1)} className="btn btn-ghost w-full py-2.5 text-[11px]">
                          <RotateCcw size={12} /> Run the full escape again
                        </button>
                      </>
                    ) : (
                      <button onClick={restartChapter} className="btn btn-ghost w-full py-2.5 text-[11px]">
                        <RotateCcw size={12} /> Replay this chapter
                      </button>
                    )}
                    <Link to="/games/impossible-room" className="btn btn-ghost w-full py-2.5 text-[11px]">
                      Back to game overview
                    </Link>
                  </>
                )}
              </div>
            </div>
            <p className="mt-4 text-center text-[9px] text-mist-600">Chapter progress saved, Keep exploring</p>
          </div>
        </div>
      )}

      {/* Hints */}
      <Modal open={showHints} onClose={() => setShowHints(false)} title={`Hints, Chapter ${ROMAN[chapter]}`}>
        <p className="text-[12px] leading-relaxed text-mist-400">
          Hints are always available. The trophy room remembers how many you needed.
        </p>
        <div className="mt-4 space-y-2">
          {room.hints.slice(0, hintCount).map((hint, i) => (
            <div key={i} className="flex gap-2.5 rounded-xl border border-gold/15 bg-gold/[0.04] px-3 py-2.5">
              <span className="font-display text-[11px] font-bold text-gold/70">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-[11px] leading-relaxed text-mist-300">{hint}</p>
            </div>
          ))}
          {hintCount === 0 && (
            <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-3 py-6 text-center text-[11px] text-mist-600">
              No hints revealed yet. Take a careful look around first.
            </p>
          )}
        </div>
        <button onClick={revealHint} disabled={hintCount >= room.hints.length} className="btn btn-primary mt-4 w-full py-3 text-xs">
          <Lightbulb size={14} /> {hintCount >= room.hints.length ? "All hints revealed" : hintCount === 0 ? "Reveal a hint" : "Reveal the next hint"}
        </button>
        <p className="mt-3 text-center text-[9px] text-mist-600">{hintCount} of {room.hints.length} hints used this chapter</p>
      </Modal>

      {/* Pause */}
      <Modal open={paused} onClose={() => setPaused(false)} title="Paused">
        <p className="text-[12px] leading-relaxed text-mist-400">The room can wait. Your timer has stopped.</p>
        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.025] p-3.5">
          <p className="text-[9px] font-bold text-mist-600">Objective</p>
          <p className="mt-1 text-[12px] font-semibold text-mist-200">{room.objective}</p>
          <p className="mt-2 text-[10px] text-mist-600">{inventory.length} items, {hintCount} hints, Chapter {ROMAN[chapter]} of III</p>
        </div>
        <div className="mt-4 space-y-2">
          <button onClick={() => setPaused(false)} className="btn btn-primary w-full py-3 text-xs">
            <Play size={13} fill="currentColor" /> Resume
          </button>
          <button onClick={() => { setPaused(false); setShowHints(true); }} className="btn btn-ghost w-full py-2.5 text-[11px]">
            <Lightbulb size={13} /> Hints
          </button>
          <button
            onClick={() => updateSettings({ sound: !soundOn })}
            className="btn btn-ghost w-full py-2.5 text-[11px]"
          >
            Sound {soundOn ? "on" : "off"}
          </button>
          <button onClick={restartChapter} className="btn btn-ghost w-full py-2.5 text-[11px]">
            <RotateCcw size={13} /> Restart chapter
          </button>
        </div>
        <Link to="/games/impossible-room" className="mt-3 block text-center text-[10px] text-mist-600 hover:text-mist-300">
          Leave the room (chapter progress resets)
        </Link>
      </Modal>

      {activePuzzle && (
        <PuzzleModal
          puzzle={activePuzzle}
          open={Boolean(puzzleId)}
          onClose={() => setPuzzleId(null)}
          onSolved={handlePuzzleSolved}
        />
      )}

      <CombineModal open={combineOpen} onClose={() => setCombineOpen(false)} items={inventory} onCombine={handleCombine} />
    </div>
  );
}
