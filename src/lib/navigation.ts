import type { MessageKey } from "@/lib/locales/en";

export const storefrontNavigation: {
  labelKey: MessageKey;
  href: "/" | "/order" | "/referrals" | "/how-it-works" | "/support" | "/documentation";
}[] = [
  { labelKey: "nav.shop", href: "/" },
  { labelKey: "nav.order", href: "/order" },
  { labelKey: "nav.rewards", href: "/referrals" },
  { labelKey: "nav.how", href: "/how-it-works" },
  { labelKey: "nav.support", href: "/support" },
  { labelKey: "nav.docs", href: "/documentation" },
];

export const footerNavigation: {
  labelKey: MessageKey;
  href: "/" | "/order" | "/how-it-works" | "/support" | "/refund-policy" | "/documentation";
}[] = [
  { labelKey: "nav.shop", href: "/" },
  { labelKey: "nav.order", href: "/order" },
  { labelKey: "nav.how", href: "/how-it-works" },
  { labelKey: "nav.support", href: "/support" },
  { labelKey: "nav.refund", href: "/refund-policy" },
  { labelKey: "nav.docs", href: "/documentation" },
];
