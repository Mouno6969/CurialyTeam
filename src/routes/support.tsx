import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleHelp, Clock3, FileText, Send, ShieldCheck } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/support";

export const Route = createFileRoute("/support")({ component: Support });

const supportTopics = [
  {
    title: "Plan availability",
    copy: "Current availability is shown directly on each plan card. Unavailable plans cannot be placed in the bag.",
    icon: CircleHelp,
  },
  {
    title: "Order requests",
    copy: "Use the bag to prepare a concise request. Submitting a transaction hash records an order and issues a receipt; it is not itself a payment confirmation.",
    icon: FileText,
  },
  {
    title: "Eligibility and terms",
    copy: "Review duration, regional eligibility, and provider terms before sending a request through your chosen channel.",
    icon: ShieldCheck,
  },
];

function Support() {
  return (
    <SiteChrome>
      <PageHero
        kicker="A person, not a queue"
        title="Write to us,"
        emphasis="we read it ourselves."
        copy="Orders, payments, and delivery questions go to a human desk on Telegram. Quote the order code from your receipt if the matter is about a specific order."
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="kicker">The desk</p>
              <h2 className="font-display mt-3 text-3xl tracking-[-0.04em] sm:text-4xl">
                Message @{TELEGRAM_HANDLE}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                This is a personal Telegram account, not a screenshot bot. Ask about
                availability, an order in progress, or a delivery that has not arrived. A
                person on the Curialy side opens every message.
              </p>
              <ul className="mt-7 space-y-3 text-sm leading-6 text-muted-foreground">
                <li className="flex gap-3">
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-foreground" />
                  Typical reply within a day. Longer only when we are confirming a
                  transfer or a fulfillment step.
                </li>
                <li className="flex gap-3">
                  <Send className="mt-0.5 size-4 shrink-0 text-foreground" />
                  Send the order code from your receipt, the plan, and the delivery handle
                  if the question is about an order.
                </li>
              </ul>
              <Button asChild className="mt-8" size="lg">
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Send className="size-4" />
                  Open Telegram · @{TELEGRAM_HANDLE}
                </a>
              </Button>
            </div>
            <aside className="border-t border-border bg-secondary/50 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="kicker">Calling card</p>
              <p className="font-display mt-4 text-2xl tracking-[-0.03em]">@{TELEGRAM_HANDLE}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                t.me/{TELEGRAM_HANDLE}
              </p>
              <div className="mt-8 space-y-4 border-t border-border pt-6 text-sm leading-6">
                <div>
                  <p className="font-medium text-foreground">What we handle</p>
                  <p className="mt-1 text-muted-foreground">
                    Order status, missing delivery, payment questions, refunds.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">What we never ask</p>
                  <p className="mt-1 text-muted-foreground">
                    Passwords, recovery phrases, wallet seeds, or screenshots of secret
                    keys.
                  </p>
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
            <p className="kicker">If an order never arrives</p>
            <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">
              The refund is not a debate.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              When a paid plan fails to reach the account you named, we return the money.
              The policy is written in plain language.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link to="/refund-policy">Read the refund policy</Link>
            </Button>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8">
            <p className="kicker">Need the store guide?</p>
            <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">
              Start with documentation.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Availability rules, bag behavior, receipts, and how to check an order sit
              together in one reference.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link to="/documentation">Open documentation</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
