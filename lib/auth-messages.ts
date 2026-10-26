export type AuthMode = "login" | "signup" | "reset";
/**
 * Plain-language replacements for common provider messages. Messages stay generic: they never say
 * whether an account exists. Unknown messages are returned unchanged so no detail is hidden.
 */
export function friendlyAuthMessage(message: string | null | undefined, mode: AuthMode = "login"): string {
  const text = (message ?? "").trim();
  if (!text) return mode === "signup" ? "Unable to create the account." : mode === "reset" ? "Unable to send the reset link." : "Unable to sign in.";
  if (/invalid login credentials/i.test(text)) return "That email and password do not match. Check both, or reset your password.";
  if (/email not confirmed/i.test(text)) return "Confirm your email first. Check your inbox and spam folder, then sign in.";
  if (/rate limit|too many|over_.*_rate_limit|security purposes/i.test(text)) return "Too many attempts. Wait a minute and try again.";
  if (/password should be at least|weak password|password.*(short|characters)/i.test(text)) return "Use at least 8 characters for your password.";
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(text)) return "We couldn’t reach AURYN. Check your connection and try again.";
  if (/unable to validate email|invalid email|valid email/i.test(text)) return "Enter a valid email address.";
  return text;
}
