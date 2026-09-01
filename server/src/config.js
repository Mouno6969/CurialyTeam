// Configuration is supplied entirely by the systemd EnvironmentFile
// (/etc/curialy-api/curialy-api.env, root-only). Nothing here has a usable
// default for a secret: missing values fail the process at boot instead of
// silently running with a weak one.

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  env: process.env.NODE_ENV || "development",
  host: process.env.HOST || "127.0.0.1",
  port: Number(process.env.PORT || 5052),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || "https://curialy.com").replace(/\/$/, ""),

  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "curialy_team",
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
  },

  telegram: {
    token: required("TELEGRAM_BOT_TOKEN"),
    adminChatId: required("TELEGRAM_ADMIN_CHAT_ID"),
    webhookSecret: required("TELEGRAM_WEBHOOK_SECRET"),
  },

  adminPasswordHash: required("ADMIN_PASSWORD_HASH"),

  // How long a web admin session stays valid.
  sessionTtlHours: 12,
  // An unpaid order stops being payable after this long.
  orderTtlMinutes: 30,
};

export const ORDER_STATUSES = [
  "awaiting_payment",
  "pending",
  "confirming",
  "completed",
  "rejected",
  "expired",
];

// Statuses an admin is allowed to set by hand. `awaiting_payment` is only ever
// set at creation, and `expired` only by the sweeper.
export const ADMIN_SETTABLE = ["pending", "confirming", "completed", "rejected"];

export const STATUS_LABELS = {
  awaiting_payment: "AWAITING PAYMENT",
  pending: "PENDING REVIEW",
  confirming: "CONFIRMING",
  completed: "COMPLETED",
  rejected: "REJECTED",
  expired: "EXPIRED",
};
