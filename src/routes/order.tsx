import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Search, TriangleAlert } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { OrderFacts, OrderTimeline } from "@/components/order/OrderFacts";
import { ReceiptPanel } from "@/components/order/ReceiptPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, fetchOrder, type Order } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/support";

export const Route = createFileRoute("/order")({
  validateSearch: (search: Record<string, unknown>): { code?: string } => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  component: OrderStatusPage,
});

function OrderStatusPage() {
  const t = useT();
  const { code: codeFromLink } = Route.useSearch();
  const [input, setInput] = useState(codeFromLink ?? "");
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(
    async (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      setBusy(true);
      setError(null);
      try {
        setOrder(await fetchOrder(code));
      } catch (cause) {
        setOrder(null);
        setError(
          cause instanceof ApiError && cause.status === 404
            ? t("order.notFound")
            : cause instanceof ApiError
              ? cause.message
              : t("order.unreachable"),
        );
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (codeFromLink) void lookup(codeFromLink);
  }, [codeFromLink, lookup]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void lookup(input);
  }

  return (
    <SiteChrome>
      <PageHero
        kicker={t("order.kicker")}
        title={t("order.title")}
        emphasis={t("order.emphasis")}
        copy={t("order.copy")}
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <form onSubmit={onSubmit} className="max-w-xl">
          <label className="text-xs font-semibold" htmlFor="order-code">
            {t("order.label")}
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              id="order-code"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="CLY-XXXXXXXX"
              autoComplete="off"
              spellCheck={false}
              className="font-mono-ui"
            />
            <Button type="submit" disabled={!input.trim() || busy}>
              <Search className="mr-2 size-4" />
              {busy ? t("order.busy") : t("order.search")}
            </Button>
          </div>
        </form>

        {error ? (
          <div className="mt-7 max-w-xl rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
            <TriangleAlert className="size-6 text-destructive" />
            <p className="mt-3 text-sm leading-6">{error}</p>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {t("support.send")}{" "}
              <a className="underline underline-offset-4" href={TELEGRAM_URL}>
                @{TELEGRAM_HANDLE}
              </a>
            </p>
          </div>
        ) : null}

        {order ? (
          <div className="mt-9 grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
            <section>
              <OrderFacts order={order} />
              <OrderTimeline order={order} />
              {order.status === "awaiting_payment" ? (
                <Button asChild className="mt-5">
                  <Link to="/pay/$id" params={{ id: order.orderCode }}>
                    {t("bag.continue")}
                  </Link>
                </Button>
              ) : null}
            </section>
            <ReceiptPanel order={order} onRefresh={() => void lookup(order.orderCode)} />
          </div>
        ) : null}
      </section>
    </SiteChrome>
  );
}
