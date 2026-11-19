/** URL shortcuts preselect a form only; they never create or enable a rule. */
export function initialAlertType(value: string | null): string {
  return ["monthly-zone", "earnings-soon", "new-filing"].includes(value ?? "")
    ? value!
    : "new-filing";
}
