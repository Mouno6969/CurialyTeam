import { createFileRoute, Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/support";

export const Route = createFileRoute("/refund-policy")({ component: RefundPolicy });

const sections = [
  {
    id: "01",
    title: "The promise",
    copy: "If a paid order fails to reach you, we refund it. That is the whole point of this page. We will not keep money for a plan that never arrived at the account you named.",
  },
  {
    id: "02",
    title: "When a refund is due",
    copy: "A refund is due when payment has been received and fulfillment cannot be completed — the plan does not appear on the agreed account, delivery cannot be finished after a genuine attempt, or we confirm that the order was paid and then lost on our side.",
  },
  {
    id: "03",
    title: "How to ask",
    copy: `Message @${TELEGRAM_HANDLE} on Telegram with the order code from your receipt, the plan, and the delivery detail you gave at checkout (for example the X handle). We confirm the miss, then return the same amount on the same network and coin.`,
  },
  {
    id: "04",
    title: "How quickly",
    copy: "As soon as we can verify that the order did not arrive. In ordinary cases that is a few days from your message. We will not stall a confirmed miss behind a ticket maze.",
  },
  {
    id: "05",
    title: "What this is not",
    copy: "A change of mind after the plan is working on your account is not a refund. A later dispute with the third-party service, after access has been delivered as described, is also outside this policy.",
  },
];

function RefundPolicy() {
  return (
    <SiteChrome>
      <PageHero
        kicker="Refund policy"
        title="If it never arrives,"
        emphasis="the money comes back."
        copy="Write this down as our rule, not as small print: a paid order that fails to reach you is refunded. No theatre. No endless chain of tickets."
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
          <aside className="h-fit rounded-xl bg-card p-6 shadow-[var(--shadow-border)]">
            <p className="kicker">Contents</p>
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
                Ask @{TELEGRAM_HANDLE}
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
            <h2 className="font-display text-3xl tracking-[-0.04em]">Still waiting on an order?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Bring the order code from your receipt to Telegram. If it failed to reach you, the
              refund is due.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                Message support
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/support">Support desk</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
