# Photo analysis activation

The service is implemented but not activated. GitHub Pages serves static files and cannot execute `server.mjs`. Run the app and API together on a Node 22+ host behind HTTPS. The browser uses same-origin `/api/status` and `/api/analyze`; a separate API hostname requires a deliberate CORS/auth design and is not configured by this build.

1. Connect a server host to the review branch. Build command: none. Start command: `node server.mjs`. The host supplies `PORT`.
2. In the host's secure environment settings, add `OPENAI_API_KEY`. Do not paste it into chat, source, frontend config, or a command line.
3. Set `APP_ORIGIN` to the exact HTTPS app origin. Optionally set `OPENAI_MODEL` (default `gpt-4.1-mini`) and `ANALYSIS_DAILY_LIMIT` (default 50 request attempts per UTC day for this running instance).
4. Set an owner-approved provider budget and alerts. Current in-memory controls allow up to 10 analysis attempts/hour per connecting IP and two simultaneous requests. Counters reset on restart and are not a billing cap. Before public release, add durable shared quotas and abuse protection appropriate to the chosen hosting proxy. Do not trust arbitrary forwarded-IP headers.
5. Verify `/api/status` reports `photoAnalysis:true`, then test consent, a real photo with known identity, unknown/non-turtle photos, timeout/refusal behavior, and saving reviewed suggestions. Never submit synthetic sightings to iNaturalist.
6. Keep secrets restricted to the backend. The static allowlist intentionally excludes server files, tests, configuration files, and environment files. The service sends only the resized image to OpenAI, requests `store:false`, and does not write photos or response payloads to its own logs. Provider data policies still apply; `store:false` is not a promise of zero retention.

No paid service, subscription, billing method, API credential, or live model call has been created by this implementation. Activation requires a usable owner-controlled account and host. The current browser preview intentionally shows analysis as unavailable until configuration is real.

## Checks

`npm test` runs journal and endpoint tests with mocked model responses. These check implementation behavior, not biological prediction accuracy. Manual browser checks cover the photo workflow, saving, the optional field guide, cover switch, and navigation. Real phone tests and a reviewed image evaluation set are release requirements.
