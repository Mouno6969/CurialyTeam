import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        STATUS_TONE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
