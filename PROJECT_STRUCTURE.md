# Complete AURYN source package

Open the **AURYN** folder after extracting the ZIP. `package.json` is in that folder; run installation/build commands there. The ZIP contains the actual multi-file Next.js application, not a website export or a patch.

## Project folders

| Path | Contents |
|---|---|
| `app/` | Pages, route handlers, layout, themes, authentication and API endpoints |
| `components/` | Research, charts, navigation, forms, portfolio and trading UI |
| `lib/` | Investment/research engines, canonical market truth, vendor adapters, Supabase, paper broker, validation and shared logic |
| `public/` | Logo, icons, manifest and imagery |
| `supabase/` | Original schema, incremental SQL and manual paper audit schema |
| `.github/workflows/` | Original scheduled jobs plus the current release build/test gate |
| `scripts/` | Research/validation jobs, test runners and reproducible source packaging |
| `tests/` | Current behavioral tests and unchanged historical tests |
| `validation/` | Original validation configuration/data |
| `docs/` | Original project context, approved reference, architecture and rebuild notes |
| `verification/` | Test reports, live-service observations, browser captures/harnesses and visual review |
| Root files | `package.json`, lockfile, TypeScript/Next/Vercel configuration, `.env.example`, deployment instructions and original release documents |

## Comparison with your original project

The supplied `AURYN(5).zip` contains 1,796 project files plus macOS resource-fork metadata. All **1,191 non-generated project paths** are preserved here. All **1,197 tracked files** in the inspected GitHub tree are also present, including the retained legacy stylesheet. The new layout does not import that old stylesheet.

The 605 intentionally omitted paths from the uploaded project are 330 Git-history files, 272 generated Next build files, one local credential file, one macOS metadata file and one compiler cache. These are not missing application source. Dependency packages are reproducibly installed from `package-lock.json` with `npm ci`. Generated output is recreated with `npm run build`.

Actual `.env.local` credentials are not redistributed. Copy `.env.example` to `.env.local` and configure it privately, or set the same values in Vercel. Keep your original credential file private if you use it locally. A public-configured build must be rebuilt if the public Supabase project settings change.

`verification/source-completeness.json` records the comparison. `SOURCE_MANIFEST.json` lists every included file with its relative path, size and SHA-256 checksum; the manifest excludes its own checksum. Packaging verifies each archived file against that inventory and runs ZIP integrity validation.

## Run and package

```sh
cd AURYN
npm ci
npm test
npm run build
npm start
```

For local development, use `npm run dev`. For a new complete source ZIP, run `bash scripts/package_release.sh` (Python 3 required for packaging). The application itself uses Node/npm.

Read `DEPLOYMENT.md` and `verification/VERIFICATION_REPORT.md` for the exact deployment status. Source completeness and production verification are separate claims.
