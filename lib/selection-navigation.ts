import type { KeyboardEvent } from "react";

export function nextSelectionIndex(key: string, index: number, count: number) {
  if (count < 1 || index < 0) return null;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowRight") return (index + 1) % count;
  if (key === "ArrowLeft") return (index + count - 1) % count;
  return null;
}

/** Move focus only. Enter/Space keeps the button's existing activation behavior. */
export function navigateSelection(event: KeyboardEvent<HTMLElement>) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const buttons = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      ":scope > button:not(:disabled)",
    ),
  );
  const index = buttons.indexOf(event.target as HTMLButtonElement);
  const next = nextSelectionIndex(event.key, index, buttons.length);
  if (next == null) return;
  event.preventDefault();
  buttons[next]?.focus();
}
