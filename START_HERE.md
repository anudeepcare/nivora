# AURYN — October 16 intelligence upgrade

This is the complete project source, based on GitHub commit `bbdce50b92384acefb3db79978423da92a75e1ea`. It includes source, lockfile, tests, migrations, original workflows, approved design boards, current verification reports and deployment instructions. It is not a claim that all 104 requirements or deployed production acceptance are complete.

1. Read `RELEASE_REPORT.md` for current verification and the remaining implementation/live-service gaps.
2. Read `GIT_AND_VERCEL.md` before copying into your existing Git checkout or deploying. Keep your `.git` history and private environment files. **Three new migrations are required.**
3. `verification/next-build/REQUIREMENTS_STATUS.md` and `requirements.json` account for every approved requirement, with source/test evidence and boundaries. The approved scope itself is in `docs/superpowers/specs/2026-10-16-approved-build.md`.
4. `docs/intelligence/ARCHITECTURE.md` explains the new data, decision, workspace and paper paths; `POLICY_AND_EVIDENCE.md` explains research limits.
5. `verification/next-build/visual-review/index.html` opens selected actual current app captures and the approved reference boards. QA data is synthetic and is not wired into normal production providers.
6. `SOURCE_MANIFEST.json` hashes every delivered file except itself. `scripts/package_release.py` verifies all archive bytes and complete tracked application/workflow/migration preservation.

`docs/handoff/START_HERE_AURYN_WORK_INSTRUCTIONS.md` and older release notes are retained as historical project context. Their dates/counts/old no-migration claims do not certify this update. The seven October 16 approved boards and the current scope/report are authoritative.

No Git push, Vercel deployment, live database migration or paper/live order was made by this build session. `npm run verify:release` checks the project; it does not update GitHub. Follow the explicit commit/push commands in `GIT_AND_VERCEL.md`.
