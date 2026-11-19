/** Light-dismiss only opt-in info disclosures; ordinary details/forms are untouched. */
export function installInfoDisclosures(root: HTMLElement) {
  const doc = root.ownerDocument;
  const selector = "details[data-info-disclosure]";
  const opened = () =>
    Array.from(root.querySelectorAll<HTMLDetailsElement>(`${selector}[open]`));
  const dismissOutside = (event: Event) => {
    const target = event.target;
    for (const item of opened())
      if (target instanceof doc.defaultView!.Node && !item.contains(target))
        item.open = false;
  };
  const escape = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    const items = opened();
    if (!items.length) return;
    for (const item of items) item.open = false;
    // Restore only when focus was inside this disclosure, never steal another control's focus.
    const active = items.find((item) => item.contains(doc.activeElement));
    active?.querySelector<HTMLElement>("summary")?.focus();
  };
  const toggle = (event: Event) => {
    const item = event.target as HTMLDetailsElement;
    if (!item.matches?.(selector) || !item.open) return;
    for (const other of opened()) if (other !== item) other.open = false;
  };
  doc.addEventListener("pointerdown", dismissOutside, true);
  doc.addEventListener("click", dismissOutside, true);
  doc.addEventListener("focusin", dismissOutside, true);
  doc.addEventListener("keydown", escape);
  root.addEventListener("toggle", toggle, true);
  return () => {
    doc.removeEventListener("pointerdown", dismissOutside, true);
    doc.removeEventListener("click", dismissOutside, true);
    doc.removeEventListener("focusin", dismissOutside, true);
    doc.removeEventListener("keydown", escape);
    root.removeEventListener("toggle", toggle, true);
  };
}
