import { create } from "zustand";
import {
  addBagItem,
  setBagItemQuantity,
  totalBagAmount,
  totalBagQuantity,
  type CatalogProduct,
  type Plan,
  type BagItem,
} from "@/lib/storefront";

type BagState = {
  bag: BagItem[];
  isOpen: boolean;
  isXHandleStep: boolean;
  xHandle: string;
  add: (product: CatalogProduct, plan: Plan) => void;
  updateQuantity: (productId: string, planId: string, quantity: number) => void;
  remove: (productId: string, planId: string) => void;
  open: () => void;
  close: () => void;
  beginXHandle: () => void;
  backToBag: () => void;
  setXHandle: (value: string) => void;
  clear: () => void;
  itemCount: () => number;
  total: () => number;
  needsXHandle: () => boolean;
};

export const useBag = create<BagState>()((set, get) => ({
  bag: [],
  isOpen: false,
  isXHandleStep: false,
  xHandle: "",
  add: (product, plan) =>
    set((state) => ({
      bag: addBagItem(state.bag, product, plan),
      isOpen: true,
      isXHandleStep: false,
    })),
  updateQuantity: (productId, planId, quantity) =>
    set((state) => ({
      bag: setBagItemQuantity(state.bag, productId, planId, quantity),
    })),
  remove: (productId, planId) =>
    set((state) => ({
      bag: setBagItemQuantity(state.bag, productId, planId, 0),
    })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, isXHandleStep: false }),
  beginXHandle: () => set({ isXHandleStep: true }),
  backToBag: () => set({ isXHandleStep: false }),
  setXHandle: (value) => set({ xHandle: value.replace(/^@/, "") }),
  clear: () => set({ bag: [], isOpen: false, isXHandleStep: false, xHandle: "" }),
  itemCount: () => totalBagQuantity(get().bag),
  total: () => totalBagAmount(get().bag),
  needsXHandle: () =>
    get().bag.some((item) => item.product.checkoutRequirement === "x_handle"),
}));
