import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, LogOut, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { StatusBadge } from "@/components/order/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, formatWhen } from "@/lib/format";
import { networkLabel } from "@/lib/payments";
import {
  ApiError,
  STATUS_LABEL,
  adminLogin,
  adminLogout,
  adminOrders,
  adminSession,
  adminSetStatus,
  receiptUrl,
  type Order,
  type OrderStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "confirming", label: "Confirming" },
  { key: "awaiting_payment", label: "Awaiting payment" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [filter, setFilter] = useState("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<Record<string, string>>({});

  const refresh = useCallback(async (status: string) => {
    setBusy(true);
    setError(null);
    try {
      const body = await adminOrders(status);
      setOrders(body.orders);
      setCounts(Object.fromEntries(body.counts.map((row) => [row.status, Number(row.n)])));
      setAuthed(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) setAuthed(false);
      else setError(cause instanceof ApiError ? cause.message : "Could not load orders.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    adminSession()
      .then((body) => setAuthed(body.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (authed) void refresh(filter);
  }, [authed, filter, refresh]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminLogin(password);
      setPassword("");
      setAuthed(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await adminLogout().catch(() => undefined);
    setAuthed(false);
    setOrders([]);
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    setBusy(true);
    setError(null);
    try {
      const note = noteFor[order.orderCode]?.trim() || undefined;
      const updated = await adminSetStatus(order.orderCode, status, note);
      setNoteFor((current) => ({ ...current, [order.orderCode]: "" }));
      setOrders((current) =>
        filter === "all" || updated.status === filter
          ? current.map((item) => (item.orderCode === updated.orderCode ? updated : item))
          : current.filter((item) => item.orderCode !== updated.orderCode),
      );
      void refresh(filter);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not change the status.");
    } finally {
      setBusy(false);
    }
  }

  if (authed === null) {
    return (
      <SiteChrome>
        <div className="page-wrap flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Checking your session…
        </div>
      </SiteChrome>
    );
  }

  if (!authed) {
    return (
      <SiteChrome>
        <main className="page-wrap flex min-h-[70vh] items-center justify-center py-14">
          <form
            onSubmit={signIn}
            className="w-full max-w-sm rounded-2xl bg-card p-7 shadow-[var(--shadow-border)]"
          >
            <ShieldCheck className="size-8" />
            <h1 className="font-display mt-4 text-3xl">Operator sign-in</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Order administration for Curialy. Status changes are also available from the
              Telegram bot.
            </p>
            <label className="mt-6 block text-xs font-semibold" htmlFor="admin-password">
              Password
            </label>
            <Input
              id="admin-password"
              type="password"
              className="mt-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" className="mt-5 w-full" disabled={!password || busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
            {error ? (
              <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </form>
        </main>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <main className="page-wrap py-9 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Operator</p>
            <h1 className="display mt-3 text-3xl sm:text-4xl">Orders</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refresh(filter)}
              aria-label="Refresh"
            >
              <RefreshCw className={cn("size-4", busy && "animate-spin")} />
            </Button>
            <Button type="button" variant="outline" onClick={() => void signOut()}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold shadow-[var(--shadow-border)]",
                filter === item.key ? "bg-foreground text-background" : "bg-card",
              )}
            >
              {item.label}
              {counts[item.key] !== undefined ? (
                <span className="ml-2 opacity-70">{counts[item.key]}</span>
              ) : null}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        ) : null}

        {orders.length === 0 && !busy ? (
          <p className="mt-10 rounded-xl bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
            Nothing in {STATUS_LABEL[filter as OrderStatus]?.toLowerCase() ?? filter}.
          </p>
        ) : null}

        <div className="mt-7 space-y-4">
          {orders.map((order) => (
            <article
              key={order.orderCode}
              className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono-ui text-lg font-semibold">{order.orderCode}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm">{order.basketSummary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.xHandle ? `@${order.xHandle}` : "no handle"} · placed{" "}
                    {formatWhen(order.createdAt)}
                    {order.submittedAt ? ` · submitted ${formatWhen(order.submittedAt)}` : ""}
                  </p>
                </div>
                <p className="tabular text-xl font-semibold">{formatMoney(order.totalUsd)}</p>
              </div>

              {order.coin ? (
                <div className="mt-4 grid gap-2 rounded-xl bg-secondary p-4 text-xs sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Paid with </span>
                    {order.expectedAmount} {order.coin} on {networkLabel(order.network)}
                  </p>
                  <p className="break-all">
                    <span className="text-muted-foreground">Tx </span>
                    <span className="font-mono-ui">{order.txHash ?? "not submitted"}</span>
                  </p>
                </div>
              ) : null}

              {order.adminNote ? (
                <p className="mt-3 text-xs text-muted-foreground">Note: {order.adminNote}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Input
                  value={noteFor[order.orderCode] ?? ""}
                  onChange={(event) =>
                    setNoteFor((current) => ({
                      ...current,
                      [order.orderCode]: event.target.value,
                    }))
                  }
                  placeholder="Optional note shown to the customer"
                  className="min-w-[14rem] flex-1"
                />
                <Button
                  type="button"
                  disabled={busy || order.status === "completed"}
                  onClick={() => void changeStatus(order, "completed")}
                >
                  <CheckCircle2 className="mr-2 size-4" />
                  Complete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || order.status === "confirming"}
                  onClick={() => void changeStatus(order, "confirming")}
                >
                  <Search className="mr-2 size-4" />
                  Confirming
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || order.status === "rejected"}
                  onClick={() => void changeStatus(order, "rejected")}
                >
                  <XCircle className="mr-2 size-4" />
                  Reject
                </Button>
                <Button asChild variant="outline">
                  <a href={receiptUrl(order.orderCode)} target="_blank" rel="noreferrer">
                    Receipt
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </SiteChrome>
  );
}


