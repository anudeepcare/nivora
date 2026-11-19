import { eodProfile } from "./eodhd";
import { safeLogoUrl } from "./logo-policy";
export type LogoProfile = { symbol: string; logoUrl: string | null };
export async function companyLogo(symbol: string): Promise<LogoProfile> {
  try {
    return { symbol, logoUrl: safeLogoUrl((await eodProfile(symbol)).logoUrl) };
  } catch {
    return { symbol, logoUrl: null };
  }
}
