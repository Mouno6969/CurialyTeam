import { type FormEvent, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { ProductMark } from "@/components/brand/ProductMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBag } from "@/lib/bag-store";
import { formatMoney } from "@/lib/format";
import { planLabel, useI18n, useT } from "@/lib/i18n";
import { ApiError, createOrder } from "@/lib/api";
import { cn } from "@/lib/utils";

export function BagDrawer() {
  const navigate = useNavigate();
  const t = useT();
  const locale = useI18n((s) => s.locale);
  const {
    bag,
    isOpen,
    isXHandleStep,
    xHandle,
    close,
    updateQuantity,
    remove,
    beginXHandle,
    backToBag,
    setXHandle,
    needsXHandle,
    total,
    clear,
  } = useBag();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const itemCount = bag.reduce((sum, item) => sum + item.quantity, 0);

  function checkout() {
    setError(null);
    if (needsXHandle()) {
      beginXHandle();
      return;
    }
    void finish();
  }

  async function finish(handle?: string) {
    if (!bag.length) return;
    setPending(true);
    try {
      const order = await createOrder(
        bag.map((item) => ({
          productId: item.product.id,
          planId: item.plan.id,
          quantity: item.quantity,
        })),
        handle,
      );
      clear();
      void navigate({ to: "/pay/$id", params: { id: order.orderCode } });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t("bag.payError"));
      setPending(false);
    }
  }

  function submitHandle(event: FormEvent) {
    event.preventDefault();
    const next = xHandle.trim();
    if (!/^[A-Za-z0-9_]{1,15}$/.test(next)) {
      setError(t("bag.handleError"));
      return;
    }
    void finish(next);
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label={t("bag.closeOverlay")}
        onClick={close}
        className={cn(
          "absolute inset-0 bg-background/55 backdrop-blur-[2px] transition-opacity duration-200 ease-[var(--ease-smooth-out)]",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-card shadow-[var(--shadow-border),-24px_0_60px_-28px_rgb(0_0_0_/_0.45)] transition-transform duration-200 ease-[var(--ease-smooth-out)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="kicker">{t("bag.kicker")}</p>
            <h2 className="font-display mt-1 text-2xl tracking-[-0.03em]">
              {t("bag.title", { n: itemCount })}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={close} aria-label={t("bag.close")}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isXHandleStep ? (
            <form
              onSubmit={submitHandle}
              className="rounded-xl bg-secondary p-5 shadow-[var(--shadow-border)]"
            >
              <p className="kicker">{t("bag.handleKicker")}</p>
              <h3 className="font-display mt-2 text-3xl tracking-[-0.03em]">
                {t("bag.handleTitle")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("bag.handleCopy")}
              </p>
              <label className="mt-6 block text-sm font-medium" htmlFor="x-handle">
                {t("bag.handleLabel")}
              </label>
              <div className="mt-2 flex items-center rounded-md bg-card shadow-[var(--shadow-border)] focus-within:ring-2 focus-within:ring-ring/70">
                <span className="px-3 text-sm font-medium text-muted-foreground">@</span>
                <Input
                  id="x-handle"
                  autoFocus
                  value={xHandle}
                  onChange={(event) => setXHandle(event.target.value)}
                  placeholder="exact_handle"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={15}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("bag.handleHint")}</p>
              {error ? (
                <p className="mt-4 rounded-md bg-destructive/15 px-3 py-2 text-xs leading-5 text-destructive">
                  {error}
                </p>
              ) : null}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={backToBag} disabled={pending}>
                  {t("bag.back")}
                </Button>
                <Button type="submit" disabled={!xHandle.trim() || pending}>
                  <ShieldCheck className="size-4" />
                  {pending ? t("bag.opening") : t("bag.continue")}
                </Button>
              </div>
            </form>
          ) : bag.length ? (
            <div className="space-y-5">
              {bag.map((item) => (
                <div
                  key={`${item.product.id}-${item.plan.id}`}
                  className="flex gap-4 border-b border-border pb-5"
                >
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-secondary shadow-[var(--shadow-border)]">
                    <ProductMark kind={item.product.mark} className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {planLabel(locale, item.plan.id)}
                        </p>
                      </div>
                      <p className="tabular text-sm font-semibold">
                        {formatMoney(item.plan.price * item.quantity)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-md shadow-[var(--shadow-border)]">
                        <button
                          type="button"
                          aria-label={t("bag.decrease")}
                          onClick={() =>
                            updateQuantity(item.product.id, item.plan.id, item.quantity - 1)
                          }
                          className="p-2 text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-7 text-center text-xs font-medium tabular">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={t("bag.increase")}
                          onClick={() =>
                            updateQuantity(item.product.id, item.plan.id, item.quantity + 1)
                          }
                          className="p-2 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.product.id, item.plan.id)}
                        className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                      >
                        {t("bag.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="size-7 text-muted-foreground" />
              <h3 className="font-display mt-4 text-2xl">{t("bag.emptyTitle")}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                {t("bag.emptyCopy")}
              </p>
            </div>
          )}
        </div>

        {!isXHandleStep ? (
          <div className="border-t border-border bg-secondary p-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("bag.total")}</span>
              <span className="tabular font-semibold text-foreground">
                {bag.length ? formatMoney(total()) : "—"}
              </span>
            </div>
            <Button
              type="button"
              className="mt-5 w-full"
              onClick={checkout}
              disabled={!bag.length || pending}
            >
              <ShieldCheck className="size-4" />
              {pending ? t("bag.creating") : t("bag.continue")}
            </Button>
            {error ? (
              <p className="mt-3 rounded-md bg-destructive/15 px-3 py-2 text-center text-xs leading-5 text-destructive">
                {error}
              </p>
            ) : (
              <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
                {t("bag.hint")}
              </p>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
