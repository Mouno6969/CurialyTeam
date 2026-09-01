import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { DotField, RadialMatrix, Rule } from "@/components/brand/DotField";
import { Logo } from "@/components/brand/Logo";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { TypeLine } from "@/components/shop/TypeLine";
import { Button } from "@/components/ui/button";
import { catalog } from "@/lib/storefront";

export const Route = createFileRoute("/")({ component: Home });

const STEPS = [
  { n: "01", label: "Choose a plan" },
  { n: "02", label: "Confirm delivery" },
  { n: "03", label: "Pay privately" },
];

function Home() {
  return (
    <SiteChrome>
      <section className="page-wrap py-8 sm:py-12 lg:py-16">
        <div className="relative overflow-hidden rounded-2xl bg-card px-6 py-10 shadow-[var(--shadow-border)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <DotField />
          <RadialMatrix className="pointer-events-none absolute -right-24 top-1/2 hidden size-[28rem] -translate-y-1/2 opacity-50 breathe lg:block xl:size-[34rem]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
            <div className="order-2 max-w-2xl lg:order-1">
              <div className="reveal flex items-center gap-3">
                <span className="kicker">A considered digital shop</span>
                <span className="hidden h-px w-10 bg-border sm:block" />
              </div>
              <h1 className="reveal reveal-d1 display-xl mt-5 text-foreground">
                Subscriptions,
                <br />
                <TypeLine />
              </h1>
              <p className="reveal reveal-d2 mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Choose a plan, add it to your bag, confirm the delivery details that matter,
                then continue to a secure payment page.
              </p>
              <div className="reveal reveal-d3 mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href="#plans">
                    Explore plans
                    <ChevronRight className="size-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/how-it-works">How it works</Link>
                </Button>
              </div>
              <ol className="reveal reveal-d5 mt-10 hidden gap-6 sm:flex">
                {STEPS.map((step, index) => (
                  <li key={step.n} className="flex items-center gap-3 text-sm">
                    <span className="font-mono-ui text-[10px] tracking-[0.16em] text-muted-foreground">
                      {step.n}
                    </span>
                    <span className="font-medium">{step.label}</span>
                    {index < STEPS.length - 1 ? (
                      <span className="hidden h-px w-8 bg-border lg:block" />
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
            <div className="order-1 flex flex-col items-center gap-6 lg:order-2">
              <div className="emblem-in relative grid place-items-center">
                <RadialMatrix className="absolute size-64 opacity-70 breathe sm:size-72 lg:hidden" />
                <Logo
                  size={220}
                  className="relative z-10 size-40 sm:size-48 lg:size-[13.5rem]"
                />
              </div>
              <div className="hidden w-full max-w-sm rounded-xl bg-secondary/80 p-5 shadow-[var(--shadow-border)] lg:block">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="kicker">Plan picker</span>
                  <span className="rounded-full bg-card px-2.5 py-1 font-mono-ui text-[10px] tracking-[0.12em] text-muted-foreground">
                    Ready
                  </span>
                </div>
                <div className="space-y-3 py-4">
                  {STEPS.map((step, index) => (
                    <div key={step.n} className="flex items-center gap-3">
                      <span className="font-mono-ui flex size-7 items-center justify-center rounded-full bg-card text-[10px] shadow-[var(--shadow-border)]">
                        {step.n}
                      </span>
                      <span className="text-sm font-medium">{step.label}</span>
                      {index < STEPS.length - 1 ? (
                        <div className="ml-auto h-px flex-1 bg-border" />
                      ) : (
                        <Check className="ml-auto size-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-primary px-4 py-3 text-primary-foreground">
                  <p className="font-display text-xl tracking-[-0.03em] text-primary-foreground">
                    Everything at a glance.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-primary-foreground/75">
                    Your bag is priced before payment instructions are shown.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="page-wrap scroll-mt-24 pb-16 sm:pb-20">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="kicker">The shop</p>
            <h2 className="display mt-2 text-3xl">Choose your plan.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Select a duration on any card, then add your preferred plan to the bag.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {catalog.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
        <Link
          to="/referrals"
          className="group mt-6 block rounded-xl bg-card p-5 shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)]"
        >
          <p className="kicker">Referral rewards</p>
          <h3 className="mt-2 font-display text-2xl tracking-[-0.03em]">Invite and earn.</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Open the referral program, get your link, and track eligible reward activity.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
            Explore rewards <ArrowRight className="size-4" />
          </span>
        </Link>
      </section>

      <section className="border-y border-border bg-secondary/60 py-14 sm:py-16">
        <div className="page-wrap grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="kicker">Guided by design</p>
            <h2 className="display mt-3 max-w-sm text-3xl">
              Detailed guidance is now one click away.
            </h2>
            <Rule className="mt-6 max-w-[10rem]" />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "How it works",
                copy: "Understand the selection and request flow.",
                href: "/how-it-works" as const,
              },
              {
                n: "02",
                title: "Support",
                copy: "Find clear answers before you request.",
                href: "/support" as const,
              },
              {
                n: "03",
                title: "Documentation",
                copy: "Read the complete store reference.",
                href: "/documentation" as const,
              },
            ].map((item) => (
              <Link
                key={item.n}
                to={item.href}
                className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)] transition-[transform] duration-200 hover:-translate-y-1"
              >
                <p className="kicker">{item.n}</p>
                <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
