import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, ShoppingBag, Sun } from "lucide-react";
import { BrandLockup } from "@/components/brand/Logo";
import { DotVeil, Rule } from "@/components/brand/DotField";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { BagDrawer } from "@/components/shop/BagDrawer";
import { Button } from "@/components/ui/button";
import { useBag } from "@/lib/bag-store";
import { useI18n, useT } from "@/lib/i18n";
import { footerNavigation, storefrontNavigation } from "@/lib/navigation";
import { useTheme } from "@/lib/theme-store";
import { cn } from "@/lib/utils";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrateTheme = useTheme((s) => s.hydrate);
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const hydrateLocale = useI18n((s) => s.hydrate);
  const t = useT();
  const openBag = useBag((s) => s.open);
  const bag = useBag((s) => s.bag);
  const itemCount = bag.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    hydrateTheme();
    hydrateLocale();
  }, [hydrateTheme, hydrateLocale]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <DotVeil className="fixed inset-0 opacity-30" />
      <div className="relative z-10">
        <div className="border-b border-border bg-secondary/70 px-4 py-2 text-center">
          <p className="kicker text-[10px] sm:text-[11px]">{t("banner.line")}</p>
        </div>
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="page-wrap flex h-16 items-center justify-between gap-3 sm:h-[72px]">
            <Link to="/" className="shrink-0" aria-label={t("nav.home")}>
              <BrandLockup />
            </Link>
            <nav
              className="hidden items-center gap-8 text-[13px] font-medium tracking-[-0.01em] text-muted-foreground lg:flex"
              aria-label={t("nav.primary")}
            >
              {storefrontNavigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "nav-link transition-colors duration-150 hover:text-foreground",
                    pathname === item.href && "is-active text-foreground",
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <LanguageSwitch />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggle}
                aria-label={theme === "dark" ? t("nav.themeLight") : t("nav.themeDark")}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={openBag}
                aria-label={`${t("nav.bag")} ${itemCount}`}
              >
                <ShoppingBag className="size-4" />
                <span className="hidden sm:inline">{t("nav.bag")}</span>
                <span className="font-mono-ui text-[11px] tabular">{itemCount}</span>
              </Button>
            </div>
          </div>
          <nav
            className="page-wrap flex gap-1 overflow-x-auto py-2 text-xs font-semibold text-muted-foreground lg:hidden"
            aria-label={t("nav.mobile")}
          >
            {storefrontNavigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-2 transition-colors duration-150",
                  pathname === item.href
                    ? "bg-secondary text-foreground"
                    : "hover:text-foreground",
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border py-12 sm:py-14">
          <div className="page-wrap">
            <Rule className="mb-8 max-w-xs" />
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <BrandLockup markSize={28} />
                <p className="mt-4 max-w-xl text-xs leading-5 text-muted-foreground">
                  {t("footer.legal", { year: new Date().getFullYear() })}
                </p>
              </div>
              <div className="flex flex-col items-start gap-4 md:items-end">
                <nav
                  className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground"
                  aria-label={t("nav.footer")}
                >
                  {footerNavigation.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="transition-colors duration-150 hover:text-foreground"
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </nav>
                <p className="kicker">{t("footer.tag")}</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <BagDrawer />
    </div>
  );
}
