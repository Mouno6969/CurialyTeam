import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  Link2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { DEMO_CAMPAIGN, getOrCreateReferralCode } from "@/lib/referrals";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/referrals")({ component: Referrals });

function Referrals() {
  const t = useT();
  const [code, setCode] = useState("CURIALY");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(getOrCreateReferralCode());
  }, []);

  const shareUrl =
    typeof window === "undefined" ? `/r/${code}` : `${window.location.origin}/r/${code}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const statusGuide = [
    { title: t("ref.st.pending"), copy: t("ref.st.pendingCopy") },
    { title: t("ref.st.available"), copy: t("ref.st.availableCopy") },
    { title: t("ref.st.paid"), copy: t("ref.st.paidCopy") },
    { title: t("ref.st.no"), copy: t("ref.st.noCopy") },
  ];
  const flow = [
    { Icon: Link2, title: t("ref.s1.title"), copy: t("ref.s1.copy") },
    { Icon: WalletCards, title: t("ref.s2.title"), copy: t("ref.s2.copy") },
    { Icon: ShieldCheck, title: t("ref.s3.title"), copy: t("ref.s3.copy") },
    { Icon: CircleDollarSign, title: t("ref.s4.title"), copy: t("ref.s4.copy") },
  ];
  const rules = [
    { title: t("ref.rule1"), copy: t("ref.rule1Copy") },
    { title: t("ref.rule2"), copy: t("ref.rule2Copy") },
    { title: t("ref.rule3"), copy: t("ref.rule3Copy") },
  ];

  return (
    <SiteChrome>
      <PageHero
        kicker={t("ref.kicker")}
        title={t("ref.title")}
        emphasis={t("ref.emphasis")}
        copy={t("ref.copy")}
      />
      <section className="page-wrap pb-10">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8">
            <p className="kicker">{t("ref.simple")}</p>
            <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">{t("ref.simpleTitle")}</h2>
            <div className="mt-6 space-y-5">
              {flow.map(({ Icon, title, copy }) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-[var(--shadow-border)]">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8">
            <p className="kicker">{t("ref.statusKicker")}</p>
            <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">{t("ref.statusTitle")}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {statusGuide.map((item) => (
                <article
                  key={item.title}
                  className="rounded-lg bg-secondary p-4 shadow-[var(--shadow-border)]"
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 rounded-lg bg-secondary p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 size-5 text-muted-foreground" />
                <p className="text-sm leading-6 text-muted-foreground">{t("ref.disclaimer")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="rounded-xl bg-card p-7 shadow-[var(--shadow-border)] sm:p-9">
          <p className="kicker">{t("ref.campaign")}</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-4xl tracking-[-0.04em]">{DEMO_CAMPAIGN.name}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                {t("ref.campaignCopy", {
                  amount: formatMoney(DEMO_CAMPAIGN.commissionUsd),
                  days: DEMO_CAMPAIGN.waitDays,
                })}
              </p>
            </div>
            <Button type="button" onClick={copyLink}>
              {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
              {copied ? t("ref.copied") : t("ref.copyLink")}
            </Button>
          </div>
          <p className="mt-5 font-mono-ui text-xs text-muted-foreground break-all">{shareUrl}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {rules.map((item) => (
              <div key={item.title} className="rounded-lg bg-secondary p-4 shadow-[var(--shadow-border)]">
                <CheckCircle2 className="size-4 text-muted-foreground" />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.copy}</p>
              </div>
            ))}
          </div>
          <Link
            to="/"
            className="mt-6 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("ref.return")}
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}
