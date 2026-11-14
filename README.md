# Turtle Tracks

An Eastern Box Turtle field guide and personal observation journal. The cream and forest-green field-guide identity remains the foundation. The selected front cover is the original Tilly design, with Tilly overlapping part of “Learn.” The photographic alternative and cover switch are removed. Other pages, matching line icons, shared controls, and functional improvements are retained.

Production: https://turtletracks.haguewilliams.com/

`main` is the single working version and source of truth. Make approved incremental updates there and verify them at the production link above. Use Git history for rollback; do not ask Hague to choose between branches or alternate preview URLs. The first release uses the existing manual iNaturalist uploader handoff. Direct submission is deferred and does not block release. The free on-device species check is an experimental trial; age and sex estimates remain unavailable.

## Files

- `index.html`: existing field guide, interactions, artwork, and journal UI.
- `journal-core.js`: validation, backup merging, sorting, and safe share summaries.
- `citizen-science.js`: contribution review, account connection, receipt handling, and the manual iNaturalist fallback.
- `inaturalist-service.mjs`: server-side OAuth/PKCE and privacy-aware, recoverable direct submission.
- `private-state.mjs`: persistent request allowances and submission recovery records for one backend process.
- `journal-core.test.cjs`: regression tests using Node's built-in test runner.

Run checks with `npm test` (54 checks), and run the local app with `npm start` on Node 22+. GitHub Pages serves the app and its on-device model without a backend or API account. GPS on a deployed site requires HTTPS and visitor permission.

## Current experience

The photograph is attached directly to the sighting. Field-guide comparison and additional details are optional; a user can save without identification or a turtle ID. The save confirmation offers Citizen Scientist. Learn, Help, journal, and quest controls share outline icons. `material-theme.css` retains the shared Material Design 3 role theme and responsive controls. Learn and habitat guidance carry the theme “Make room for turtles. Make room to thrive,” connecting care for wildlife with time outdoors and attention to home. The original Tilly cover uses a shared layout for the headline and illustration so their overlap does not depend on screen height.

`on-device-photo.js`, `on-device-worker.js`, and `on-device-core.js` run a self-hosted MobileNet feature model plus a custom Eastern box turtle classifier inside the browser. No photograph, GPS, or notes are sent for analysis; no paid service or API key is required. Visitors explicitly run the check and review a suggestion before saving. The model can confuse similar turtles and returns unknown often. Sex and life stage always remain unknown in this trial.

On an additional frozen 143-photo evaluation, 17 of 19 suggestions matched source labels; 2 were mistaken. Only 17 of 53 Eastern box turtles received suggestions. This missed the 95% precision target: it is a disclosed experimental trial, not a validated identification product. See [model card](models/eastern-box-v1/README.md), [evaluation](models/eastern-box-v1/evaluation.json), and [reproduction tools](tools/model-development/README.md). Desktop browser upload, analyze, review, save and reopen are checked; physical phones remain to be tested.

The earlier OpenAI backend code remains inactive and optional. It is not needed for the free trial. Do not provision Render, paid inference, or credentials without a new owner decision. See `DEPLOYMENT.md` for current static deployment and deferred backend configuration.

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
