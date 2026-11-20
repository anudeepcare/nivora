export type ThemePreference = "light" | "dark" | "system" | "daylight";
export const DAYLIGHT_START = 7;
export const DAYLIGHT_END = 19;
export const DAYLIGHT_EVENT = "auryn-daylight-clock";

export function themePreference(value: string | null): ThemePreference {
  return value === "light" || value === "system" || value === "daylight"
    ? value
    : "dark";
}
export function resolvedTheme(
  value: ThemePreference,
  systemDark: boolean,
  now = new Date(),
): "light" | "dark" {
  if (value === "daylight") {
    const hour = now.getHours();
    return hour >= DAYLIGHT_START && hour < DAYLIGHT_END ? "light" : "dark";
  }
  return value === "system" ? (systemDark ? "dark" : "light") : value;
}
