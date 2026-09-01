import { bagSummary, totalBagAmount, type BagItem } from "@/lib/storefront";

export type PaymentMethod = "manual_transfer" | "connected_wallet";
export type PaymentStatus = "awaiting" | "submitted" | "paid" | "expired";

export type NetworkKey = "ethereum" | "solana" | "polygon";
export type CoinSymbol = "USDC" | "USDT" | "ETH" | "SOL" | "POL";

export type NetworkOption = {
  key: NetworkKey;
  label: string;
  coins: CoinSymbol[];
  logo: string;
};

export const networks: NetworkOption[] = [
  {
    key: "ethereum",
    label: "Ethereum",
    coins: ["USDC", "USDT", "ETH"],
    logo: "/brand/net-ethereum.svg",
  },
  {
    key: "solana",
    label: "Solana",
    coins: ["USDC", "USDT", "SOL"],
    logo: "/brand/net-solana.svg",
  },
  {
    key: "polygon",
    label: "Polygon",
    coins: ["USDC", "USDT", "POL"],
    logo: "/brand/net-polygon.svg",
  },
];

export const coinKind: Record<CoinSymbol, "stablecoin" | "native"> = {
  USDC: "stablecoin",
  USDT: "stablecoin",
  ETH: "native",
  SOL: "native",
  POL: "native",
};

export const coinLabel: Record<CoinSymbol, string> = {
  USDC: "USD Coin",
  USDT: "Tether USD",
  ETH: "Ether",
  SOL: "Solana",
  POL: "Polygon",
};

export const coinLogo: Record<CoinSymbol, string> = {
  USDC: "/brand/coin-usdc.svg",
  USDT: "/brand/coin-usdt.svg",
  ETH: "/brand/net-ethereum.svg",
  SOL: "/brand/net-solana.svg",
  POL: "/brand/net-polygon.svg",
};

export type PaymentLink = {
  publicId: string;
  createdAt: number;
  expiresAt: number;
  basketSummary: string;
  totalUsd: number;
  xHandle?: string;
  status: PaymentStatus;
  network?: NetworkKey;
  coin?: CoinSymbol;
  method?: PaymentMethod;
  settlementAddress: string;
  txHash?: string;
};

const STORAGE_KEY = "curialy.payments";
const DEMO_ADDRESS = "0xC0r14ly0000000000000000000000000000C0DE";

function readAll(): PaymentLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PaymentLink[];
  } catch {
    return [];
  }
}

function writeAll(items: PaymentLink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function publicId() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `cly_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function createPaymentLink(bag: BagItem[], xHandle?: string): PaymentLink {
  const now = Date.now();
  const link: PaymentLink = {
    publicId: publicId(),
    createdAt: now,
    expiresAt: now + 30 * 60 * 1000,
    basketSummary: bagSummary(bag),
    totalUsd: totalBagAmount(bag),
    xHandle: xHandle?.trim() || undefined,
    status: "awaiting",
    settlementAddress: DEMO_ADDRESS,
  };
  writeAll([link, ...readAll()].slice(0, 24));
  return link;
}

export function getPaymentLink(id: string): PaymentLink | undefined {
  const found = readAll().find((item) => item.publicId === id);
  if (!found) return undefined;
  if (found.status === "awaiting" && found.expiresAt <= Date.now()) {
    return updatePaymentLink(id, { status: "expired" });
  }
  return found;
}

export function updatePaymentLink(
  id: string,
  patch: Partial<PaymentLink>,
): PaymentLink | undefined {
  const items = readAll();
  const next = items.map((item) =>
    item.publicId === id ? { ...item, ...patch } : item,
  );
  writeAll(next);
  return next.find((item) => item.publicId === id);
}

export function expectedAmount(link: PaymentLink) {
  if (!link.coin) return String(link.totalUsd);
  if (coinKind[link.coin] === "stablecoin") return link.totalUsd.toFixed(2);
  if (link.coin === "ETH") return (link.totalUsd / 3200).toFixed(6);
  if (link.coin === "SOL") return (link.totalUsd / 140).toFixed(4);
  return (link.totalUsd / 0.45).toFixed(2);
}
