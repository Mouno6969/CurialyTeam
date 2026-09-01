export type Plan = {
  id: string;
  label: string;
  price: number;
  compareAtPrice?: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  mark: "x" | "google-ai";
  officialMarkAlt: string;
  available: boolean;
  checkoutRequirement?: "x_handle";
  plans: Plan[];
};

export type BagItem = {
  product: CatalogProduct;
  plan: Plan;
  quantity: number;
};

export const catalog: CatalogProduct[] = [
  {
    id: "x-premium",
    name: "X Premium",
    category: "Social plan",
    description:
      "A clear duration for premium social features, delivered with next-step guidance.",
    mark: "x",
    officialMarkAlt: "X logo",
    available: true,
    checkoutRequirement: "x_handle",
    plans: [
      { id: "x-3", label: "3 months", price: 3, compareAtPrice: 4 },
      { id: "x-6", label: "6 months", price: 6, compareAtPrice: 8 },
    ],
  },
  {
    id: "google-ai",
    name: "Google AI",
    category: "AI plan",
    description:
      "Flexible access periods for AI tools, with the plan length set before you request an order.",
    mark: "google-ai",
    officialMarkAlt: "Google AI",
    available: false,
    plans: [
      { id: "ai-1", label: "1 month", price: 10 },
      { id: "ai-3", label: "3 months", price: 27 },
      { id: "ai-6", label: "6 months", price: 50 },
      { id: "ai-12", label: "12 months", price: 96 },
    ],
  },
];

export function addBagItem(
  current: BagItem[],
  product: CatalogProduct,
  plan: Plan,
): BagItem[] {
  const match = current.find(
    (item) => item.product.id === product.id && item.plan.id === plan.id,
  );
  if (!match) return [...current, { product, plan, quantity: 1 }];
  return current.map((item) =>
    item === match ? { ...item, quantity: item.quantity + 1 } : item,
  );
}

export function setBagItemQuantity(
  current: BagItem[],
  productId: string,
  planId: string,
  quantity: number,
): BagItem[] {
  if (quantity <= 0) {
    return current.filter(
      (item) => !(item.product.id === productId && item.plan.id === planId),
    );
  }
  return current.map((item) =>
    item.product.id === productId && item.plan.id === planId
      ? { ...item, quantity }
      : item,
  );
}

export function totalBagQuantity(bag: BagItem[]) {
  return bag.reduce((sum, item) => sum + item.quantity, 0);
}

export function totalBagAmount(bag: BagItem[]) {
  return bag.reduce((sum, item) => sum + item.plan.price * item.quantity, 0);
}

export function bagSummary(bag: BagItem[]) {
  return bag
    .map((item) => `${item.product.name} · ${item.plan.label} × ${item.quantity}`)
    .join(" · ");
}
