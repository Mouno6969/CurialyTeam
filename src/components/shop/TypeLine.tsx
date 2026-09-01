import { useEffect, useState } from "react";

const LINES = ["made simple.", "priced clearly.", "paid privately."];

export function TypeLine() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(LINES[0]);
  const [phase, setPhase] = useState<"type" | "hold" | "erase">("hold");

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setText(LINES[0]);
      return;
    }

    const full = LINES[index];
    let timeout = 0;

    if (phase === "type") {
      if (text.length < full.length) {
        timeout = window.setTimeout(() => setText(full.slice(0, text.length + 1)), 48);
      } else {
        timeout = window.setTimeout(() => setPhase("hold"), 1700);
      }
    } else if (phase === "hold") {
      timeout = window.setTimeout(() => setPhase("erase"), 1500);
    } else if (text.length > 0) {
      timeout = window.setTimeout(() => setText(full.slice(0, text.length - 1)), 26);
    } else {
      setIndex((current) => (current + 1) % LINES.length);
      setPhase("type");
    }

    return () => window.clearTimeout(timeout);
  }, [index, phase, text]);

  return (
    <em className="type-line font-display font-normal italic text-muted-foreground">
      {text}
      <span className="caret" aria-hidden="true" />
    </em>
  );
}
