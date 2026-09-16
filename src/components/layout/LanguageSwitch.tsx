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
      className="relative z-50 flex h-11 items-center rounded-md bg-card p-0.5 shadow-[var(--shadow-border)]"
    >
      {OPTIONS.map((option) => {
        const active = locale === option.id;
        return (
          <button
            key={option.id}
            type="button"
            data-set-locale={option.id}
            onClick={() => setLocale(option.id)}
            aria-pressed={active}
            className={cn(
              "lang-switch-btn h-10 min-w-11 rounded-sm px-3 text-xs font-semibold tracking-[0.04em]",
              active ? "is-active" : "text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
