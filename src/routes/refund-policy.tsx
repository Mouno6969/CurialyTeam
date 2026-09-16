import { createFileRoute, Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/support";

export const Route = createFileRoute("/refund-policy")({ component: RefundPolicy });

function RefundPolicy() {
  const t = useT();
  const sections = [
    { id: "01", title: t("refund.s1.title"), copy: t("refund.s1.copy") },
    { id: "02", title: t("refund.s2.title"), copy: t("refund.s2.copy") },
    { id: "03", title: t("refund.s3.title"), copy: t("refund.s3.copy", { handle: TELEGRAM_HANDLE }) },
    { id: "04", title: t("refund.s4.title"), copy: t("refund.s4.copy") },
    { id: "05", title: t("refund.s5.title"), copy: t("refund.s5.copy") },
  ];

  return (
    <SiteChrome>
      <PageHero
        kicker={t("refund.kicker")}
        title={t("refund.title")}
        emphasis={t("refund.emphasis")}
        copy={t("refund.copy")}
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
          <aside className="h-fit rounded-xl bg-card p-6 shadow-[var(--shadow-border)]">
            <p className="kicker">{t("refund.contents")}</p>
            <ol className="mt-4 space-y-1 text-sm text-muted-foreground">
              {sections.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#refund-${item.id}`}
                    className="block py-1.5 transition-colors hover:text-foreground"
                  >
                    <span className="mr-2 font-mono-ui">{item.id}</span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
            <Button asChild className="mt-6 w-full">
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Send className="size-4" />
                {t("refund.ask", { handle: TELEGRAM_HANDLE })}
              </a>
            </Button>
          </aside>
          <div className="space-y-4">
            {sections.map((item) => (
              <article
                id={`refund-${item.id}`}
                key={item.id}
                className="scroll-mt-28 rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-7"
              >
                <p className="kicker">{item.id}</p>
                <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">{item.title}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-5 rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="font-display text-3xl tracking-[-0.04em]">{t("refund.waitTitle")}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("refund.waitCopy")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                {t("refund.message")}
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/support">{t("refund.desk")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
