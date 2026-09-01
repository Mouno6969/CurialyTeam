import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: number;
  alt?: string;
};

export function Logo({ className, size = 40, alt = "Curialy" }: LogoProps) {
  return (
    <img
      src="/brand/curialy-logo.jpg"
      alt={alt}
      width={size}
      height={size}
      className={cn(
        "rounded-full object-cover outline outline-1 -outline-offset-1 outline-foreground/10",
        className,
      )}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-[1.5rem] leading-none tracking-[-0.045em] text-foreground",
        className,
      )}
    >
      Curialy
    </span>
  );
}

export function BrandLockup({
  className,
  markSize = 36,
}: {
  className?: string;
  markSize?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo size={markSize} />
      <Wordmark />
    </span>
  );
}
