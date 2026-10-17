export type AnalystStatus = {
  available: boolean;
  reason: "ready" | "disabled" | "unconfigured" | "unconfirmed" | "preview";
  message: string;
};
export function analystStatus(
  env: Record<string, string | undefined>,
  confirmed: boolean,
): AnalystStatus {
  if (!confirmed)
    return {
      available: false,
      reason: "unconfirmed",
      message: "Confirm your email to use AI analysis.",
    };
  if (env.AURYN_AI_ENABLED !== "true")
    return {
      available: false,
      reason: "disabled",
      message:
        "AI generation is disabled in this deployment. Reported financial evidence remains available.",
    };
  if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL)
    return {
      available: false,
      reason: "unconfigured",
      message:
        "AI setup is incomplete. Your administrator needs to configure a provider and model.",
    };
  return {
    available: true,
    reason: "ready",
    message: "Generated on request. Your daily account allowance applies.",
  };
}
