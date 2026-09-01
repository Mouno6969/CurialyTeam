import { StatusBadge } from "@/components/order/StatusBadge";
import { formatMoney, formatWhen } from "@/lib/format";
import { networkLabel } from "@/lib/payments";
import type { Order } from "@/lib/api";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm break-all">{value}</span>
    </div>
  );
}

/** The order, in plain rows. Used on the payment page and the status page. */
export function OrderFacts({ order }: { order: Order }) {
  return (
    <div className="divide-y divide-border rounded-xl bg-secondary px-4 shadow-[var(--shadow-border)]">
      <Row label="Status" value={<StatusBadge status={order.status} />} />
      <Row label="Order code" value={<span className="font-mono-ui">{order.orderCode}</span>} />
      <Row label="Items" value={order.basketSummary} />
      <Row label="Total" value={<span className="tabular">{formatMoney(order.totalUsd)}</span>} />
      <Row label="X handle" value={order.xHandle ? `@${order.xHandle}` : "Not provided"} />
      {order.network && order.coin ? (
        <>
          <Row label="Paid with" value={`${networkLabel(order.network)} · ${order.coin}`} />
          <Row
            label="Amount sent"
            value={
              <span className="tabular font-semibold">
                {order.expectedAmount} {order.coin}
              </span>
            }
          />
        </>
      ) : null}
      {order.txHash ? (
        <Row label="Transaction hash" value={<span className="font-mono-ui text-xs">{order.txHash}</span>} />
      ) : null}
      <Row label="Placed" value={formatWhen(order.createdAt)} />
      {order.submittedAt ? <Row label="Payment submitted" value={formatWhen(order.submittedAt)} /> : null}
      {order.completedAt ? <Row label="Completed" value={formatWhen(order.completedAt)} /> : null}
      {order.adminNote ? <Row label="Note from Curialy" value={order.adminNote} /> : null}
    </div>
  );
}

/** Append-only history, newest last, as recorded by the server. */
export function OrderTimeline({ order }: { order: Order }) {
  if (!order.events?.length) return null;
  return (
    <div className="mt-5 rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
      <p className="kicker">History</p>
      <ol className="mt-4 space-y-3">
        {order.events.map((event, index) => (
          <li key={`${event.status}-${index}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <StatusBadge status={event.status} />
            <span className="text-muted-foreground">{formatWhen(event.at)}</span>
            {event.note ? <span className="text-muted-foreground">— {event.note}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
