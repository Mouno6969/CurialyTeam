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
import { DEMO_CAMPAIGN, getOrCreateReferralCode } from "@/lib/referrals";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/referrals")({ component: Referrals });

const statusGuide = [
  {
    title: "Pending",
    copy: "A qualifying payment was verified, but the campaign waiting period is still running.",
  },
  {
    title: "Available",
    copy: "The waiting period finished. This amount can be included in an eligible withdrawal request.",
  },
  {
    title: "Paid",
    copy: "A verified payout transaction sent the available reward to your connected withdrawal wallet.",
  },
  {
    title: "Not eligible",
    copy: "The order did not meet campaign requirements, such as attribution, product, value, or anti-fraud checks.",
  },
];

function Referrals() {
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

  return (
    <SiteChrome>
      <PageHero
        kicker="Referral rewards, explained"
        title="Share your link."
        emphasis="Earn only after a verified eligible payment."
        copy="This is not a click-reward program. A reward begins only when a referred customer’s purchase is independently verified and meets the active campaign’s terms."
      />
      <section className="page-wrap pb-10">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8">
            <p className="kicker">The simple version</p>
            <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">
              What happens after you share?
            </h2>
            <div className="mt-6 space-y-5">
              {[
                {
                  Icon: Link2,
                  title: "1. You share your personal link",
                  copy: "Your unique link is ready below. Share it with people who are genuinely interested.",
                },
                {
                  Icon: WalletCards,
                  title: "2. Your friend makes an order",
                  copy: "They use the link, create a payment session, and choose a payment method.",
                },
                {
                  Icon: ShieldCheck,
                  title: "3. The payment system verifies it",
                  copy: "Verification checks the real on-chain transfer, not only a screenshot or submitted hash.",
                },
                {
                  Icon: CircleDollarSign,
                  title: "4. An eligible reward appears",
                  copy: "If campaign conditions are met, the reward first appears as pending and becomes available after the stated waiting period.",
                },
              ].map(({ Icon, title, copy }) => (
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
            <p className="kicker">Reward status guide</p>
            <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">
              Know what each status means.
            </h2>
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
                <p className="text-sm leading-6 text-muted-foreground">
                  Rewards never promise earnings for clicks, signups, self-referrals, or
                  payments that do not meet an active campaign’s rules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="rounded-xl bg-card p-7 shadow-[var(--shadow-border)] sm:p-9">
          <p className="kicker">Active campaign details</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-4xl tracking-[-0.04em]">{DEMO_CAMPAIGN.name}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                A qualifying verified purchase may create a{" "}
                <strong className="text-foreground">
                  {formatMoney(DEMO_CAMPAIGN.commissionUsd)}
                </strong>{" "}
                pending reward, available after {DEMO_CAMPAIGN.waitDays} days.
              </p>
            </div>
            <Button type="button" onClick={copyLink}>
              {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Link copied" : "Copy my referral link"}
            </Button>
          </div>
          <p className="mt-5 font-mono-ui text-xs text-muted-foreground break-all">{shareUrl}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { title: "Share responsibly", copy: "Use your personal link only for genuine referrals." },
              { title: "Payment must settle", copy: "A submitted transaction is not a confirmed purchase." },
              { title: "Check statuses clearly", copy: "Pending, available, paid, or ineligible — never guessed." },
            ].map((item) => (
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
            Return to the shop
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}
