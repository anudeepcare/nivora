# Deployment preflight

Run `node scripts/deployment-preflight.mjs` inside the deployment environment, where environment variables are already supplied securely. It only checks presence and unsafe public names; it never reads env files, makes network calls, prints values, changes settings, or proves credentials valid. Exit 1 identifies missing configuration. Do not paste keys in chat or Git.

Required: Supabase URL/publishable key, server-only service-role key, workspace owner UUID, EODHD key/token and SentiSense key/token. Public Supabase configuration must exist at build time. Vendor and service-role keys must never use NEXT_PUBLIC names.

A successful presence check is NOT acceptance. Existing production authentication additionally requires repository database migrations and access settings, including `auryn_request_allow`, access configuration and market budgets. Verify migrations in an isolated environment before any production changes. Do not disable authorization or quotas to make a test pass. Confirm data licensing before enabling commercial access; the script does not grant rights or enable it.

After deploying a protected preview, test login, request budgets, saved preferences and real provider responses. Empty provider results can mean absent configuration, coverage, access restrictions or upstream errors; they are not proof that a company lacks data.
