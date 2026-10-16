"use client";
import {useEffect, useState} from 'react';
import {supabaseBrowser} from '@/lib/supabase';
import {loadSocialAuthProviders, type SocialAuthProvider} from '@/lib/social-auth-providers';

type SocialAuthOptionsProps = {
  providers: readonly SocialAuthProvider[];
  busy: SocialAuthProvider | '';
  error: string;
  unavailable: boolean;
  onLogin: (provider: SocialAuthProvider) => void;
};

export function SocialAuthOptions({providers, busy, error, unavailable, onLogin}: SocialAuthOptionsProps) {
  return <div className="uxSocial">
    {providers.map(provider => <button type="button" key={provider} disabled={!!busy} onClick={() => onLogin(provider)}>
      <b aria-hidden="true" style={provider === 'apple' ? {color: 'inherit'} : undefined}>{provider === 'google' ? 'G' : '●'}</b>
      {busy === provider ? 'Connecting…' : `Continue with ${provider === 'google' ? 'Google' : 'Apple'}`}
    </button>)}
    {unavailable && <p role="status" className="formError">Google and Apple sign-in are unavailable right now. Please continue with email.</p>}
    {error && <p role="alert" className="formError">{error}</p>}
    <div className="uxDivider">{providers.length ? 'or continue with email' : 'Continue with email'}</div>
  </div>;
}

export default function SocialAuth() {
  const [providers, setProviders] = useState<SocialAuthProvider[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<SocialAuthProvider | ''>('');

  useEffect(() => {
    const controller = new AbortController();
    void loadSocialAuthProviders(controller.signal).then(enabled => {
      if (controller.signal.aborted) return;
      setProviders(enabled ?? []);
      setUnavailable(enabled === null);
    });
    return () => controller.abort();
  }, []);

  async function login(provider: SocialAuthProvider) {
    if (busy || !providers.includes(provider)) return;
    setBusy(provider);
    setError('');
    try {
      const {error} = await supabaseBrowser().auth.signInWithOAuth({provider, options: {redirectTo: window.location.origin + '/auth/callback'}});
      if (error) throw error;
    } catch {
      setError('We couldn’t start sign-in. Please try again or continue with email.');
      setBusy('');
    }
  }

  return <SocialAuthOptions providers={providers} busy={busy} error={error} unavailable={unavailable} onLogin={login}/>;
}
