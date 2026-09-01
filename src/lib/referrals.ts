const CODE_KEY = "curialy.referralCode";

export const DEMO_CAMPAIGN = {
  name: "Founding circle",
  commissionUsd: 2,
  waitDays: 7,
};

export function getOrCreateReferralCode() {
  if (typeof window === "undefined") return "CURIALY";
  const existing = localStorage.getItem(CODE_KEY);
  if (existing) return existing;
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const code = `C${Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, "0")).join("")}`;
  localStorage.setItem(CODE_KEY, code);
  return code;
}

export function rememberReferral(code: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("curialy.referredBy", code.trim().toUpperCase());
}
