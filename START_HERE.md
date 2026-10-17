# AURYN — complete source, UX repair of October 16–17, 2026

This is the complete source archive after the reported interface defects were reproduced and repaired. It includes the earlier investment engine, integration code, migrations, workflows, tests and approved design reference.

1. Read `RELEASE_REPORT.md` and `verification/repair-2026-10-17/VERIFICATION_REPORT.md`. These supersede earlier release summaries.
2. Follow `GIT_AND_VERCEL.md`. Copy the contents of `AURYN/` into your existing checkout, including `.github`; preserve `.git` and private `.env.local`. Avoid an extra `AURYN/AURYN` folder.
3. Review `verification/repair-2026-10-17/visual-review/index.html` for screenshots from the actual application. Quotes/signals/account data in previews are explicitly illustrative. They are not a live investment recommendation or evidence of broker execution.
4. Run `npm ci` and `npm run verify:release` with your own environment. Dependencies and generated `.next` files are excluded; Vercel rebuilds from source.
5. Keep existing integration credentials. Review the paper migration and trusted administrator configuration before testing Paper Lab.

The site was not pushed or deployed in this repair. No account permission was changed and no order was placed. Physical iPhone/Safari, live cross-account security, email delivery and broker execution still require deployment acceptance. `verification/next-build/REMAINING_GAPS.md` records outstanding capabilities from the larger product scope.

The active global UI now comes from `app/ui.css`; component CSS modules remain local. Historical global styles remain in source for provenance but are no longer imported by the app layout. This removes the previous stack of global overrides.

`SOURCE_MANIFEST.json` lists every included file and hash. The archive is checked against the tracked source inventory and every file's bytes. Credentials, Git history, dependencies, build caches and personal screenshots are excluded. No paid provider was added.
