/** UI route policy only. Every private API independently verifies the user. */
export function authDestination(pathname: string, signedIn: boolean, recovering = false): string | null {
  if (!signedIn) return pathname === "/login" ? null : "/login";
  if (recovering && pathname !== "/reset-password") return "/reset-password";
  return pathname === "/login" ? "/overview" : null;
}
export function authErrorMessage(code: string | null) {
  return code === "cancelled" ? "Sign-in was cancelled. You can try again or use email."
    : code === "callback" ? "This sign-in link could not be verified. Please start again on this device."
    : "";
}
