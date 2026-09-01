-- Curialy storefront order system.
--
-- Deliberately separate from the `curialy` database used by the previous
-- Express/tRPC application, which is preserved untouched.

CREATE DATABASE IF NOT EXISTS curialy_team
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE curialy_team;

CREATE TABLE IF NOT EXISTS orders (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  -- What the customer types into the order-status page. Short enough to read
  -- off a receipt, random enough that guessing another order is impractical.
  order_code         VARCHAR(24)  NOT NULL UNIQUE,
  -- Unguessable; gates the receipt image so order_code alone cannot enumerate.
  receipt_token      CHAR(32)     NOT NULL,
  x_handle           VARCHAR(64)      NULL,
  items              LONGTEXT     NOT NULL,
  basket_summary     VARCHAR(255) NOT NULL,
  total_usd          DECIMAL(10,2) NOT NULL,
  network            VARCHAR(16)      NULL,
  coin               VARCHAR(12)      NULL,
  settlement_address VARCHAR(160)     NULL,
  expected_amount    VARCHAR(40)      NULL,
  tx_hash            VARCHAR(160)     NULL,
  status             ENUM('awaiting_payment','pending','confirming','completed','rejected','expired')
                     NOT NULL DEFAULT 'awaiting_payment',
  admin_note         TEXT             NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  submitted_at       TIMESTAMP        NULL,
  completed_at       TIMESTAMP        NULL,
  INDEX idx_status_created (status, created_at),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Append-only audit of every status transition, whoever made it.
CREATE TABLE IF NOT EXISTS order_events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT          NOT NULL,
  from_status VARCHAR(24)      NULL,
  to_status   VARCHAR(24)  NOT NULL,
  actor       ENUM('customer','admin_web','admin_telegram','system') NOT NULL,
  note        TEXT             NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_events_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE CASCADE,
  INDEX idx_order (order_id, created_at)
) ENGINE=InnoDB;

-- Admin web sessions. Kept server-side so a status change can be revoked by
-- deleting rows rather than rotating the signing secret.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token      CHAR(48)  NOT NULL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  ip         VARCHAR(45)   NULL
) ENGINE=InnoDB;

-- Sliding-window counters for order creation and order-code lookups.
CREATE TABLE IF NOT EXISTS rate_hits (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  bucket     VARCHAR(64) NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bucket_created (bucket, created_at)
) ENGINE=InnoDB;
