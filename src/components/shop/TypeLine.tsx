import { useEffect, useState } from "react";
import { useI18n, useT } from "@/lib/i18n";

export function TypeLine() {
  const t = useT();
  const locale = useI18n((s) => s.locale);
  const lines = [t("home.type.simple"), t("home.type.priced"), t("home.type.paid")];
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(lines[0]);
  const [phase, setPhase] = useState<"type" | "hold" | "erase">("hold");

  useEffect(() => {
    setIndex(0);
    setText(lines[0]);
    setPhase("hold");
  }, [locale]);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setText(lines[0]);
      return;
    }

    const full = lines[index] ?? lines[0];
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
      setIndex((current) => (current + 1) % lines.length);
      setPhase("type");
    }

    return () => window.clearTimeout(timeout);
  }, [index, phase, text, locale]);

  return (
    <em className="type-line font-display font-normal italic text-muted-foreground">
      {text}
      <span className="caret" aria-hidden="true" />
    </em>
  );
}
