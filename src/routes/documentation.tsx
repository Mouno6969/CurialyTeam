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
    title: "Your order code",
    copy: "Continuing from the bag creates an order and gives it a short code, such as CLY-7K3M2QX9. That code is how you find the order later and how support finds it too. It appears on screen and on your receipt.",
  },
  {
    id: "05",
    title: "Paying",
    copy: "Choose the network you will send from, then the coin. The exact amount and the destination address are then shown together; send that amount to that address from any wallet, and paste the transaction hash back. Manual transfer is the only method — there is no wallet connection.",
  },
  {
    id: "06",
    title: "Stablecoins and native coins",
    copy: "USDC and USDT amounts are fixed in dollars. Native coins (ETH, SOL, POL) are converted at a reference rate that is fixed onto your order when you choose the coin, so the figure you are shown is the figure that counts.",
  },
  {
    id: "07",
    title: "Your receipt",
    copy: "Submitting the transaction hash issues a receipt immediately, with the order code, the delivery handle, the items, the amount, the destination address, and the hash. It carries a barcode of the order code and a QR code that opens the order's status page. It is downloadable, and it reissues itself as the status changes.",
  },
  {
    id: "08",
    title: "Checking an order",
    copy: "Enter your code on the order status page at any time. Case and the CLY- prefix are optional. An order reads awaiting payment, then pending review once you submit a hash, then confirming while it is checked, and finally completed or rejected. Unpaid orders expire after thirty minutes.",
  },
  {
    id: "09",
    title: "Human support",
    copy: "Questions go to @Curialy on Telegram. A person reads the desk. Quote your order code when the matter is about a specific order.",
  },
  {
    id: "10",
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
        copy="Use this reference to understand availability, plan selection, how an order is paid for, and how to check its status afterwards using the code on your receipt."
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
              Return to the storefront to see current status and available plan options, or check
              an existing order with its code.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/">Visit the store</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/order">Check an order</Link>
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
