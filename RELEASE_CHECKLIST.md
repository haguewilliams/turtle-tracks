# Turtle Tracks final stages

Status: November 13, 2026. Hague requested consolidation into one working version on `main`. The current web app can be published with photo analysis and direct iNaturalist submission inactive. The checks below still apply before enabling those integrations or submitting to the App Store.

## Implemented and checked

- [x] Preserve cream/green styling and the merged encounter workflow; use the original overlapping Tilly front cover.
- [x] Keep the selected turtle ID when leaving and returning to the encounter page. Browser check: two sightings remain attached to Turtle 001.
- [x] Reset photo and estimate fields before editing a different observation. Browser check: a photo-free observation does not inherit another record's photograph.
- [x] Wait for photo processing before saving; discard stale photo/GPS responses after switching observations.
- [x] Leave the form intact and show a persistent warning when browser storage rejects a save. Automated quota-failure test passes.
- [x] Search sightings and filter by turtle; open individual turtle histories; calculate last seen from observation date/time.
- [x] Validate backup structure, dates, IDs, images, and coordinates; preview merge versus replacement; preserve current records on failed imports.
- [x] Browser-check backup merge and persistence after reload; reject an invalid backup without changing the journal.
- [x] Share the selected record with location text omitted by default and honest identification language.
- [x] Add Citizen Scientist to My Tracks, Learn, and the navigation menu.
- [x] Browser-check contribution readiness and preparation using clearly labeled synthetic data; download a real photo file. No test data sent to external databases.
- [x] Run 43 automated journal/photo-service/iNaturalist checks and JavaScript syntax checks.

## Before API activation and App Store release

- [x] Confirm the original overlapping Tilly cover, matching icons, and one-version workflow with Hague.
- [ ] Test real iPhone and Android camera uploads, GPS permission allowed/denied, and small-screen keyboard behavior.
- [ ] Complete accessibility and all-page content review, including external wildlife-help links. SCDNR registry verified; NWRA page could not be verified by the research tool.
- [ ] Register the iNaturalist application and confirm authorization/callback configuration.
- [x] Implement direct authorization and submission with consent, obscured/private location, durable duplicate protection, and saved receipts; verify using controlled provider responses.
- [ ] Verify OAuth, revocation, and an explicitly authorized genuine contribution against the approved live iNaturalist application. No synthetic wildlife records.
- [ ] Provision one HTTPS backend process with persistent private storage; configure secure credentials and owner-approved usage/spending controls.
- [ ] Complete iNaturalist owner eligibility and staff approval. Normal application eligibility: account older than two months and ten improving identifications of other users’ observations in the past month.
- [ ] Activate and evaluate the implemented photo-analysis service with a server-held API key, HTTPS backend, owner-approved budget, and reviewed real photos. The service is not yet activated.
- [x] Consolidate into `main`, verify successful GitHub Pages deployment, and visually confirm the live cover plus Learn and Help icons.

Cloud sync, cross-device journals, and automatic individual-turtle recognition are not implemented. The public science-data handoff remains manual and labeled accordingly; the new direct-submission code is inactive pending account and hosting setup. No scheduled/background development task has been created.

## November 13 functional improvements

- [x] Restore only the original Tilly front cover with Learn partly behind her; remove the photographic cover and switch while preserving other pages and improved icons.
- [x] Use one photo area and optional field-guide/additional-detail panels.
- [x] Remove mandatory anatomy scoring and leave unknown turtle identity unassigned.
- [x] Add the photo-analysis endpoint, disclosure/consent, review-before-save results, server-side validation, and rate controls.
- [x] Restore matching Learn and Help line icons and shared Material Design styling.
- [x] Verify photo saving, post-save science readiness, and Help navigation in the browser.
- [ ] Test native camera/GPS, VoiceOver, text enlargement, offline data durability, and supported phones.
- [ ] Build the native iOS package and complete TestFlight and App Store preparation described in PRODUCT_BRIEF.md.

- [x] Browser-check the retained responsive recording controls at narrow widths. The earlier photographic-cover viewport checks do not establish the restored Tilly cover’s phone behavior; complete that device check before release.
