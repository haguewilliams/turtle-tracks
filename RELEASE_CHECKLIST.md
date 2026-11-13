# Turtle Tracks final stages

Status: development review, November 13, 2026. Production is unchanged.

## Implemented and checked

- [x] Preserve approved Home, cream/green field-guide styling, merged Identify/Observe workflow, and Tilly.
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
- [x] Run 12 automated journal regression checks and JavaScript syntax checks.

## Before release

- [ ] Review the working experience with Hague and approve the development changes.
- [ ] Test real iPhone and Android camera uploads, GPS permission allowed/denied, and small-screen keyboard behavior.
- [ ] Complete accessibility and all-page content review, including external wildlife-help links. SCDNR registry verified; NWRA page could not be verified by the research tool.
- [ ] Register the iNaturalist application and confirm authorization/callback configuration.
- [ ] Implement and test direct submission: photo upload, observation create, obscured location, error handling, duplicate prevention, and saved receipt URL.
- [ ] Decide whether automatic photo identification is part of this release. Current identification is a guided comparison; there is no AI identification service connected.
- [ ] Merge the approved changes and verify production deployment.

Cloud sync, cross-device journals, and automatic individual-turtle recognition are not implemented. Existing science-data handoff is manual and labeled accordingly. No scheduled/background development task has been created.
