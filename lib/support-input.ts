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
  return { id, email, category, message, page };
}
