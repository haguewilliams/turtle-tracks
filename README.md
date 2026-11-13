# Turtle Tracks

An Eastern Box Turtle field guide and personal observation journal. The cream and forest-green field-guide identity remains the foundation. The selected front cover is the original Tilly design, with Tilly overlapping part of “Learn.” The photographic alternative and cover switch are removed. Other pages, matching line icons, shared controls, and functional improvements are retained.

Production: https://turtletracks.haguewilliams.com/

`main` is the single working version and source of truth. Make approved incremental updates there and verify them at the production link above. Use Git history for rollback; do not ask Hague to choose between branches or alternate preview URLs. The first release uses the existing manual iNaturalist uploader handoff. Direct submission is deferred and does not block release. Photo analysis remains an active priority and is not yet activated.

## Files

- `index.html`: existing field guide, interactions, artwork, and journal UI.
- `journal-core.js`: validation, backup merging, sorting, and safe share summaries.
- `citizen-science.js`: contribution review, account connection, receipt handling, and the manual iNaturalist fallback.
- `inaturalist-service.mjs`: server-side OAuth/PKCE and privacy-aware, recoverable direct submission.
- `private-state.mjs`: persistent request allowances and submission recovery records for one backend process.
- `journal-core.test.cjs`: regression tests using Node's built-in test runner.

Run checks with `npm test` (49 checks), and run the same-origin app/API with `npm start` on Node 22+. The frontend can still be served statically, with photo analysis unavailable. GPS on a deployed site requires HTTPS and visitor permission.

## Current experience

The photograph is attached directly to the sighting. Field-guide comparison and additional details are optional; a user can save without identification or a turtle ID. The save confirmation offers Citizen Scientist. Learn, Help, journal, and quest controls share outline icons. `material-theme.css` retains the shared Material Design 3 role theme and responsive controls. Learn and habitat guidance carry the theme “Make room for turtles. Make room to thrive,” connecting care for wildlife with time outdoors and attention to home. The original Tilly cover uses a shared layout for the headline and illustration so their overlap does not depend on screen height.

`server.mjs`, `photo-analysis-core.js`, and `photo-analysis.js` implement real photo analysis through OpenAI image inputs and structured output. No API credential is configured, so the service is not active. Tests use controlled provider responses; they are not a live accuracy evaluation. See `DEPLOYMENT.md` for secure activation and `PRODUCT_BRIEF.md` for the App Store release mandate.

## Data and contributions

Observations remain in the browser's local storage under the existing `turtleTracksMasterV2` key. Export a backup before switching browsers/devices or clearing browser data. Version 2 backups and legacy record arrays remain accepted; new backups use version 3. Imports are validated before review, merge preserves existing records, and replacing the journal requires a separate confirmation. Failed storage writes do not commit changes in memory or clear the encounter form.

Citizen Scientist requires a photo and observation date to prepare a sighting. Saved GPS remains available with Copy coordinates; missing GPS does not block preparation and is clearly flagged for the contributor to add on iNaturalist’s map. A three-step panel provides a photo download, separate date/location/public-note copy controls, and the official uploader link. Private journal notes are excluded by default. Photo and details are not transferred automatically. This manual path is the selected first-release contribution experience; no Turtle Tracks API application approval is needed to link users to the official uploader. Turtle Tracks does not claim a submission succeeded, grant Research Grade, or submit anything without the contributor's review.

## Direct iNaturalist submission — later release

Hague chose to defer this integration on November 13, 2026. Keep the existing code disabled; it is not a first-release acceptance requirement. The account participation and approval process can proceed independently on iNaturalist’s own website.

The code is implemented and tested with controlled provider responses, but no live account or application is connected. Contributors authorize their own account, review the photo/date/GPS and public notes, choose obscured or private visibility, and consent before sending. Credentials stay in encrypted HttpOnly cookies; client secrets stay on the backend. A saved UUID and persistent server ledger prevent blind duplicate retries. Only a verified observation-plus-photo response becomes a saved contribution receipt. Local journal edits do not edit iNaturalist.

Activation requires an approved iNaturalist application and the same-origin Node backend with persistent storage. The normal app-owner application requires an account older than two months and ten improving identifications of other users' observations in the past month, followed by staff approval. A fresh account is not enough to activate immediately. See `DEPLOYMENT.md` for exact configuration, recovery limits, and live verification requirements. No wildlife observations have been submitted during development.

Official references:

- https://www.inaturalist.org/pages/api+reference
- https://www.inaturalist.org/pages/api+recommended+practices
- https://help.inaturalist.org/en/support/solutions/articles/151000169938
- https://help.inaturalist.org/en/support/solutions/articles/151000170346-which-inaturalist-observations-are-exported-for-gbif-and-how-often-does-this-export-happen-
- https://www.herpmapper.org/content/pdf/herpmapper-announcement.pdf

See `RELEASE_CHECKLIST.md` for verified work and outstanding release checks.

See [INATURALIST_PLAN.md](INATURALIST_PLAN.md) for the parallel account-approval plan and the prepared app-owner application description.
