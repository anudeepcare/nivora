# Deploy to preprod first

First switch your existing repository to preprod with `cd ~/Downloads/AURYN` and `git switch preprod`. Then unzip the complete AURYN folder and copy its contents into that repository. Keep your local environment files. Do not delete your `.git` directory.

```bash
cd ~/Downloads/AURYN
git switch preprod
npm ci --include=dev
npm run verify
npm run test:api
git add -A
(git diff --cached --quiet || git commit -m "Add AURYN Edge, confirmed Pace and support enquiries")
git push origin preprod
```

Run the commands sequentially; stop on any failed check. The ZIP contains the full app at its root folder AURYN; there is no `product` subfolder. `.next`, node_modules and private environment files are excluded from the archive.

Apply the additive support migration and configure the server Supabase settings in Preview if you want to test saved contact requests. Leave support outgoing email disabled in Preview. No billing or paper execution flags need enabling for this release. All existing subscription, data-provider and production values remain unchanged.

## Review the preview before any production merge

- Landing, login and signup at desktop and mobile sizes.
- Stock Overview: verdict explanation, confirmed/forming Pace, chart ranges and candles, scenario scale, metric help.
- Business: full evidence remains accessible; revenue-region section is absent.
- All research tabs and back navigation retain the correct company and data.
- Home: unavailable counts are not shown as zero; company-group coverage is visible.
- Portfolio/watchlist: existing account data and calculations remain intact.
- Contact while signed out; save a test request only if the support migration is applied. Check its reference in owner Support and change status. Outgoing preview email is intentionally suppressed.
- Physical installed iPhone: header/status bar separation, keyboard/search, bottom dock and scrolling. Automated desktop/mobile viewport results cannot certify physical Safari behavior.

Production promotion requires a separate review and your explicit approval. Never force-push main or reset your local branch to replace unrelated history. If your preprod branch diverges, inspect it before merging; these instructions intentionally do not rewrite history.
