export function themePreference(
  value: string | null,
): "light" | "dark" | "system" {
  return value === "light" || value === "system" ? value : "dark";
}
export function resolvedTheme(
  value: "light" | "dark" | "system",
  systemDark: boolean,
): "light" | "dark" {
  return value === "system" ? (systemDark ? "dark" : "light") : value;
}
