# Turtle Tracks final stages

Status: development review, November 13, 2026. Production is unchanged.

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
- [x] Run 25 automated journal/photo-service checks and JavaScript syntax checks.

## Before release

- [ ] Review the working experience with Hague and approve the development changes.
- [ ] Test real iPhone and Android camera uploads, GPS permission allowed/denied, and small-screen keyboard behavior.
- [ ] Complete accessibility and all-page content review, including external wildlife-help links. SCDNR registry verified; NWRA page could not be verified by the research tool.
- [ ] Register the iNaturalist application and confirm authorization/callback configuration.
- [ ] Implement and test direct submission: photo upload, observation create, obscured location, error handling, duplicate prevention, and saved receipt URL.
- [ ] Activate and evaluate the implemented photo-analysis service with a server-held API key, HTTPS backend, owner-approved budget, and reviewed real photos. The service is not yet activated.
- [ ] Merge the approved changes and verify production deployment.

Cloud sync, cross-device journals, and automatic individual-turtle recognition are not implemented. Existing science-data handoff is manual and labeled accordingly. No scheduled/background development task has been created.

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
