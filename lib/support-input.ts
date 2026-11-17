export const supportCategories = [
  "General enquiry",
  "Technical issue",
  "Billing",
  "Feedback",
  "Privacy concern",
] as const;
export function supportInput(raw: unknown) {
  if (!raw || typeof raw !== "object")
    throw Error("Please complete the contact form.");
  const b = raw as Record<string, unknown>;
  const text = (k: string) =>
    typeof b[k] === "string" ? (b[k] as string).trim() : "";
  const id = text("id"),
    email = text("email").toLowerCase(),
    category = text("category"),
    message = text("message"),
    source = text("page");
  if (text("website")) throw Error("Please try again.");
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      id,
    )
  )
    throw Error("Please reload the form and try again.");
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))
    throw Error("Enter a valid email address.");
  if (
    !supportCategories.includes(category as (typeof supportCategories)[number])
  )
    throw Error("Choose a contact topic.");
  if (message.length < 10 || message.length > 5000)
    throw Error("Use between 10 and 5,000 characters for your message.");
  const page =
    source.startsWith("/") && !source.startsWith("//")
      ? source.split(/[?#]/)[0].slice(0, 300)
      : "/contact";
  const screenshot = typeof b.screenshot === "string" ? b.screenshot : "";
  if (screenshot.length > 410000)
    throw Error("Screenshot is too large. Choose a smaller image.");
  if (
    screenshot &&
    !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(screenshot)
  )
    throw Error("Attach a JPEG screenshot.");
  let diagnosticText = "";
  if (b.diagnostics && typeof b.diagnostics === "object") {
    const d = b.diagnostics as Record<string, unknown>;
    const version =
      typeof d.version === "string" && /^[0-9A-Za-z.-]{1,30}$/.test(d.version)
        ? d.version
        : "unknown";
    const rawPage = typeof d.page === "string" ? d.page.split(/[?#]/)[0] : "";
    const section = rawPage.replace(/^\/preview/, "").split("/")[1];
    const safePage = [
      "research",
      "overview",
      "portfolio",
      "watchlist",
      "settings",
      "compare",
      "contact",
    ].includes(section)
      ? `/${section}${section === "research" ? "/[symbol]" : ""}`
      : "/other";
    const viewport =
      typeof d.viewport === "string" && /^\d{2,5}×\d{2,5}$/.test(d.viewport)
        ? d.viewport
        : "unknown";
    diagnosticText = `\n\nUser-approved diagnostics: version ${version}; page ${safePage}; viewport ${viewport}.`;
  }
  if (message.length + diagnosticText.length > 5000)
    throw Error(
      "Shorten the message to leave room for diagnostics (maximum 4,700 characters with diagnostics).",
    );
  return {
    id,
    email,
    category,
    message: message + diagnosticText,
    page,
    ...(screenshot ? { screenshot } : {}),
  };
}
