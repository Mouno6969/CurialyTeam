import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrokenRing } from "@/components/brand/DotField";
import { ProductMark } from "@/components/brand/ProductMark";
import { useBag } from "@/lib/bag-store";
import { formatMoney } from "@/lib/format";
import type { CatalogProduct } from "@/lib/storefront";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const add = useBag((s) => s.add);
  const [selectedPlanId, setSelectedPlanId] = useState(product.plans[0]?.id ?? "");
  const selectedPlan =
    product.plans.find((plan) => plan.id === selectedPlanId) ?? product.plans[0];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-smooth-out)] hover:-translate-y-1 hover:shadow-[var(--shadow-border-hover)]">
      <div className="relative flex aspect-[1.18/1] items-center justify-center overflow-hidden">
        <div className="dot-field absolute inset-0 opacity-80" />
        <div className="absolute inset-4 rounded-lg hairline-ring" />
        <BrokenRing className="absolute size-44 opacity-35 sm:size-52" />
        <Badge className="absolute left-4 top-4 z-10">{product.category}</Badge>
        {!product.available ? (
          <Badge className="absolute right-4 top-4 z-10" variant="quiet">
            Unavailable
          </Badge>
        ) : null}
        <ProductMark
          kind={product.mark}
          className="relative z-10 h-20 w-20"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-2xl tracking-[-0.03em] text-foreground">
          {product.name}
        </h3>
        <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-2" aria-label={`Choose ${product.name} duration`}>
          {product.plans.map((plan) => {
            const selected = selectedPlan?.id === plan.id;
            return (
              <button
                type="button"
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                disabled={!product.available}
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-medium transition-[background-color,color,box-shadow] duration-150",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground shadow-[var(--shadow-border)] hover:text-foreground",
                  "disabled:cursor-not-allowed disabled:opacity-45",
                )}
              >
                {plan.label}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="kicker">Plan price</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="tabular text-xl font-semibold tracking-tight">
                {selectedPlan ? formatMoney(selectedPlan.price) : "—"}
              </p>
              {selectedPlan?.compareAtPrice ? (
                <p className="text-xs text-muted-foreground line-through">
                  {formatMoney(selectedPlan.compareAtPrice)}
                </p>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            disabled={!selectedPlan || !product.available}
            onClick={() => selectedPlan && product.available && add(product, selectedPlan)}
          >
            {product.available ? (
              <>
                <Plus className="size-4" />
                Add to bag
              </>
            ) : (
              "Currently unavailable"
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
