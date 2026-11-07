# Performance evidence

Next production build reports main catch-all app first-load JavaScript at 254 kB, versus 308 kB in the prior verified source build: about 18% lower. Primary screens now load separately instead of through the monolithic ApprovedWorkspace module. This is a build payload comparison, not a measured real-user latency claim.

`baseline-assets.json` and `final-assets.json` count all emitted JS/CSS assets (raw and gzip). Lazy-loaded new features count toward those totals even when not initially loaded. Public route CSS measurements are in `production-public-browser.json`; legacy workspace compatibility CSS is now owned by Product instead of the root layout.

Cache regressions cover LRU retention, refresh while pending, and account clearance while pending. Older requests cannot overwrite refreshed values or repopulate a cleared cache. Primary workspace/hook bodies were compared independently with the baseline to preserve behavior.

Live-provider latency, real-user LCP/interaction distributions and physical-device installed PWA performance still require real observations. No synthetic timing is represented as production performance.

All emitted assets: JS gzip increased by 27,521 bytes because the release includes new lazy workflows; CSS raw decreased by 8,053 bytes, while gzip increased by 2,874 bytes due to separate chunks. Total assets are not claimed to shrink. The meaningful measured gain is the initial application JS payload and public CSS isolation.
