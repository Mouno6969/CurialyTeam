import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ClipboardCheck, Send, ShoppingBag } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({ component: HowItWorks });

const steps = [
  {
    number: "01",
    title: "Choose a plan",
    copy: "Review the plan options, current availability, and displayed pricing before making a selection.",
    icon: ShoppingBag,
  },
  {
    number: "02",
    title: "Build your bag",
    copy: "Add an available plan, adjust the quantity if needed, and review the estimated total in your bag.",
    icon: ClipboardCheck,
  },
  {
    number: "03",
    title: "Prepare your request",
    copy: "Confirm delivery details, then continue to a secure payment link priced on the server.",
    icon: Send,
  },
];

function HowItWorks() {
  return (
    <SiteChrome>
      <PageHero
        kicker="Process overview"
        title="A simple path from"
        emphasis="selection to request."
        copy="Curialy keeps the order-preparation process concise. Every step is visible before you continue to payment."
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="grid gap-5 md:grid-cols-3">
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
              <p className="kicker">Before you proceed</p>
            </div>
            <h2 className="font-display mt-4 text-3xl tracking-[-0.04em]">
              Review availability and terms first.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              A plan marked unavailable cannot be added to the bag. Confirm plan duration and
              eligibility before sending an order request.
            </p>
          </div>
          <Button asChild>
            <Link to="/documentation">Read documentation</Link>
          </Button>
        </div>
      </section>
    </SiteChrome>
  );
}
