import { useI18n, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { id: Locale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "zh", label: "中文" },
];

export function LanguageSwitch() {
  const locale = useI18n((s) => s.locale);
  const setLocale = useI18n((s) => s.setLocale);

  return (
    <div
      role="group"
      aria-label={locale === "zh" ? "语言" : "Language"}
      className="flex h-9 items-center rounded-md bg-card px-1 shadow-[var(--shadow-border)]"
    >
      {OPTIONS.map((option) => {
        const active = locale === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setLocale(option.id)}
            aria-pressed={active}
            className={cn(
              "h-7 rounded-sm px-2 text-[11px] font-semibold tracking-[0.04em]",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
