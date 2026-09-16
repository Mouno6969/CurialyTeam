import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleHelp, Clock3, FileText, Send, ShieldCheck } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/support";

export const Route = createFileRoute("/support")({ component: Support });

function Support() {
  const t = useT();
  const supportTopics = [
    { title: t("support.t1.title"), copy: t("support.t1.copy"), icon: CircleHelp },
    { title: t("support.t2.title"), copy: t("support.t2.copy"), icon: FileText },
    { title: t("support.t3.title"), copy: t("support.t3.copy"), icon: ShieldCheck },
  ];

  return (
    <SiteChrome>
      <PageHero
        kicker={t("support.kicker")}
        title={t("support.title")}
        emphasis={t("support.emphasis")}
        copy={t("support.copy")}
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="kicker">{t("support.desk")}</p>
              <h2 className="font-display mt-3 text-3xl tracking-[-0.04em] sm:text-4xl">
                {t("support.message", { handle: TELEGRAM_HANDLE })}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                {t("support.deskCopy")}
              </p>
              <ul className="mt-7 space-y-3 text-sm leading-6 text-muted-foreground">
                <li className="flex gap-3">
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-foreground" />
                  {t("support.reply")}
                </li>
                <li className="flex gap-3">
                  <Send className="mt-0.5 size-4 shrink-0 text-foreground" />
                  {t("support.send")}
                </li>
              </ul>
              <Button asChild className="mt-8" size="lg">
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Send className="size-4" />
                  {t("support.open", { handle: TELEGRAM_HANDLE })}
                </a>
              </Button>
            </div>
            <aside className="border-t border-border bg-secondary/50 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="kicker">{t("support.card")}</p>
              <p className="font-display mt-4 text-2xl tracking-[-0.03em]">@{TELEGRAM_HANDLE}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                t.me/{TELEGRAM_HANDLE}
              </p>
              <div className="mt-8 space-y-4 border-t border-border pt-6 text-sm leading-6">
                <div>
                  <p className="font-medium text-foreground">{t("support.handle")}</p>
                  <p className="mt-1 text-muted-foreground">{t("support.handleCopy")}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("support.never")}</p>
                  <p className="mt-1 text-muted-foreground">{t("support.neverCopy")}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {supportTopics.map((topic) => {
            const Icon = topic.icon;
            return (
              <article
                key={topic.title}
                className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-7"
              >
                <Icon className="size-5 text-muted-foreground" />
                <h2 className="font-display mt-7 text-2xl tracking-[-0.04em] sm:text-3xl">
                  {topic.title}
                </h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{topic.copy}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8">
            <p className="kicker">{t("support.missKicker")}</p>
            <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">{t("support.missTitle")}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("support.missCopy")}
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link to="/refund-policy">{t("support.missCta")}</Link>
            </Button>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8">
            <p className="kicker">{t("support.docsKicker")}</p>
            <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">{t("support.docsTitle")}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("support.docsCopy")}
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link to="/documentation">{t("support.docsCta")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
