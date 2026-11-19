// Read-only local configuration check. Never prints values or contacts services.
const env = process.env;
const present = (name) => typeof env[name] === 'string' && env[name].trim().length > 0;
const required = [
 ['NEXT_PUBLIC_SUPABASE_URL'], ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
 ['SUPABASE_SERVICE_ROLE_KEY'], ['AURYN_OWNER_USER_ID'],
 ['EODHD_API_KEY', 'EODHD_API_TOKEN'], ['SENTISENSE_API_KEY', 'SENTISENSE_API_TOKEN'],
];
const missing = required.filter((names)=> !names.some(present)).map((names)=>names.join(' or '));
const exposed = Object.keys(env).filter((name)=>present(name) && /^NEXT_PUBLIC_(?:(?:SENTISENSE|EODHD).*|SUPABASE_SERVICE_ROLE_KEY)$/.test(name));
console.log(JSON.stringify({
 configurationPresent: missing.length === 0 && exposed.length === 0,
 missing, unsafePublicVariables: exposed,
 verification: 'Presence only. Database migrations, account access, provider credentials, plan entitlements and live coverage are not verified.',
 nextChecks: ['Apply and verify repository Supabase migrations in an isolated test environment.', 'Verify account access settings and auryn_request_allow RPC.', 'Test login and authenticated provider requests on the preview.'],
}, null, 2));
process.exitCode = missing.length || exposed.length ? 1 : 0;
