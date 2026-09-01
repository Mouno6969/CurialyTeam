export type AppTheme = "light" | "dark";

export function resolveInitialTheme(
  storedTheme: string | null,
  fallback: AppTheme = "dark",
): AppTheme {
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return fallback;
}
