import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/documentation")({ component: Documentation });

const guidance = [
  {
    id: "01",
    title: "Selecting plans",
    copy: "Select a duration from an available plan card. The displayed amount is the current price; where shown, a struck-through price indicates the prior amount.",
  },
  {
    id: "02",
    title: "Availability status",
    copy: "A currently unavailable service remains visible for reference but cannot be added to the bag. Check back after the service status changes.",
  },
  {
    id: "03",
    title: "Using the bag",
    copy: "The bag supports quantity changes, removal, and an estimated total. It is designed to help prepare a request rather than collect payment.",
  },
  {
    id: "04",
    title: "Opening a payment link",
    copy: "Continue from the bag to receive an opaque payment link. Choose a network and coin, then transfer manually or connect a wallet.",
  },
  {
    id: "05",
    title: "Human support",
    copy: "Questions go to @Curialy on Telegram. A person reads the desk. Include the payment-link reference when the matter is about a specific order.",
  },
  {
    id: "06",
    title: "Refunds",
    copy: "If a paid order fails to reach the account you named, we refund it. The full wording lives on the refund policy page.",
  },
];

function Documentation() {
  return (
    <SiteChrome>
      <PageHero
        kicker="Store documentation"
        title="The essentials,"
        emphasis="in one place."
        copy="Use this reference to understand availability, plan selection, and the request-preparation flow before you use the store."
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
          <aside className="h-fit rounded-xl bg-card p-6 shadow-[var(--shadow-border)]">
            <p className="kicker">Contents</p>
            <ol className="mt-4 space-y-1 text-sm text-muted-foreground">
              {guidance.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#guide-${item.id}`}
                    className="block py-1.5 transition-colors hover:text-foreground"
                  >
                    <span className="mr-2 font-mono-ui">{item.id}</span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
          <div className="space-y-4">
            {guidance.map((item) => (
              <article
                id={`guide-${item.id}`}
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
            <h2 className="font-display text-3xl tracking-[-0.04em]">Ready to browse plans?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Return to the storefront to see current status and available plan options.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/">Visit the store</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/refund-policy">Refund policy</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
