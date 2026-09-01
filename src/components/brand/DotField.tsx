import { cn } from "@/lib/utils";

export function RadialMatrix({ className }: { className?: string }) {
  return (
    <img
      src="/brand/radial-dots.svg"
      alt=""
      aria-hidden="true"
      className={cn("pointer-events-none select-none radial-matrix", className)}
    />
  );
}

export function DotField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 dot-field breathe", className)}
    />
  );
}

export function DotVeil({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 dot-veil opacity-40", className)}
    />
  );
}

export function BrokenRing({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("text-silver", className)}
      aria-hidden="true"
    >
      <circle
        cx="100"
        cy="100"
        r="91"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeDasharray="271 15"
        strokeDashoffset="143"
      />
    </svg>
  );
}

export function Rule({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span className="rule-diamond" />
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
