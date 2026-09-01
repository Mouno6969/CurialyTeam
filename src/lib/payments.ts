// Presentation metadata for the payment step. Order state itself lives on the
// server (see @/lib/api) — this file only describes how networks and coins are
// labelled and which logo belongs to each.

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

export function networkLabel(key: string | null | undefined) {
  return networks.find((network) => network.key === key)?.label ?? key ?? "—";
}
