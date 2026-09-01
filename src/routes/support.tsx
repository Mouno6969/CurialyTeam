import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleHelp, FileText, ShieldCheck } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/support")({ component: Support });

const supportTopics = [
  {
    title: "Plan availability",
    copy: "Current availability is shown directly on each plan card. Unavailable plans cannot be placed in the bag.",
    icon: CircleHelp,
  },
  {
    title: "Order requests",
    copy: "Use the bag to prepare a concise request. The site provides a payment link, not a payment confirmation.",
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
        kicker="Support centre"
        title="Helpful answers,"
        emphasis="before you request."
        copy="This page explains how plan availability, order summaries, and eligibility checks work in the storefront."
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {supportTopics.map((topic) => {
            const Icon = topic.icon;
            return (
              <article
                key={topic.title}
                className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-7"
              >
                <Icon className="size-6 text-muted-foreground" />
                <h2 className="font-display mt-8 text-3xl tracking-[-0.04em]">{topic.title}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{topic.copy}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-8 rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8">
          <p className="kicker">Need a clear next step?</p>
          <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">
            Start with the store guide.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            The documentation page brings the ordering flow, availability rules, and
            request-summary behavior together in one reference.
          </p>
          <Button asChild className="mt-6">
            <Link to="/documentation">Open documentation</Link>
          </Button>
        </div>
      </section>
    </SiteChrome>
  );
}
