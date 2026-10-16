export type SocialAuthProvider = 'google' | 'apple';

const supportedProviders: readonly SocialAuthProvider[] = ['google', 'apple'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** null means settings could not be verified; an empty list means no social providers are enabled. */
export function parseSocialAuthProviders(settings: unknown): SocialAuthProvider[] | null {
  if (!isRecord(settings) || !isRecord(settings.external)) return null;
  const external = settings.external;
  for (const provider of supportedProviders) {
    if (Object.prototype.hasOwnProperty.call(external, provider) && typeof external[provider] !== 'boolean') return null;
  }
  return supportedProviders.filter(provider => Object.prototype.hasOwnProperty.call(external, provider) && external[provider] === true);
}

/** Public Auth settings only: https://supabase.com/docs/guides/self-hosting/self-hosted-oauth */
export async function loadSocialAuthProviders(signal?: AbortSignal): Promise<SocialAuthProvider[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || signal?.aborted) return null;

  let settingsUrl: string;
  try {
    const base = new URL(url);
    if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) return null;
    settingsUrl = base.toString().replace(/\/+$/, '') + '/auth/v1/settings';
  } catch {
    return null;
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, {once: true});
  const timeout = setTimeout(abort, 4000);
  try {
    const response = await fetch(settingsUrl, {
      method: 'GET',
      headers: {apikey: key, Accept: 'application/json'},
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const settings: unknown = await response.json();
    return controller.signal.aborted ? null : parseSocialAuthProviders(settings);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
