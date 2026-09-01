import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { receiptUrl, type Order } from "@/lib/api";

/**
 * The receipt is rendered server-side, so this shows the current image rather
 * than reconstructing it in the browser. The cache-buster is keyed to the
 * status and timestamps so the picture updates the moment the order does.
 */
export function ReceiptPanel({ order, onRefresh }: { order: Order; onRefresh?: () => void }) {
  const version = [order.status, order.submittedAt, order.completedAt, order.adminNote]
    .map((part) => part ?? "")
    .join("|");
  const src = `${receiptUrl(order.orderCode)}?v=${encodeURIComponent(version)}`;

  return (
    <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">Your receipt</p>
          <h2 className="font-display mt-2 text-2xl">Order {order.orderCode}</h2>
        </div>
        <div className="flex gap-2">
          {onRefresh ? (
            <Button type="button" variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh receipt">
              <RefreshCw className="size-4" />
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <a href={src} download={`curialy-receipt-${order.orderCode}.png`}>
              <Download className="mr-2 size-4" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl bg-secondary p-3">
        <img
          src={src}
          alt={`Receipt for order ${order.orderCode}, status ${order.status}`}
          className="mx-auto block w-full max-w-[560px] rounded-lg"
          loading="lazy"
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        The barcode and QR code both carry this order code. Scanning the QR opens the status
        page for this order, so the receipt can be checked without typing anything.
      </p>
    </section>
  );
}
