// Thin client for the order API. Everything that used to live in localStorage
// is now server state: the order, its status, and its receipt all belong to the
// backend so support, the admin panel, and the Telegram bot see the same thing.

export type OrderStatus =
  | "awaiting_payment"
  | "pending"
  | "confirming"
  | "completed"
  | "rejected"
  | "expired";

export type OrderItem = {
  productId: string;
  productName: string;
  planId: string;
  planLabel: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderEvent = {
  status: OrderStatus;
  actor: "customer" | "admin_web" | "admin_telegram" | "system";
  note: string | null;
  at: string;
};

export type Order = {
  orderCode: string;
  xHandle: string | null;
  items: OrderItem[];
  basketSummary: string;
  totalUsd: number;
  network: string | null;
  coin: string | null;
  settlementAddress: string | null;
  expectedAmount: string | null;
  txHash: string | null;
  status: OrderStatus;
  adminNote: string | null;
  createdAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  receiptUrl: string;
  events?: OrderEvent[];
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new ApiError(body.error ?? "Something went wrong.", response.status);
  }
  return body as T;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting payment",
  pending: "Pending review",
  confirming: "Confirming",
  completed: "Completed",
  rejected: "Rejected",
  expired: "Expired",
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  awaiting_payment: "bg-secondary text-foreground",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  confirming: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-destructive/15 text-destructive",
  expired: "bg-secondary text-muted-foreground",
};

export function createOrder(
  items: Array<{ productId: string; planId: string; quantity: number }>,
  xHandle?: string,
) {
  return request<{ order: Order }>("/orders", {
    method: "POST",
    body: JSON.stringify({ items, xHandle }),
  }).then((body) => body.order);
}

export function fetchOrder(code: string) {
  return request<{ order: Order }>(`/orders/${encodeURIComponent(code)}`).then(
    (body) => body.order,
  );
}

export function chooseMethod(code: string, network: string, coin: string) {
  return request<{ order: Order }>(`/orders/${encodeURIComponent(code)}/method`, {
    method: "POST",
    body: JSON.stringify({ network, coin }),
  }).then((body) => body.order);
}

export function submitTxHash(code: string, txHash: string) {
  return request<{ order: Order }>(`/orders/${encodeURIComponent(code)}/submit`, {
    method: "POST",
    body: JSON.stringify({ txHash }),
  }).then((body) => body.order);
}

export function receiptUrl(code: string) {
  return `/api/orders/${encodeURIComponent(code)}/receipt.png`;
}

// --- admin ---

export function adminLogin(password: string) {
  return request<{ authenticated: boolean }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function adminLogout() {
  return request<{ authenticated: boolean }>("/admin/logout", { method: "POST" });
}

export function adminSession() {
  return request<{ authenticated: boolean }>("/admin/session");
}

export function adminOrders(status: string) {
  return request<{ orders: Order[]; counts: Array<{ status: OrderStatus; n: number }> }>(
    `/admin/orders?status=${encodeURIComponent(status)}&limit=100`,
  );
}

export function adminSetStatus(code: string, status: OrderStatus, note?: string) {
  return request<{ order: Order }>(`/admin/orders/${encodeURIComponent(code)}/status`, {
    method: "POST",
    body: JSON.stringify({ status, note }),
  }).then((body) => body.order);
}
