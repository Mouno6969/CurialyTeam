import { useId } from "react";
import { cn } from "@/lib/utils";

export function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("text-foreground", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.851L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

export function GoogleAiMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const fill = `url(#google-ai-spark-${uid})`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`google-ai-spark-${uid}`} x1="8" y1="56" x2="56" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#4285F4" />
          <stop offset="0.35" stop-color="#9B72CB" />
          <stop offset="0.68" stop-color="#D96570" />
          <stop offset="1" stop-color="#EF6C3F" />
        </linearGradient>
      </defs>
      <path
        fill={fill}
        d="M28 4C28 16.15 16.15 28 4 28C16.15 28 28 39.85 28 52C28 39.85 39.85 28 52 28C39.85 28 28 16.15 28 4Z"
      />
      <path
        fill={fill}
        d="M50 36C50 41.52 44.52 47 39 47C44.52 47 50 52.48 50 58C50 52.48 55.48 47 61 47C55.48 47 50 41.52 50 36Z"
      />
    </svg>
  );
}

export function ProductMark({
  kind,
  className,
}: {
  kind: "x" | "google-ai";
  className?: string;
}) {
  if (kind === "x") return <XMark className={cn("h-16 w-16", className)} />;
  return <GoogleAiMark className={cn("h-16 w-16", className)} />;
}
