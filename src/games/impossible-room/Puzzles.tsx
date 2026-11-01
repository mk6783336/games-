import { useEffect, useState } from "react";
import { ArrowUp, Check, ChevronDown, ChevronUp, Delete, LockKeyhole, Moon, Sparkles, Star, Sun } from "lucide-react";
import { Modal } from "../../components/UI";
import { playCue } from "../../lib/sound";
import { usePlayer } from "../../state/player";
import { ITEMS, type PuzzleDef } from "./data";

const SYMBOLS = [
  { id: "moon" as const, label: "Crescent moon", icon: Moon },
  { id: "star" as const, label: "Star", icon: Star },
  { id: "sun" as const, label: "Sun", icon: Sun },
];

export function PuzzleModal({
  puzzle,
  open,
  onClose,
  onSolved,
}: {
  puzzle: PuzzleDef;
  open: boolean;
  onClose: () => void;
  onSolved: () => void;
}) {
  const { state } = usePlayer();
  const [digits, setDigits] = useState("");
  const [slots, setSlots] = useState<("moon" | "star" | "sun")[]>(["sun", "star", "moon"]);
  const [dials, setDials] = useState<number[]>([3, 5, 1]);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDigits("");
    setSlots(["sun", "star", "moon"]);
    setDials([3, 5, 1]);
    setError("");
    setAttempts(0);
    setSolved(false);
  }, [open, puzzle.title]);

  const evaluate = (correct: boolean) => {
    if (solved) return;
    if (correct) {
      setSolved(true);
      setError("");
      playCue("success", state.settings.sound);
      onSolved();
    } else {
      setAttempts((a) => a + 1);
      setError("That isn't it. The mechanism holds.");
      playCue("error", state.settings.sound);
    }
  };

  const submit = () => {
    if (puzzle.kind === "keypad") {
      evaluate(digits === puzzle.code);
      if (digits !== puzzle.code) setDigits("");
    }
    if (puzzle.kind === "symbols") {
      evaluate((puzzle.sequence ?? []).every((s, i) => slots[i] === s));
    }
    if (puzzle.kind === "rings") {
      evaluate((puzzle.rings ?? []).every((n, i) => dials[i] === n));
    }
  };

  // Physical keyboard support for the keypad.
  useEffect(() => {
    if (!open || solved || puzzle.kind !== "keypad") return;
    const handler = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setDigits((d) => (d + e.key).slice(0, puzzle.code?.length ?? 3));
        playCue("click", state.settings.sound);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setDigits((d) => d.slice(0, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = puzzle.code ?? "";
        if (digits === target) {
          setSolved(true);
          setError("");
          playCue("success", state.settings.sound);
          onSolved();
        } else if (digits.length > 0) {
          setAttempts((a) => a + 1);
          setError("That isn't it. The mechanism holds.");
          playCue("error", state.settings.sound);
          setDigits("");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, solved, puzzle, digits, state.settings.sound, onSolved]);

  const pressDigit = (d: string) => {
    if (solved) return;
    if (d === "clear") {
      setDigits("");
      playCue("click", state.settings.sound);
      return;
    }
    if (d === "back") {
      setDigits((v) => v.slice(0, -1));
      setError("");
      return;
    }
    if (digits.length >= (puzzle.code?.length ?? 3)) return;
    setDigits((v) => v + d);
    playCue("click", state.settings.sound);
  };

  const cycleSlot = (index: number) => {
    if (solved) return;
    playCue("click", state.settings.sound);
    setSlots((prev) => {
      const next = [...prev];
      const idx = SYMBOLS.findIndex((s) => s.id === prev[index]);
      next[index] = SYMBOLS[(idx + 1) % SYMBOLS.length].id;
      return next;
    });
    setError("");
  };

  const changeDial = (index: number, delta: number) => {
    if (solved) return;
    playCue("click", state.settings.sound);
    setDials((prev) => {
      const next = [...prev];
      next[index] = (next[index] + delta + 10) % 10;
      return next;
    });
    setError("");
  };

  return (
    <Modal open={open} onClose={onClose} title={puzzle.title} wide>
      {solved ? (
        <div className="fade-up flex flex-col items-center py-4 text-center">
          <div className="relative grid size-20 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <span className="absolute inset-0 rounded-full bg-gold/20 blur-2xl" />
            <Check size={38} strokeWidth={2.5} className="relative" />
          </div>
          <p className="mt-5 font-display text-xl font-bold text-white">Mechanism solved</p>
          <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-mist-400">{puzzle.successText}</p>
          {puzzle.give && (
            <div className="mt-4 flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.07] px-4 py-2 text-[11px] font-bold text-gold">
              <Sparkles size={13} /> Acquired: {ITEMS[puzzle.give].name}
            </div>
          )}
          <button onClick={onClose} className="btn btn-primary mt-6 w-full py-3 text-xs">
            Continue
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[12px] leading-relaxed text-mist-400">{puzzle.prompt}</p>

          {puzzle.kind === "keypad" && (
            <div className="mt-5">
              <div className="flex justify-center gap-2.5">
                {Array.from({ length: puzzle.code?.length ?? 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`grid size-12 place-items-center rounded-xl border font-display text-xl font-bold tabular-nums transition-colors motion-reduce:transition-none ${
                      digits[i] ? "border-accent/40 bg-accent/10 text-white" : "border-white/10 bg-black/25 text-mist-600"
                    }`}
                  >
                    {digits[i] ?? "·"}
                  </div>
                ))}
              </div>

              <div className="mx-auto mt-5 grid max-w-[260px] grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"].map((key) => (
                  <button
                    key={key}
                    onClick={() => pressDigit(key)}
                    className={`grid h-12 place-items-center rounded-xl border text-sm font-bold transition-[color,border-color,transform] motion-reduce:transition-none active:scale-95 ${
                      key === "clear" || key === "back"
                        ? "border-white/8 bg-white/[0.03] text-mist-500 hover:text-white"
                        : "border-white/10 bg-white/[0.05] text-mist-100 hover:border-accent/40 hover:bg-white/[0.08]"
                    }`}
                    aria-label={key === "clear" ? "Clear" : key === "back" ? "Delete last digit" : `Digit ${key}`}
                  >
                    {key === "clear" ? "C" : key === "back" ? <Delete size={16} /> : key}
                  </button>
                ))}
              </div>
              <button onClick={submit} disabled={digits.length !== (puzzle.code?.length ?? 3)} className="btn btn-primary mx-auto mt-4 flex w-full max-w-[260px] py-3 text-xs">
                <LockKeyhole size={14} /> Open
              </button>
            </div>
          )}

          {puzzle.kind === "symbols" && (
            <div className="mt-6">
              <div className="flex items-center justify-center gap-3 sm:gap-5">
                {slots.map((slot, index) => {
                  const symbol = SYMBOLS.find((s) => s.id === slot)!;
                  const Icon = symbol.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => cycleSlot(index)}
                      className="group relative grid size-[5.2rem] place-items-center rounded-full border border-white/12 gold-wash text-gold shadow-card transition-colors motion-reduce:transition-none hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-accent sm:size-24"
                      aria-label={`Ring ${index + 1}: ${symbol.label}. Click to change.`}
                    >
                      <span className="absolute inset-2 rounded-full border border-dashed border-white/10" />
                      <Icon size={28} strokeWidth={1.6} />
                      <span className="absolute -bottom-2.5 rounded-full border border-white/10 bg-shade px-2 py-0.5 text-[8px] font-bold text-mist-600">
                        Ring {index + 1}
                      </span>
                      <span className="absolute inset-x-0 -top-1 flex justify-center text-[8px] text-mist-600 opacity-0 transition-opacity motion-reduce:transition-none group-hover:opacity-100"><ArrowUp size={10} /></span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-7 text-center text-[10px] text-mist-600">Tap a ring to turn it.</p>
              <button onClick={submit} className="btn btn-primary mx-auto mt-4 flex w-full max-w-[280px] py-3 text-xs">
                <LockKeyhole size={14} /> Align the rings
              </button>
            </div>
          )}

          {puzzle.kind === "rings" && (
            <div className="mt-6">
              <div className="flex justify-center gap-3 sm:gap-5">
                {dials.map((digit, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => changeDial(i, 1)}
                      className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-mist-400 transition-colors motion-reduce:transition-none hover:border-accent/40 hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
                      aria-label={`Increase ring ${i + 1}`}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <div className="relative grid size-[4.5rem] place-items-center overflow-hidden rounded-full border border-gold/25 gold-wash shadow-rim sm:size-20">
                      <span className="absolute inset-2 rounded-full border border-dashed border-white/8" />
                      <span className="font-display text-3xl font-extrabold text-gold tabular-nums">{digit}</span>
                    </div>
                    <button
                      onClick={() => changeDial(i, -1)}
                      className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-mist-400 transition-colors motion-reduce:transition-none hover:border-accent/40 hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
                      aria-label={`Decrease ring ${i + 1}`}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <span className="text-[8px] font-bold text-mist-600">{["Hours", "Minutes", "Declination"][i]}</span>
                  </div>
                ))}
              </div>
              <button onClick={submit} className="btn btn-primary mx-auto mt-5 flex w-full max-w-[280px] py-3 text-xs">
                <LockKeyhole size={14} /> Seal the rings
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-[11px] font-semibold text-red-300/80">{error}</p>
          )}
          {attempts >= 3 && !error && (
            <p className="mt-4 text-center text-[10px] text-mist-600">The room has already given you what you need.</p>
          )}
          {attempts >= 3 && error && (
            <p className="mt-2 text-center text-[10px] text-mist-600">The room has already given you what you need.</p>
          )}
        </div>
      )}
    </Modal>
  );
}
