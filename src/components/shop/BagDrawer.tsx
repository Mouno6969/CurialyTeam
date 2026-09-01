import { type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { ProductMark } from "@/components/brand/ProductMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBag } from "@/lib/bag-store";
import { formatMoney } from "@/lib/format";
import { ApiError, createOrder } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function BagDrawer() {
  const navigate = useNavigate();
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
      setError(
        cause instanceof ApiError ? cause.message : "Could not open a payment link. Try again.",
      );
      setPending(false);
    }
  }

  function submitHandle(event: FormEvent) {
    event.preventDefault();
    const next = xHandle.trim();
    if (!/^[A-Za-z0-9_]{1,15}$/.test(next)) {
      setError("Use 1–15 letters, numbers, or underscores.");
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
        aria-label="Close shopping bag"
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
            <p className="kicker">Your selection</p>
            <h2 className="font-display mt-1 text-2xl tracking-[-0.03em]">
              Shopping bag ({itemCount})
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Close bag">
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isXHandleStep ? (
            <form
              onSubmit={submitHandle}
              className="rounded-xl bg-secondary p-5 shadow-[var(--shadow-border)]"
            >
              <p className="kicker">One last detail</p>
              <h3 className="font-display mt-2 text-3xl tracking-[-0.03em]">
                Where should we deliver X Premium?
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Enter the exact X handle that should receive this purchase. Never enter a
                password, recovery code, or wallet secret.
              </p>
              <label className="mt-6 block text-sm font-medium" htmlFor="x-handle">
                X handle
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
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Use 1–15 letters, numbers, or underscores.
              </p>
              {error ? (
                <p className="mt-4 rounded-md bg-destructive/15 px-3 py-2 text-xs leading-5 text-destructive">
                  {error}
                </p>
              ) : null}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={backToBag} disabled={pending}>
                  Back to bag
                </Button>
                <Button type="submit" disabled={!xHandle.trim() || pending}>
                  <ShieldCheck className="size-4" />
                  {pending ? "Opening payment…" : "Continue to payment"}
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
                    <ProductMark
                      kind={item.product.mark}
                      className="h-8 w-8"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.plan.label}</p>
                      </div>
                      <p className="tabular text-sm font-semibold">
                        {formatMoney(item.plan.price * item.quantity)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-md shadow-[var(--shadow-border)]">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
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
                          aria-label="Increase quantity"
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
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="size-7 text-muted-foreground" />
              <h3 className="font-display mt-4 text-2xl">Your bag is open.</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                Choose a plan and it will appear here, ready to create a secure payment link.
              </p>
            </div>
          )}
        </div>

        {!isXHandleStep ? (
          <div className="border-t border-border bg-secondary p-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Estimated total</span>
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
              {pending ? "Creating secure payment link…" : "Continue to payment"}
            </Button>
            {error ? (
              <p className="mt-3 rounded-md bg-destructive/15 px-3 py-2 text-center text-xs leading-5 text-destructive">
                {error}
              </p>
            ) : (
              <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
                You will choose a network and either transfer manually or pay from a connected
                wallet on the next page.
              </p>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
