import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ClipboardCheck, ReceiptText, Send, ShoppingBag } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/how-it-works")({ component: HowItWorks });

function HowItWorks() {
  const t = useT();
  const steps = [
    { number: "01", title: t("how.s1.title"), copy: t("how.s1.copy"), icon: ShoppingBag },
    { number: "02", title: t("how.s2.title"), copy: t("how.s2.copy"), icon: ClipboardCheck },
    { number: "03", title: t("how.s3.title"), copy: t("how.s3.copy"), icon: Send },
    { number: "04", title: t("how.s4.title"), copy: t("how.s4.copy"), icon: ReceiptText },
  ];

  return (
    <SiteChrome>
      <PageHero
        kicker={t("how.kicker")}
        title={t("how.title")}
        emphasis={t("how.emphasis")}
        copy={t("how.copy")}
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                key={step.number}
                className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="kicker">{step.number}</span>
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <h2 className="font-display mt-10 text-3xl tracking-[-0.04em]">{step.title}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{step.copy}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-8 grid gap-6 rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="size-4" />
              <p className="kicker">{t("how.beforeKicker")}</p>
            </div>
            <h2 className="font-display mt-4 text-3xl tracking-[-0.04em]">{t("how.beforeTitle")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("how.beforeCopy")}
            </p>
          </div>
          <Button asChild>
            <Link to="/documentation">{t("how.docs")}</Link>
          </Button>
        </div>
      </section>
    </SiteChrome>
  );
}
