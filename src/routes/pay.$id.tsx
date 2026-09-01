import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Copy,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatWhen, formatMoney } from "@/lib/format";
import {
  coinKind,
  coinLabel,
  coinLogo,
  expectedAmount,
  getPaymentLink,
  networks,
  updatePaymentLink,
  type CoinSymbol,
  type NetworkKey,
  type PaymentLink,
} from "@/lib/payments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pay/$id")({ component: PaymentPage });

function PaymentPage() {
  const { id } = Route.useParams();
  const [link, setLink] = useState<PaymentLink | undefined>();
  const [ready, setReady] = useState(false);
  const [network, setNetwork] = useState<NetworkKey | "">("");
  const [coin, setCoin] = useState<CoinSymbol | "">("");
  const [hash, setHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLink(getPaymentLink(id));
    setReady(true);
  }, [id]);

  function refresh(next?: PaymentLink) {
    setLink(next ?? getPaymentLink(id));
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setNotice("Copy is unavailable. Select and copy the value manually.");
    }
  }

  function chooseManual() {
    if (!network || !coin) return;
    refresh(
      updatePaymentLink(id, {
        network,
        coin,
        method: "manual_transfer",
      }),
    );
    setNotice("Manual transfer instructions are ready. Send the exact amount, then submit the transaction hash.");
  }

  function submitHash() {
    if (!hash.trim()) return;
    refresh(
      updatePaymentLink(id, {
        status: "submitted",
        txHash: hash.trim(),
      }),
    );
    setNotice("Hash recorded. Independent verification would now confirm the received asset, amount, and destination.");
  }

  function simulatePaid() {
    refresh(updatePaymentLink(id, { status: "paid" }));
  }

  if (!ready) {
    return (
      <SiteChrome>
        <div className="page-wrap flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Loading payment link…
        </div>
      </SiteChrome>
    );
  }

  if (!link) {
    return (
      <SiteChrome>
        <main className="page-wrap flex min-h-[62vh] items-center justify-center py-16">
          <section className="max-w-md rounded-xl bg-card p-8 text-center shadow-[var(--shadow-border)]">
            <TriangleAlert className="mx-auto size-9 text-destructive" />
            <h1 className="font-display mt-5 text-3xl">Payment link unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This link may be invalid, expired, or no longer available. Return to the shop and
              create a fresh payment link from your bag.
            </p>
            <Button asChild className="mt-6">
              <Link to="/">Return to shop</Link>
            </Button>
          </section>
        </main>
      </SiteChrome>
    );
  }

  const selectedNetwork = networks.find((item) => item.key === (link.network ?? network));
  const coins = selectedNetwork?.coins ?? [];

  return (
    <SiteChrome>
      <main className="page-wrap py-9 sm:py-14">
        <div className="grid gap-7 lg:grid-cols-[0.88fr_1.12fr]">
          <section>
            <p className="kicker">Secure payment link</p>
            <h1 className="display mt-3 text-3xl sm:text-4xl">Choose how you want to pay.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Both methods lead to the same verification: the received asset, exact amount,
              settlement address, and required confirmations must match before this order
              becomes paid.
            </p>
            <div className="mt-7 rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="kicker">Payment summary</p>
                  <p className="mt-2 text-lg font-semibold">{link.basketSummary}</p>
                </div>
                <p className="tabular text-xl font-semibold">{formatMoney(link.totalUsd)}</p>
              </div>
              <div className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Link status:{" "}
                <span className="capitalize text-foreground">{link.status.replace("_", " ")}</span>
                {" · "}
                Expires {formatWhen(link.expiresAt)}
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
                <p className="font-semibold">Manual transfer</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Copy the network address and exact amount, send from any wallet, then paste
                  the transaction hash.
                </p>
              </div>
              <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
                <p className="font-semibold">Connected wallet</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Connect an EVM wallet, approve the transaction, and the hash is submitted
                  automatically.
                </p>
              </div>
            </div>
          </section>
          <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)] sm:p-7">
            {link.status === "paid" ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto size-10" />
                <h2 className="font-display mt-5 text-3xl">Payment confirmed</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  Verification matched the expected asset and amount. If the order was
                  referral-attributed and eligible, qualification is handled next.
                </p>
                <Button asChild className="mt-6">
                  <Link to="/">Return to shop</Link>
                </Button>
              </div>
            ) : link.status === "expired" ? (
              <div className="py-8 text-center">
                <TriangleAlert className="mx-auto size-10" />
                <h2 className="font-display mt-5 text-3xl">Payment link expired</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Create a new payment link from your bag. Do not send assets to an expired
                  instruction.
                </p>
                <Button asChild className="mt-6">
                  <Link to="/">Return to shop</Link>
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="kicker">Secure checkout</p>
                    <h2 className="font-display mt-2 text-3xl">Payment method</h2>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copy(window.location.href)}
                    aria-label="Copy payment link"
                  >
                    {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>

                {!link.method ? (
                  <div className="mt-6">
                    {!network ? (
                      <div>
                        <p className="kicker">Step 1 of 3</p>
                        <h3 className="font-display mt-2 text-2xl">Choose a network</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Pick the blockchain you will send from. You choose the coin next.
                        </p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {networks.map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setNetwork(item.key)}
                              className="flex items-center gap-3 rounded-xl bg-secondary p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
                            >
                              <img
                                src={item.logo}
                                alt=""
                                className="size-9 rounded-full"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold">{item.label}</span>
                                <span className="mt-1 block text-xs text-muted-foreground">
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
                          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="size-3.5" />
                          All networks
                        </button>
                        <p className="kicker">Step 2 of 3</p>
                        <h3 className="font-display mt-2 text-2xl">
                          Choose a coin on {selectedNetwork?.label}
                        </h3>
                        <div className="mt-5 grid gap-3">
                          {coins.map((symbol) => (
                            <button
                              key={symbol}
                              type="button"
                              onClick={() => setCoin(symbol)}
                              className={cn(
                                "flex items-center gap-3 rounded-xl bg-secondary p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150",
                                coin === symbol && "shadow-[var(--shadow-border-hover)]",
                              )}
                            >
                              <img
                                src={coinLogo[symbol]}
                                alt=""
                                className="size-9 rounded-full"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold">
                                  {symbol}{" "}
                                  <span className="font-normal text-muted-foreground">
                                    · {coinLabel[symbol]}
                                  </span>
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
                            <h3 className="font-display mt-2 text-2xl">How do you want to pay?</h3>
                            <div className="mt-4 grid gap-3">
                              <button
                                type="button"
                                onClick={chooseManual}
                                className="rounded-xl bg-secondary p-4 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
                              >
                                <p className="font-semibold">Pay by manual transfer</p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  Copy the address and exact amount, send from any wallet, then
                                  paste the transaction hash.
                                </p>
                              </button>
                              <button
                                type="button"
                                disabled
                                className="rounded-xl bg-secondary p-4 text-left opacity-55 shadow-[var(--shadow-border)]"
                              >
                                <p className="font-semibold">Connect wallet and pay</p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  Wallet connect is available on the production payment service.
                                  Use manual transfer in this preview.
                                </p>
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6">
                    <p className="kicker">Payment instructions</p>
                    <h2 className="font-display mt-2 text-3xl">Manual transfer details</h2>
                    <div className="mt-5 divide-y divide-border rounded-xl bg-secondary px-4 shadow-[var(--shadow-border)]">
                      <div className="flex items-center justify-between gap-4 py-3">
                        <span className="text-xs text-muted-foreground">Network</span>
                        <span className="text-sm">
                          {networks.find((n) => n.key === link.network)?.label} · {link.coin}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-3">
                        <span className="text-xs text-muted-foreground">Send exactly</span>
                        <span className="tabular text-sm font-semibold">
                          {expectedAmount(link)} {link.coin}
                        </span>
                      </div>
                      <div className="py-3">
                        <span className="text-xs text-muted-foreground">Send to this address</span>
                        <div className="mt-2 flex items-center gap-2 rounded-md bg-card p-3 font-mono-ui text-xs break-all shadow-[var(--shadow-border)]">
                          {link.settlementAddress}
                          <button
                            type="button"
                            onClick={() => copy(link.settlementAddress)}
                            className="ml-auto shrink-0 rounded p-1.5 hover:bg-secondary"
                            aria-label="Copy settlement address"
                          >
                            <Clipboard className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {link.status === "submitted" ? (
                      <div className="mt-5 rounded-lg bg-secondary p-4 text-sm leading-6">
                        <ShieldCheck className="mr-2 inline size-4" />
                        Hash submitted. Waiting for independent confirmation.
                      </div>
                    ) : (
                      <div className="mt-5">
                        <label className="text-xs font-semibold" htmlFor="manual-hash">
                          After transfer, paste transaction hash
                        </label>
                        <div className="mt-2 flex gap-2">
                          <Input
                            id="manual-hash"
                            value={hash}
                            onChange={(event) => setHash(event.target.value)}
                            placeholder="Transaction hash"
                          />
                          <Button type="button" disabled={!hash.trim()} onClick={submitHash}>
                            Submit
                          </Button>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={simulatePaid}
                      className="mt-4 text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Preview confirmation
                    </button>
                    <p className="mt-5 rounded-lg bg-secondary p-3 text-xs leading-5 text-muted-foreground">
                      A submitted hash is not payment confirmation. Do not send assets to an
                      address that does not match these instructions.
                    </p>
                  </div>
                )}
                {notice ? (
                  <p className="mt-5 rounded-lg bg-secondary p-3 text-sm">{notice}</p>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </main>
    </SiteChrome>
  );
}
