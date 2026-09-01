// Server-side copy of the storefront catalog. Prices are resolved here from the
// product/plan keys the client sends, never from client-supplied amounts, so a
// tampered request cannot set its own price.

export const CATALOG = {
  "x-premium": {
    name: "X Premium",
    requiresXHandle: true,
    available: true,
    plans: {
      "x-3": { label: "3 months", price: 3 },
      "x-6": { label: "6 months", price: 6 },
    },
  },
  "google-ai": {
    name: "Google AI",
    requiresXHandle: false,
    available: false,
    plans: {
      "ai-1": { label: "1 month", price: 10 },
      "ai-3": { label: "3 months", price: 27 },
      "ai-6": { label: "6 months", price: 50 },
      "ai-12": { label: "12 months", price: 96 },
    },
  },
};

export const NETWORKS = {
  ethereum: { label: "Ethereum", coins: ["USDC", "USDT", "ETH"] },
  solana: { label: "Solana", coins: ["USDC", "USDT", "SOL"] },
  polygon: { label: "Polygon", coins: ["USDC", "USDT", "POL"] },
};

// The operator's receiving addresses. EVM chains share one; Solana has its own.
export const SETTLEMENT_ADDRESSES = {
  ethereum: "0xb94a707D215Eb8d480E7acC15c831ACC57BA1e25",
  polygon: "0xb94a707D215Eb8d480E7acC15c831ACC57BA1e25",
  solana: "7rtkQHXXG75p5EKhDN6UsCa7H2azqvVJmq3sCY85HSzz",
};

export const STABLECOINS = new Set(["USDC", "USDT"]);

// Static reference prices for native coins, in USD. These do not track the
// market: a native-coin order quotes whatever is here at submission time and
// the quote is frozen onto the order so the receipt stays consistent. Update
// these before relying on native-coin payments.
export const NATIVE_USD_PRICE = { ETH: 3200, SOL: 140, POL: 0.45 };

/**
 * Resolves client-sent line items into priced items and a total.
 * @returns {{items: Array, totalUsd: number, summary: string, requiresXHandle: boolean}}
 * @throws {Error} with `.status = 400` when an item is unknown or unavailable.
 */
export function priceItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw badRequest("Your bag is empty.");
  }
  if (rawItems.length > 12) throw badRequest("Too many lines in one order.");

  const items = [];
  let requiresXHandle = false;

  for (const raw of rawItems) {
    const product = CATALOG[raw?.productId];
    if (!product) throw badRequest(`Unknown product: ${raw?.productId}`);
    if (!product.available) throw badRequest(`${product.name} is not on sale yet.`);
    const plan = product.plans[raw?.planId];
    if (!plan) throw badRequest(`Unknown plan for ${product.name}: ${raw?.planId}`);

    const quantity = Number(raw?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw badRequest("Quantity must be a whole number between 1 and 20.");
    }
    if (product.requiresXHandle) requiresXHandle = true;

    items.push({
      productId: raw.productId,
      productName: product.name,
      planId: raw.planId,
      planLabel: plan.label,
      unitPrice: plan.price,
      quantity,
      lineTotal: Number((plan.price * quantity).toFixed(2)),
    });
  }

  const totalUsd = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const summary = items
    .map((item) => `${item.productName} · ${item.planLabel} × ${item.quantity}`)
    .join(" · ");

  return { items, totalUsd, summary, requiresXHandle };
}

/** Amount to send, as a display string, for a given coin and USD total. */
export function expectedAmount(coin, totalUsd) {
  if (STABLECOINS.has(coin)) return totalUsd.toFixed(2);
  const price = NATIVE_USD_PRICE[coin];
  if (!price) throw badRequest(`No reference price for ${coin}.`);
  const decimals = coin === "ETH" ? 6 : coin === "SOL" ? 4 : 2;
  return (totalUsd / price).toFixed(decimals);
}

export function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}
