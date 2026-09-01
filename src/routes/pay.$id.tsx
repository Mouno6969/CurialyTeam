import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clipboard, Copy, ShieldCheck, TriangleAlert } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { OrderFacts, OrderTimeline } from "@/components/order/OrderFacts";
import { ReceiptPanel } from "@/components/order/ReceiptPanel";
import { StatusBadge } from "@/components/order/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, formatWhen } from "@/lib/format";
import {
  ApiError,
  chooseMethod,
  fetchOrder,
  submitTxHash,
  type Order,
} from "@/lib/api";
import {
  coinKind,
  coinLabel,
  coinLogo,
  networks,
  type CoinSymbol,
  type NetworkKey,
} from "@/lib/payments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pay/$id")({ component: PaymentPage });

// Statuses where the admin may still act, so the page keeps checking.
const LIVE_STATUSES = new Set(["pending", "confirming"]);

function PaymentPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState<NetworkKey | "">("");
  const [coin, setCoin] = useState<CoinSymbol | "">("");
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      setOrder(await fetchOrder(id));
      setError(null);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) setOrder(null);
      else setError(cause instanceof ApiError ? cause.message : "Could not load this order.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // While the order is with the operator, pick up status changes made from the
  // admin panel or Telegram without the customer reloading.
  useEffect(() => {
    if (!order || !LIVE_STATUSES.has(order.status)) {
      if (pollRef.current) window.clearInterval(pollRef.current);
      return;
    }
    pollRef.current = window.setInterval(() => void load(), 15_000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [order?.status, load, order]);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setNotice("Copy is unavailable. Select and copy the value manually.");
    }
  }

  async function confirmMethod() {
    if (!network || !coin) return;
    setBusy(true);
    setError(null);
    try {
      setOrder(await chooseMethod(id, network, coin));
      setNotice("Transfer details are ready. Send the exact amount, then submit the hash.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not set the payment method.");
    } finally {
      setBusy(false);
    }
  }

  async function submitHash() {
    if (!hash.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setOrder(await submitTxHash(id, hash.trim()));
      setHash("");
      setNotice("Payment submitted. Your receipt is below and Curialy has been notified.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not submit the hash.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <SiteChrome>
        <div className="page-wrap flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Loading your order…
        </div>
      </SiteChrome>
    );
  }

  if (!order) {
    return (
      <SiteChrome>
        <main className="page-wrap flex min-h-[62vh] items-center justify-center py-16">
          <section className="max-w-md rounded-xl bg-card p-8 text-center shadow-[var(--shadow-border)]">
            <TriangleAlert className="mx-auto size-9 text-destructive" />
            <h1 className="font-display mt-5 text-3xl">Order not found</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This link may be mistyped or the order may never have been created. Check the code
              on the status page, or start again from the shop.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline">
                <Link to="/order">Check a code</Link>
              </Button>
              <Button asChild>
                <Link to="/">Return to shop</Link>
              </Button>
            </div>
          </section>
        </main>
      </SiteChrome>
    );
  }

  const selectedNetwork = networks.find((item) => item.key === (order.network ?? network));
  const coins = selectedNetwork?.coins ?? [];
  const awaitingMethod = order.status === "awaiting_payment" && !order.coin;
  const awaitingTransfer = order.status === "awaiting_payment" && Boolean(order.coin);
  const settled = ["pending", "confirming", "completed", "rejected"].includes(order.status);

  return (
    <SiteChrome>
      <main className="page-wrap py-9 sm:py-14">
        <div className="grid gap-7 lg:grid-cols-[0.88fr_1.12fr]">
          <section>
            <p className="kicker">Secure payment link</p>
            <h1 className="display mt-3 text-3xl sm:text-4xl">
              {settled ? "Your order is on record." : "Choose how you want to pay."}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Every order is tracked by its code. Keep it: it is how you check status here, and
              how Curialy finds your order on Telegram.
            </p>

            <div className="mt-7 rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="kicker">Order</p>
                  <p className="font-mono-ui mt-2 text-lg font-semibold">{order.orderCode}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm">{order.basketSummary}</p>
                  <p className="tabular text-xl font-semibold">{formatMoney(order.totalUsd)}</p>
                </div>
                {order.status === "awaiting_payment" ? (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Payment window closes {formatWhen(order.expiresAt)}.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <OrderFacts order={order} />
            </div>
            <OrderTimeline order={order} />

            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              Need a hand? The support desk is on Telegram at{" "}
              <a className="underline underline-offset-4" href="https://t.me/Curialy">
                @Curialy
              </a>
              . Quote your order code.
            </p>
          </section>

          <div>
            {settled ? (
              <div className="space-y-5">
                {order.status === "completed" ? (
                  <div className="rounded-2xl bg-card p-6 text-center shadow-[var(--shadow-border)]">
                    <CheckCircle2 className="mx-auto size-10 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="font-display mt-4 text-3xl">Order completed</h2>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                      Curialy has marked this order fulfilled. Your receipt below now reads
                      COMPLETED — keep it as proof of the order.
                    </p>
                  </div>
                ) : order.status === "rejected" ? (
                  <div className="rounded-2xl bg-card p-6 text-center shadow-[var(--shadow-border)]">
                    <TriangleAlert className="mx-auto size-10 text-destructive" />
                    <h2 className="font-display mt-4 text-3xl">Order rejected</h2>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                      {order.adminNote ??
                        "This order was not accepted. Contact @Curialy on Telegram with your order code."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)]">
                    <ShieldCheck className="size-9" />
                    <h2 className="font-display mt-4 text-2xl">
                      {order.status === "confirming"
                        ? "Confirming your transfer"
                        : "With Curialy for review"}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Your payment details were sent to Curialy the moment you submitted them.
                      This page updates itself as the status changes, so you can leave it open.
                    </p>
                  </div>
                )}
                <ReceiptPanel order={order} onRefresh={() => void load()} />
              </div>
            ) : order.status === "expired" ? (
              <section className="rounded-2xl bg-card p-7 text-center shadow-[var(--shadow-border)]">
                <TriangleAlert className="mx-auto size-10" />
                <h2 className="font-display mt-5 text-3xl">Payment window closed</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Start a new order from your bag. Do not send assets against an expired
                  instruction.
                </p>
                <Button asChild className="mt-6">
                  <Link to="/">Return to shop</Link>
                </Button>
              </section>
            ) : (
              <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="kicker">Secure checkout</p>
                    <h2 className="font-display mt-2 text-3xl">
                      {awaitingMethod ? "Payment method" : "Manual transfer details"}
                    </h2>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void copy(window.location.href)}
                    aria-label="Copy payment link"
                  >
                    {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>

                {awaitingMethod ? (
                  <div className="mt-6">
                    {!network ? (
                      <div>
                        <p className="kicker">Step 1 of 3</p>
                        <h3 className="font-display mt-2 text-2xl">Choose a network</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Pick the blockchain you will send from. You choose the coin next.
                        </p>
                        <div className="mt-4 grid gap-3">
                          {networks.map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setNetwork(item.key)}
                              className="flex items-center gap-3 rounded-xl bg-secondary p-4 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
                            >
                              <img src={item.logo} alt="" className="size-7" aria-hidden />
                              <span>
                                <span className="block font-semibold">{item.label}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {item.coins.join(" · ")}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setNetwork("");
                            setCoin("");
                          }}
                          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                        >
                          All networks
                        </button>
                        <p className="kicker mt-4">Step 2 of 3</p>
                        <h3 className="font-display mt-2 text-2xl">
                          Choose a coin on {selectedNetwork?.label}
                        </h3>
                        <div className="mt-4 grid gap-3">
                          {coins.map((symbol) => (
                            <button
                              key={symbol}
                              type="button"
                              onClick={() => setCoin(symbol)}
                              className={cn(
                                "flex items-center gap-3 rounded-xl bg-secondary p-4 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
                                coin === symbol && "shadow-[var(--shadow-border-hover)]",
                              )}
                            >
                              <img src={coinLogo[symbol]} alt="" className="size-7" aria-hidden />
                              <span className="flex-1">
                                <span className="block font-semibold">
                                  {symbol} · {coinLabel[symbol]}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {coinKind[symbol] === "stablecoin"
                                    ? "Stablecoin · amount fixed in dollars"
                                    : "Native coin · amount varies with market price"}
                                </span>
                              </span>
                              {coin === symbol ? <CheckCircle2 className="size-5" /> : null}
                            </button>
                          ))}
                        </div>
                        {coin ? (
                          <div className="mt-6">
                            <p className="kicker">Step 3 of 3</p>
                            <h3 className="font-display mt-2 text-2xl">Confirm the method</h3>
                            <Button
                              type="button"
                              className="mt-4 w-full"
                              disabled={busy}
                              onClick={() => void confirmMethod()}
                            >
                              {busy ? "Preparing…" : `Pay by manual transfer in ${coin}`}
                            </Button>
                            <p className="mt-3 text-xs leading-5 text-muted-foreground">
                              Wallet connect is not available. Manual transfer is the only method.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}

                {awaitingTransfer ? (
                  <div className="mt-6">
                    <div className="divide-y divide-border rounded-xl bg-secondary px-4 shadow-[var(--shadow-border)]">
                      <div className="flex items-center justify-between gap-4 py-3">
                        <span className="text-xs text-muted-foreground">Network</span>
                        <span className="text-sm">
                          {selectedNetwork?.label} · {order.coin}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-3">
                        <span className="text-xs text-muted-foreground">Send exactly</span>
                        <span className="tabular text-sm font-semibold">
                          {order.expectedAmount} {order.coin}
                        </span>
                      </div>
                      <div className="py-3">
                        <span className="text-xs text-muted-foreground">Send to this address</span>
                        <div className="font-mono-ui mt-2 flex items-center gap-2 rounded-md bg-card p-3 text-xs break-all shadow-[var(--shadow-border)]">
                          {order.settlementAddress}
                          <button
                            type="button"
                            onClick={() => void copy(order.settlementAddress ?? "")}
                            className="ml-auto shrink-0 rounded p-1.5 hover:bg-secondary"
                            aria-label="Copy settlement address"
                          >
                            <Clipboard className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="text-xs font-semibold" htmlFor="manual-hash">
                        After the transfer, paste the transaction hash
                      </label>
                      <div className="mt-2 flex gap-2">
                        <Input
                          id="manual-hash"
                          value={hash}
                          onChange={(event) => setHash(event.target.value)}
                          placeholder="Transaction hash"
                        />
                        <Button
                          type="button"
                          disabled={!hash.trim() || busy}
                          onClick={() => void submitHash()}
                        >
                          {busy ? "Sending…" : "Submit"}
                        </Button>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        Submitting the hash notifies Curialy and issues your receipt straight
                        away. It is not itself confirmation that funds arrived.
                      </p>
                    </div>

                    <p className="mt-5 rounded-lg bg-secondary p-3 text-xs leading-5 text-muted-foreground">
                      Do not send assets to any address that does not match these instructions.
                    </p>
                  </div>
                ) : null}

                {error ? (
                  <p className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
                {notice ? (
                  <p className="mt-5 rounded-lg bg-secondary p-3 text-sm">{notice}</p>
                ) : null}

              </section>

            )}
          </div>

        </div>
      </main>
    </SiteChrome>
  );
}


